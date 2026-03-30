Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

trap {
  try {
    $msg = $_.Exception.Message
    if ($script:LogFile) {
      Add-Content -LiteralPath $script:LogFile -Value ("[{0}] FATAL: {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $msg)
    }
    Write-Host ("[FATAL] {0}" -f $msg) -ForegroundColor Red
  } catch {}
  exit 1
}

$RepoRoot  = "D:\01-Main-Work\Boots\Agentic-AI\mission-control\orry"
$ToolsDir  = Join-Path $RepoRoot "tools"
$LogsDir   = Join-Path $ToolsDir "logs"
$Stamp     = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupDir = Join-Path $ToolsDir ("backup_force_dynamic_protected_{0}" -f $Stamp)
$script:LogFile = Join-Path $LogsDir ("force-dynamic-protected_{0}.log" -f $Stamp)

function Write-Log {
  param([Parameter(Mandatory = $true)][string]$Message)
  $line = "[{0}] {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $Message
  Add-Content -LiteralPath $script:LogFile -Value $line
  Write-Host $line
}

function Write-Utf8NoBomFile {
  param(
    [Parameter(Mandatory = $true)][string]$Path,
    [Parameter(Mandatory = $true)][string]$Content
  )
  $dir = Split-Path -Parent $Path
  if (-not (Test-Path -LiteralPath $dir)) {
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
  }
  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($Path, $Content, $utf8NoBom)
}

function Backup-File {
  param(
    [Parameter(Mandatory = $true)][string]$Path
  )
  if (-not (Test-Path -LiteralPath $Path)) { return }
  $relative = $Path.Substring($RepoRoot.Length).TrimStart('\')
  $dest = Join-Path $BackupDir $relative
  $destDir = Split-Path -Parent $dest
  if (-not (Test-Path -LiteralPath $destDir)) {
    New-Item -ItemType Directory -Force -Path $destDir | Out-Null
  }
  Copy-Item -LiteralPath $Path -Destination $dest -Force
  Write-Log ("Backup created: {0}" -f $dest)
}

function Invoke-Step {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][scriptblock]$Action
  )
  Write-Log ("STEP START: {0}" -f $Name)
  try {
    & $Action
    Write-Log ("STEP OK: {0} | exit=0" -f $Name)
  } catch {
    $msg = $_.Exception.Message
    Write-Log ("STEP FAIL: {0} | exit=1 | error={1}" -f $Name, $msg)
    throw
  }
}

Invoke-Step -Name "Validate paths and create folders" -Action {
  if (-not (Test-Path -LiteralPath $RepoRoot)) {
    throw "Repo root not found: $RepoRoot"
  }
  New-Item -ItemType Directory -Force -Path $ToolsDir | Out-Null
  New-Item -ItemType Directory -Force -Path $LogsDir | Out-Null
  New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null
  Set-Content -LiteralPath (Join-Path $ToolsDir "LAST_BACKUP_DIR.txt") -Value $BackupDir -Encoding utf8
}

$ProtectedRoots = @(
  (Join-Path $RepoRoot "src\app\(protected)"),
  (Join-Path $RepoRoot "app\(protected)")
) | Where-Object { Test-Path -LiteralPath $_ }

if (-not $ProtectedRoots -or $ProtectedRoots.Count -eq 0) {
  throw "Protected app folder not found."
}

Invoke-Step -Name "Patch all protected page files to force-dynamic" -Action {
  $pageFiles = foreach ($root in $ProtectedRoots) {
    Get-ChildItem -LiteralPath $root -Recurse -File | Where-Object {
      $_.Name -in @('page.tsx','page.jsx','page.ts','page.js')
    }
  }

  if (-not $pageFiles) {
    throw "No protected page files found."
  }

  foreach ($file in $pageFiles) {
    Backup-File -Path $file.FullName
    $content = Get-Content -LiteralPath $file.FullName -Raw
    if ($content -notmatch "export\s+const\s+dynamic\s*=\s*['""]force-dynamic['""]") {
      $newContent = "export const dynamic = 'force-dynamic'`r`n" + $content
      Write-Utf8NoBomFile -Path $file.FullName -Content $newContent
      Write-Log ("Patched: {0}" -f $file.FullName)
    } else {
      Write-Log ("Already dynamic: {0}" -f $file.FullName)
    }
  }
}

Invoke-Step -Name "Ensure .env.production.local exists" -Action {
  $envFile = Join-Path $RepoRoot ".env.production.local"
  if (-not (Test-Path -LiteralPath $envFile)) {
    $template = @"
DATABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
APP_BASE_URL=
RESEND_API_KEY=
EMAIL_FROM=
"@
    Write-Utf8NoBomFile -Path $envFile -Content $template
    Write-Log ("Created: {0}" -f $envFile)
  } else {
    Write-Log ("Exists: {0}" -f $envFile)
  }
}

Invoke-Step -Name "Clear .next cache" -Action {
  $nextDir = Join-Path $RepoRoot ".next"
  if (Test-Path -LiteralPath $nextDir) {
    Remove-Item -LiteralPath $nextDir -Recurse -Force
    Write-Log ("Removed: {0}" -f $nextDir)
  } else {
    Write-Log ("Skip remove (not found): {0}" -f $nextDir)
  }
}

Invoke-Step -Name "Run npm build" -Action {
  Set-Location -LiteralPath $RepoRoot
  & npm run build *>&1 | Tee-Object -FilePath $script:LogFile -Append
  $exitCode = $LASTEXITCODE
  Write-Log ("npm run build exit={0}" -f $exitCode)
  if ($exitCode -ne 0) {
    throw "npm run build failed with exit code $exitCode"
  }
}

Write-Log "All steps completed successfully."
Write-Host ""
Write-Host ("Backup : {0}" -f $BackupDir) -ForegroundColor Green
Write-Host ("Log    : {0}" -f $script:LogFile) -ForegroundColor Green
