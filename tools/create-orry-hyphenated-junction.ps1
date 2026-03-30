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
$TargetPath = "D:\01-Main Work\Boots\Agentic-AI\mission-control\orry"

$ToolsDir = Join-Path $SourcePath "tools"
$LogsDir = Join-Path $ToolsDir "logs"
$BackupDir = Join-Path $ToolsDir ("backup_create_orry_junction_" + (Get-Date -Format "yyyyMMdd_HHmmss"))
$LastBackupPointer = Join-Path $ToolsDir "LAST_BACKUP_DIR.txt"
$script:LogFile = Join-Path $LogsDir "create-orry-hyphenated-junction.log"
$SummaryFile = Join-Path $LogsDir "create-orry-hyphenated-junction-summary.txt"

$Result = "FAILED"
$Notes = "Unknown"
$TargetParent = Split-Path -Parent $TargetPath

Run-Step -Label "Validate source and prepare folders" -Action {
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
        Copy-Item -LiteralPath $script:LogFile -Destination (Join-Path $BackupDir "create-orry-hyphenated-junction.previous.log") -Force
    }
    New-EmptyUtf8NoBomFile -Path $script:LogFile
    Write-Utf8NoBomFile -Path $LastBackupPointer -Content $BackupDir
}

Run-Step -Label "Prepare target parent path" -Action {
    if (-not (Test-Path -LiteralPath $TargetParent)) {
        New-Item -ItemType Directory -Path $TargetParent -Force | Out-Null
        Log ("Created target parent: {0}" -f $TargetParent)
    }
}

Run-Step -Label "Validate target path state" -Action {
    if (Test-Path -LiteralPath $TargetPath) {
        $item = Get-Item -LiteralPath $TargetPath -Force
        if ($item.Attributes.ToString().Contains("ReparsePoint")) {
            Log ("Target already exists as reparse point: {0}" -f $TargetPath)
            $global:AlreadyExistsAsJunction = $true
        } else {
            throw "Target path already exists and is not a junction: $TargetPath"
        }
    } else {
        $global:AlreadyExistsAsJunction = $false
    }
}

Run-Step -Label "Create junction to source repo" -Action {
    if (-not $global:AlreadyExistsAsJunction) {
        New-Item -ItemType Junction -Path $TargetPath -Target $SourcePath -Force | Out-Null
        Log ("Created junction: {0} -> {1}" -f $TargetPath, $SourcePath)
    } else {
        Log "Skipped creation because junction already exists"
    }
}

Run-Step -Label "Validate junction target" -Action {
    if (-not (Test-Path -LiteralPath $TargetPath)) {
        throw "Target path still not accessible after junction creation: $TargetPath"
    }

    $targetTools = Join-Path $TargetPath "tools"
    $targetDeploy = Join-Path $TargetPath "tools\deploy-orry-direct.ps1"

    if (-not (Test-Path -LiteralPath $targetTools)) {
        throw "Target junction does not expose tools folder: $targetTools"
    }
    if (-not (Test-Path -LiteralPath $targetDeploy)) {
        throw "Target junction does not expose deploy script: $targetDeploy"
    }
}

$Result = "SUCCESS"
$Notes = "Created a junction path so the new hyphenated path points to the existing repo. No files were moved or copied."

$summary = New-Object System.Collections.Generic.List[string]
$summary.Add("CREATE ORRY HYPHENATED JUNCTION SUMMARY")
$summary.Add(("Generated: {0}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss")))
$summary.Add(("SourcePath: {0}" -f $SourcePath))
$summary.Add(("TargetPath: {0}" -f $TargetPath))
$summary.Add(("LogFile: {0}" -f $script:LogFile))
$summary.Add(("BackupDir: {0}" -f $BackupDir))
$summary.Add(("Result: {0}" -f $Result))
$summary.Add(("Notes: {0}" -f $Notes))
Write-Utf8NoBomFile -Path $SummaryFile -Content ($summary -join [Environment]::NewLine)
Log ("Summary written: {0}" -f $SummaryFile)
