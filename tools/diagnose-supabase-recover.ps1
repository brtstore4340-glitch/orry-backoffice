Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

trap {
    Write-Error ($_ | Out-String)
    exit 1
}

function Write-Utf8NoBomFile {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][string]$Content
    )
    $dir = Split-Path -Parent $Path
    if ($dir -and -not (Test-Path -LiteralPath $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    $enc = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($Path, $Content, $enc)
}

function Log {
    param([string]$Message)
    $line = "[{0}] {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $Message
    Write-Host $line
    Add-Content -LiteralPath $script:LogFile -Value $line
}

$repo = "D:\01-Main-Work\Boots\Agentic-AI\mission-control\orry"
$toolsDir = Join-Path $repo "tools"
$logsDir = Join-Path $toolsDir "logs"
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupDir = Join-Path $toolsDir ("backup_supabase_recover_diag_{0}" -f $timestamp)
$script:LogFile = Join-Path $logsDir "supabase-recover-diagnose.log"
$lastBackup = Join-Path $toolsDir "LAST_BACKUP_DIR.txt"

if (-not (Test-Path -LiteralPath $repo)) {
    throw "Repo not found: $repo"
}

New-Item -ItemType Directory -Path $toolsDir -Force | Out-Null
New-Item -ItemType Directory -Path $logsDir -Force | Out-Null
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
Write-Utf8NoBomFile -Path $lastBackup -Content $backupDir
Write-Utf8NoBomFile -Path $script:LogFile -Content ""

Set-Location $repo

Log "STEP START: Read env files"
$envCandidates = @(".env.local", ".env", ".env.production", ".env.sample", ".env.example") |
    ForEach-Object { Join-Path $repo $_ } |
    Where-Object { Test-Path -LiteralPath $_ }

if ($envCandidates.Count -eq 0) {
    Log "STEP WARN: No env files found in repo root"
} else {
    foreach ($file in $envCandidates) {
        Copy-Item -LiteralPath $file -Destination (Join-Path $backupDir (Split-Path $file -Leaf)) -Force
        Log ("Backed up env file: {0}" -f $file)

        $content = Get-Content -LiteralPath $file -Raw
        foreach ($key in @(
            "NEXT_PUBLIC_SUPABASE_URL",
            "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY",
            "SUPABASE_SERVICE_ROLE_KEY",
            "AUTH_SECRET"
        )) {
            if ($content -match "(?m)^\s*$([regex]::Escape($key))\s*=\s*(.+?)\s*$") {
                $value = $Matches[1]
                $masked = if ($value.Length -le 8) { "********" } else { $value.Substring(0,4) + "..." + $value.Substring($value.Length-4) }
                Log ("ENV FOUND: {0}={1}" -f $key, $masked)
            } else {
                Log ("ENV MISSING: {0}" -f $key)
            }
        }
    }
}
Log "STEP OK: Read env files | exit=0"

Log "STEP START: Search auth recovery call sites"
Get-ChildItem -LiteralPath $repo -Recurse -File -Include *.ts,*.tsx,*.js,*.jsx |
    Select-String -Pattern "resetPasswordForEmail|auth/v1/recover|forgot|recovery" |
    ForEach-Object {
        Log ("MATCH: {0}:{1}: {2}" -f $_.Path, $_.LineNumber, $_.Line.Trim())
    }
Log "STEP OK: Search auth recovery call sites | exit=0"

Log "STEP START: Check vercel config"
Get-ChildItem -LiteralPath $repo -Force -Name "vercel.json","vercel.ts",".vercel" -ErrorAction SilentlyContinue |
    ForEach-Object { Log ("VERCEL CONFIG: {0}" -f $_) }
Log "STEP OK: Check vercel config | exit=0"

Log "STEP START: Summary"
Log "Next manual checks:"
Log "1) Supabase Dashboard -> Authentication -> Logs"
Log "2) Auth provider SMTP / Email settings"
Log "3) Provider logs (Resend / SendGrid / SES / etc.)"
Log "4) Retry once with a different real email after 60+ seconds"
Log "STEP OK: Summary | exit=0"
