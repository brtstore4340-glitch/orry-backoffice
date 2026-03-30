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
$BackupDir = Join-Path $ToolsDir ("backup_force_dynamic_protected_fix_{0}" -f $Stamp)
$script:LogFile = Join-Path $LogsDir ("force-dynamic-protected-fix_{0}.log" -f $Stamp)

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
  param([Parameter(Mandatory = $true)][string]$Path)

  if (-not (Test-Path -LiteralPath $Path)) {
    Write-Log ("BACKUP SKIP: not found: {0}" -f $Path)
    return
  }

  $fullRepo = [System.IO.Path]::GetFullPath($RepoRoot)
  $fullPath = [System.IO.Path]::GetFullPath($Path)
  $relative = $fullPath.Substring($fullRepo.Length).TrimStart('\')
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

Invoke-Step -Name "Find protected roots" -Action {
  $script:ProtectedRoots = @(
    (Join-Path $RepoRoot "src\app\(protected)"),
    (Join-Path $RepoRoot "app\(protected)")
  ) | Where-Object { Test-Path -LiteralPath $_ }

  $script:ProtectedRoots = @($script:ProtectedRoots)

  if ($script:ProtectedRoots.Count -eq 0) {
    throw "Protected app folder not found."
  }

  foreach ($root in $script:ProtectedRoots) {
    Write-Log ("Protected root: {0}" -f $root)
  }
}

Invoke-Step -Name "Patch all protected page files to force-dynamic" -Action {
  $pageFiles = @()

  foreach ($root in $script:ProtectedRoots) {
    $found = Get-ChildItem -LiteralPath $root -Recurse -File | Where-Object {
      $_.Name -in @('page.tsx', 'page.jsx', 'page.ts', 'page.js')
    }
    if ($found) {
      $pageFiles += @($found)
    }
  }

  $pageFiles = @($pageFiles | Sort-Object -Property FullName -Unique)

  if ($pageFiles.Count -eq 0) {
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

Invoke-Step -Name "Ensure .env.production.local exists and has required keys" -Action {
  $envFile = Join-Path $RepoRoot ".env.production.local"

  $requiredLines = @(
    "DATABASE_URL=",
    "SUPABASE_SERVICE_ROLE_KEY=",
    "APP_BASE_URL=",
    "RESEND_API_KEY=",
    "EMAIL_FROM="
  )

  if (-not (Test-Path -LiteralPath $envFile)) {
    $content = [string]::Join("`r`n", $requiredLines) + "`r`n"
    Write-Utf8NoBomFile -Path $envFile -Content $content
    Write-Log ("Created env template: {0}" -f $envFile)
  } else {
    $existing = Get-Content -LiteralPath $envFile -Raw
    $updated = $existing

    foreach ($line in $requiredLines) {
      $key = $line.Split('=')[0]
      if ($updated -notmatch ("(?m)^" + [regex]::Escape($key) + "=")) {
        if (-not $updated.EndsWith("`n") -and -not $updated.EndsWith("`r")) {
          $updated += "`r`n"
        }
        $updated += $line + "`r`n"
      }
    }

    if ($updated -ne $existing) {
      Backup-File -Path $envFile
      Write-Utf8NoBomFile -Path $envFile -Content $updated
      Write-Log ("Updated env template with missing keys: {0}" -f $envFile)
    } else {
      Write-Log ("Env file already contains required keys: {0}" -f $envFile)
    }
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

Write-Log "Patch completed successfully."
Write-Host ""
Write-Host ("Backup : {0}" -f $BackupDir) -ForegroundColor Green
Write-Host ("Log    : {0}" -f $script:LogFile) -ForegroundColor Green
