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

function Run-Native {
    param(
        [Parameter(Mandatory = $true)][string]$Label,
        [Parameter(Mandatory = $true)][string]$FilePath,
        [Parameter()][string[]]$ArgumentList = @(),
        [Parameter()][string]$WorkingDirectory = (Get-Location).Path,
        [Parameter()][int[]]$AcceptExitCodes = @(0)
    )

    $stdout = New-TemporaryFile
    $stderr = New-TemporaryFile
    try {
        Log ("CMD: {0} {1}" -f $FilePath, ($ArgumentList -join " "))
        $p = Start-Process -FilePath $FilePath -ArgumentList $ArgumentList -WorkingDirectory $WorkingDirectory -NoNewWindow -Wait -PassThru -RedirectStandardOutput $stdout.FullName -RedirectStandardError $stderr.FullName
        $outText = if (Test-Path -LiteralPath $stdout.FullName) { [string](Get-Content -LiteralPath $stdout.FullName -Raw -ErrorAction SilentlyContinue) } else { "" }
        $errText = if (Test-Path -LiteralPath $stderr.FullName) { [string](Get-Content -LiteralPath $stderr.FullName -Raw -ErrorAction SilentlyContinue) } else { "" }

        Log ("EXIT CODE: {0}" -f $p.ExitCode)

        if (-not [string]::IsNullOrWhiteSpace($outText)) {
            Log "STDOUT BEGIN"
            ($outText -split "`r?`n") | ForEach-Object { if ($_ -ne "") { Log $_ } }
            Log "STDOUT END"
        }
        if (-not [string]::IsNullOrWhiteSpace($errText)) {
            Log "STDERR BEGIN"
            ($errText -split "`r?`n") | ForEach-Object { if ($_ -ne "") { Log $_ } }
            Log "STDERR END"
        }

        if ($AcceptExitCodes -notcontains $p.ExitCode) {
            throw ("{0} failed with exit code {1}" -f $Label, $p.ExitCode)
        }

        return [pscustomobject]@{
            ExitCode = $p.ExitCode
            StdOut = $outText
            StdErr = $errText
        }
    } finally {
        Remove-Item -LiteralPath $stdout.FullName -Force -ErrorAction SilentlyContinue
        Remove-Item -LiteralPath $stderr.FullName -Force -ErrorAction SilentlyContinue
    }
}

$SourcePath = "D:\01-Main-Work\Boots\Agentic-AI\mission-control\orry"
$TargetPath = "D:\01-Main Work\Boots\Agentic-AI\mission-control\orry"

$ToolsDir = Join-Path $SourcePath "tools"
$LogsDir = Join-Path $ToolsDir "logs"
$BackupDir = Join-Path $ToolsDir ("backup_copy_orry_repo_" + (Get-Date -Format "yyyyMMdd_HHmmss"))
$LastBackupPointer = Join-Path $ToolsDir "LAST_BACKUP_DIR.txt"
$script:LogFile = Join-Path $LogsDir "copy-orry-path.log"
$SummaryFileSource = Join-Path $LogsDir "copy-orry-path-summary.txt"

$Result = "FAILED"
$Notes = "Unknown"
$CopiedTargetSummary = $null

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
        Copy-Item -LiteralPath $script:LogFile -Destination (Join-Path $BackupDir "copy-orry-path.previous.log") -Force
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
}

Run-Step -Label "Write copy plan snapshot" -Action {
    $plan = New-Object System.Collections.Generic.List[string]
    $plan.Add("COPY ORRY REPO PLAN")
    $plan.Add(("Generated: {0}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss")))
    $plan.Add(("SourcePath: {0}" -f $SourcePath))
    $plan.Add(("TargetPath: {0}" -f $TargetPath))
    $plan.Add("Mode: Copy repo directory to new hyphenated path using robocopy")
    $plan.Add("Guard: Do not overwrite existing target")
    $plan.Add("Reason: Source repo is currently in use, so direct Move-Item can fail")
    Write-Utf8NoBomFile -Path (Join-Path $BackupDir "copy-plan.txt") -Content ($plan -join [Environment]::NewLine)
}

Run-Step -Label "Copy repo directory to new hyphenated path" -Action {
    $null = Run-Native -Label "robocopy-copy-orry" -FilePath "robocopy.exe" -ArgumentList @(
        $SourcePath,
        $TargetPath,
        "/E",
        "/COPY:DAT",
        "/DCOPY:DAT",
        "/R:1",
        "/W:1",
        "/XJ",
        "/NFL",
        "/NDL",
        "/NP"
    ) -WorkingDirectory $SourcePath -AcceptExitCodes @(0,1,2,3,4,5,6,7)
}

Run-Step -Label "Validate copied target" -Action {
    if (-not (Test-Path -LiteralPath $TargetPath)) {
        throw "Target path was not created: $TargetPath"
    }

    $required = @(
        (Join-Path $TargetPath "tools"),
        (Join-Path $TargetPath "package.json")
    )

    foreach ($item in $required) {
        if (-not (Test-Path -LiteralPath $item)) {
            throw ("Required copied item missing: {0}" -f $item)
        }
    }
}

Run-Step -Label "Write summary to source and target" -Action {
    $TargetToolsDir = Join-Path $TargetPath "tools"
    $TargetLogsDir = Join-Path $TargetToolsDir "logs"
    if (-not (Test-Path -LiteralPath $TargetLogsDir)) {
        New-Item -ItemType Directory -Path $TargetLogsDir -Force | Out-Null
    }

    $summaryLines = New-Object System.Collections.Generic.List[string]
    $summaryLines.Add("COPY ORRY PATH SUMMARY")
    $summaryLines.Add(("Generated: {0}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss")))
    $summaryLines.Add(("OldPath: {0}" -f $SourcePath))
    $summaryLines.Add(("NewPath: {0}" -f $TargetPath))
    $summaryLines.Add(("SourceLogFile: {0}" -f $script:LogFile))
    $summaryLines.Add(("BackupDir: {0}" -f $BackupDir))
    $summaryLines.Add("Result: SUCCESS")
    $summaryLines.Add("Notes: Repo was copied to new hyphenated path. Switch terminals/VS Code to the new path, validate app, then delete the old repo later when nothing is using it.")

    Write-Utf8NoBomFile -Path $SummaryFileSource -Content ($summaryLines -join [Environment]::NewLine)

    $CopiedTargetSummary = Join-Path $TargetLogsDir "copy-orry-path-summary.txt"
    Write-Utf8NoBomFile -Path $CopiedTargetSummary -Content ($summaryLines -join [Environment]::NewLine)

    Log ("Summary written at source: {0}" -f $SummaryFileSource)
    Log ("Summary written at target: {0}" -f $CopiedTargetSummary)
}

$Result = "SUCCESS"
$Notes = "Repo copied successfully to new hyphenated path. Old path remains in place because it was in use."

$finalSummary = New-Object System.Collections.Generic.List[string]
$finalSummary.Add("COPY ORRY PATH SUMMARY")
$finalSummary.Add(("Generated: {0}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss")))
$finalSummary.Add(("OldPath: {0}" -f $SourcePath))
$finalSummary.Add(("NewPath: {0}" -f $TargetPath))
$finalSummary.Add(("LogFile: {0}" -f $script:LogFile))
$finalSummary.Add(("BackupDir: {0}" -f $BackupDir))
$finalSummary.Add(("Result: {0}" -f $Result))
$finalSummary.Add(("Notes: {0}" -f $Notes))
Write-Utf8NoBomFile -Path $SummaryFileSource -Content ($finalSummary -join [Environment]::NewLine)
Log ("Summary written: {0}" -f $SummaryFileSource)
