<#
set-vercel-env.ps1

Usage:
- Export your Vercel personal token to environment variable: $env:VERCEL_TOKEN
  or the script will prompt for it.
- Ensure the target Vercel project id is available as VERCEL_PROJECT_ID env var
  or pass it as the -ProjectId parameter.
- Run from repo root:
    pwsh .\scripts\set-vercel-env.ps1

What it does:
- Parses .env.development.local for known Supabase keys
- For each required key, calls the Vercel API to create an encrypted environment variable
- Targets the "production" environment by default (change the -Target param)

Note: This script will send secret values to Vercel. Keep your Vercel token and project id secure.
#>
[CmdletBinding()]
param(
    [string] $ProjectId = $env:VERCEL_PROJECT_ID,
    [string] $DotenvPath = "$PSScriptRoot\..\.env.development.local",
    [string[]] $Target = @("production"),
    [switch] $DryRun
)

function Read-DotEnv($path) {
    $result = @{}
    if (-not (Test-Path $path)) { Write-Error "Dotenv not found: $path"; return $result }
    Get-Content $path | ForEach-Object {
        $_ = $_.Trim()
        if ($_ -eq "" -or $_.StartsWith('#')) { return }
        if ($_ -match '^(?<k>[A-Za-z0-9_]+)=(?<v>.*)$') {
            $k = $matches.k
            $v = $matches.v
            # remove surrounding quotes if present
            if ($v.StartsWith('"') -and $v.EndsWith('"')) { $v = $v.Substring(1, $v.Length-2) }
            if ($v.StartsWith("'") -and $v.EndsWith("'")) { $v = $v.Substring(1, $v.Length-2) }
            $result[$k] = $v
        }
    }
    return $result
}

# Mapping of canonical env var -> possible names in your .env
$searchMap = @{
    "NEXT_PUBLIC_SUPABASE_URL" = @("NEXT_PUBLIC_SUPABASE_URL","NEXT_PUBLIC_SUPABASE_URL_SUPABASE_URL","NEXT_PUBLIC_SUPABASE_URL")
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY" = @("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY","NEXT_PUBLIC_SUPABASE_URL_SUPABASE_PUBLISHABLE_DEFAULT_KEY","NEXT_PUBLIC_SUPABASE_URL_SUPABASE_PUBLISHABLE_KEY","NEXT_PUBLIC_SUPABASE_URL_SUPABASE_ANON_KEY","ANON_KEY")
    "SUPABASE_SERVICE_ROLE_KEY" = @("SUPABASE_SERVICE_ROLE_KEY","SERVICE_ROLE_KEY","NEXT_PUBLIC_SUPABASE_URL_SUPABASE_SERVICE_ROLE_KEY","NEXT_PUBLIC_SUPABASE_URL_SUPABASE_SECRET_KEY")
}

if (-not $ProjectId) {
    $ProjectId = Read-Host "Enter Vercel project id (Vercel_Project_ID)"
}

$token = $env:VERCEL_TOKEN
if (-not $token) {
    $secure = Read-Host -Prompt "Enter Vercel token" -AsSecureString
    $token = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure))
}

$dotenv = Read-DotEnv $DotenvPath
if ($dotenv.Count -eq 0) { Write-Error "No dotenv values loaded; aborting"; exit 1 }

$toCreate = @()
foreach ($canonical in $searchMap.Keys) {
    $found = $null
    foreach ($candidate in $searchMap[$canonical]) {
        if ($dotenv.ContainsKey($candidate)) { $found = $dotenv[$candidate]; break }
    }
    if ($found) {
        $toCreate += [PSCustomObject]@{ Key = $canonical; Value = $found }
    } else {
        Write-Warning "Could not find value for $canonical in $DotenvPath"
    }
}

if ($toCreate.Count -eq 0) { Write-Error "No environment variables discovered to add; aborting"; exit 1 }

foreach ($item in $toCreate) {
    Write-Host "Preparing to add $($item.Key) -> target: $($Target -join ',')"
    if ($DryRun) { continue }

    $body = @{
        key = $item.Key
        value = $item.Value
        target = $Target
        type = "encrypted"
    } | ConvertTo-Json -Depth 5

    $uri = "https://api.vercel.com/v9/projects/$ProjectId/env"
    try {
        $resp = Invoke-RestMethod -Method Post -Uri $uri -Headers @{ Authorization = "Bearer $token"; 'Content-Type' = 'application/json' } -Body $body
        Write-Host "Created: $($resp.key) (id: $($resp.id))"
    } catch {
        Write-Error "Failed to create $($item.Key): $($_.Exception.Message)"
    }
}

Write-Host "Done. Run a deployment to apply production values (or set preview/development targets as needed)."