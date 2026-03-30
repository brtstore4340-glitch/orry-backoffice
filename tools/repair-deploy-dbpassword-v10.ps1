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

$RepoRoot = "D:\01-Main-Work\Boots\Agentic-AI\mission-control\orry"
$ToolsDir = Join-Path $RepoRoot "tools"
$LogsDir = Join-Path $ToolsDir "logs"
$BackupDir = Join-Path $ToolsDir ("backup_repair_deploy_dbpassword_v10_" + (Get-Date -Format "yyyyMMdd_HHmmss"))
$LastBackupPointer = Join-Path $ToolsDir "LAST_BACKUP_DIR.txt"
$DeployScript = Join-Path $ToolsDir "deploy-orry-direct.ps1"
$script:LogFile = Join-Path $LogsDir "repair-deploy-dbpassword-v10.log"
$SummaryFile = Join-Path $LogsDir "repair-deploy-dbpassword-v10-summary.txt"

$PatchMarkerStart = "# BEGIN AUTOFIX DBPASSWORD THROW REPLACEMENT V10"
$PatchMarkerEnd = "# END AUTOFIX DBPASSWORD THROW REPLACEMENT V10"

$ReplacementBlock = @'
# BEGIN AUTOFIX DBPASSWORD THROW REPLACEMENT V10
        if ([string]::IsNullOrWhiteSpace($DbPassword)) {
            foreach ($envName in @('DbPassword','DB_PASSWORD','SUPABASE_DB_PASSWORD','PGPASSWORD')) {
                $candidate = [Environment]::GetEnvironmentVariable($envName, 'Process')
                if ([string]::IsNullOrWhiteSpace($candidate)) {
                    $candidate = [Environment]::GetEnvironmentVariable($envName, 'User')
                }
                if ([string]::IsNullOrWhiteSpace($candidate)) {
                    $candidate = [Environment]::GetEnvironmentVariable($envName, 'Machine')
                }
                if (-not [string]::IsNullOrWhiteSpace($candidate)) {
                    $DbPassword = $candidate
                    break
                }
            }
        }

        if ([string]::IsNullOrWhiteSpace($DbPassword) -and ($Host.Name -match 'ConsoleHost|Visual Studio Code Host')) {
            try {
                $secureDbPassword = Read-Host 'Enter DbPassword for deployment' -AsSecureString
                if ($secureDbPassword) {
                    $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureDbPassword)
                    try {
                        $DbPassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
                    } finally {
                        if ($bstr -ne [IntPtr]::Zero) {
                            [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
                        }
                    }
                }
            } catch {
            }
        }

        if ([string]::IsNullOrWhiteSpace($DbPassword)) {
            throw "DbPassword is required for database deployment."
        }

        $env:DbPassword = $DbPassword
        $env:DB_PASSWORD = $DbPassword
        $env:SUPABASE_DB_PASSWORD = $DbPassword
        $env:PGPASSWORD = $DbPassword
# END AUTOFIX DBPASSWORD THROW REPLACEMENT V10
'@

try {
    Run-Step -Label "Validate paths and prepare folders" -Action {
        if (-not (Test-Path -LiteralPath $RepoRoot)) { throw "Repo root not found: $RepoRoot" }
        if (-not (Test-Path -LiteralPath $ToolsDir)) { New-Item -ItemType Directory -Path $ToolsDir -Force | Out-Null }
        if (-not (Test-Path -LiteralPath $LogsDir)) { New-Item -ItemType Directory -Path $LogsDir -Force | Out-Null }
        if (-not (Test-Path -LiteralPath $BackupDir)) { New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null }
        New-EmptyUtf8NoBomFile -Path $script:LogFile
        Write-Utf8NoBomFile -Path $LastBackupPointer -Content $BackupDir
    }

    Run-Step -Label "Backup current broken deploy script" -Action {
        if (-not (Test-Path -LiteralPath $DeployScript)) {
            throw "Deploy script not found: $DeployScript"
        }
        Copy-Item -LiteralPath $DeployScript -Destination (Join-Path $BackupDir "deploy-orry-direct.broken.ps1") -Force
        Log ("Broken deploy script backed up: {0}" -f $DeployScript)
    }

    Run-Step -Label "Restore deploy script from latest v9 backup" -Action {
        $candidateDirs = Get-ChildItem -LiteralPath $ToolsDir -Directory -ErrorAction Stop | Where-Object {
            $_.Name -like 'backup_patch_deploy_dbpassword_v9_*'
        } | Sort-Object LastWriteTime -Descending

        if (-not $candidateDirs -or $candidateDirs.Count -eq 0) {
            throw "No backup_patch_deploy_dbpassword_v9_* directory was found."
        }

        $restored = $false
        foreach ($dir in $candidateDirs) {
            $candidateFile = Join-Path $dir.FullName "deploy-orry-direct.ps1"
            if (Test-Path -LiteralPath $candidateFile) {
                Copy-Item -LiteralPath $candidateFile -Destination $DeployScript -Force
                Log ("Restored deploy script from backup: {0}" -f $candidateFile)
                $restored = $true
                break
            }
        }

        if (-not $restored) {
            throw "Could not find deploy-orry-direct.ps1 in any v9 backup directory."
        }
    }

    Run-Step -Label "Patch exact DbPassword throw block safely" -Action {
        $text = Get-Content -LiteralPath $DeployScript -Raw -Encoding UTF8 -ErrorAction Stop
        if ($null -eq $text) { $text = "" }

        if ($text.Contains($PatchMarkerStart)) {
            Log "Patch marker already present. No duplicate patch applied."
        } else {
            $throwLine = 'throw "DbPassword is required for database deployment."'
            if (-not $text.Contains($throwLine)) {
                throw 'Exact throw line for DbPassword was not found in deploy script.'
            }

            $newText = $text.Replace($throwLine, $ReplacementBlock)
            Write-Utf8NoBomFile -Path $DeployScript -Content $newText
            Log "Deploy script patched by replacing the exact throw line."
        }
    }

    Run-Step -Label "Verify patch marker and parse sanity" -Action {
        $verify = Get-Content -LiteralPath $DeployScript -Raw -Encoding UTF8 -ErrorAction Stop
        if (-not $verify.Contains($PatchMarkerStart)) {
            throw "Patch verification failed. Marker not found."
        }

        $null = [System.Management.Automation.Language.Parser]::ParseFile(
            $DeployScript,
            [ref]$null,
            [ref]$parseErrors
        )

        if ($parseErrors -and $parseErrors.Count -gt 0) {
            $first = $parseErrors | Select-Object -First 1
            throw ("Parse verification failed: " + $first.Message)
        }
    }

    $summary = New-Object System.Collections.Generic.List[string]
    $summary.Add("REPAIR DEPLOY DBPASSWORD SUMMARY V10")
    $summary.Add(("Generated: {0}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss")))
    $summary.Add(("RepoRoot: {0}" -f $RepoRoot))
    $summary.Add(("DeployScript: {0}" -f $DeployScript))
    $summary.Add(("BackupDir: {0}" -f $BackupDir))
    $summary.Add(("LogFile: {0}" -f $script:LogFile))
    $summary.Add("Result: SUCCESS")
    $summary.Add("Notes: Restored deploy-orry-direct.ps1 from backup and replaced only the exact DbPassword throw line with safe env/prompt resolution logic.")
    Write-Utf8NoBomFile -Path $SummaryFile -Content ($summary -join [Environment]::NewLine)
    Log ("Summary written: {0}" -f $SummaryFile)
    exit 0
}
catch {
    Log ("FINAL ERROR: {0}" -f $_.Exception.Message)
    $summary = New-Object System.Collections.Generic.List[string]
    $summary.Add("REPAIR DEPLOY DBPASSWORD SUMMARY V10")
    $summary.Add(("Generated: {0}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss")))
    $summary.Add(("RepoRoot: {0}" -f $RepoRoot))
    $summary.Add(("DeployScript: {0}" -f $DeployScript))
    $summary.Add(("BackupDir: {0}" -f $BackupDir))
    $summary.Add(("LogFile: {0}" -f $script:LogFile))
    $summary.Add("Result: FAILED")
    $summary.Add(("Notes: {0}" -f $_.Exception.Message))
    Write-Utf8NoBomFile -Path $SummaryFile -Content ($summary -join [Environment]::NewLine)
    Log ("Summary written: {0}" -f $SummaryFile)
    exit 1
}
