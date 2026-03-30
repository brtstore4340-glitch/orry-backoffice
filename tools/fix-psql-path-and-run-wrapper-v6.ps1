Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

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

function Run-NativeDetailed {
    param(
        [Parameter(Mandatory = $true)][string]$FilePath,
        [Parameter()][string[]]$ArgumentList = @(),
        [Parameter()][string]$WorkingDirectory = (Get-Location).Path,
        [Parameter()][switch]$AllowFail
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

        if (($proc.ExitCode -ne 0) -and (-not $AllowFail)) {
            throw ("Process failed with exit code {0}" -f $proc.ExitCode)
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
$BackupDir = Join-Path $ToolsDir ("backup_fix_psql_path_" + (Get-Date -Format "yyyyMMdd_HHmmss"))
$LastBackupPointer = Join-Path $ToolsDir "LAST_BACKUP_DIR.txt"
$script:LogFile = Join-Path $LogsDir "fix-psql-path-and-run-wrapper-v6.log"
$SummaryFile = Join-Path $LogsDir "fix-psql-path-and-run-wrapper-v6-summary.txt"
$WrapperV6 = Join-Path $ToolsDir "run-deploy-orry-wrapper-v6.ps1"

$script:FoundPsql = $null
$script:WrapperExitCode = $null
$script:Result = "FAILED"
$script:Notes = "Unknown"

try {
    Run-Step -Label "Validate paths and prepare folders" -Action {
        if (-not (Test-Path -LiteralPath $RepoRoot)) { throw "Repo root not found: $RepoRoot" }
        if (-not (Test-Path -LiteralPath $ToolsDir)) { New-Item -ItemType Directory -Path $ToolsDir -Force | Out-Null }
        if (-not (Test-Path -LiteralPath $LogsDir)) { New-Item -ItemType Directory -Path $LogsDir -Force | Out-Null }
        if (-not (Test-Path -LiteralPath $BackupDir)) { New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null }
        if (Test-Path -LiteralPath $script:LogFile) {
            Copy-Item -LiteralPath $script:LogFile -Destination (Join-Path $BackupDir "fix-psql-path-and-run-wrapper-v6.previous.log") -Force
        }
        New-EmptyUtf8NoBomFile -Path $script:LogFile
        Write-Utf8NoBomFile -Path $LastBackupPointer -Content $BackupDir
    }

    Set-Location -LiteralPath $RepoRoot

    Run-Step -Label "Find psql.exe in common locations" -Action {
        $candidates = New-Object System.Collections.Generic.List[string]

        $patterns = @(
            "C:\Program Files\PostgreSQL\*\bin\psql.exe",
            "C:\Program Files (x86)\PostgreSQL\*\bin\psql.exe",
            "C:\Program Files\pgAdmin 4\runtime\psql.exe",
            "C:\Program Files\PostgresPlus\*\bin\psql.exe"
        )

        foreach ($pattern in $patterns) {
            Get-ChildItem -Path $pattern -File -ErrorAction SilentlyContinue | ForEach-Object {
                if (-not $candidates.Contains($_.FullName)) {
                    [void]$candidates.Add($_.FullName)
                }
            }
        }

        $existing = Get-Command psql -ErrorAction SilentlyContinue
        if ($existing) {
            $script:FoundPsql = $existing.Source
            Log ("psql already in PATH: {0}" -f $script:FoundPsql)
            return
        }

        if ($candidates.Count -eq 0) {
            throw "psql.exe was not found in common install locations."
        }

        $best = $candidates | Sort-Object -Descending | Select-Object -First 1
        $script:FoundPsql = $best
        $binDir = Split-Path -Parent $best

        if (-not ($env:Path -split ';' | Where-Object { $_ -eq $binDir })) {
            $env:Path = $binDir + ";" + $env:Path
        }

        Log ("psql found: {0}" -f $script:FoundPsql)
        Log ("Temporarily added to PATH for this session: {0}" -f $binDir)

        $resolved = Get-Command psql -ErrorAction Stop
        Log ("Resolved psql command: {0}" -f $resolved.Source)
    }

    Run-Step -Label "Verify wrapper v6 exists" -Action {
        if (-not (Test-Path -LiteralPath $WrapperV6)) {
            throw "Wrapper v6 not found: $WrapperV6"
        }
    }

    Run-Step -Label "Run wrapper v6 after fixing PATH" -Action {
        $result = Run-NativeDetailed -FilePath "powershell.exe" -ArgumentList @(
            "-ExecutionPolicy", "Bypass",
            "-File", $WrapperV6
        ) -WorkingDirectory $RepoRoot -AllowFail

        $script:WrapperExitCode = $result.ExitCode

        if ($result.ExitCode -ne 0) {
            throw ("Wrapper v6 failed with exit code {0}" -f $result.ExitCode)
        }
    }

    $script:Result = "SUCCESS"
    $script:Notes = "psql was found and wrapper v6 completed successfully."
}
catch {
    if (-not $script:FoundPsql) {
        $script:Notes = "psql.exe not found. Install PostgreSQL client tools or add the PostgreSQL bin folder to PATH, then rerun."
    } elseif ($null -ne $script:WrapperExitCode) {
        $script:Notes = "psql path fixed for current session, but wrapper v6 still failed. Read deploy-orry-wrapper-v6-summary.txt and logs next."
    } else {
        $script:Notes = $_.Exception.Message
    }
    Log ("FINAL ERROR: {0}" -f $_.Exception.Message)
}
finally {
    $summary = New-Object System.Collections.Generic.List[string]
    $summary.Add("FIX PSQL PATH AND RUN WRAPPER V6 SUMMARY")
    $summary.Add(("Generated: {0}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss")))
    $summary.Add(("RepoRoot: {0}" -f $RepoRoot))
    $summary.Add(("BackupDir: {0}" -f $BackupDir))
    $summary.Add(("LogFile: {0}" -f $script:LogFile))
    $summary.Add(("FoundPsql: {0}" -f $(if ($script:FoundPsql) { $script:FoundPsql } else { "NOT FOUND" })))
    $summary.Add(("WrapperV6: {0}" -f $WrapperV6))
    $summary.Add(("WrapperExitCode: {0}" -f $(if ($null -ne $script:WrapperExitCode) { $script:WrapperExitCode } else { "N/A" })))
    $summary.Add(("Result: {0}" -f $script:Result))
    $summary.Add(("Notes: {0}" -f $script:Notes))
    Write-Utf8NoBomFile -Path $SummaryFile -Content ($summary -join [Environment]::NewLine)
    Log ("Summary written: {0}" -f $SummaryFile)
    if ($script:Result -eq "SUCCESS") {
        exit 0
    } else {
        exit 1
    }
}
