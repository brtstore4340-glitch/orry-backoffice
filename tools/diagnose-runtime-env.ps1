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

$RepoRoot   = "D:\01-Main-Work\Boots\Agentic-AI\mission-control\orry"
$ToolsDir   = Join-Path $RepoRoot "tools"
$LogsDir    = Join-Path $ToolsDir "logs"
$Stamp      = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupDir  = Join-Path $ToolsDir ("backup_diagnose_runtime_env_{0}" -f $Stamp)
$script:LogFile = Join-Path $LogsDir ("diagnose-runtime-env_{0}.log" -f $Stamp)
$SummaryFile = Join-Path $LogsDir ("diagnose-runtime-env-summary_{0}.txt" -f $Stamp)
$EnvFile    = Join-Path $RepoRoot ".env.production.local"

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

function Read-EnvFile {
  param([Parameter(Mandatory = $true)][string]$Path)
  $map = @{}
  if (-not (Test-Path -LiteralPath $Path)) {
    return $map
  }
  $lines = Get-Content -LiteralPath $Path
  foreach ($line in $lines) {
    if ([string]::IsNullOrWhiteSpace($line)) { continue }
    if ($line.TrimStart().StartsWith("#")) { continue }
    $m = [regex]::Match($line, '^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)$')
    if ($m.Success) {
      $name = $m.Groups[1].Value
      $value = $m.Groups[2].Value
      $map[$name] = $value
    }
  }
  return $map
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

Invoke-Step -Name "Ensure env file exists" -Action {
  if (-not (Test-Path -LiteralPath $EnvFile)) {
    $template = @(
      "DATABASE_URL="
      "SUPABASE_SERVICE_ROLE_KEY="
      "APP_BASE_URL="
      "RESEND_API_KEY="
      "EMAIL_FROM="
      "NEXT_PUBLIC_SUPABASE_URL="
      "NEXT_PUBLIC_SUPABASE_ANON_KEY="
      "NEXT_PUBLIC_APP_URL="
      "SUPABASE_URL="
      "SUPABASE_ANON_KEY="
    ) -join "`r`n"
    Write-Utf8NoBomFile -Path $EnvFile -Content ($template + "`r`n")
    Write-Log ("Created env template: {0}" -f $EnvFile)
  } else {
    Write-Log ("Env file exists: {0}" -f $EnvFile)
  }
  Backup-File -Path $EnvFile
}

Invoke-Step -Name "Scan source for env validator and middleware" -Action {
  $searchRoots = @(
    (Join-Path $RepoRoot "src"),
    (Join-Path $RepoRoot "app"),
    (Join-Path $RepoRoot "lib"),
    (Join-Path $RepoRoot "utils"),
    (Join-Path $RepoRoot "middleware.ts"),
    (Join-Path $RepoRoot "middleware.js")
  ) | Where-Object { Test-Path -LiteralPath $_ }

  $script:CandidateFiles = @()

  foreach ($root in $searchRoots) {
    if ((Get-Item -LiteralPath $root).PSIsContainer) {
      $script:CandidateFiles += @(Get-ChildItem -LiteralPath $root -Recurse -File -Include *.ts,*.tsx,*.js,*.jsx)
    } else {
      $script:CandidateFiles += @(Get-Item -LiteralPath $root)
    }
  }

  $script:CandidateFiles = @($script:CandidateFiles | Sort-Object -Property FullName -Unique)

  if ($script:CandidateFiles.Count -eq 0) {
    throw "No candidate source files found."
  }

  $interestingPatterns = @(
    "Runtime environment is invalid"
    "Missing required production environment values"
    "process\.env\."
    "safeParse\("
    "zod"
    "middleware"
    "NEXT_PUBLIC_"
    "SUPABASE"
    "RESEND"
    "EMAIL_FROM"
    "APP_BASE_URL"
    "DATABASE_URL"
  )

  $script:InterestingFiles = New-Object System.Collections.Generic.List[string]

  foreach ($file in $script:CandidateFiles) {
    $content = Get-Content -LiteralPath $file.FullName -Raw
    foreach ($pattern in $interestingPatterns) {
      if ($content -match $pattern) {
        [void]$script:InterestingFiles.Add($file.FullName)
        break
      }
    }
  }

  $script:InterestingFiles = @($script:InterestingFiles | Sort-Object -Unique)

  foreach ($path in $script:InterestingFiles) {
    Backup-File -Path $path
    Write-Log ("Interesting file: {0}" -f $path)
  }
}

Invoke-Step -Name "Extract required env variable names from source" -Action {
  $envNames = New-Object System.Collections.Generic.List[string]

  foreach ($path in $script:InterestingFiles) {
    $content = Get-Content -LiteralPath $path -Raw

    foreach ($m in [regex]::Matches($content, 'process\.env\.([A-Z][A-Z0-9_]+)')) {
      $name = $m.Groups[1].Value
      if (-not $envNames.Contains($name)) { [void]$envNames.Add($name) }
    }

    foreach ($m in [regex]::Matches($content, '''([A-Z][A-Z0-9_]+)''')) {
      $name = $m.Groups[1].Value
      if ($name -match '^(DATABASE_URL|SUPABASE_SERVICE_ROLE_KEY|APP_BASE_URL|RESEND_API_KEY|EMAIL_FROM|NEXT_PUBLIC_[A-Z0-9_]+|SUPABASE_[A-Z0-9_]+)$') {
        if (-not $envNames.Contains($name)) { [void]$envNames.Add($name) }
      }
    }

    foreach ($m in [regex]::Matches($content, '"([A-Z][A-Z0-9_]+)"')) {
      $name = $m.Groups[1].Value
      if ($name -match '^(DATABASE_URL|SUPABASE_SERVICE_ROLE_KEY|APP_BASE_URL|RESEND_API_KEY|EMAIL_FROM|NEXT_PUBLIC_[A-Z0-9_]+|SUPABASE_[A-Z0-9_]+)$') {
        if (-not $envNames.Contains($name)) { [void]$envNames.Add($name) }
      }
    }
  }

  $baseline = @(
    "DATABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "APP_BASE_URL",
    "RESEND_API_KEY",
    "EMAIL_FROM",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  )

  foreach ($name in $baseline) {
    if (-not $envNames.Contains($name)) { [void]$envNames.Add($name) }
  }

  $script:RequiredEnvNames = @($envNames | Sort-Object -Unique)

  if ($script:RequiredEnvNames.Count -eq 0) {
    throw "No env variable names extracted."
  }

  foreach ($name in $script:RequiredEnvNames) {
    Write-Log ("Required env candidate: {0}" -f $name)
  }
}

Invoke-Step -Name "Append missing env keys to .env.production.local" -Action {
  $currentMap = Read-EnvFile -Path $EnvFile
  $raw = Get-Content -LiteralPath $EnvFile -Raw
  $updated = $raw

  foreach ($name in $script:RequiredEnvNames) {
    if (-not $currentMap.ContainsKey($name)) {
      if (-not [string]::IsNullOrWhiteSpace($updated) -and -not $updated.EndsWith("`n") -and -not $updated.EndsWith("`r")) {
        $updated += "`r`n"
      }
      $updated += ("{0}=" -f $name) + "`r`n"
      Write-Log ("Added missing env key template: {0}" -f $name)
    }
  }

  if ($updated -ne $raw) {
    Write-Utf8NoBomFile -Path $EnvFile -Content $updated
  }
}

Invoke-Step -Name "Create summary of missing and empty env values" -Action {
  $map = Read-EnvFile -Path $EnvFile
  $missingOrEmpty = New-Object System.Collections.Generic.List[string]
  $present = New-Object System.Collections.Generic.List[string]

  foreach ($name in $script:RequiredEnvNames) {
    if (-not $map.ContainsKey($name)) {
      [void]$missingOrEmpty.Add(("{0} = <missing>" -f $name))
    } elseif ([string]::IsNullOrWhiteSpace($map[$name])) {
      [void]$missingOrEmpty.Add(("{0} = <empty>" -f $name))
    } else {
      [void]$present.Add(("{0} = <set>" -f $name))
    }
  }

  $lines = New-Object System.Collections.Generic.List[string]
  [void]$lines.Add(("Generated: {0}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss")))
  [void]$lines.Add("")
  [void]$lines.Add("Required env candidates:")
  foreach ($name in $script:RequiredEnvNames) { [void]$lines.Add((" - {0}" -f $name)) }
  [void]$lines.Add("")
  [void]$lines.Add("Present:")
  foreach ($item in $present) { [void]$lines.Add((" - {0}" -f $item)) }
  [void]$lines.Add("")
  [void]$lines.Add("Missing or empty:")
  foreach ($item in $missingOrEmpty) { [void]$lines.Add((" - {0}" -f $item)) }

  Write-Utf8NoBomFile -Path $SummaryFile -Content (($lines -join "`r`n") + "`r`n")
  Write-Log ("Summary written: {0}" -f $SummaryFile)

  if ($missingOrEmpty.Count -gt 0) {
    Write-Host ""
    Write-Host "=== MISSING / EMPTY ENV ===" -ForegroundColor Yellow
    foreach ($item in $missingOrEmpty) {
      Write-Host $item -ForegroundColor Yellow
    }
  }
}

Invoke-Step -Name "Show likely middleware and env files" -Action {
  foreach ($path in $script:InterestingFiles) {
    if ($path -match 'middleware|env|config|auth|supabase') {
      Write-Log ("Focus file: {0}" -f $path)
    }
  }
}

Write-Log "Diagnosis completed successfully."
Write-Host ""
Write-Host ("Backup : {0}" -f $BackupDir) -ForegroundColor Green
Write-Host ("Log    : {0}" -f $script:LogFile) -ForegroundColor Green
Write-Host ("Summary: {0}" -f $SummaryFile) -ForegroundColor Green
Write-Host ("Env    : {0}" -f $EnvFile) -ForegroundColor Green
