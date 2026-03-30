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

function Find-PsqlInCommonLocations {
    $existing = Get-Command psql -ErrorAction SilentlyContinue
    if ($existing) { return $existing.Source }

    $patterns = @(
        "C:\Program Files\PostgreSQL\*\bin\psql.exe",
        "C:\Program Files (x86)\PostgreSQL\*\bin\psql.exe",
        "C:\Program Files\pgAdmin 4\runtime\psql.exe",
        "C:\Program Files\PostgresPlus\*\bin\psql.exe"
    )

    $candidates = @()
    foreach ($pattern in $patterns) {
        $candidates += Get-ChildItem -Path $pattern -File -ErrorAction SilentlyContinue | Select-Object -ExpandProperty FullName
    }

    if (-not $candidates -or $candidates.Count -eq 0) { return $null }
    return ($candidates | Sort-Object -Descending | Select-Object -First 1)
}

function Ensure-PsqlAvailable {
    $psqlPath = Find-PsqlInCommonLocations
    if (-not $psqlPath) {
        throw "psql.exe was not found in PATH or common install locations."
    }

    $binDir = Split-Path -Parent $psqlPath
    if (-not ($env:Path -split ';' | Where-Object { $_ -eq $binDir })) {
        $env:Path = $binDir + ";" + $env:Path
    }

    $resolved = Get-Command psql -ErrorAction Stop
    return $resolved.Source
}

function Convert-SecureStringToPlainText {
    param([Parameter(Mandatory = $true)][Security.SecureString]$SecureString)
    $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecureString)
    try {
        return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
    } finally {
        if ($bstr -ne [IntPtr]::Zero) {
            [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
        }
    }
}

function Write-Summary {
    param(
        [Parameter(Mandatory = $true)][string]$ResultText,
        [Parameter(Mandatory = $true)][int]$ExitCode,
        [Parameter(Mandatory = $true)][string]$Notes
    )
    $summary = New-Object System.Collections.Generic.List[string]
    $summary.Add("DEPLOY ORRY WITH DBPASSWORD SUMMARY V8")
    $summary.Add(("Generated: {0}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss")))
    $summary.Add(("RepoRoot: {0}" -f $RepoRoot))
    $summary.Add(("DeployScript: {0}" -f $DeployScript))
    $summary.Add(("BackupDir: {0}" -f $BackupDir))
    $summary.Add(("LogFile: {0}" -f $script:LogFile))
    $summary.Add(("ChildLog: {0}" -f $ChildLogFile))
    $summary.Add(("FoundPsql: {0}" -f $(if ($script:FoundPsql) { $script:FoundPsql } else { "NOT FOUND" })))
    $summary.Add(("ExitCode: {0}" -f $ExitCode))
    $summary.Add(("Result: {0}" -f $ResultText))
    $summary.Add(("Notes: {0}" -f $Notes))
    Write-Utf8NoBomFile -Path $SummaryFile -Content ($summary -join [Environment]::NewLine)
    Log ("Summary written: {0}" -f $SummaryFile)
}

$PrimaryRepoRoot = "D:\01-Main-Work\Boots\Agentic-AI\mission-control\orry"
$FallbackRepoRoot = "D:\01-Main-Work\Boots\Agentic-AI\mission-control\orry"

if (Test-Path -LiteralPath $PrimaryRepoRoot) {
    $RepoRoot = $PrimaryRepoRoot
} elseif (Test-Path -LiteralPath $FallbackRepoRoot) {
    $RepoRoot = $FallbackRepoRoot
} else {
    throw "Neither repo path exists. Checked: $PrimaryRepoRoot and $FallbackRepoRoot"
}

$ToolsDir = Join-Path $RepoRoot "tools"
$LogsDir = Join-Path $ToolsDir "logs"
$BackupDir = Join-Path $ToolsDir ("backup_deploy_orry_with_dbpassword_v8_" + (Get-Date -Format "yyyyMMdd_HHmmss"))
$LastBackupPointer = Join-Path $ToolsDir "LAST_BACKUP_DIR.txt"
$DeployScript = Join-Path $ToolsDir "deploy-orry-direct.ps1"
$script:LogFile = Join-Path $LogsDir "deploy-orry-with-dbpassword-v8.log"
$ChildLogFile = Join-Path $LogsDir "deploy-orry-with-dbpassword-v8-child.log"
$SummaryFile = Join-Path $LogsDir "deploy-orry-with-dbpassword-v8-summary.txt"

$script:RunSucceeded = $false
$script:FinalExitCode = 1
$script:SummaryNotes = "Unknown"
$script:FoundPsql = $null

try {
    Run-Step -Label "Validate paths and prepare folders" -Action {
        if (-not (Test-Path -LiteralPath $RepoRoot)) { throw "Repo root not found: $RepoRoot" }
        if (-not (Test-Path -LiteralPath $ToolsDir)) { New-Item -ItemType Directory -Path $ToolsDir -Force | Out-Null }
        if (-not (Test-Path -LiteralPath $LogsDir)) { New-Item -ItemType Directory -Path $LogsDir -Force | Out-Null }
        if (-not (Test-Path -LiteralPath $BackupDir)) { New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null }
        New-EmptyUtf8NoBomFile -Path $script:LogFile
        New-EmptyUtf8NoBomFile -Path $ChildLogFile
        Write-Utf8NoBomFile -Path $LastBackupPointer -Content $BackupDir
    }

    Run-Step -Label "Backup deploy script" -Action {
        if (-not (Test-Path -LiteralPath $DeployScript)) {
            throw "Deploy script not found: $DeployScript"
        }
        Copy-Item -LiteralPath $DeployScript -Destination (Join-Path $BackupDir "deploy-orry-direct.ps1") -Force
        Log ("Backup created: {0}" -f $DeployScript)
    }

    Set-Location -LiteralPath $RepoRoot

    Run-Step -Label "Ensure psql is available" -Action {
        $script:FoundPsql = Ensure-PsqlAvailable
        Log ("Resolved psql command: {0}" -f $script:FoundPsql)
    }

    Run-Step -Label "Read DbPassword securely" -Action {
        $secure = Read-Host "Enter Supabase DB password (input hidden)" -AsSecureString
        $plain = Convert-SecureStringToPlainText -SecureString $secure
        if ([string]::IsNullOrWhiteSpace($plain)) {
            throw "DbPassword input was empty."
        }

        $env:DbPassword = $plain
        $env:DB_PASSWORD = $plain
        $env:SUPABASE_DB_PASSWORD = $plain
        $env:PGPASSWORD = $plain

        Log "DbPassword was captured securely and injected into the current session."
    }

    Run-Step -Label "Run deploy script directly in-process" -Action {
        try {
            & {
                & $DeployScript *>> $ChildLogFile
            }
            $code = $LASTEXITCODE
            if ($null -eq $code) { $code = 0 }
            Log ("Deploy script LASTEXITCODE: {0}" -f $code)
            if ($code -ne 0) {
                throw ("deploy-orry-direct.ps1 returned exit code {0}" -f $code)
            }
        } catch {
            Append-Utf8 -Path $ChildLogFile -Line "CHILD EXCEPTION BEGIN"
            Append-Utf8 -Path $ChildLogFile -Line ("Message: " + $_.Exception.Message)
            Append-Utf8 -Path $ChildLogFile -Line ("Type: " + $_.Exception.GetType().FullName)
            if ($_.CategoryInfo) {
                Append-Utf8 -Path $ChildLogFile -Line ("CategoryInfo: " + $_.CategoryInfo.ToString())
            }
            if ($_.InvocationInfo) {
                if ($_.InvocationInfo.PositionMessage) {
                    Append-Utf8 -Path $ChildLogFile -Line "PositionMessage:"
                    Append-Utf8 -Path $ChildLogFile -Line $_.InvocationInfo.PositionMessage
                }
                if ($_.InvocationInfo.ScriptName) {
                    Append-Utf8 -Path $ChildLogFile -Line ("ScriptName: " + $_.InvocationInfo.ScriptName)
                }
                if ($_.InvocationInfo.Line) {
                    Append-Utf8 -Path $ChildLogFile -Line ("Line: " + $_.InvocationInfo.Line)
                }
            }
            if ($_.ScriptStackTrace) {
                Append-Utf8 -Path $ChildLogFile -Line "ScriptStackTrace:"
                Append-Utf8 -Path $ChildLogFile -Line $_.ScriptStackTrace
            }
            Append-Utf8 -Path $ChildLogFile -Line "CHILD EXCEPTION END"
            throw
        }
    }

    $script:RunSucceeded = $true
    $script:FinalExitCode = 0
    $script:SummaryNotes = "Deploy script completed successfully with DbPassword supplied from secure prompt."
}
catch {
    $script:RunSucceeded = $false
    $script:FinalExitCode = 1
    $script:SummaryNotes = $_.Exception.Message
    Log ("FINAL ERROR: {0}" -f $_.Exception.Message)
}
finally {
    # best effort cleanup of plaintext secrets from this process environment
    try {
        $env:DbPassword = $null
        $env:DB_PASSWORD = $null
        $env:SUPABASE_DB_PASSWORD = $null
        $env:PGPASSWORD = $null
    } catch {}

    if ($script:RunSucceeded) {
        Write-Summary -ResultText "SUCCESS" -ExitCode $script:FinalExitCode -Notes $script:SummaryNotes
        exit 0
    } else {
        Write-Summary -ResultText "FAILED" -ExitCode $script:FinalExitCode -Notes $script:SummaryNotes
        exit 1
    }
}
