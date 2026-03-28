$script = @'
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

trap {
    $msg = $_.Exception.Message
    try {
        if ($script:LogFile -and (Test-Path -LiteralPath (Split-Path -Parent $script:LogFile))) {
            Add-Content -LiteralPath $script:LogFile -Value ("[{0}] FATAL: {1}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $msg) -Encoding utf8
        }
    } catch {}
    Write-Host "[FATAL] $msg" -ForegroundColor Red
    exit 1
}

function Write-Utf8NoBomFile {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][string]$Content
    )
    $dir = Split-Path -Parent $Path
    if ($dir -and -not (Test-Path -LiteralPath $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    $enc = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($Path, $Content, $enc)
}

function Log {
    param([Parameter(Mandatory = $true)][string]$Message)
    $line = "[{0}] {1}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $Message
    Write-Host $line
    Add-Content -LiteralPath $script:LogFile -Value $line -Encoding utf8
}

function Backup-File {
    param(
        [Parameter(Mandatory = $true)][string]$FilePath,
        [Parameter(Mandatory = $true)][string]$BackupDir
    )
    if (-not (Test-Path -LiteralPath $FilePath)) {
        throw "Backup target not found: $FilePath"
    }
    $dest = Join-Path $BackupDir (Split-Path -Leaf $FilePath)
    Copy-Item -LiteralPath $FilePath -Destination $dest -Force
    return $dest
}

function Run-Step {
    param(
        [Parameter(Mandatory = $true)][string]$Name,
        [Parameter(Mandatory = $true)][scriptblock]$Action
    )
    Log "STEP START: $Name"
    try {
        & $Action
        $script:StepResults.Add([pscustomobject]@{
            Step = $Name
            ExitCode = 0
            Status = 'OK'
        }) | Out-Null
        Log "STEP OK: $Name | exit=0"
    } catch {
        $msg = $_.Exception.Message
        $script:StepResults.Add([pscustomobject]@{
            Step = $Name
            ExitCode = 1
            Status = 'FAIL'
        }) | Out-Null
        Log "STEP FAIL: $Name | exit=1 | error=$msg"
        throw
    }
}

$RepoRoot = 'D:\01 Main Work\Boots\Agentic AI\mission-control\orry'
$ToolsDir = Join-Path $RepoRoot 'tools'
$LogsDir = Join-Path $ToolsDir 'logs'
$TimeTag = Get-Date -Format 'yyyyMMdd_HHmmss'
$BackupDir = Join-Path $ToolsDir ("backup_prisma7_manualfix_" + $TimeTag)
$script:LogFile = Join-Path $LogsDir ("prisma7-manualfix_" + $TimeTag + ".log")
$SummaryFile = Join-Path $LogsDir ("prisma7-manualfix-summary_" + $TimeTag + ".txt")
$script:StepResults = New-Object System.Collections.Generic.List[object]

$SchemaPath = Join-Path $RepoRoot 'prisma\schema.prisma'
$ConfigPath = Join-Path $RepoRoot 'prisma.config.ts'
$LastBackupPtr = Join-Path $ToolsDir 'LAST_BACKUP_DIR.txt'

Run-Step -Name 'Validate paths and create folders' -Action {
    if (-not (Test-Path -LiteralPath $RepoRoot)) { throw "Repo root not found: $RepoRoot" }
    if (-not (Test-Path -LiteralPath $ToolsDir)) { New-Item -ItemType Directory -Path $ToolsDir -Force | Out-Null }
    if (-not (Test-Path -LiteralPath $LogsDir)) { New-Item -ItemType Directory -Path $LogsDir -Force | Out-Null }
    if (-not (Test-Path -LiteralPath $BackupDir)) { New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null }

    foreach ($p in @($SchemaPath, $ConfigPath)) {
        if (-not (Test-Path -LiteralPath $p)) {
            throw "Required file not found: $p"
        }
    }

    Write-Utf8NoBomFile -Path $LastBackupPtr -Content $BackupDir
}

Run-Step -Name 'Backup target files' -Action {
    $b1 = Backup-File -FilePath $SchemaPath -BackupDir $BackupDir
    $b2 = Backup-File -FilePath $ConfigPath -BackupDir $BackupDir
    Log "Backup created: $b1"
    Log "Backup created: $b2"
}

Run-Step -Name 'Rewrite schema datasource for Prisma 7' -Action {
    $schema = Get-Content -LiteralPath $SchemaPath -Raw

    $pattern = 'datasource\s+db\s*\{[\s\S]*?\}'
    if ($schema -notmatch $pattern) {
        throw 'datasource db { ... } block not found in schema.prisma'
    }

    $replacement = @'
datasource db {
  provider = "postgresql"
}
'@

    $schema = [regex]::Replace($schema, $pattern, $replacement, 1)

    if ($schema -match '^\s*url\s*=' -or $schema -match '^\s*directUrl\s*=') {
        throw 'schema.prisma still contains url/directUrl after rewrite'
    }

    Write-Utf8NoBomFile -Path $SchemaPath -Content $schema
}

Run-Step -Name 'Rewrite prisma.config.ts datasource block' -Action {
    $config = Get-Content -LiteralPath $ConfigPath -Raw

    if ($config -notmatch 'import\s+"dotenv/config";') {
        $config = 'import "dotenv/config";' + "`r`n" + $config
    }

    if ($config -notmatch 'defineConfig\s*\(') {
        throw 'defineConfig(...) not found in prisma.config.ts'
    }

    if ($config -match 'datasource\s*:\s*\{[\s\S]*?\}\s*,?') {
        $config = [regex]::Replace(
            $config,
            'datasource\s*:\s*\{[\s\S]*?\}\s*,?',
            'datasource: {' + "`r`n" + '    url: env("DATABASE_URL"),' + "`r`n" + '  },',
            1
        )
    } else {
        $config = [regex]::Replace(
            $config,
            'export\s+default\s+defineConfig\s*\(\s*\{',
            'export default defineConfig({' + "`r`n" + '  datasource: {' + "`r`n" + '    url: env("DATABASE_URL"),' + "`r`n" + '  },',
            1
        )
    }

    $config = [regex]::Replace($config, '^\s*directUrl\s*:\s*env\("DIRECT_URL"\),?\s*$', '', 'Multiline')
    Write-Utf8NoBomFile -Path $ConfigPath -Content $config
}

Run-Step -Name 'Verify rewritten files' -Action {
    $schemaNow = Get-Content -LiteralPath $SchemaPath -Raw
    $configNow = Get-Content -LiteralPath $ConfigPath -Raw

    if ($schemaNow -match 'url\s*=' -or $schemaNow -match 'directUrl\s*=') {
        throw 'Verification failed: schema.prisma still has url/directUrl'
    }
    if ($configNow -notmatch 'datasource\s*:\s*\{[\s\S]*url:\s*env\("DATABASE_URL"\)') {
        throw 'Verification failed: prisma.config.ts does not contain datasource.url'
    }

    Log '----- schema.prisma (head) -----'
    (Get-Content -LiteralPath $SchemaPath -TotalCount 20) | ForEach-Object { Log $_ }
    Log '----- prisma.config.ts -----'
    Get-Content -LiteralPath $ConfigPath | ForEach-Object { Log $_ }
}

Run-Step -Name 'Prisma validate' -Action {
    Push-Location $RepoRoot
    try {
        & npm exec prisma validate 2>&1 | Tee-Object -FilePath $script:LogFile -Append
        if ($LASTEXITCODE -ne 0) {
            throw "npm exec prisma validate failed with exit code $LASTEXITCODE"
        }
    } finally {
        Pop-Location
    }
}

Run-Step -Name 'Prisma generate' -Action {
    Push-Location $RepoRoot
    try {
        & npm exec prisma generate 2>&1 | Tee-Object -FilePath $script:LogFile -Append
        if ($LASTEXITCODE -ne 0) {
            throw "npm exec prisma generate failed with exit code $LASTEXITCODE"
        }
    } finally {
        Pop-Location
    }
}

Run-Step -Name 'Next build' -Action {
    Push-Location $RepoRoot
    try {
        & npm run build 2>&1 | Tee-Object -FilePath $script:LogFile -Append
        if ($LASTEXITCODE -ne 0) {
            throw "npm run build failed with exit code $LASTEXITCODE"
        }
    } finally {
        Pop-Location
    }
}

$summary = @()
$summary += 'PRISMA 7 MANUAL FIX SUMMARY'
$summary += ('RepoRoot: ' + $RepoRoot)
$summary += ('BackupDir: ' + $BackupDir)
$summary += ('LogFile: ' + $script:LogFile)
$summary += ''
foreach ($row in $script:StepResults) {
    $summary += ('{0} | exit={1} | {2}' -f $row.Step, $row.ExitCode, $row.Status)
}
Write-Utf8NoBomFile -Path $SummaryFile -Content ($summary -join "`r`n")

Write-Host ''
Write-Host 'Done.' -ForegroundColor Green
Write-Host ('Backup : ' + $BackupDir)
Write-Host ('Log    : ' + $script:LogFile)
Write-Host ('Summary: ' + $SummaryFile)
exit 0
'@

$target = "D:\01 Main Work\Boots\Agentic AI\mission-control\orry\tools\fix-prisma7-manual.ps1"
$enc = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($target, $script, $enc)
Write-Host "Created: $target"