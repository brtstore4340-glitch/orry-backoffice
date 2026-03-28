Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$RepoRoot = 'D:\01 Main Work\Boots\Agentic AI\mission-control\orry'
$ToolsDir = Join-Path $RepoRoot 'tools'
$LogsDir = Join-Path $ToolsDir 'logs'
$TimeTag = Get-Date -Format 'yyyyMMdd_HHmmss'
$BackupDir = Join-Path $ToolsDir ("backup_prisma7_direct_" + $TimeTag)
$LogFile = Join-Path $LogsDir ("prisma7-direct_" + $TimeTag + ".log")
$SummaryFile = Join-Path $LogsDir ("prisma7-direct-summary_" + $TimeTag + ".txt")
$LastBackupFile = Join-Path $ToolsDir 'LAST_BACKUP_DIR.txt'

$SchemaPath = Join-Path $RepoRoot 'prisma\schema.prisma'
$ConfigPath = Join-Path $RepoRoot 'prisma.config.ts'

$StepResults = New-Object System.Collections.Generic.List[object]

trap {
    $msg = $_.Exception.Message
    try {
        if (Test-Path -LiteralPath (Split-Path -Parent $LogFile)) {
            Add-Content -LiteralPath $LogFile -Value ("[{0}] FATAL: {1}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $msg) -Encoding utf8
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
    Add-Content -LiteralPath $LogFile -Value $line -Encoding utf8
}

function Backup-File {
    param(
        [Parameter(Mandatory = $true)][string]$FilePath,
        [Parameter(Mandatory = $true)][string]$BackupRoot
    )
    if (-not (Test-Path -LiteralPath $FilePath)) {
        throw "Backup target not found: $FilePath"
    }
    $dest = Join-Path $BackupRoot (Split-Path -Leaf $FilePath)
    Copy-Item -LiteralPath $FilePath -Destination $dest -Force
    return $dest
}

function Add-StepResult {
    param(
        [Parameter(Mandatory = $true)][string]$Step,
        [Parameter(Mandatory = $true)][int]$ExitCode,
        [Parameter(Mandatory = $true)][string]$Status
    )
    $StepResults.Add([pscustomobject]@{
        Step = $Step
        ExitCode = $ExitCode
        Status = $Status
    }) | Out-Null
}

function Run-Step {
    param(
        [Parameter(Mandatory = $true)][string]$Name,
        [Parameter(Mandatory = $true)][scriptblock]$Action
    )

    Log "STEP START: $Name"
    try {
        & $Action
        Add-StepResult -Step $Name -ExitCode 0 -Status 'OK'
        Log "STEP OK: $Name | exit=0"
    } catch {
        $msg = $_.Exception.Message
        Add-StepResult -Step $Name -ExitCode 1 -Status 'FAIL'
        Log "STEP FAIL: $Name | exit=1 | error=$msg"
        throw
    }
}

function Invoke-NpmCommand {
    param(
        [Parameter(Mandatory = $true)][string]$Arguments,
        [Parameter(Mandatory = $true)][string]$StepName
    )

    Run-Step -Name $StepName -Action {
        Push-Location $RepoRoot
        try {
            Log ("RUN: npm " + $Arguments)
            $output = & npm $Arguments.Split(' ') 2>&1
            foreach ($line in $output) {
                Log ($line.ToString())
            }
            if ($LASTEXITCODE -ne 0) {
                throw ("npm " + $Arguments + " failed with exit code " + $LASTEXITCODE)
            }
        } finally {
            Pop-Location
        }
    }
}

Run-Step -Name 'Validate paths and create folders' -Action {
    if (-not (Test-Path -LiteralPath $RepoRoot)) {
        throw "Repo root not found: $RepoRoot"
    }

    foreach ($dir in @($ToolsDir, $LogsDir, $BackupDir)) {
        if (-not (Test-Path -LiteralPath $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
        }
    }

    foreach ($p in @($SchemaPath, $ConfigPath)) {
        if (-not (Test-Path -LiteralPath $p)) {
            throw "Required file not found: $p"
        }
    }

    Write-Utf8NoBomFile -Path $LastBackupFile -Content $BackupDir
}

Run-Step -Name 'Backup target files' -Action {
    $b1 = Backup-File -FilePath $SchemaPath -BackupRoot $BackupDir
    $b2 = Backup-File -FilePath $ConfigPath -BackupRoot $BackupDir
    Log ("Backup created: " + $b1)
    Log ("Backup created: " + $b2)
}

Run-Step -Name 'Rewrite schema.prisma datasource block' -Action {
    $schema = Get-Content -LiteralPath $SchemaPath -Raw

    $pattern = 'datasource\s+db\s*\{[\s\S]*?\}'
    if ($schema -notmatch $pattern) {
        throw 'datasource db block not found in schema.prisma'
    }

    $replacement = "datasource db {`r`n  provider = `"postgresql`"`r`n}"
    $schema = [System.Text.RegularExpressions.Regex]::Replace($schema, $pattern, $replacement, 1)

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

    $dsPattern = 'datasource\s*:\s*\{[\s\S]*?\}\s*,?'
    $dsReplacement = 'datasource: {' + "`r`n" + '    url: env("DATABASE_URL"),' + "`r`n" + '  },'

    if ($config -match $dsPattern) {
        $config = [System.Text.RegularExpressions.Regex]::Replace($config, $dsPattern, $dsReplacement, 1)
    } else {
        $config = [System.Text.RegularExpressions.Regex]::Replace(
            $config,
            'export\s+default\s+defineConfig\s*\(\s*\{',
            'export default defineConfig({' + "`r`n" + '  datasource: {' + "`r`n" + '    url: env("DATABASE_URL"),' + "`r`n" + '  },',
            1
        )
    }

    $config = [System.Text.RegularExpressions.Regex]::Replace(
        $config,
        '^\s*directUrl\s*:\s*env\("DIRECT_URL"\),?\s*$',
        '',
        [System.Text.RegularExpressions.RegexOptions]::Multiline
    )

    Write-Utf8NoBomFile -Path $ConfigPath -Content $config
}

Run-Step -Name 'Verify rewritten files' -Action {
    $schemaNow = Get-Content -LiteralPath $SchemaPath -Raw
    $configNow = Get-Content -LiteralPath $ConfigPath -Raw

    if ($schemaNow -match 'url\s*=' -or $schemaNow -match 'directUrl\s*=') {
        throw 'Verification failed: schema.prisma still has url/directUrl'
    }

    if ($configNow -notmatch 'datasource\s*:\s*\{[\s\S]*url:\s*env\("DATABASE_URL"\)') {
        throw 'Verification failed: prisma.config.ts missing datasource.url'
    }

    Log '----- schema.prisma (first 20 lines) -----'
    Get-Content -LiteralPath $SchemaPath -TotalCount 20 | ForEach-Object { Log $_ }

    Log '----- prisma.config.ts -----'
    Get-Content -LiteralPath $ConfigPath | ForEach-Object { Log $_ }
}

Invoke-NpmCommand -Arguments 'exec prisma validate' -StepName 'Prisma validate'
Invoke-NpmCommand -Arguments 'exec prisma generate' -StepName 'Prisma generate'
Invoke-NpmCommand -Arguments 'run build' -StepName 'Next build'

Run-Step -Name 'Write summary' -Action {
    $summary = New-Object System.Collections.Generic.List[string]
    $summary.Add('PRISMA 7 DIRECT FIX SUMMARY') | Out-Null
    $summary.Add('RepoRoot: ' + $RepoRoot) | Out-Null
    $summary.Add('BackupDir: ' + $BackupDir) | Out-Null
    $summary.Add('LogFile: ' + $LogFile) | Out-Null
    $summary.Add('') | Out-Null

    foreach ($row in $StepResults) {
        $summary.Add(('{0} | exit={1} | {2}' -f $row.Step, $row.ExitCode, $row.Status)) | Out-Null
    }

    Write-Utf8NoBomFile -Path $SummaryFile -Content ($summary -join "`r`n")
}

Write-Host ''
Write-Host 'Done.' -ForegroundColor Green
Write-Host ('Backup : ' + $BackupDir)
Write-Host ('Log    : ' + $LogFile)
Write-Host ('Summary: ' + $SummaryFile)
exit 0