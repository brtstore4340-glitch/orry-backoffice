[CmdletBinding()]
param(
    [string]$ProjectDir = "D:\01-Main-Work\Boots\Agentic-AI\mission-control\orry"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Invoke-ProcessCapture {
    param(
        [Parameter(Mandatory = $true)][string]$FilePath,
        [Parameter(Mandatory = $true)][string[]]$Arguments
    )

    $proc = New-Object System.Diagnostics.Process
    $proc.StartInfo.FileName = $FilePath
    $proc.StartInfo.Arguments = ($Arguments -join " ")
    $proc.StartInfo.WorkingDirectory = $ProjectDir
    $proc.StartInfo.RedirectStandardOutput = $true
    $proc.StartInfo.RedirectStandardError = $true
    $proc.StartInfo.UseShellExecute = $false
    $null = $proc.Start()
    $stdout = $proc.StandardOutput.ReadToEnd()
    $stderr = $proc.StandardError.ReadToEnd()
    $proc.WaitForExit()

    [pscustomobject]@{
        ExitCode = $proc.ExitCode
        StdOut = $stdout.Trim()
        StdErr = $stderr.Trim()
    }
}

function Show-Check {
    param(
        [Parameter(Mandatory = $true)][string]$Label,
        [Parameter(Mandatory = $true)]$Result
    )

    Write-Host "`n[$Label]"
    Write-Host "exit=$($Result.ExitCode)"
    if ($Result.StdOut) { Write-Host $Result.StdOut }
    if ($Result.StdErr) { Write-Host $Result.StdErr }
}

Show-Check -Label "node --version" -Result (Invoke-ProcessCapture -FilePath "C:\Program Files\nodejs\node.exe" -Arguments @("--version"))
Show-Check -Label "git remote -v" -Result (Invoke-ProcessCapture -FilePath "D:\Program Files\Git\cmd\git.exe" -Arguments @("remote", "-v"))
Show-Check -Label "nslookup google.com" -Result (Invoke-ProcessCapture -FilePath "C:\Windows\System32\nslookup.exe" -Arguments @("google.com"))
Show-Check -Label "nslookup db.csulanaivoltmubaktvn.supabase.co" -Result (Invoke-ProcessCapture -FilePath "C:\Windows\System32\nslookup.exe" -Arguments @("db.csulanaivoltmubaktvn.supabase.co"))
Show-Check -Label "psql exists" -Result ([pscustomobject]@{
    ExitCode = if (Test-Path -LiteralPath "C:\Program Files\PostgreSQL\17\bin\psql.exe") { 0 } else { 1 }
    StdOut = if (Test-Path -LiteralPath "C:\Program Files\PostgreSQL\17\bin\psql.exe") { "C:\Program Files\PostgreSQL\17\bin\psql.exe" } else { "" }
    StdErr = ""
})
