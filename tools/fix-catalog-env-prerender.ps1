@'
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
$BackupDir = Join-Path $ToolsDir ("backup_fix_catalog_env_{0}" -f $Stamp)
$script:LogFile = Join-Path $LogsDir ("fix-catalog-env_{0}.log" -f $Stamp)

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
  if (-not [string]::IsNullOrWhiteSpace($dir) -and -not (Test-Path -LiteralPath $dir)) {
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
  }
  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($Path, $Content, $utf8NoBom)
}

function Backup-File {
  param(
    [Parameter(Mandatory = $true)][string]$Path,
    [Parameter(Mandatory = $true)][string]$BackupRoot,
    [Parameter(Mandatory = $true)][string]$BaseRoot
  )
  if (-not (Test-Path -LiteralPath $Path)) {
    Write-Log ("BACKUP SKIP: not found: {0}" -f $Path)
    return
  }

  $fullBase = [System.IO.Path]::GetFullPath($BaseRoot)
  $fullPath = [System.IO.Path]::GetFullPath($Path)

  if ($fullPath.StartsWith($fullBase, [System.StringComparison]::OrdinalIgnoreCase)) {
    $relative = $fullPath.Substring($fullBase.Length).TrimStart('\')
  } else {
    $relative = Split-Path -Leaf $fullPath
  }

  $dest = Join-Path $BackupRoot $relative
  $destDir = Split-Path -Parent $dest
  New-Item -ItemType Directory -Force -Path $destDir | Out-Null
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

$CatalogCandidates = @(
  (Join-Path $RepoRoot "src\app\(protected)\catalog\page.tsx"),
  (Join-Path $RepoRoot "src\app\(protected)\catalog\page.jsx"),
  (Join-Path $RepoRoot "app\(protected)\catalog\page.tsx"),
  (Join-Path $RepoRoot "app\(protected)\catalog\page.jsx")
)
$CatalogPage = $CatalogCandidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
if (-not $CatalogPage) {
  throw "Catalog page not found."
}

$EnvFile = Join-Path $RepoRoot ".env.production.local"

Invoke-Step -Name "Backup current files" -Action {
  Backup-File -Path $CatalogPage -BackupRoot $BackupDir -BaseRoot $RepoRoot
  if (Test-Path -LiteralPath $EnvFile) {
    Backup-File -Path $EnvFile -BackupRoot $BackupDir -BaseRoot $RepoRoot
  } else {
    Write-Log ("BACKUP SKIP: env file not found yet: {0}" -f $EnvFile)
  }
}

Invoke-Step -Name "Force catalog page to dynamic rendering" -Action {
  $content = Get-Content -LiteralPath $CatalogPage -Raw
  if ($content -notmatch "export\s+const\s+dynamic\s*=\s*['""]force-dynamic['""]") {
    $newContent = "export const dynamic = 'force-dynamic'`r`n" + $content
    Write-Utf8NoBomFile -Path $CatalogPage -Content $newContent
    Write-Log ("Added export const dynamic = 'force-dynamic' to: {0}" -f $CatalogPage)
  } else {
    Write-Log ("Catalog page already marked force-dynamic: {0}" -f $CatalogPage)
  }
}

Invoke-Step -Name "Create production env template if missing" -Action {
  if (-not (Test-Path -LiteralPath $EnvFile)) {
    $template = @'
DATABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
APP_BASE_URL=
RESEND_API_KEY=
EMAIL_FROM=
'@
    Write-Utf8NoBomFile -Path $EnvFile -Content $template
    Write-Log ("Created env template: {0}" -f $EnvFile)
  } else {
    Write-Log ("Env file already exists: {0}" -f $EnvFile)
  }
}

Invoke-Step -Name "Clear .next cache" -Action {
  $NextDir = Join-Path $RepoRoot ".next"
  if (Test-Path -LiteralPath $NextDir) {
    Remove-Item -LiteralPath $NextDir -Recurse -Force
    Write-Log ("Removed: {0}" -f $NextDir)
  } else {
    Write-Log ("Skip remove (not found): {0}" -f $NextDir)
  }
}

Write-Log "Patch completed."
Write-Host ""
Write-Host "DONE" -ForegroundColor Green
Write-Host ("Backup : {0}" -f $BackupDir)
Write-Host ("Log    : {0}" -f $script:LogFile)
Write-Host ("Env    : {0}" -f $EnvFile)
'@ | Set-Content -LiteralPath "D:\01-Main-Work\Boots\Agentic-AI\mission-control\orry\tools\fix-catalog-env-prerender.ps1" -Encoding utf8