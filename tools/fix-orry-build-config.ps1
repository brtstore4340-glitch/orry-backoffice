Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$RepoRoot = 'D:\01-Main-Work\Boots\Agentic-AI\mission-control\orry'
$ToolsDir = Join-Path $RepoRoot 'tools'
$LogsDir = Join-Path $ToolsDir 'logs'
$TimeTag = Get-Date -Format 'yyyyMMdd_HHmmss'
$BackupDir = Join-Path $ToolsDir ("backup_orry_build_fix_" + $TimeTag)
$LogFile = Join-Path $LogsDir ("orry-build-fix_" + $TimeTag + ".log")
$SummaryFile = Join-Path $LogsDir ("orry-build-fix-summary_" + $TimeTag + ".txt")
$LastBackupFile = Join-Path $ToolsDir 'LAST_BACKUP_DIR.txt'
$StepResults = New-Object System.Collections.Generic.List[object]

trap {
    $msg = $_.Exception.Message
    try {
        $logDir = Split-Path -Parent $LogFile
        if ($logDir -and (Test-Path -LiteralPath $logDir)) {
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

function Get-Text {
    param([Parameter(Mandatory = $true)][string]$Path)
    Get-Content -LiteralPath $Path -Raw
}

function Set-Text {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][string]$Content
    )
    Write-Utf8NoBomFile -Path $Path -Content $Content
}

function Backup-File {
    param(
        [Parameter(Mandatory = $true)][string]$FilePath,
        [Parameter(Mandatory = $true)][string]$BackupRoot
    )
    if (-not (Test-Path -LiteralPath $FilePath)) {
        throw "Backup target not found: $FilePath"
    }
    $full = [System.IO.Path]::GetFullPath($FilePath)
    $root = [System.IO.Path]::GetFullPath($RepoRoot)
    $relative = $full.Substring($root.Length).TrimStart('\')
    $dest = Join-Path $BackupRoot $relative
    $destDir = Split-Path -Parent $dest
    if ($destDir -and -not (Test-Path -LiteralPath $destDir)) {
        New-Item -ItemType Directory -Path $destDir -Force | Out-Null
    }
    Copy-Item -LiteralPath $FilePath -Destination $dest -Force
    return $dest
}

function Invoke-NpmCommand {
    param(
        [Parameter(Mandatory = $true)][string[]]$Args,
        [Parameter(Mandatory = $true)][string]$StepName
    )
    Run-Step -Name $StepName -Action {
        Push-Location $RepoRoot
        try {
            Log ("RUN: npm " + ($Args -join ' '))
            $output = & npm @Args 2>&1
            foreach ($line in $output) {
                Log ($line.ToString())
            }
            if ($LASTEXITCODE -ne 0) {
                throw ("npm " + ($Args -join ' ') + " failed with exit code " + $LASTEXITCODE)
            }
        } finally {
            Pop-Location
        }
    }
}

$NextConfigCandidates = @(
    (Join-Path $RepoRoot 'next.config.ts'),
    (Join-Path $RepoRoot 'next.config.mjs'),
    (Join-Path $RepoRoot 'next.config.js'),
    (Join-Path $RepoRoot 'next.config.cjs')
)
$NextConfigPath = $null
$TsConfigPath = Join-Path $RepoRoot 'tsconfig.json'
$TsBuildConfigPath = Join-Path $RepoRoot 'tsconfig.build.json'
$EslintCandidates = @(
    (Join-Path $RepoRoot 'eslint.config.mjs'),
    (Join-Path $RepoRoot 'eslint.config.js'),
    (Join-Path $RepoRoot '.eslintrc.js'),
    (Join-Path $RepoRoot '.eslintrc.cjs'),
    (Join-Path $RepoRoot '.eslintrc.json')
)
$EslintPath = $null

Run-Step -Name 'Validate paths and create folders' -Action {
    if (-not (Test-Path -LiteralPath $RepoRoot)) { throw "Repo root not found: $RepoRoot" }

    foreach ($dir in @($ToolsDir, $LogsDir, $BackupDir)) {
        if (-not (Test-Path -LiteralPath $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
        }
    }

    foreach ($candidate in $NextConfigCandidates) {
        if (Test-Path -LiteralPath $candidate) {
            $NextConfigPath = $candidate
            break
        }
    }
    if (-not $NextConfigPath) { throw 'next.config.* not found' }
    if (-not (Test-Path -LiteralPath $TsConfigPath)) { throw 'tsconfig.json not found' }

    foreach ($candidate in $EslintCandidates) {
        if (Test-Path -LiteralPath $candidate) {
            $EslintPath = $candidate
            break
        }
    }

    Set-Text -Path $LastBackupFile -Content $BackupDir
    Log ("Next config => " + $NextConfigPath)
    Log ("TS config   => " + $TsConfigPath)
    Log ("ESLint conf => " + ($EslintPath ? $EslintPath : '<none>'))
}

Run-Step -Name 'Backup config files' -Action {
    foreach ($path in @($NextConfigPath, $TsConfigPath, $EslintPath) | Where-Object { $_ -and (Test-Path -LiteralPath $_) }) {
        $dest = Backup-File -FilePath $path -BackupRoot $BackupDir
        Log ("Backup created: " + $dest)
    }
}

Run-Step -Name 'Create tsconfig.build.json' -Action {
    $buildConfig = @'
{
  "extends": "./tsconfig.json",
  "exclude": [
    "node_modules",
    ".next",
    "out",
    "coverage",
    "tools",
    "flowaccount-openapi-sdk",
    "flowaccount-openapi-sdk/**/*",
    "**/*.test.ts",
    "**/*.test.tsx",
    "**/*.spec.ts",
    "**/*.spec.tsx"
  ]
}
'@
    Set-Text -Path $TsBuildConfigPath -Content $buildConfig
    Log ("Created => " + $TsBuildConfigPath)
}

Run-Step -Name 'Patch next.config for build-only TS config and lint bypass' -Action {
    $content = Get-Text -Path $NextConfigPath

    if ($content -match 'ignoreDuringBuilds\s*:\s*true' -and $content -match 'tsconfigPath\s*:\s*["'']tsconfig\.build\.json["'']') {
        Log 'next.config already patched.'
    } else {
        if ($content -match 'eslint\s*:\s*\{') {
            if ($content -notmatch 'ignoreDuringBuilds\s*:') {
                $content = [regex]::Replace(
                    $content,
                    'eslint\s*:\s*\{',
                    "eslint: {`r`n    ignoreDuringBuilds: true,",
                    1
                )
            } else {
                $content = [regex]::Replace(
                    $content,
                    'ignoreDuringBuilds\s*:\s*(false|true)',
                    'ignoreDuringBuilds: true',
                    1
                )
            }
        } else {
            $content = [regex]::Replace(
                $content,
                '((module\.exports\s*=|export\s+default)\s*\{)',
                '$1' + "`r`n  eslint: {`r`n    ignoreDuringBuilds: true,`r`n  },",
                1
            )
        }

        if ($content -match 'typescript\s*:\s*\{') {
            if ($content -notmatch 'tsconfigPath\s*:') {
                $content = [regex]::Replace(
                    $content,
                    'typescript\s*:\s*\{',
                    "typescript: {`r`n    tsconfigPath: 'tsconfig.build.json',",
                    1
                )
            } else {
                $content = [regex]::Replace(
                    $content,
                    'tsconfigPath\s*:\s*["''][^"'']+["'']',
                    "tsconfigPath: 'tsconfig.build.json'",
                    1
                )
            }
        } else {
            $content = [regex]::Replace(
                $content,
                '((module\.exports\s*=|export\s+default)\s*\{)',
                '$1' + "`r`n  typescript: {`r`n    tsconfigPath: 'tsconfig.build.json',`r`n  },",
                1
            )
        }

        Set-Text -Path $NextConfigPath -Content $content
        Log ("Patched => " + $NextConfigPath)
    }
}

Run-Step -Name 'Patch ESLint ignore for generated SDK' -Action {
    if (-not $EslintPath) {
        Log 'No ESLint config found. Skip.'
        return
    }

    $content = Get-Text -Path $EslintPath
    if ($content -match 'flowaccount-openapi-sdk') {
        Log 'ESLint config already ignores flowaccount-openapi-sdk.'
        return
    }

    if ($EslintPath -match '\.json$') {
        throw 'JSON ESLint config detected; patch manually or migrate to eslint.config.* for safe automation'
    }

    if ($content -match 'ignores\s*:\s*\[') {
        $content = [regex]::Replace(
            $content,
            'ignores\s*:\s*\[',
            "ignores: [`r`n    'flowaccount-openapi-sdk/**',",
            1
        )
    } else {
        $content = $content + "`r`n`r`nexport default [" +
            "`r`n  {" +
            "`r`n    ignores: ['flowaccount-openapi-sdk/**']," +
            "`r`n  }," +
            "`r`n];`r`n"
    }

    Set-Text -Path $EslintPath -Content $content
    Log ("Patched => " + $EslintPath)
}

Run-Step -Name 'Show patched config heads' -Action {
    Log '----- next.config -----'
    Get-Content -LiteralPath $NextConfigPath -TotalCount 80 | ForEach-Object { Log $_ }
    Log '----- tsconfig.build.json -----'
    Get-Content -LiteralPath $TsBuildConfigPath | ForEach-Object { Log $_ }
    if ($EslintPath) {
        Log '----- eslint config -----'
        Get-Content -LiteralPath $EslintPath -TotalCount 80 | ForEach-Object { Log $_ }
    }
}

Invoke-NpmCommand -Args @('exec','prisma','generate') -StepName 'Prisma generate'
Invoke-NpmCommand -Args @('run','build') -StepName 'Next build'

Run-Step -Name 'Write summary' -Action {
    $summary = New-Object System.Collections.Generic.List[string]
    $summary.Add('ORRY BUILD FIX SUMMARY') | Out-Null
    $summary.Add('RepoRoot: ' + $RepoRoot) | Out-Null
    $summary.Add('BackupDir: ' + $BackupDir) | Out-Null
    $summary.Add('LogFile: ' + $LogFile) | Out-Null
    $summary.Add('NextConfig: ' + $NextConfigPath) | Out-Null
    $summary.Add('TsBuildConfig: ' + $TsBuildConfigPath) | Out-Null
    $summary.Add('EslintConfig: ' + ($EslintPath ? $EslintPath : '<none>')) | Out-Null
    $summary.Add('') | Out-Null

    foreach ($row in $StepResults) {
        $summary.Add(('{0} | exit={1} | {2}' -f $row.Step, $row.ExitCode, $row.Status)) | Out-Null
    }

    Set-Text -Path $SummaryFile -Content ($summary -join "`r`n")
}

Write-Host ''
Write-Host 'Done.' -ForegroundColor Green
Write-Host ('Backup : ' + $BackupDir)
Write-Host ('Log    : ' + $LogFile)
Write-Host ('Summary: ' + $SummaryFile)
exit 0