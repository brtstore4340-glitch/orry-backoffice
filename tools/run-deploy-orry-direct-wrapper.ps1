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

function Log {
    param([Parameter(Mandatory = $true)][string]$Message)
    $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $line = "[{0}] {1}" -f $ts, $Message
    Write-Host $line
    Add-Content -LiteralPath $script:LogFile -Value $line -Encoding utf8
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
        [Parameter(Mandatory = $true)][string]$Label,
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

        if (-not [string]::IsNullOrWhiteSpace($outText)) {
            Log "STDOUT BEGIN"
            ($outText -split "`r?`n") | ForEach-Object { if ($_ -ne "") { Log $_ } }
            Log "STDOUT END"
        } else {
            Log "STDOUT: <empty>"
        }

        if (-not [string]::IsNullOrWhiteSpace($errText)) {
            Log "STDERR BEGIN"
            ($errText -split "`r?`n") | ForEach-Object { if ($_ -ne "") { Log $_ } }
            Log "STDERR END"
        } else {
            Log "STDERR: <empty>"
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

$RepoRoot = "D:\01-Main-Work\Boots\Agentic-AI\mission-control\orry"
$ToolsDir = Join-Path $RepoRoot "tools"
$LogsDir = Join-Path $ToolsDir "logs"
$BackupDir = Join-Path $ToolsDir ("backup_deploy_wrapper_" + (Get-Date -Format "yyyyMMdd_HHmmss"))
$LastBackupPointer = Join-Path $ToolsDir "LAST_BACKUP_DIR.txt"
$DeployScript = Join-Path $ToolsDir "deploy-orry-direct.ps1"
$script:LogFile = Join-Path $LogsDir "deploy-orry-direct-wrapper.log"
$SummaryFile = Join-Path $LogsDir "deploy-orry-direct-wrapper-summary.txt"

Run-Step -Label "Validate paths and prepare folders" -Action {
    if (-not (Test-Path -LiteralPath $RepoRoot)) { throw "Repo root not found: $RepoRoot" }
    if (-not (Test-Path -LiteralPath $ToolsDir)) { New-Item -ItemType Directory -Path $ToolsDir -Force | Out-Null }
    if (-not (Test-Path -LiteralPath $LogsDir)) { New-Item -ItemType Directory -Path $LogsDir -Force | Out-Null }
    if (-not (Test-Path -LiteralPath $BackupDir)) { New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null }
    Write-Utf8NoBomFile -Path $LastBackupPointer -Content $BackupDir
    Write-Utf8NoBomFile -Path $script:LogFile -Content ""
}

Run-Step -Label "Backup deploy script" -Action {
    if (-not (Test-Path -LiteralPath $DeployScript)) {
        throw "Deploy script not found: $DeployScript"
    }
    Copy-Item -LiteralPath $DeployScript -Destination (Join-Path $BackupDir "deploy-orry-direct.ps1") -Force
    Log ("Backup created: {0}" -f $DeployScript)
}

Set-Location -LiteralPath $RepoRoot

Run-Step -Label "Preflight command checks" -Action {
    foreach ($cmd in @("powershell.exe","npm.cmd")) {
        if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
            throw ("Required command not found: {0}" -f $cmd)
        }
    }

    $psql = Get-Command psql -ErrorAction SilentlyContinue
    $supabase = Get-Command supabase -ErrorAction SilentlyContinue

    Log ("CLI psql: {0}" -f ($(if ($psql) { $psql.Source } else { "MISSING" })))
    Log ("CLI supabase: {0}" -f ($(if ($supabase) { $supabase.Source } else { "MISSING" })))
}

$result = $null

Run-Step -Label "Run deploy script with detailed wrapper" -Action {
    $result = Run-NativeDetailed -Label "deploy-orry-direct" -FilePath "powershell.exe" -ArgumentList @(
        "-NoProfile",
        "-ExecutionPolicy", "Bypass",
        "-File", $DeployScript
    ) -WorkingDirectory $RepoRoot

    if ($result.ExitCode -ne 0) {
        throw ("deploy-orry-direct returned non-zero exit code {0}" -f $result.ExitCode)
    }
}

$summary = New-Object System.Collections.Generic.List[string]
$summary.Add("DEPLOY ORRY DIRECT WRAPPER SUMMARY")
$summary.Add(("Generated: {0}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss")))
$summary.Add(("RepoRoot: {0}" -f $RepoRoot))
$summary.Add(("DeployScript: {0}" -f $DeployScript))
$summary.Add(("BackupDir: {0}" -f $BackupDir))
$summary.Add(("ExitCode: {0}" -f $(if ($result) { $result.ExitCode } else { "N/A" })))
$summary.Add("")
$summary.Add("Result: SUCCESS")
Write-Utf8NoBomFile -Path $SummaryFile -Content ($summary -join [Environment]::NewLine)
Log ("Summary written: {0}" -f $SummaryFile)