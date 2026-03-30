Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$RepoRoot = 'D:\01-Main-Work\Boots\Agentic-AI\mission-control\orry'
$ToolsDir = Join-Path $RepoRoot 'tools'
$LogsDir = Join-Path $ToolsDir 'logs'
$TimeTag = Get-Date -Format 'yyyyMMdd_HHmmss'
$BackupDir = Join-Path $ToolsDir ("backup_orry_node_crypto_fix_" + $TimeTag)
$LogFile = Join-Path $LogsDir ("orry-node-crypto-fix_" + $TimeTag + ".log")
$SummaryFile = Join-Path $LogsDir ("orry-node-crypto-fix-summary_" + $TimeTag + ".txt")
$LastBackupFile = Join-Path $ToolsDir 'LAST_BACKUP_DIR.txt'
$StepResults = New-Object System.Collections.Generic.List[object]

trap {
    $msg = $_.Exception.Message
    try {
        $logDir = Split-Path -Parent $LogFile
        if ($logDir -and (Test-Path -LiteralPath $logDir)) {
            Add-Content -LiteralPath $LogFile -Value ("[{0}] FATAL: {1}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $msg) -Encoding utf8
        }
    } catch {}
    Write-Host "[FATAL] $msg" -ForegroundColor Red
    exit 1
}

function Write-Utf8NoBomFile {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][string]$Content
    )
    $dir = Split-Path -Parent $Path
    if ($dir -and -not (Test-Path -LiteralPath $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    $enc = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($Path, $Content, $enc)
}

function Log {
    param([Parameter(Mandatory = $true)][string]$Message)
    $line = "[{0}] {1}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $Message
    Write-Host $line
    Add-Content -LiteralPath $LogFile -Value $line -Encoding utf8
}

function Add-StepResult {
    param(
        [Parameter(Mandatory = $true)][string]$Step,
        [Parameter(Mandatory = $true)][int]$ExitCode,
        [Parameter(Mandatory = $true)][string]$Status
    )
    $StepResults.Add([pscustomobject]@{
        Step = $Step
        ExitCode = $ExitCode
        Status = $Status
    }) | Out-Null
}

function Run-Step {
    param(
        [Parameter(Mandatory = $true)][string]$Name,
        [Parameter(Mandatory = $true)][scriptblock]$Action
    )
    Log "STEP START: $Name"
    try {
        & $Action
        Add-StepResult -Step $Name -ExitCode 0 -Status 'OK'
        Log "STEP OK: $Name | exit=0"
    } catch {
        $msg = $_.Exception.Message
        Add-StepResult -Step $Name -ExitCode 1 -Status 'FAIL'
        Log "STEP FAIL: $Name | exit=1 | error=$msg"
        throw
    }
}

function Backup-File {
    param(
        [Parameter(Mandatory = $true)][string]$FilePath,
        [Parameter(Mandatory = $true)][string]$BackupRoot
    )
    if (-not (Test-Path -LiteralPath $FilePath)) {
        throw "Backup target not found: $FilePath"
    }
    $full = [System.IO.Path]::GetFullPath($FilePath)
    $root = [System.IO.Path]::GetFullPath($RepoRoot)
    $relative = $full.Substring($root.Length).TrimStart('\')
    $dest = Join-Path $BackupRoot $relative
    $destDir = Split-Path -Parent $dest
    if ($destDir -and -not (Test-Path -LiteralPath $destDir)) {
        New-Item -ItemType Directory -Path $destDir -Force | Out-Null
    }
    Copy-Item -LiteralPath $FilePath -Destination $dest -Force
    return $dest
}

function Get-Utf8Raw {
    param([Parameter(Mandatory = $true)][string]$Path)
    Get-Content -LiteralPath $Path -Raw
}

function Set-Utf8Raw {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][string]$Content
    )
    Write-Utf8NoBomFile -Path $Path -Content $Content
}

function Invoke-NpmCommand {
    param(
        [Parameter(Mandatory = $true)][string[]]$Args,
        [Parameter(Mandatory = $true)][string]$StepName
    )
    Run-Step -Name $StepName -Action {
        Push-Location $RepoRoot
        try {
            Log ("RUN: npm " + ($Args -join ' '))
            $output = & npm @Args 2>&1
            foreach ($line in $output) {
                Log ($line.ToString())
            }
            if ($LASTEXITCODE -ne 0) {
                throw ("npm " + ($Args -join ' ') + " failed with exit code " + $LASTEXITCODE)
            }
        } finally {
            Pop-Location
        }
    }
}

$SecurityPath = Join-Path $RepoRoot 'src\lib\security.ts'
$AuthPath = Join-Path $RepoRoot 'src\auth.ts'
$TsPaths = New-Object System.Collections.Generic.List[string]
$NodeCryptoHits = New-Object System.Collections.Generic.List[string]
$RuntimeTargets = New-Object System.Collections.Generic.List[string]

Run-Step -Name 'Validate paths and create folders' -Action {
    if (-not (Test-Path -LiteralPath $RepoRoot)) { throw "Repo root not found: $RepoRoot" }

    foreach ($dir in @($ToolsDir, $LogsDir, $BackupDir)) {
        if (-not (Test-Path -LiteralPath $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
        }
    }

    Write-Utf8NoBomFile -Path $LastBackupFile -Content $BackupDir
}

Run-Step -Name 'Collect TypeScript files' -Action {
    $files = Get-ChildItem -LiteralPath $RepoRoot -Recurse -File -Include *.ts,*.tsx,*.mts,*.cts |
        Where-Object {
            $_.FullName -notmatch '\\node_modules\\' -and
            $_.FullName -notmatch '\\\.next\\' -and
            $_.FullName -notmatch '\\out\\' -and
            $_.FullName -notmatch '\\coverage\\' -and
            $_.FullName -notmatch '\\tools\\backup_'
        }

    foreach ($file in $files) {
        [void]$TsPaths.Add($file.FullName)
    }

    if ($TsPaths.Count -eq 0) {
        throw 'No TypeScript files found'
    }

    Log ("TS files found: " + $TsPaths.Count)
}

Run-Step -Name 'Scan for node:crypto usages' -Action {
    foreach ($path in $TsPaths) {
        $content = Get-Utf8Raw -Path $path
        if ($content -match 'crypto') {
            [void]$NodeCryptoHits.Add($path)
            Log ("HIT node:crypto => " + $path)
        }
    }

    if ($NodeCryptoHits.Count -eq 0) {
        Log 'No node:crypto usages found.'
    }
}

Run-Step -Name 'Backup candidate files' -Action {
    $toBackup = New-Object 'System.Collections.Generic.HashSet[string]'

    foreach ($path in $NodeCryptoHits) {
        if (Test-Path -LiteralPath $path) {
            [void]$toBackup.Add($path)
        }
    }

    foreach ($path in @($SecurityPath, $AuthPath)) {
        if (Test-Path -LiteralPath $path) {
            [void]$toBackup.Add($path)
        }
    }

    foreach ($path in $TsPaths) {
        $content = Get-Utf8Raw -Path $path
        if (
            $content -match 'from\s+["''][^"'']*auth["'']' -or
            $content -match 'from\s+["''][^"'']*security["'']'
        ) {
            [void]$toBackup.Add($path)
        }
    }

    foreach ($path in $toBackup) {
        $dest = Backup-File -FilePath $path -BackupRoot $BackupDir
        Log ("Backup created: " + $dest)
    }
}

Run-Step -Name 'Replace node:crypto with crypto' -Action {
    foreach ($path in $NodeCryptoHits) {
        $content = Get-Utf8Raw -Path $path
        $newContent = $content -replace '(["''])node:crypto\1', '$1crypto$1'
        if ($newContent -ne $content) {
            Set-Utf8Raw -Path $path -Content $newContent
            Log ("Patched import => " + $path)
        }
    }
}

Run-Step -Name 'Force security.ts to be server-only' -Action {
    if (-not (Test-Path -LiteralPath $SecurityPath)) {
        Log ("Skip: not found => " + $SecurityPath)
        return
    }

    $content = Get-Utf8Raw -Path $SecurityPath
    if ($content -notmatch "(?m)^\s*import\s+['""]server-only['""];?\s*$") {
        $content = "import 'server-only';`r`n" + $content
        Set-Utf8Raw -Path $SecurityPath -Content $content
        Log ("Added server-only => " + $SecurityPath)
    } else {
        Log ("server-only already present => " + $SecurityPath)
    }
}

Run-Step -Name 'Find routes importing auth/security' -Action {
    $routableNames = @('page.tsx','page.ts','layout.tsx','layout.ts','route.ts','route.tsx','middleware.ts','proxy.ts')

    foreach ($path in $TsPaths) {
        $name = Split-Path -Leaf $path
        if ($name -notin $routableNames) { continue }

        $content = Get-Utf8Raw -Path $path
        if (
            $content -match 'from\s+["''][^"'']*src/auth["'']' -or
            $content -match 'from\s+["'']@/auth["'']' -or
            $content -match 'from\s+["''][^"'']*lib/security["'']' -or
            $content -match 'from\s+["'']@/lib/security["'']'
        ) {
            [void]$RuntimeTargets.Add($path)
            Log ("Runtime target => " + $path)
        }
    }
}

Run-Step -Name 'Set runtime=nodejs on affected routes' -Action {
    foreach ($path in $RuntimeTargets) {
        $content = Get-Utf8Raw -Path $path

        if ($content -match 'export\s+const\s+runtime\s*=\s*["''](edge|nodejs)["'']') {
            $newContent = [regex]::Replace(
                $content,
                'export\s+const\s+runtime\s*=\s*["''](edge|nodejs)["'']',
                "export const runtime = 'nodejs'",
                1
            )
            if ($newContent -ne $content) {
                Set-Utf8Raw -Path $path -Content $newContent
                Log ("Replaced runtime => " + $path)
            }
        } else {
            $newContent = "export const runtime = 'nodejs';`r`n" + $content
            Set-Utf8Raw -Path $path -Content $newContent
            Log ("Inserted runtime => " + $path)
        }
    }
}

Run-Step -Name 'Verify no node:crypto remains in source' -Action {
    $remaining = New-Object System.Collections.Generic.List[string]
    foreach ($path in $TsPaths) {
        $content = Get-Utf8Raw -Path $path
        if ($content -match 'crypto') {
            [void]$remaining.Add($path)
        }
    }

    if ($remaining.Count -gt 0) {
        foreach ($path in $remaining) {
            Log ("Remaining node:crypto => " + $path)
        }
        throw 'node:crypto still remains in source files'
    }
}

Invoke-NpmCommand -Args @('exec','prisma','generate') -StepName 'Prisma generate'
Invoke-NpmCommand -Args @('run','build') -StepName 'Next build'

Run-Step -Name 'Write summary' -Action {
    $summary = New-Object System.Collections.Generic.List[string]
    $summary.Add('ORRY NODE CRYPTO FIX SUMMARY') | Out-Null
    $summary.Add('RepoRoot: ' + $RepoRoot) | Out-Null
    $summary.Add('BackupDir: ' + $BackupDir) | Out-Null
    $summary.Add('LogFile: ' + $LogFile) | Out-Null
    $summary.Add('') | Out-Null

    foreach ($row in $StepResults) {
        $summary.Add(('{0} | exit={1} | {2}' -f $row.Step, $row.ExitCode, $row.Status)) | Out-Null
    }

    Write-Utf8NoBomFile -Path $SummaryFile -Content ($summary -join "`r`n")
}

Write-Host ''
Write-Host 'Done.' -ForegroundColor Green
Write-Host ('Backup : ' + $BackupDir)
Write-Host ('Log    : ' + $LogFile)
Write-Host ('Summary: ' + $SummaryFile)
exit 0