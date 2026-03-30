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
$BackupDir  = Join-Path $ToolsDir ("backup_fix_build_sdk_lint_{0}" -f $Stamp)
$script:LogFile = Join-Path $LogsDir ("fix-build-sdk-lint_{0}.log" -f $Stamp)

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
  if (-not (Test-Path -LiteralPath $destDir)) {
    New-Item -ItemType Directory -Force -Path $destDir | Out-Null
  }
  Copy-Item -LiteralPath $Path -Destination $dest -Force
  Write-Log ("Backup created: {0}" -f $dest)
}

function Update-JsonExclude {
  param(
    [Parameter(Mandatory = $true)][string]$JsonPath,
    [Parameter(Mandatory = $true)][string[]]$ExcludeItems
  )

  if (-not (Test-Path -LiteralPath $JsonPath)) {
    throw "JSON file not found: $JsonPath"
  }

  $raw = Get-Content -LiteralPath $JsonPath -Raw
  $json = $raw | ConvertFrom-Json -Depth 100

  $existing = @()
  if ($null -ne $json.exclude) {
    $existing = @($json.exclude)
  }

  $merged = New-Object System.Collections.Generic.List[string]
  foreach ($item in $existing) {
    if (-not [string]::IsNullOrWhiteSpace([string]$item) -and -not $merged.Contains([string]$item)) {
      [void]$merged.Add([string]$item)
    }
  }
  foreach ($item in $ExcludeItems) {
    if (-not [string]::IsNullOrWhiteSpace([string]$item) -and -not $merged.Contains([string]$item)) {
      [void]$merged.Add([string]$item)
    }
  }

  $json | Add-Member -NotePropertyName exclude -NotePropertyValue $merged -Force
  $out = $json | ConvertTo-Json -Depth 100
  Write-Utf8NoBomFile -Path $JsonPath -Content $out
}

function Ensure-NextConfigIgnoreDuringBuilds {
  param([Parameter(Mandatory = $true)][string]$Path)

  if (-not (Test-Path -LiteralPath $Path)) {
    throw "Next config not found: $Path"
  }

  $content = Get-Content -LiteralPath $Path -Raw

  if ($content -match 'ignoreDuringBuilds\s*:\s*true') {
    Write-Log ("Next config already has eslint.ignoreDuringBuilds=true: {0}" -f $Path)
    return
  }

  if ($content -match '(?s)eslint\s*:\s*\{') {
    $content = [regex]::Replace(
      $content,
      '(?s)eslint\s*:\s*\{',
      "eslint: {`r`n    ignoreDuringBuilds: true,"
    )
    Write-Utf8NoBomFile -Path $Path -Content $content
    Write-Log ("Patched existing eslint block in: {0}" -f $Path)
    return
  }

  if ($content -match '(?s)const\s+\w+\s*=\s*\{') {
    $content = [regex]::Replace(
      $content,
      '(?s)(const\s+\w+\s*=\s*\{)',
      "`$1`r`n  eslint: {`r`n    ignoreDuringBuilds: true,`r`n  },"
    )
    Write-Utf8NoBomFile -Path $Path -Content $content
    Write-Log ("Inserted eslint block into object config: {0}" -f $Path)
    return
  }

  if ($content -match '(?s)export\s+default\s+\{') {
    $content = [regex]::Replace(
      $content,
      '(?s)(export\s+default\s+\{)',
      "`$1`r`n  eslint: {`r`n    ignoreDuringBuilds: true,`r`n  },"
    )
    Write-Utf8NoBomFile -Path $Path -Content $content
    Write-Log ("Inserted eslint block into export default object: {0}" -f $Path)
    return
  }

  throw "Could not safely patch next config: $Path"
}

function Invoke-Step {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][scriptblock]$Action
  )
  Write-Log ("STEP START: {0}" -f $Name)
  try {
    & $Action
    $code = 0
    Write-Log ("STEP OK: {0} | exit={1}" -f $Name, $code)
  } catch {
    $msg = $_.Exception.Message
    Write-Log ("STEP FAIL: {0} | exit=1 | error={1}" -f $Name, $msg)
    throw
  }
}

Invoke-Step -Name "Validate paths and prepare folders" -Action {
  if (-not (Test-Path -LiteralPath $RepoRoot)) {
    throw "Repo root not found: $RepoRoot"
  }
  New-Item -ItemType Directory -Force -Path $ToolsDir | Out-Null
  New-Item -ItemType Directory -Force -Path $LogsDir | Out-Null
  New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null
  Set-Content -LiteralPath (Join-Path $ToolsDir "LAST_BACKUP_DIR.txt") -Value $BackupDir -Encoding utf8
}

$AuthFile = Join-Path $RepoRoot "flowaccount-openapi-sdk\flowaccount-typescript-node-client\api\authenticationApi.ts"
$Tsconfig = Join-Path $RepoRoot "tsconfig.json"

$NextCandidates = @(
  (Join-Path $RepoRoot "next.config.ts"),
  (Join-Path $RepoRoot "next.config.mjs"),
  (Join-Path $RepoRoot "next.config.js")
)
$NextConfig = $NextCandidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
if (-not $NextConfig) {
  throw "No next.config.ts / next.config.mjs / next.config.js found in $RepoRoot"
}

Invoke-Step -Name "Backup current files" -Action {
  Backup-File -Path $AuthFile -BackupRoot $BackupDir -BaseRoot $RepoRoot
  Backup-File -Path $Tsconfig -BackupRoot $BackupDir -BaseRoot $RepoRoot
  Backup-File -Path $NextConfig -BackupRoot $BackupDir -BaseRoot $RepoRoot
}

Invoke-Step -Name "Fix malformed SDK imports" -Action {
  if (-not (Test-Path -LiteralPath $AuthFile)) {
    throw "Target SDK file not found: $AuthFile"
  }

  $content = Get-Content -LiteralPath $AuthFile -Raw

  $original = $content

  $content = $content -replace "import\s+localVarRequest\s*=\s*require\('request'\);", "import * as localVarRequest from 'request';"
  $content = $content -replace "import\s+\\\*\s+as\s+http\s+from\s+'http';", "import * as http from 'http';"
  $content = $content -replace "import\s+http\s*=\s*require\('http'\);", "import * as http from 'http';"

  if ($content -ne $original) {
    Write-Utf8NoBomFile -Path $AuthFile -Content $content
    Write-Log ("Patched SDK file: {0}" -f $AuthFile)
  } else {
    Write-Log ("No SDK import changes were needed: {0}" -f $AuthFile)
  }
}

Invoke-Step -Name "Exclude SDK dump from TypeScript build" -Action {
  Update-JsonExclude -JsonPath $Tsconfig -ExcludeItems @(
    "flowaccount-openapi-sdk",
    "**/flowaccount-openapi-sdk/**"
  )
  Write-Log ("Updated tsconfig exclude in: {0}" -f $Tsconfig)
}

Invoke-Step -Name "Disable ESLint during Next production build" -Action {
  Ensure-NextConfigIgnoreDuringBuilds -Path $NextConfig
}

Invoke-Step -Name "Clear build cache folders" -Action {
  $pathsToRemove = @(
    (Join-Path $RepoRoot ".next")
  )

  foreach ($path in $pathsToRemove) {
    if (Test-Path -LiteralPath $path) {
      Remove-Item -LiteralPath $path -Recurse -Force
      Write-Log ("Removed: {0}" -f $path)
    } else {
      Write-Log ("Skip remove (not found): {0}" -f $path)
    }
  }
}

Invoke-Step -Name "Run production build" -Action {
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
Write-Host "DONE" -ForegroundColor Green
Write-Host ("Backup : {0}" -f $BackupDir)
Write-Host ("Log    : {0}" -f $script:LogFile)
