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
$WrongTargetPath = "D:\01-Main Work\Boots\Agentic-AI\mission-control\orry"
$CorrectTargetPath = "D:\01-Main-Work\Boots\Agentic-AI\mission-control\orry"

$ToolsDir = Join-Path $SourcePath "tools"
$LogsDir = Join-Path $ToolsDir "logs"
$BackupDir = Join-Path $ToolsDir ("backup_fix_orry_hyphenated_path_" + (Get-Date -Format "yyyyMMdd_HHmmss"))
$LastBackupPointer = Join-Path $ToolsDir "LAST_BACKUP_DIR.txt"
$script:LogFile = Join-Path $LogsDir "fix-orry-hyphenated-path.log"
$SummaryFile = Join-Path $LogsDir "fix-orry-hyphenated-path-summary.txt"

$WrongTargetParent = Split-Path -Parent $WrongTargetPath
$CorrectTargetParent = Split-Path -Parent $CorrectTargetPath

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
        Copy-Item -LiteralPath $script:LogFile -Destination (Join-Path $BackupDir "fix-orry-hyphenated-path.previous.log") -Force
    }
    New-EmptyUtf8NoBomFile -Path $script:LogFile
    Write-Utf8NoBomFile -Path $LastBackupPointer -Content $BackupDir
}

Run-Step -Label "Ensure target parents exist" -Action {
    foreach ($parent in @($WrongTargetParent, $CorrectTargetParent)) {
        if ($parent -and -not (Test-Path -LiteralPath $parent)) {
            New-Item -ItemType Directory -Path $parent -Force | Out-Null
            Log ("Created parent: {0}" -f $parent)
        }
    }
}

Run-Step -Label "Remove wrong target junction if present" -Action {
    if (Test-Path -LiteralPath $WrongTargetPath) {
        $item = Get-Item -LiteralPath $WrongTargetPath -Force
        if ($item.Attributes.ToString().Contains("ReparsePoint")) {
            Remove-Item -LiteralPath $WrongTargetPath -Force
            Log ("Removed wrong junction: {0}" -f $WrongTargetPath)
        } else {
            throw "Wrong target path exists and is not a junction: $WrongTargetPath"
        }
    } else {
        Log "Wrong target path not present"
    }
}

Run-Step -Label "Validate correct target state" -Action {
    if (Test-Path -LiteralPath $CorrectTargetPath) {
        $item = Get-Item -LiteralPath $CorrectTargetPath -Force
        if ($item.Attributes.ToString().Contains("ReparsePoint")) {
            Log ("Correct target already exists as junction: {0}" -f $CorrectTargetPath)
            $global:CorrectExistsAsJunction = $true
        } else {
            throw "Correct target already exists and is not a junction: $CorrectTargetPath"
        }
    } else {
        $global:CorrectExistsAsJunction = $false
    }
}

Run-Step -Label "Create correct junction" -Action {
    if (-not $global:CorrectExistsAsJunction) {
        New-Item -ItemType Junction -Path $CorrectTargetPath -Target $SourcePath -Force | Out-Null
        Log ("Created junction: {0} -> {1}" -f $CorrectTargetPath, $SourcePath)
    } else {
        Log "Skipped creation because correct junction already exists"
    }
}

Run-Step -Label "Validate correct junction" -Action {
    if (-not (Test-Path -LiteralPath $CorrectTargetPath)) {
        throw "Correct target is not accessible: $CorrectTargetPath"
    }
    $required = @(
        (Join-Path $CorrectTargetPath "tools"),
        (Join-Path $CorrectTargetPath "tools\deploy-orry-direct.ps1")
    )
    foreach ($item in $required) {
        if (-not (Test-Path -LiteralPath $item)) {
            throw ("Required item missing through correct junction: {0}" -f $item)
        }
    }
}

$summary = New-Object System.Collections.Generic.List[string]
$summary.Add("FIX ORRY HYPHENATED PATH SUMMARY")
$summary.Add(("Generated: {0}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss")))
$summary.Add(("SourcePath: {0}" -f $SourcePath))
$summary.Add(("RemovedWrongTarget: {0}" -f $WrongTargetPath))
$summary.Add(("CorrectTarget: {0}" -f $CorrectTargetPath))
$summary.Add(("LogFile: {0}" -f $script:LogFile))
$summary.Add(("BackupDir: {0}" -f $BackupDir))
$summary.Add("Result: SUCCESS")
$summary.Add("Notes: Wrong hyphenated target was removed if present. Correct junction now points to the source repo.")
Write-Utf8NoBomFile -Path $SummaryFile -Content ($summary -join [Environment]::NewLine)
Log ("Summary written: {0}" -f $SummaryFile)
