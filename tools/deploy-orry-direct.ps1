[CmdletBinding()]
param(
    [string]$ProjectDir = "D:\01 Main Work\Boots\Agentic AI\mission-control\orry",
    [string]$SupabaseDir = "D:\01 Main Work\Boots\Agentic AI\mission-control\orry\supabase",
    [string]$DbHost = "db.csulanaivoltmubaktvn.supabase.co",
    [int]$DbPort = 5432,
    [string]$DbName = "postgres",
    [string]$DbUser = "postgres",
    [string]$DbPassword = "",
    [string]$VercelToken = "",
    [switch]$SkipDatabase,
    [switch]$SkipSeed,
    [switch]$SkipVercel
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Invoke-ProcessCapture {
    param(
        [Parameter(Mandatory = $true)][string]$FilePath,
        [Parameter(Mandatory = $true)][string[]]$Arguments,
        [Parameter(Mandatory = $false)][string]$WorkingDirectory = $ProjectDir,
        [Parameter(Mandatory = $false)][hashtable]$Environment = @{}
    )

    $proc = New-Object System.Diagnostics.Process
    $proc.StartInfo.FileName = $FilePath
    $proc.StartInfo.Arguments = ($Arguments -join " ")
    $proc.StartInfo.WorkingDirectory = $WorkingDirectory
    $proc.StartInfo.RedirectStandardOutput = $true
    $proc.StartInfo.RedirectStandardError = $true
    $proc.StartInfo.UseShellExecute = $false

    foreach ($entry in $Environment.GetEnumerator()) {
        $proc.StartInfo.Environment[$entry.Key] = [string]$entry.Value
    }

    $null = $proc.Start()
    $stdout = $proc.StandardOutput.ReadToEnd()
    $stderr = $proc.StandardError.ReadToEnd()
    $proc.WaitForExit()

    [pscustomobject]@{
        ExitCode = $proc.ExitCode
        StdOut = $stdout
        StdErr = $stderr
    }
}

function Assert-Ok {
    param(
        [Parameter(Mandatory = $true)]$Result,
        [Parameter(Mandatory = $true)][string]$Label
    )

    if ($Result.ExitCode -ne 0) {
        throw "$Label failed with exit code $($Result.ExitCode)`nSTDOUT:`n$($Result.StdOut)`nSTDERR:`n$($Result.StdErr)"
    }
}

function Get-ExistingPath {
    param([Parameter(Mandatory = $true)][string[]]$Candidates)
    foreach ($candidate in $Candidates) {
        if (Test-Path -LiteralPath $candidate) {
            return $candidate
        }
    }
    return $null
}

function Invoke-DatabaseSqlFile {
    param(
        [Parameter(Mandatory = $true)][string]$PsqlPath,
        [Parameter(Mandatory = $true)][string]$SqlPath
    )

    $result = Invoke-ProcessCapture -FilePath $PsqlPath -WorkingDirectory $ProjectDir -Environment @{
        PGPASSWORD = $DbPassword
    } -Arguments @(
        "-h", $DbHost,
        "-p", "$DbPort",
        "-U", $DbUser,
        "-d", $DbName,
        "-v", "ON_ERROR_STOP=1",
        "-f", "`"$SqlPath`""
    )

    Assert-Ok -Result $result -Label "psql $SqlPath"
    $result.StdOut
}

$ProjectDir = [System.IO.Path]::GetFullPath($ProjectDir)
$SupabaseDir = [System.IO.Path]::GetFullPath($SupabaseDir)

$psqlPath = Get-ExistingPath -Candidates @(
    "C:\Program Files\PostgreSQL\17\bin\psql.exe",
    "C:\Program Files\PostgreSQL\16\bin\psql.exe",
    "C:\Program Files\PostgreSQL\15\bin\psql.exe"
)

if (-not $SkipDatabase.IsPresent -and -not $psqlPath) {
    throw "psql.exe was not found."
}

$nodePath = Get-ExistingPath -Candidates @(
    "C:\Program Files\Adobe\Adobe Creative Cloud Experience\libs\node.exe",
    "C:\Program Files\nodejs\node.exe",
    "C:\nvm4w\nodejs\node.exe"
)

if (-not $SkipVercel.IsPresent -and -not $nodePath) {
    throw "node.exe was not found."
}

$vercelCli = "C:\Users\User\AppData\Local\Volta\tools\image\packages\vercel\node_modules\vercel\dist\index.js"
if (-not $SkipVercel.IsPresent -and -not (Test-Path -LiteralPath $vercelCli)) {
    throw "Vercel CLI entry was not found at $vercelCli"
}

Write-Host "ProjectDir : $ProjectDir"
Write-Host "SupabaseDir: $SupabaseDir"

if (-not $SkipDatabase.IsPresent) {
    if ([string]::IsNullOrWhiteSpace($DbPassword)) {
        # BEGIN AUTOFIX DBPASSWORD THROW REPLACEMENT V11B
        if ([string]::IsNullOrWhiteSpace($DbPassword)) {
            foreach ($envName in @('DbPassword','DB_PASSWORD','SUPABASE_DB_PASSWORD','PGPASSWORD')) {
                $candidate = [Environment]::GetEnvironmentVariable($envName, 'Process')
                if ([string]::IsNullOrWhiteSpace($candidate)) { $candidate = [Environment]::GetEnvironmentVariable($envName, 'User') }
                if ([string]::IsNullOrWhiteSpace($candidate)) { $candidate = [Environment]::GetEnvironmentVariable($envName, 'Machine') }
                if (-not [string]::IsNullOrWhiteSpace($candidate)) {
                    $DbPassword = $candidate
                    break
                }
            }
        }

        if ([string]::IsNullOrWhiteSpace($DbPassword) -and ($Host.Name -match 'ConsoleHost|Visual Studio Code Host')) {
            try {
                $secureDbPassword = Read-Host 'Enter DbPassword for deployment' -AsSecureString
                if ($secureDbPassword) {
                    $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureDbPassword)
                    try {
                        $DbPassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
                    } finally {
                        if ($bstr -ne [IntPtr]::Zero) {
                            [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
                        }
                    }
                }
            } catch {
            }
        }

        if ([string]::IsNullOrWhiteSpace($DbPassword)) {
            throw "DbPassword is required for database deployment."
        }

        $env:DbPassword = $DbPassword
        $env:DB_PASSWORD = $DbPassword
        $env:SUPABASE_DB_PASSWORD = $DbPassword
        $env:PGPASSWORD = $DbPassword
# END AUTOFIX DBPASSWORD THROW REPLACEMENT V11B
    }

    $migrationFiles = Get-ChildItem -LiteralPath (Join-Path $SupabaseDir "migrations") -Filter *.sql | Sort-Object Name
    foreach ($file in $migrationFiles) {
        Write-Host "Applying migration $($file.Name)"
        Invoke-DatabaseSqlFile -PsqlPath $psqlPath -SqlPath $file.FullName | Out-Host
    }

    if (-not $SkipSeed.IsPresent) {
        $seedPath = Join-Path $SupabaseDir "seed.sql"
        if (Test-Path -LiteralPath $seedPath) {
            Write-Host "Applying seed.sql"
            Invoke-DatabaseSqlFile -PsqlPath $psqlPath -SqlPath $seedPath | Out-Host
        }
    }
}

if (-not $SkipVercel.IsPresent) {
    $args = @($vercelCli, "deploy", "--prod", "--yes")
    if (-not [string]::IsNullOrWhiteSpace($VercelToken)) {
        $args += @("--token", $VercelToken)
    }

    Write-Host "Running Vercel deployment"
    $result = Invoke-ProcessCapture -FilePath $nodePath -WorkingDirectory $ProjectDir -Arguments $args
    Assert-Ok -Result $result -Label "vercel deploy"
    $result.StdOut
}

Write-Host "Deployment finished."
