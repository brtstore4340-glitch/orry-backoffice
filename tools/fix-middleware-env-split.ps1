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
$BackupDir = Join-Path $ToolsDir ("backup_fix_middleware_env_split_{0}" -f $Stamp)
$script:LogFile = Join-Path $LogsDir ("fix-middleware-env-split_{0}.log" -f $Stamp)

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

$EnvTs = Join-Path $RepoRoot "src\lib\env.ts"
$EnvFile = Join-Path $RepoRoot ".env.production.local"

Invoke-Step -Name "Backup current files" -Action {
  Backup-File -Path $EnvTs
  Backup-File -Path $EnvFile
}

Invoke-Step -Name "Rewrite src\lib\env.ts to split middleware/public env from server env" -Action {
  if (-not (Test-Path -LiteralPath $EnvTs)) {
    throw "File not found: $EnvTs"
  }

  $newEnvTs = @'
import { z } from "zod";

const runtimeSchema = z.object({
  NODE_ENV: z.string().optional(),
  AUTH_SECRET: z.string().min(1).optional(),
  DATABASE_URL: z.string().min(1).optional(),
  DIRECT_URL: z.string().min(1).optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  SUPABASE_STORAGE_BUCKET: z.string().min(1).optional(),
  APP_BASE_URL: z.string().url().optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  EMAIL_FROM: z.string().email().optional()
});

const parsed = runtimeSchema.safeParse({
  NODE_ENV: process.env.NODE_ENV,
  AUTH_SECRET: process.env.AUTH_SECRET,
  DATABASE_URL: process.env.DATABASE_URL,
  DIRECT_URL: process.env.DIRECT_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_STORAGE_BUCKET: process.env.SUPABASE_STORAGE_BUCKET,
  APP_BASE_URL: process.env.APP_BASE_URL,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  EMAIL_FROM: process.env.EMAIL_FROM
});

if (!parsed.success) {
  throw new Error("Runtime environment is invalid.");
}

export const env = parsed.data;

export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

export function isPlaceholder(value: string | undefined | null): boolean {
  if (!value) return true;
  const normalized = String(value).trim();
  if (!normalized) return true;
  return normalized === "..." -or normalized === "changeme" -or normalized === "REPLACE_ME";
}

export function getMissingMiddlewareEnv(): string[] {
  const missing: string[] = [];
  if (isPlaceholder(env.NEXT_PUBLIC_SUPABASE_URL)) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (isPlaceholder(env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY)) missing.push("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY");
  return missing;
}

export function getMissingServerEnv(): string[] {
  const missing: string[] = [];
  if (isPlaceholder(env.DATABASE_URL)) missing.push("DATABASE_URL");
  if (isPlaceholder(env.NEXT_PUBLIC_SUPABASE_URL)) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (isPlaceholder(env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY)) missing.push("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY");
  if (isPlaceholder(env.SUPABASE_SERVICE_ROLE_KEY)) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (isPlaceholder(env.RESEND_API_KEY)) missing.push("RESEND_API_KEY");
  if (isPlaceholder(env.EMAIL_FROM)) missing.push("EMAIL_FROM");
  return missing;
}

export function assertMiddlewareEnv(): void {
  const missing = getMissingMiddlewareEnv();
  if (missing.length > 0) {
    throw new Error(`Missing middleware environment values: ${missing.join(", ")}`);
  }
}

export function assertServerEnv(): void {
  if (!isProduction()) return;
  const missing = getMissingServerEnv();
  if (missing.length > 0) {
    throw new Error(`Missing required production environment values: ${missing.join(", ")}`);
  }
}
'@

  $newEnvTs = $newEnvTs -replace '\s-or\s', ' || '
  Write-Utf8NoBomFile -Path $EnvTs -Content $newEnvTs
  Write-Log ("Rewrote file: {0}" -f $EnvTs)
}

Invoke-Step -Name "Ensure .env.production.local contains middleware keys" -Action {
  $required = @(
    "NEXT_PUBLIC_SUPABASE_URL=",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=",
    "APP_BASE_URL=http://127.0.0.1:3000"
  )

  $existing = ""
  if (Test-Path -LiteralPath $EnvFile) {
    $existing = Get-Content -LiteralPath $EnvFile -Raw
  }

  $updated = $existing
  foreach ($line in $required) {
    $key = $line.Split("=")[0]
    if ($updated -notmatch ("(?m)^" + [regex]::Escape($key) + "=")) {
      if (-not [string]::IsNullOrWhiteSpace($updated) -and -not ($updated.EndsWith("`r") -or $updated.EndsWith("`n"))) {
        $updated += "`r`n"
      }
      $updated += $line + "`r`n"
      Write-Log ("Added env key template: {0}" -f $key)
    }
  }

  if ($updated -ne $existing) {
    Write-Utf8NoBomFile -Path $EnvFile -Content $updated
    Write-Log ("Updated env file: {0}" -f $EnvFile)
  } else {
    Write-Log ("Env file already contains required middleware keys: {0}" -f $EnvFile)
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

Invoke-Step -Name "Build app" -Action {
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
Write-Host ("Env    : {0}" -f $EnvFile) -ForegroundColor Green
'@ | Set-Content -LiteralPath "D:\01-Main-Work\Boots\Agentic-AI\mission-control\orry\tools\fix-middleware-env-split.ps1" -Encoding utf8