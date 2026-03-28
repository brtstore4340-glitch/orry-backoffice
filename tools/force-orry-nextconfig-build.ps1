$path = "D:\01 Main Work\Boots\Agentic AI\mission-control\orry\tools\force-orry-nextconfig-build.ps1"

if (-not (Test-Path -LiteralPath $path)) {
    throw "File not found: $path"
}

$toolsDir = Split-Path -Parent $path
$logsDir = Join-Path (Split-Path -Parent $toolsDir) "tools\logs"
if (-not (Test-Path -LiteralPath $logsDir)) {
    New-Item -ItemType Directory -Path $logsDir -Force | Out-Null
}

$timeTag = Get-Date -Format 'yyyyMMdd_HHmmss'
$backupDir = Join-Path $toolsDir ("backup_force_script_fix_" + $timeTag)
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
Copy-Item -LiteralPath $path -Destination (Join-Path $backupDir (Split-Path -Leaf $path)) -Force
Set-Content -LiteralPath (Join-Path $toolsDir 'LAST_BACKUP_DIR.txt') -Value $backupDir -Encoding utf8

$content = Get-Content -LiteralPath $path -Raw

$content = $content -replace '\[Parameter\(Mandatory = \$true\)\]\[string\]\$Message', '[AllowEmptyString()][string]$Message'
$content = $content -replace 'ForEach-Object \{ Log \$_ \}', 'ForEach-Object { Log ([string]$_) }'

$enc = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($path, $content, $enc)

Write-Host "Patched: $path"
Write-Host "Backup : $backupDir"