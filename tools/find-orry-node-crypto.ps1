Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$RepoRoot = 'D:\01 Main Work\Boots\Agentic AI\mission-control\orry'
$ToolsDir = Join-Path $RepoRoot 'tools'
$LogsDir = Join-Path $ToolsDir 'logs'
$TimeTag = Get-Date -Format 'yyyyMMdd_HHmmss'
$BackupDir = Join-Path $ToolsDir ("backup_orry_find_node_crypto_" + $TimeTag)
$LogFile = Join-Path $LogsDir ("orry-find-node-crypto_" + $TimeTag + ".log")
$SummaryFile = Join-Path $LogsDir ("orry-find-node-crypto-summary_" + $TimeTag + ".txt")
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

Run-Step -Name 'Validate paths and create folders' -Action {
    if (-not (Test-Path -LiteralPath $RepoRoot)) {
        throw "Repo root not found: $RepoRoot"
    }

    foreach ($dir in @($ToolsDir, $LogsDir, $BackupDir)) {
        if (-not (Test-Path -LiteralPath $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
        }
    }

    Write-Utf8NoBomFile -Path $LastBackupFile -Content $BackupDir
}

$Results = New-Object System.Collections.Generic.List[object]

Run-Step -Name 'Search remaining node:crypto in source' -Action {
    $files = Get-ChildItem -LiteralPath $RepoRoot -Recurse -File -Include *.ts,*.tsx,*.mts,*.cts,*.js,*.jsx,*.mjs,*.cjs |
        Where-Object {
            $_.FullName -notmatch '\\node_modules\\' -and
            $_.FullName -notmatch '\\\.next\\' -and
            $_.FullName -notmatch '\\out\\' -and
            $_.FullName -notmatch '\\coverage\\' -and
            $_.FullName -notmatch '\\tools\\backup_'
        }

    foreach ($file in $files) {
        $matches = Select-String -LiteralPath $file.FullName -Pattern 'node:crypto' -SimpleMatch
        foreach ($m in $matches) {
            $item = [pscustomobject]@{
                Path = $m.Path
                LineNumber = $m.LineNumber
                Line = $m.Line.Trim()
            }
            $Results.Add($item) | Out-Null
            Log ("FOUND => " + $item.Path + ":" + $item.LineNumber + " | " + $item.Line)
        }
    }

    if ($Results.Count -eq 0) {
        Log 'No remaining node:crypto found in scanned source files.'
    }
}

Run-Step -Name 'Write summary' -Action {
    $summary = New-Object System.Collections.Generic.List[string]
    $summary.Add('ORRY FIND NODE CRYPTO SUMMARY') | Out-Null
    $summary.Add('RepoRoot: ' + $RepoRoot) | Out-Null
    $summary.Add('BackupDir: ' + $BackupDir) | Out-Null
    $summary.Add('LogFile: ' + $LogFile) | Out-Null
    $summary.Add('') | Out-Null

    foreach ($row in $StepResults) {
        $summary.Add(('{0} | exit={1} | {2}' -f $row.Step, $row.ExitCode, $row.Status)) | Out-Null
    }

    $summary.Add('') | Out-Null
    $summary.Add('MATCHES: ' + $Results.Count) | Out-Null
    foreach ($r in $Results) {
        $summary.Add(($r.Path + ':' + $r.LineNumber + ' | ' + $r.Line)) | Out-Null
    }

    Write-Utf8NoBomFile -Path $SummaryFile -Content ($summary -join "`r`n")
}

Write-Host ''
Write-Host 'Done.' -ForegroundColor Green
Write-Host ('Log    : ' + $LogFile)
Write-Host ('Summary: ' + $SummaryFile)
exit 0