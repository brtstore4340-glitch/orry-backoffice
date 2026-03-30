Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

trap {
  $msg = $_.Exception.Message
  try {
    if ($script:LogFile) {
      Add-Content -LiteralPath $script:LogFile -Value ("[{0}] FATAL: {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $msg)
    }
  } catch {}
  Write-Host "[FATAL] $msg" -ForegroundColor Red
  exit 1
}

$Repo = "D:\01-Main-Work\Boots\Agentic-AI\mission-control\orry"
$Tools = Join-Path $Repo "tools"
$Logs = Join-Path $Tools "logs"
$Stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupDir = Join-Path $Tools "backup_probe_middleware_env_$Stamp"
$script:LogFile = Join-Path $Logs "probe-middleware-env_$Stamp.log"
$Summary = Join-Path $Logs "probe-middleware-env-summary_$Stamp.txt"

function Log([string]$Text) {
  $line = "[{0}] {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $Text
  Add-Content -LiteralPath $script:LogFile -Value $line
  Write-Host $line
}

function Write-Utf8NoBomFile {
  param([string]$Path,[string]$Content)
  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($Path, $Content, $utf8NoBom)
}

function Backup-File([string]$Path) {
  if (-not (Test-Path -LiteralPath $Path)) { return }
  $fullRepo = [System.IO.Path]::GetFullPath($Repo)
  $fullPath = [System.IO.Path]::GetFullPath($Path)
  $relative = $fullPath.Substring($fullRepo.Length).TrimStart('\')
  $dest = Join-Path $BackupDir $relative
  $destDir = Split-Path -Parent $dest
  if (-not (Test-Path -LiteralPath $destDir)) {
    New-Item -ItemType Directory -Force -Path $destDir | Out-Null
  }
  Copy-Item -LiteralPath $Path -Destination $dest -Force
  Log "Backup created: $dest"
}

New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null
New-Item -ItemType Directory -Force -Path $Logs | Out-Null
Set-Content -LiteralPath (Join-Path $Tools "LAST_BACKUP_DIR.txt") -Value $BackupDir -Encoding utf8

$patterns = @(
  "Runtime environment is invalid",
  "Missing required production environment values",
  "process\.env\.",
  "DATABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "RESEND_API_KEY",
  "EMAIL_FROM",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "middleware",
  "safeParse",
  "zod"
)

$roots = @(
  (Join-Path $Repo "src"),
  (Join-Path $Repo "app"),
  (Join-Path $Repo "lib"),
  (Join-Path $Repo "utils"),
  (Join-Path $Repo "middleware.ts"),
  (Join-Path $Repo "middleware.js")
) | Where-Object { Test-Path -LiteralPath $_ }

$results = @()

foreach ($root in $roots) {
  $item = Get-Item -LiteralPath $root
  if ($item.PSIsContainer) {
    $files = Get-ChildItem -LiteralPath $root -Recurse -File | Where-Object { $_.Extension -in ".ts",".tsx",".js",".jsx" }
  } else {
    $files = @($item)
  }

  foreach ($file in $files) {
    $hits = Select-String -Path $file.FullName -Pattern $patterns -SimpleMatch:$false
    if ($hits) {
      Backup-File $file.FullName
      foreach ($hit in $hits) {
        $results += [PSCustomObject]@{
          Path = $hit.Path
          LineNumber = $hit.LineNumber
          Line = $hit.Line.Trim()
        }
      }
    }
  }
}

$results = $results | Sort-Object Path, LineNumber -Unique

if (-not $results) {
  throw "No env-related source hits found."
}

$lines = New-Object System.Collections.Generic.List[string]
$lines.Add("MIDDLEWARE / ENV PROBE")
$lines.Add(("Generated: {0}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss")))
$lines.Add("")

foreach ($row in $results) {
  $text = "{0}:{1}: {2}" -f $row.Path, $row.LineNumber, $row.Line
  $lines.Add($text)
  Log $text
}

Write-Utf8NoBomFile -Path $Summary -Content (($lines -join "`r`n") + "`r`n")

Write-Host ""
Write-Host "DONE" -ForegroundColor Green
Write-Host "Backup : $BackupDir"
Write-Host "Log    : $script:LogFile"
Write-Host "Summary: $Summary"
