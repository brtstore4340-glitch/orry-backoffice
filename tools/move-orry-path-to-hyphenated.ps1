Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

trap {
    try {
        if ($script:LogFile) {
            Add-Content -LiteralPath $script:LogFile -Value ("[FATAL] " + $_.Exception.Message) -Encoding utf8
        }
    } catch {}
    throw
}

function Write-Utf8NoBomFile {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [AllowEmptyString()][string]$Content = ""
    )
    $parent = Split-Path -Parent $Path
    if ($parent -and -not (Test-Path -LiteralPath $parent)) {
        New-Item -ItemType Directory -Path $parent -Force | Out-Null
    }
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($Path, $Content, $utf8NoBom)
}

function New-EmptyUtf8NoBomFile {
    param([Parameter(Mandatory = $true)][string]$Path)
    Write-Utf8NoBomFile -Path $Path -Content ""
}

function Append-Utf8 {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][string]$Line
    )
    Add-Content -LiteralPath $Path -Value $Line -Encoding utf8
}

function Log {
    param([Parameter(Mandatory = $true)][string]$Message)
    $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $line = "[{0}] {1}" -f $ts, $Message
    Write-Host $line
    Append-Utf8 -Path $script:LogFile -Line $line
}

function Run-Step {
    param(
        [Parameter(Mandatory = $true)][string]$Label,
        [Parameter(Mandatory = $true)][scriptblock]$Action
    )
    Log ("STEP START: {0}" -f $Label)
    try {
        & $Action
        Log ("STEP OK: {0} | exit=0" -f $Label)
    } catch {
        Log ("STEP FAIL: {0} | exit=1 | error={1}" -f $Label, $_.Exception.Message)
        throw
    }
}

$SourcePath = "D:\01-Main-Work\Boots\Agentic-AI\mission-control\orry"
$TargetPath = "D:\01-Main-Work\Boots\Agentic-AI\mission-control\orry"

$ToolsDir = Join-Path $SourcePath "tools"
$LogsDir = Join-Path $ToolsDir "logs"
$BackupDir = Join-Path $ToolsDir ("backup_move_orry_repo_" + (Get-Date -Format "yyyyMMdd_HHmmss"))
$LastBackupPointer = Join-Path $ToolsDir "LAST_BACKUP_DIR.txt"
$script:LogFile = Join-Path $LogsDir "move-orry-path.log"
$SummaryFile = Join-Path $LogsDir "move-orry-path-summary.txt"

$Result = "FAILED"
$Notes = "Unknown"

Run-Step -Label "Validate source and prepare log folders" -Action {
    if (-not (Test-Path -LiteralPath $SourcePath)) {
        throw "Source path not found: $SourcePath"
    }

    if (-not (Test-Path -LiteralPath $ToolsDir)) {
        New-Item -ItemType Directory -Path $ToolsDir -Force | Out-Null
    }
    if (-not (Test-Path -LiteralPath $LogsDir)) {
        New-Item -ItemType Directory -Path $LogsDir -Force | Out-Null
    }
    if (-not (Test-Path -LiteralPath $BackupDir)) {
        New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
    }

    if (Test-Path -LiteralPath $script:LogFile) {
        Copy-Item -LiteralPath $script:LogFile -Destination (Join-Path $BackupDir "move-orry-path.previous.log") -Force
    }
    New-EmptyUtf8NoBomFile -Path $script:LogFile
    Write-Utf8NoBomFile -Path $LastBackupPointer -Content $BackupDir
}

Run-Step -Label "Preflight target path checks" -Action {
    if (Test-Path -LiteralPath $TargetPath) {
        throw "Target path already exists: $TargetPath"
    }

    $targetParent = Split-Path -Parent $TargetPath
    if (-not (Test-Path -LiteralPath $targetParent)) {
        New-Item -ItemType Directory -Path $targetParent -Force | Out-Null
        Log ("Created target parent: {0}" -f $targetParent)
    }

    if (-not (Test-Path -LiteralPath $targetParent)) {
        throw "Target parent could not be created: $targetParent"
    }
}

Run-Step -Label "Write move plan snapshot" -Action {
    $plan = New-Object System.Collections.Generic.List[string]
    $plan.Add("MOVE ORRY REPO PLAN")
    $plan.Add(("Generated: {0}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss")))
    $plan.Add(("SourcePath: {0}" -f $SourcePath))
    $plan.Add(("TargetPath: {0}" -f $TargetPath))
    $plan.Add("Mode: Move entire repo directory")
    $plan.Add("Guard: Do not overwrite existing target")
    $plan.Add("Guard: Preserve tools/LAST_BACKUP_DIR.txt and logs at source before move")
    Write-Utf8NoBomFile -Path (Join-Path $BackupDir "move-plan.txt") -Content ($plan -join [Environment]::NewLine)
}

Run-Step -Label "Move repo directory to new hyphenated path" -Action {
    Move-Item -LiteralPath $SourcePath -Destination $TargetPath -Force
}

$NewToolsDir = Join-Path $TargetPath "tools"
$NewLogsDir = Join-Path $NewToolsDir "logs"
$NewSummaryFile = Join-Path $NewLogsDir "move-orry-path-summary.txt"
$NewLogFile = Join-Path $NewLogsDir "move-orry-path.log"
$NewLastBackupPointer = Join-Path $NewToolsDir "LAST_BACKUP_DIR.txt"

if (-not (Test-Path -LiteralPath $NewLogsDir)) {
    New-Item -ItemType Directory -Path $NewLogsDir -Force | Out-Null
}

if (-not (Test-Path -LiteralPath $NewLogFile)) {
    New-EmptyUtf8NoBomFile -Path $NewLogFile
}

$script:LogFile = $NewLogFile
Write-Utf8NoBomFile -Path $NewLastBackupPointer -Content (Join-Path $TargetPath "tools\backup_move_orry_repo_" + (Get-Date -Format "yyyyMMdd_HHmmss"))

Log ("SourcePath moved successfully to TargetPath")
Log ("New repo path: {0}" -f $TargetPath)

$summary = New-Object System.Collections.Generic.List[string]
$summary.Add("MOVE ORRY PATH SUMMARY")
$summary.Add(("Generated: {0}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss")))
$summary.Add(("OldPath: {0}" -f $SourcePath))
$summary.Add(("NewPath: {0}" -f $TargetPath))
$summary.Add(("LogFile: {0}" -f $NewLogFile))
$summary.Add(("BackupDir: {0}" -f $BackupDir))
$summary.Add("Result: SUCCESS")
$summary.Add("Notes: Repo directory moved to new hyphenated path. Update terminals, VS Code workspace, and any hard-coded paths/scripts next.")
Write-Utf8NoBomFile -Path $NewSummaryFile -Content ($summary -join [Environment]::NewLine)
Log ("Summary written: {0}" -f $NewSummaryFile)
