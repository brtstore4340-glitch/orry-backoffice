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
$BackupDir = Join-Path $ToolsDir ("backup_patch_deploy_dbpassword_v9_" + (Get-Date -Format "yyyyMMdd_HHmmss"))
$LastBackupPointer = Join-Path $ToolsDir "LAST_BACKUP_DIR.txt"
$DeployScript = Join-Path $ToolsDir "deploy-orry-direct.ps1"
$script:LogFile = Join-Path $LogsDir "patch-deploy-dbpassword-v9.log"
$SummaryFile = Join-Path $LogsDir "patch-deploy-dbpassword-v9-summary.txt"

$PatchMarkerStart = "# BEGIN AUTOFIX DBPASSWORD RESOLUTION V9"
$PatchMarkerEnd = "# END AUTOFIX DBPASSWORD RESOLUTION V9"

$PatchBlock = @'
# BEGIN AUTOFIX DBPASSWORD RESOLUTION V9
try {
    if ([string]::IsNullOrWhiteSpace($DbPassword)) {
        foreach ($envName in @('DbPassword','DB_PASSWORD','SUPABASE_DB_PASSWORD','PGPASSWORD')) {
            foreach ($scope in @('Process','User','Machine')) {
                $candidate = [Environment]::GetEnvironmentVariable($envName, $scope)
                if (-not [string]::IsNullOrWhiteSpace($candidate)) {
                    $DbPassword = $candidate
                    break
                }
            }
            if (-not [string]::IsNullOrWhiteSpace($DbPassword)) { break }
        }
    }

    if ([string]::IsNullOrWhiteSpace($DbPassword)) {
        if ($Host.Name -match 'ConsoleHost|Visual Studio Code Host') {
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
    }

    if (-not [string]::IsNullOrWhiteSpace($DbPassword)) {
        $env:DbPassword = $DbPassword
        $env:DB_PASSWORD = $DbPassword
        $env:SUPABASE_DB_PASSWORD = $DbPassword
        $env:PGPASSWORD = $DbPassword
    }
} catch {
}
# END AUTOFIX DBPASSWORD RESOLUTION V9
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

    Run-Step -Label "Backup deploy script" -Action {
        if (-not (Test-Path -LiteralPath $DeployScript)) {
            throw "Deploy script not found: $DeployScript"
        }
        Copy-Item -LiteralPath $DeployScript -Destination (Join-Path $BackupDir "deploy-orry-direct.ps1") -Force
        Log ("Backup created: {0}" -f $DeployScript)
    }

    Run-Step -Label "Patch deploy script for DbPassword resolution" -Action {
        $text = Get-Content -LiteralPath $DeployScript -Raw -Encoding UTF8 -ErrorAction Stop
        if ($null -eq $text) { $text = "" }

        if ($text.Contains($PatchMarkerStart)) {
            Log "Patch marker already present. No duplicate patch applied."
        } else {
            $newText = $text

            $inserted = $false

            $paramPattern = '(?s)(param\s*\(.*?\)\s*)'
            if ([regex]::IsMatch($newText, $paramPattern)) {
                $newText = [regex]::Replace($newText, $paramPattern, ('$1' + [Environment]::NewLine + $PatchBlock + [Environment]::NewLine), 1)
                $inserted = $true
                Log "Inserted patch block after param() section."
            }

            if (-not $inserted) {
                $strictPattern = '(?m)^(Set-StrictMode.*|[$]ErrorActionPreference\s*=.*)$'
                $matches = [regex]::Matches($newText, $strictPattern)
                if ($matches.Count -gt 0) {
                    $last = $matches[$matches.Count - 1]
                    $idx = $last.Index + $last.Length
                    $newText = $newText.Insert($idx, [Environment]::NewLine + $PatchBlock + [Environment]::NewLine)
                    $inserted = $true
                    Log "Inserted patch block after strict mode / ErrorActionPreference section."
                }
            }

            if (-not $inserted) {
                $newText = $PatchBlock + [Environment]::NewLine + $newText
                Log "Inserted patch block at top of file as fallback."
            }

            Write-Utf8NoBomFile -Path $DeployScript -Content $newText
            Log "Deploy script patched successfully."
        }
    }

    Run-Step -Label "Verify patch marker" -Action {
        $verify = Get-Content -LiteralPath $DeployScript -Raw -Encoding UTF8 -ErrorAction Stop
        if (-not $verify.Contains($PatchMarkerStart)) {
            throw "Patch verification failed. Marker not found in deploy script."
        }
    }

    $summary = New-Object System.Collections.Generic.List[string]
    $summary.Add("PATCH DEPLOY DBPASSWORD SUMMARY V9")
    $summary.Add(("Generated: {0}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss")))
    $summary.Add(("RepoRoot: {0}" -f $RepoRoot))
    $summary.Add(("DeployScript: {0}" -f $DeployScript))
    $summary.Add(("BackupDir: {0}" -f $BackupDir))
    $summary.Add(("LogFile: {0}" -f $script:LogFile))
    $summary.Add("Result: SUCCESS")
    $summary.Add("Notes: deploy-orry-direct.ps1 now resolves DbPassword from env names DbPassword/DB_PASSWORD/SUPABASE_DB_PASSWORD/PGPASSWORD and falls back to secure prompt.")
    Write-Utf8NoBomFile -Path $SummaryFile -Content ($summary -join [Environment]::NewLine)
    Log ("Summary written: {0}" -f $SummaryFile)
    exit 0
}
catch {
    Log ("FINAL ERROR: {0}" -f $_.Exception.Message)
    $summary = New-Object System.Collections.Generic.List[string]
    $summary.Add("PATCH DEPLOY DBPASSWORD SUMMARY V9")
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
