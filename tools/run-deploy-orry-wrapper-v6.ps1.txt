Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$script:RunSucceeded = $false
$script:FinalExitCode = 1

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
    $parent = Split-Path -Parent $Path
    if ($parent -and -not (Test-Path -LiteralPath $parent)) {
        New-Item -ItemType Directory -Path $parent -Force | Out-Null
    }
    Add-Content -LiteralPath $Path -Value $Line -Encoding utf8
}

function Log {
    param([Parameter(Mandatory = $true)][string]$Message)
    $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $line = "[{0}] {1}" -f $ts, $Message
    Write-Host $line
    Append-Utf8 -Path $script:WrapperLogFile -Line $line
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

function Run-NativeDetailed {
    param(
        [Parameter(Mandatory = $true)][string]$FilePath,
        [Parameter()][string[]]$ArgumentList = @(),
        [Parameter()][string]$WorkingDirectory = (Get-Location).Path
    )

    $stdout = New-TemporaryFile
    $stderr = New-TemporaryFile
    try {
        Log ("CMD: {0} {1}" -f $FilePath, ($ArgumentList -join " "))
        $proc = Start-Process -FilePath $FilePath -ArgumentList $ArgumentList -WorkingDirectory $WorkingDirectory -NoNewWindow -Wait -PassThru -RedirectStandardOutput $stdout.FullName -RedirectStandardError $stderr.FullName

        $outText = if (Test-Path -LiteralPath $stdout.FullName) { [string](Get-Content -LiteralPath $stdout.FullName -Raw -ErrorAction SilentlyContinue) } else { "" }
        $errText = if (Test-Path -LiteralPath $stderr.FullName) { [string](Get-Content -LiteralPath $stderr.FullName -Raw -ErrorAction SilentlyContinue) } else { "" }

        Log ("EXIT CODE: {0}" -f $proc.ExitCode)

        if ([string]::IsNullOrWhiteSpace($outText)) {
            Log "STDOUT: <empty>"
        } else {
            Log "STDOUT BEGIN"
            ($outText -split "`r?`n") | ForEach-Object { if ($_ -ne "") { Log $_ } }
            Log "STDOUT END"
        }

        if ([string]::IsNullOrWhiteSpace($errText)) {
            Log "STDERR: <empty>"
        } else {
            Log "STDERR BEGIN"
            ($errText -split "`r?`n") | ForEach-Object { if ($_ -ne "") { Log $_ } }
            Log "STDERR END"
        }

        return [pscustomobject]@{
            ExitCode = $proc.ExitCode
            StdOut   = $outText
            StdErr   = $errText
        }
    } finally {
        Remove-Item -LiteralPath $stdout.FullName -Force -ErrorAction SilentlyContinue
        Remove-Item -LiteralPath $stderr.FullName -Force -ErrorAction SilentlyContinue
    }
}

function Write-Summary {
    param(
        [Parameter(Mandatory = $true)][string]$ResultText,
        [Parameter(Mandatory = $true)][int]$ExitCode,
        [Parameter(Mandatory = $true)][string]$Notes
    )
    $summary = New-Object System.Collections.Generic.List[string]
    $summary.Add("DEPLOY ORRY WRAPPER SUMMARY V6")
    $summary.Add(("Generated: {0}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss")))
    $summary.Add(("RepoRoot: {0}" -f $RepoRoot))
    $summary.Add(("DeployScript: {0}" -f $DeployScript))
    $summary.Add(("ChildScript: {0}" -f $ChildScriptPath))
    $summary.Add(("BackupDir: {0}" -f $BackupDir))
    $summary.Add(("WrapperLog: {0}" -f $script:WrapperLogFile))
    $summary.Add(("ChildLog: {0}" -f $ChildLogFile))
    $summary.Add(("ExitCode: {0}" -f $ExitCode))
    $summary.Add(("Result: {0}" -f $ResultText))
    $summary.Add(("Notes: {0}" -f $Notes))
    Write-Utf8NoBomFile -Path $SummaryFile -Content ($summary -join [Environment]::NewLine)
    Log ("Summary written: {0}" -f $SummaryFile)
}

$RepoRoot = "D:\01-Main-Work\Boots\Agentic-AI\mission-control\orry"
$ToolsDir = Join-Path $RepoRoot "tools"
$LogsDir = Join-Path $ToolsDir "logs"
$BackupDir = Join-Path $ToolsDir ("backup_deploy_wrapper_v6_" + (Get-Date -Format "yyyyMMdd_HHmmss"))
$LastBackupPointer = Join-Path $ToolsDir "LAST_BACKUP_DIR.txt"
$DeployScript = Join-Path $ToolsDir "deploy-orry-direct.ps1"
$ChildScriptPath = Join-Path $ToolsDir "invoke-deploy-orry-child-v6.ps1"
$script:WrapperLogFile = Join-Path $LogsDir "deploy-orry-wrapper-v6.log"
$ChildLogFile = Join-Path $LogsDir "deploy-orry-child-v6.log"
$SummaryFile = Join-Path $LogsDir "deploy-orry-wrapper-v6-summary.txt"
$script:SummaryNotes = "Unknown"

try {
    if (-not (Test-Path -LiteralPath $RepoRoot)) { throw "Repo root not found: $RepoRoot" }
    if (-not (Test-Path -LiteralPath $ToolsDir)) { New-Item -ItemType Directory -Path $ToolsDir -Force | Out-Null }
    if (-not (Test-Path -LiteralPath $LogsDir)) { New-Item -ItemType Directory -Path $LogsDir -Force | Out-Null }
    if (-not (Test-Path -LiteralPath $BackupDir)) { New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null }

    New-EmptyUtf8NoBomFile -Path $script:WrapperLogFile
    New-EmptyUtf8NoBomFile -Path $ChildLogFile
    Write-Utf8NoBomFile -Path $LastBackupPointer -Content $BackupDir

    Run-Step -Label "Backup deploy script" -Action {
        if (-not (Test-Path -LiteralPath $DeployScript)) {
            throw "Deploy script not found: $DeployScript"
        }
        Copy-Item -LiteralPath $DeployScript -Destination (Join-Path $BackupDir "deploy-orry-direct.ps1") -Force
        Log ("Backup created: {0}" -f $DeployScript)
    }

    Set-Location -LiteralPath $RepoRoot

    $psqlCmd = $null
    $supabaseCmd = $null

    Run-Step -Label "Preflight command checks" -Action {
        foreach ($cmd in @("powershell.exe")) {
            if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
                throw ("Required command not found: {0}" -f $cmd)
            }
        }

        $psqlCmd = Get-Command psql -ErrorAction SilentlyContinue
        $supabaseCmd = Get-Command supabase -ErrorAction SilentlyContinue

        Log ("CLI psql: {0}" -f ($(if ($psqlCmd) { $psqlCmd.Source } else { "MISSING" })))
        Log ("CLI supabase: {0}" -f ($(if ($supabaseCmd) { $supabaseCmd.Source } else { "MISSING" })))

        if (-not $psqlCmd) {
            $script:SummaryNotes = "Precheck failed: psql is missing from PATH."
            throw "psql is missing from PATH. Install PostgreSQL client tools or add psql.exe to PATH before deploy."
        }
    }

    Run-Step -Label "Write child runner script" -Action {
        $childScript = @'
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$deployScript = "D:\01-Main-Work\Boots\Agentic-AI\mission-control\orry\tools\deploy-orry-direct.ps1"
$childLog = "D:\01-Main-Work\Boots\Agentic-AI\mission-control\orry\tools\logs\deploy-orry-child-v6.log"

function Write-ChildLine {
    param([string]$Message)
    $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Add-Content -LiteralPath $childLog -Value ("[{0}] {1}" -f $ts, $Message) -Encoding utf8
}

try {
    Write-ChildLine "CHILD START"
    Write-ChildLine ("PWD: " + (Get-Location).Path)
    Write-ChildLine ("Deploy script: " + $deployScript)

    if (-not (Test-Path -LiteralPath $deployScript)) {
        throw "Deploy script not found: $deployScript"
    }

    & $deployScript *>> $childLog
    $childExit = $LASTEXITCODE
    if ($null -eq $childExit) { $childExit = 0 }

    Write-ChildLine ("CHILD COMPLETED | LASTEXITCODE=" + $childExit)
    exit $childExit
}
catch {
    Write-ChildLine "CHILD EXCEPTION BEGIN"
    Write-ChildLine ("Message: " + $_.Exception.Message)
    Write-ChildLine ("Type: " + $_.Exception.GetType().FullName)
    if ($_.CategoryInfo) {
        Write-ChildLine ("CategoryInfo: " + $_.CategoryInfo.ToString())
    }
    if ($_.InvocationInfo) {
        if ($_.InvocationInfo.PositionMessage) {
            Write-ChildLine "PositionMessage:"
            Write-ChildLine $_.InvocationInfo.PositionMessage
        }
        if ($_.InvocationInfo.ScriptName) {
            Write-ChildLine ("ScriptName: " + $_.InvocationInfo.ScriptName)
        }
        if ($_.InvocationInfo.Line) {
            Write-ChildLine ("Line: " + $_.InvocationInfo.Line)
        }
    }
    if ($_.ScriptStackTrace) {
        Write-ChildLine "ScriptStackTrace:"
        Write-ChildLine $_.ScriptStackTrace
    }
    Write-ChildLine "CHILD EXCEPTION END"
    exit 1
}
'@
        Write-Utf8NoBomFile -Path $ChildScriptPath -Content $childScript
        Log ("Child runner written: {0}" -f $ChildScriptPath)
    }

    $result = $null

    Run-Step -Label "Run deploy script via child runner" -Action {
        $result = Run-NativeDetailed -FilePath "powershell.exe" -ArgumentList @(
            "-NoProfile",
            "-ExecutionPolicy", "Bypass",
            "-File", $ChildScriptPath
        ) -WorkingDirectory $RepoRoot

        if (Test-Path -LiteralPath $ChildLogFile) {
            $childText = [string](Get-Content -LiteralPath $ChildLogFile -Raw -ErrorAction SilentlyContinue)
            if (-not [string]::IsNullOrWhiteSpace($childText)) {
                Log "CHILD LOG BEGIN"
                ($childText -split "`r?`n") | ForEach-Object { if ($_ -ne "") { Log $_ } }
                Log "CHILD LOG END"
            } else {
                Log "CHILD LOG: <empty>"
            }
        } else {
            Log "CHILD LOG: <missing>"
        }

        if ($result.ExitCode -ne 0) {
            $script:SummaryNotes = "Deploy child runner failed. Read deploy-orry-child-v6.log for the actual root cause."
            throw ("deploy-orry-direct returned non-zero exit code {0}" -f $result.ExitCode)
        }
    }

    $script:FinalExitCode = 0
    $script:RunSucceeded = $true
    $script:SummaryNotes = "Deploy wrapper completed successfully."
}
catch {
    $script:FinalExitCode = 1
    Log ("FINAL ERROR: {0}" -f $_.Exception.Message)
    if ([string]::IsNullOrWhiteSpace($script:SummaryNotes) -or ($script:SummaryNotes -eq "Unknown")) {
        $script:SummaryNotes = $_.Exception.Message
    }
}
finally {
    if ($script:RunSucceeded) {
        Write-Summary -ResultText "SUCCESS" -ExitCode $script:FinalExitCode -Notes $script:SummaryNotes
    } else {
        Write-Summary -ResultText "FAILED" -ExitCode $script:FinalExitCode -Notes $script:SummaryNotes
    }
    exit $script:FinalExitCode
}
