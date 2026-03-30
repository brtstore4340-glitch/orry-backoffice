Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

trap {
  $msg = $_.Exception.Message
  try {
    if ($script:LogFile) {
      Add-Content -LiteralPath $script:LogFile -Value ("[{0}] FATAL: {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $msg)
    }
  } catch {}
  Write-Host ("[FATAL] {0}" -f $msg) -ForegroundColor Red
  exit 1
}

$RepoRoot    = "D:\01-Main-Work\Boots\Agentic-AI\mission-control\orry"
$ToolsDir    = Join-Path $RepoRoot "tools"
$LogsDir     = Join-Path $ToolsDir "logs"
$Stamp       = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupDir   = Join-Path $ToolsDir ("backup_runtime_env_probe_{0}" -f $Stamp)
$script:LogFile = Join-Path $LogsDir ("runtime-env-probe_{0}.log" -f $Stamp)
$SummaryFile = Join-Path $LogsDir ("runtime-env-probe-summary_{0}.txt" -f $Stamp)
$EnvFile     = Join-Path $RepoRoot ".env.production.local"

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
  $parent = Split-Path -Parent $Path
  if (-not [string]::IsNullOrWhiteSpace($parent) -and -not (Test-Path -LiteralPath $parent)) {
    New-Item -ItemType Directory -Force -Path $parent | Out-Null
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

function Read-EnvMap {
  param([Parameter(Mandatory = $true)][string]$Path)

  $map = @{}
  if (-not (Test-Path -LiteralPath $Path)) {
    return $map
  }

  foreach ($line in Get-Content -LiteralPath $Path) {
    if ([string]::IsNullOrWhiteSpace($line)) { continue }
    if ($line.TrimStart().StartsWith("#")) { continue }

    $m = [regex]::Match($line, '^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)$')
    if ($m.Success) {
      $map[$m.Groups[1].Value] = $m.Groups[2].Value
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
    ) -join "`r`n"
    Write-Utf8NoBomFile -Path $EnvFile -Content ($template + "`r`n")
    Write-Log ("Created env file template: {0}" -f $EnvFile)
  } else {
    Write-Log ("Env file exists: {0}" -f $EnvFile)
  }

  Backup-File -Path $EnvFile
}

Invoke-Step -Name "Collect candidate source files" -Action {
  $roots = @(
    (Join-Path $RepoRoot "src"),
    (Join-Path $RepoRoot "app"),
    (Join-Path $RepoRoot "lib"),
    (Join-Path $RepoRoot "utils"),
    (Join-Path $RepoRoot "middleware.ts"),
    (Join-Path $RepoRoot "middleware.js")
  ) | Where-Object { Test-Path -LiteralPath $_ }

  $files = @()
  foreach ($root in @($roots)) {
    $item = Get-Item -LiteralPath $root
    if ($item.PSIsContainer) {
      $files += @(Get-ChildItem -LiteralPath $root -Recurse -File | Where-Object {
        $_.Extension -in @(".ts", ".tsx", ".js", ".jsx")
      })
    } else {
      $files += @($item)
    }
  }

  $script:CandidateFiles = @($files | Sort-Object -Property FullName -Unique)
  if ($script:CandidateFiles.Count -eq 0) {
    throw "No candidate source files found."
  }

  Write-Log ("Candidate source files: {0}" -f $script:CandidateFiles.Count)
}

Invoke-Step -Name "Find env-validator and middleware source" -Action {
  $patterns = @(
    "Runtime environment is invalid",
    "Missing required production environment values",
    "process\.env\.",
    "safeParse\(",
    "zod",
    "middleware",
    "EMAIL_FROM",
    "RESEND_API_KEY",
    "APP_BASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "DATABASE_URL"
  )

  $matches = New-Object System.Collections.Generic.List[object]

  foreach ($file in $script:CandidateFiles) {
    $raw = Get-Content -LiteralPath $file.FullName -Raw
    $hit = $false

    foreach ($pattern in $patterns) {
      if ($raw -match $pattern) {
        $hit = $true
        break
      }
    }

    if ($hit) {
      [void]$matches.Add($file)
    }
  }

  $script:InterestingFiles = @($matches | Sort-Object -Property FullName -Unique)

  if ($script:InterestingFiles.Count -eq 0) {
    throw "No interesting env-related files found."
  }

  foreach ($file in $script:InterestingFiles) {
    Backup-File -Path $file.FullName
    Write-Log ("Interesting file: {0}" -f $file.FullName)
  }
}

Invoke-Step -Name "Extract env names from source" -Action {
  $names = New-Object System.Collections.Generic.List[string]

  foreach ($file in $script:InterestingFiles) {
    $raw = Get-Content -LiteralPath $file.FullName -Raw

    foreach ($m in [regex]::Matches($raw, 'process\.env\.([A-Z][A-Z0-9_]+)')) {
      $name = $m.Groups[1].Value
      if (-not $names.Contains($name)) {
        [void]$names.Add($name)
      }
    }

    foreach ($m in [regex]::Matches($raw, '"([A-Z][A-Z0-9_]+)"')) {
      $name = $m.Groups[1].Value
      if ($name -match '^(DATABASE_URL|SUPABASE_SERVICE_ROLE_KEY|APP_BASE_URL|RESEND_API_KEY|EMAIL_FROM|NEXT_PUBLIC_[A-Z0-9_]+|SUPABASE_[A-Z0-9_]+)$') {
        if (-not $names.Contains($name)) {
          [void]$names.Add($name)
        }
      }
    }

    foreach ($m in [regex]::Matches($raw, "'([A-Z][A-Z0-9_]+)'")) {
      $name = $m.Groups[1].Value
      if ($name -match '^(DATABASE_URL|SUPABASE_SERVICE_ROLE_KEY|APP_BASE_URL|RESEND_API_KEY|EMAIL_FROM|NEXT_PUBLIC_[A-Z0-9_]+|SUPABASE_[A-Z0-9_]+)$') {
        if (-not $names.Contains($name)) {
          [void]$names.Add($name)
        }
      }
    }
  }

  foreach ($baseline in @(
    "DATABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "APP_BASE_URL",
    "RESEND_API_KEY",
    "EMAIL_FROM",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  )) {
    if (-not $names.Contains($baseline)) {
      [void]$names.Add($baseline)
    }
  }

  $script:RequiredEnvNames = @($names | Sort-Object -Unique)
  foreach ($name in $script:RequiredEnvNames) {
    Write-Log ("Required env candidate: {0}" -f $name)
  }
}

Invoke-Step -Name "Append missing env keys into .env.production.local" -Action {
  $currentMap = Read-EnvMap -Path $EnvFile
  $raw = Get-Content -LiteralPath $EnvFile -Raw
  $updated = $raw

  foreach ($name in $script:RequiredEnvNames) {
    if (-not $currentMap.ContainsKey($name)) {
      if (-not [string]::IsNullOrWhiteSpace($updated) -and -not ($updated.EndsWith("`r") -or $updated.EndsWith("`n"))) {
        $updated += "`r`n"
      }
      $updated += ("{0}=" -f $name) + "`r`n"
      Write-Log ("Added env placeholder: {0}" -f $name)
    }
  }

  if ($updated -ne $raw) {
    Write-Utf8NoBomFile -Path $EnvFile -Content $updated
  }
}

Invoke-Step -Name "Write summary report" -Action {
  $map = Read-EnvMap -Path $EnvFile
  $lines = New-Object System.Collections.Generic.List[string]

  [void]$lines.Add(("Generated: {0}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss")))
  [void]$lines.Add("")
  [void]$lines.Add("Interesting source files:")
  foreach ($file in $script:InterestingFiles) {
    [void]$lines.Add((" - {0}" -f $file.FullName))
  }

  [void]$lines.Add("")
  [void]$lines.Add("Required env candidates:")
  foreach ($name in $script:RequiredEnvNames) {
    [void]$lines.Add((" - {0}" -f $name))
  }

  [void]$lines.Add("")
  [void]$lines.Add("Missing or empty:")
  foreach ($name in $script:RequiredEnvNames) {
    if (-not $map.ContainsKey($name)) {
      [void]$lines.Add((" - {0} = <missing>" -f $name))
    } elseif ([string]::IsNullOrWhiteSpace($map[$name])) {
      [void]$lines.Add((" - {0} = <empty>" -f $name))
    }
  }

  [void]$lines.Add("")
  [void]$lines.Add("Present:")
  foreach ($name in $script:RequiredEnvNames) {
    if ($map.ContainsKey($name) -and -not [string]::IsNullOrWhiteSpace($map[$name])) {
      [void]$lines.Add((" - {0} = <set>" -f $name))
    }
  }

  Write-Utf8NoBomFile -Path $SummaryFile -Content (($lines -join "`r`n") + "`r`n")
  Write-Log ("Summary written: {0}" -f $SummaryFile)
}

Write-Log "Completed runtime env probe."
Write-Host ""
Write-Host ("Backup : {0}" -f $BackupDir) -ForegroundColor Green
Write-Host ("Log    : {0}" -f $script:LogFile) -ForegroundColor Green
Write-Host ("Summary: {0}" -f $SummaryFile) -ForegroundColor Green
Write-Host ("Env    : {0}" -f $EnvFile) -ForegroundColor Green
