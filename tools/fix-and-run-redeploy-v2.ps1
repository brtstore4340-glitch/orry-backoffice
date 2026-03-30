Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

trap {
    try {
        if ($script:LogFile -and (Test-Path -LiteralPath (Split-Path -Parent $script:LogFile))) {
            Add-Content -LiteralPath $script:LogFile -Value ("[FATAL] " + $_.Exception.Message) -Encoding utf8
        }
    } catch {}
    throw
}

function Write-Utf8NoBomFile {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [AllowEmptyString()][string]$Content = ""
    )
    $parent = Split-Path -Parent $Path
    if (-not [string]::IsNullOrWhiteSpace($parent) -and -not (Test-Path -LiteralPath $parent)) {
        New-Item -ItemType Directory -Path $parent -Force | Out-Null
    }
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($Path, $Content, $utf8NoBom)
}

function New-EmptyUtf8NoBomFile {
    param(
        [Parameter(Mandatory = $true)][string]$Path
    )
    $parent = Split-Path -Parent $Path
    if (-not [string]::IsNullOrWhiteSpace($parent) -and -not (Test-Path -LiteralPath $parent)) {
        New-Item -ItemType Directory -Path $parent -Force | Out-Null
    }
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($Path, "", $utf8NoBom)
}

function Log {
    param([Parameter(Mandatory = $true)][string]$Message)
    $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $line = "[{0}] {1}" -f $ts, $Message
    Write-Host $line
    Add-Content -LiteralPath $script:LogFile -Value $line -Encoding utf8
}

function Run-Step {
    param(
        [Parameter(Mandatory = $true)][string]$Label,
        [Parameter(Mandatory = $true)][scriptblock]$Action
    )
    Log ("STEP START: {0}" -f $Label)
    try {
        & $Action
        Log ("STEP OK: {0} | exit=0" -f $Label)
    } catch {
        Log ("STEP FAIL: {0} | exit=1 | error={1}" -f $Label, $_.Exception.Message)
        throw
    }
}

function Invoke-Native {
    param(
        [Parameter(Mandatory = $true)][string]$Label,
        [Parameter(Mandatory = $true)][string]$FilePath,
        [Parameter()][string[]]$ArgumentList = @(),
        [Parameter()][string]$WorkingDirectory = (Get-Location).Path,
        [Parameter()][switch]$AllowFail
    )

    $stdout = New-TemporaryFile
    $stderr = New-TemporaryFile
    try {
        Log ("CMD: {0} {1}" -f $FilePath, ($ArgumentList -join " "))
        $p = Start-Process -FilePath $FilePath -ArgumentList $ArgumentList -WorkingDirectory $WorkingDirectory -NoNewWindow -Wait -PassThru -RedirectStandardOutput $stdout.FullName -RedirectStandardError $stderr.FullName
        $outText = if (Test-Path -LiteralPath $stdout.FullName) { Get-Content -LiteralPath $stdout.FullName -Raw -ErrorAction SilentlyContinue } else { "" }
        $errText = if (Test-Path -LiteralPath $stderr.FullName) { Get-Content -LiteralPath $stderr.FullName -Raw -ErrorAction SilentlyContinue } else { "" }

        if (-not [string]::IsNullOrWhiteSpace($outText)) {
            Log "STDOUT BEGIN"
            ($outText -split "`r?`n") | ForEach-Object { if ($_ -ne "") { Log $_ } }
            Log "STDOUT END"
        }
        if (-not [string]::IsNullOrWhiteSpace($errText)) {
            Log "STDERR BEGIN"
            ($errText -split "`r?`n") | ForEach-Object { if ($_ -ne "") { Log $_ } }
            Log "STDERR END"
        }

        if (($p.ExitCode -ne 0) -and (-not $AllowFail)) {
            throw ("{0} failed with exit code {1}" -f $Label, $p.ExitCode)
        }

        return [pscustomobject]@{
            ExitCode = $p.ExitCode
            StdOut   = $outText
            StdErr   = $errText
        }
    } finally {
        Remove-Item -LiteralPath $stdout.FullName -Force -ErrorAction SilentlyContinue
        Remove-Item -LiteralPath $stderr.FullName -Force -ErrorAction SilentlyContinue
    }
}

function Backup-IfExists {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][string]$BackupRoot
    )
    if (Test-Path -LiteralPath $Path) {
        $name = Split-Path -Leaf $Path
        Copy-Item -LiteralPath $Path -Destination (Join-Path $BackupRoot $name) -Force
        Log ("Backup created: {0}" -f $Path)
    }
}

function Replace-ProjectRefInFile {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][string]$NewRef
    )
    if (-not (Test-Path -LiteralPath $Path)) { return $false }

    $old = Get-Content -LiteralPath $Path -Raw -Encoding UTF8
    $new = $old

    $refs = @(
        "csulanaivoltmubaktvn",
        "csulanaivoltmubaktvn",
        "csulanaivoltmubaktvn"
    ) | Select-Object -Unique

    foreach ($r in $refs) {
        if ($r -ne $NewRef) {
            $new = $new.Replace($r, $NewRef)
        }
    }

    if ($new -ne $old) {
        Write-Utf8NoBomFile -Path $Path -Content $new
        Log ("Patched project ref in file: {0}" -f $Path)
        return $true
    }

    return $false
}

function Find-ImportantFiles {
    param([Parameter(Mandatory = $true)][string]$RepoRoot)

    $results = New-Object System.Collections.Generic.List[string]
    $globs = @(
        ".env",
        ".env.local",
        ".env.production",
        "package.json",
        "next.config.js",
        "next.config.mjs",
        "next.config.ts",
        "supabase\config.toml",
        "tools\*.ps1"
    )

    foreach ($g in $globs) {
        Get-ChildItem -Path (Join-Path $RepoRoot $g) -File -Recurse -ErrorAction SilentlyContinue | ForEach-Object {
            if (-not $results.Contains($_.FullName)) {
                [void]$results.Add($_.FullName)
            }
        }
    }

    Get-ChildItem -Path (Join-Path $RepoRoot "src") -File -Recurse -ErrorAction SilentlyContinue | Where-Object {
        $_.Extension -in @(".ts",".tsx",".js",".jsx")
    } | ForEach-Object {
        if (-not $results.Contains($_.FullName)) {
            [void]$results.Add($_.FullName)
        }
    }

    return $results
}

$RepoRoot = "D:\01-Main-Work\Boots\Agentic-AI\mission-control\orry"
$ToolsDir = Join-Path $RepoRoot "tools"
$LogsDir = Join-Path $ToolsDir "logs"
$BackupDir = Join-Path $ToolsDir ("backup_redeploy_orry_v2_" + (Get-Date -Format "yyyyMMdd_HHmmss"))
$LastBackupPointer = Join-Path $ToolsDir "LAST_BACKUP_DIR.txt"
$script:LogFile = Join-Path $LogsDir "redeploy-orry-v2.log"
$SummaryFile = Join-Path $LogsDir "redeploy-orry-v2-summary.txt"
$EnvScanFile = Join-Path $LogsDir "redeploy-orry-v2-env-scan.txt"

$ProjectRef = "csulanaivoltmubaktvn"
$ExpectedSupabaseUrl = "https://csulanaivoltmubaktvn.supabase.co"
$DeployScript = Join-Path $ToolsDir "deploy-orry-direct.ps1"
$EnvLocal = Join-Path $RepoRoot ".env.local"
$EnvPlain = Join-Path $RepoRoot ".env"
$SupabaseConfig = Join-Path $RepoRoot "supabase\config.toml"

Run-Step -Label "Validate paths and prepare folders" -Action {
    if (-not (Test-Path -LiteralPath $RepoRoot)) { throw "Repo root not found: $RepoRoot" }
    if (-not (Test-Path -LiteralPath $ToolsDir)) { New-Item -ItemType Directory -Path $ToolsDir -Force | Out-Null }
    if (-not (Test-Path -LiteralPath $LogsDir)) { New-Item -ItemType Directory -Path $LogsDir -Force | Out-Null }
    if (-not (Test-Path -LiteralPath $BackupDir)) { New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null }
    Write-Utf8NoBomFile -Path $LastBackupPointer -Content $BackupDir
    if (Test-Path -LiteralPath $script:LogFile) {
        Copy-Item -LiteralPath $script:LogFile -Destination (Join-Path $BackupDir "redeploy-orry-v2.previous.log") -Force
    }
    New-EmptyUtf8NoBomFile -Path $script:LogFile
}

Set-Location -LiteralPath $RepoRoot

Run-Step -Label "Backup critical files" -Action {
    Backup-IfExists -Path $DeployScript -BackupRoot $BackupDir
    Backup-IfExists -Path $EnvLocal -BackupRoot $BackupDir
    Backup-IfExists -Path $EnvPlain -BackupRoot $BackupDir
    Backup-IfExists -Path $SupabaseConfig -BackupRoot $BackupDir
    Backup-IfExists -Path (Join-Path $RepoRoot "package.json") -BackupRoot $BackupDir
    Backup-IfExists -Path (Join-Path $RepoRoot "package-lock.json") -BackupRoot $BackupDir
    Backup-IfExists -Path (Join-Path $RepoRoot "pnpm-lock.yaml") -BackupRoot $BackupDir
    Backup-IfExists -Path (Join-Path $RepoRoot "next.config.js") -BackupRoot $BackupDir
    Backup-IfExists -Path (Join-Path $RepoRoot "next.config.mjs") -BackupRoot $BackupDir
    Backup-IfExists -Path (Join-Path $RepoRoot "next.config.ts") -BackupRoot $BackupDir
}

Run-Step -Label "Patch project ref in important files" -Action {
    $files = Find-ImportantFiles -RepoRoot $RepoRoot
    $patchedCount = 0
    foreach ($file in $files) {
        if (Replace-ProjectRefInFile -Path $file -NewRef $ProjectRef) {
            $patchedCount++
        }
    }
    Log ("Patched files count: {0}" -f $patchedCount)
}

Run-Step -Label "Normalize .env.local Supabase URL when present" -Action {
    if (Test-Path -LiteralPath $EnvLocal) {
        $text = Get-Content -LiteralPath $EnvLocal -Raw -Encoding UTF8
        if ($text -match "(?m)^NEXT_PUBLIC_SUPABASE_URL=") {
            $text = [regex]::Replace($text, "(?m)^NEXT_PUBLIC_SUPABASE_URL=.*$", "NEXT_PUBLIC_SUPABASE_URL=$ExpectedSupabaseUrl")
        } else {
            $text = ($text.TrimEnd() + [Environment]::NewLine + "NEXT_PUBLIC_SUPABASE_URL=$ExpectedSupabaseUrl" + [Environment]::NewLine)
        }
        Write-Utf8NoBomFile -Path $EnvLocal -Content $text
        Log ("Normalized NEXT_PUBLIC_SUPABASE_URL in {0}" -f $EnvLocal)
    } else {
        Write-Utf8NoBomFile -Path $EnvLocal -Content ("NEXT_PUBLIC_SUPABASE_URL=$ExpectedSupabaseUrl" + [Environment]::NewLine)
        Log (".env.local created with NEXT_PUBLIC_SUPABASE_URL")
    }
}

Run-Step -Label "Scan environment and config" -Action {
    $lines = New-Object System.Collections.Generic.List[string]
    $lines.Add("ORRY ENV SCAN V2")
    $lines.Add(("Generated: {0}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss")))
    $lines.Add(("RepoRoot: {0}" -f $RepoRoot))
    $lines.Add(("Expected ProjectRef: {0}" -f $ProjectRef))
    $lines.Add(("Expected Supabase URL: {0}" -f $ExpectedSupabaseUrl))
    $lines.Add("")

    foreach ($path in @($EnvPlain, $EnvLocal, $DeployScript, $SupabaseConfig, (Join-Path $RepoRoot "package.json"))) {
        $lines.Add(("FILE: {0}" -f $path))
        if (Test-Path -LiteralPath $path) {
            $content = Get-Content -LiteralPath $path -Raw -Encoding UTF8
            $hits = $content -split "`r?`n" | Where-Object {
                ($_ -match "SUPABASE") -or
                ($_ -match "DATABASE_URL") -or
                ($_ -match "DIRECT_URL") -or
                ($_ -match "POSTGRES") -or
                ($_ -match "csulanaivoltmubaktvn") -or
                ($_ -match "csulanaivoltmubaktvn") -or
                ($_ -match "csulanaivoltmubaktvn")
            }
            if ($hits.Count -gt 0) {
                foreach ($h in $hits) {
                    $safe = $h
                    $safe = [regex]::Replace($safe, "(?i)(password=)[^'"";\s]+", '$1********')
                    $safe = [regex]::Replace($safe, "(?i)(postgres://[^:]+:)[^@]+@", '$1********@')
                    $safe = [regex]::Replace($safe, "(?i)(SUPABASE_DB_PASSWORD=).+$", '$1********')
                    $safe = [regex]::Replace($safe, "(?i)(DIRECT_URL=postgres://[^:]+:)[^@]+@", '$1********@')
                    $safe = [regex]::Replace($safe, "(?i)(DATABASE_URL=postgres://[^:]+:)[^@]+@", '$1********@')
                    $lines.Add($safe)
                }
            } else {
                $lines.Add("<no matching lines>")
            }
        } else {
            $lines.Add("<missing>")
        }
        $lines.Add("")
    }

    $lines.Add(("CLI supabase: {0}" -f ($(if (Get-Command supabase -ErrorAction SilentlyContinue) { "FOUND" } else { "MISSING" }))))
    $lines.Add(("CLI psql: {0}" -f ($(if (Get-Command psql -ErrorAction SilentlyContinue) { "FOUND" } else { "MISSING" }))))
    $lines.Add(("CLI npm: {0}" -f ($(if (Get-Command npm -ErrorAction SilentlyContinue) { "FOUND" } else { "MISSING" }))))

    Write-Utf8NoBomFile -Path $EnvScanFile -Content ($lines -join [Environment]::NewLine)
    Log ("Environment scan written: {0}" -f $EnvScanFile)
}

Run-Step -Label "Verify required commands and files" -Action {
    foreach ($cmd in @("npm")) {
        if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
            throw ("Required command not found in PATH: {0}" -f $cmd)
        }
    }
    if (-not (Test-Path -LiteralPath $DeployScript)) {
        throw ("Deploy script missing: {0}" -f $DeployScript)
    }
}

Run-Step -Label "Install dependencies" -Action {
    $null = Invoke-Native -Label "npm-install" -FilePath "npm.cmd" -ArgumentList @("install") -WorkingDirectory $RepoRoot
}

Run-Step -Label "Build application" -Action {
    $pkgPath = Join-Path $RepoRoot "package.json"
    if (-not (Test-Path -LiteralPath $pkgPath)) {
        throw "package.json not found"
    }
    $pkg = Get-Content -LiteralPath $pkgPath -Raw -Encoding UTF8 | ConvertFrom-Json
    if (-not $pkg.scripts.build) {
        throw "package.json does not contain a build script"
    }
    $null = Invoke-Native -Label "npm-build" -FilePath "npm.cmd" -ArgumentList @("run","build") -WorkingDirectory $RepoRoot
}

Run-Step -Label "Dry scan deploy script for stale refs" -Action {
    $text = Get-Content -LiteralPath $DeployScript -Raw -Encoding UTF8
    $stale = @()
    foreach ($r in @("csulanaivoltmubaktvn","csulanaivoltmubaktvn")) {
        if ($text -match [regex]::Escape($r)) {
            $stale += $r
        }
    }
    if ($stale.Count -gt 0) {
        throw ("deploy-orry-direct.ps1 still contains stale refs: {0}" -f ($stale -join ", "))
    }
    Log "No stale Supabase project refs remain in deploy script"
}

Run-Step -Label "Run deploy script" -Action {
    $null = Invoke-Native -Label "deploy-orry-direct" -FilePath "powershell.exe" -ArgumentList @("-ExecutionPolicy","Bypass","-File",$DeployScript) -WorkingDirectory $RepoRoot
}

$summary = New-Object System.Collections.Generic.List[string]
$summary.Add("ORRY REDEPLOY SUMMARY V2")
$summary.Add(("Generated: {0}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss")))
$summary.Add(("RepoRoot: {0}" -f $RepoRoot))
$summary.Add(("Supabase ProjectRef: {0}" -f $ProjectRef))
$summary.Add(("Expected URL: {0}" -f $ExpectedSupabaseUrl))
$summary.Add(("BackupDir: {0}" -f $BackupDir))
$summary.Add(("LogFile: {0}" -f $script:LogFile))
$summary.Add(("EnvScanFile: {0}" -f $EnvScanFile))
$summary.Add("")
$summary.Add("Result: SUCCESS")
Write-Utf8NoBomFile -Path $SummaryFile -Content ($summary -join [Environment]::NewLine)
Log ("Summary written: {0}" -f $SummaryFile)
Log "REDEPLOY COMPLETED SUCCESSFULLY"