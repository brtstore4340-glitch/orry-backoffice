param(
    [string] $Token = $env:VERCEL_TOKEN,
    [string] $ProjectId = 'prj_SFP1kKZ3UQZEoc0HW96AtYm69Nfw',
    [string] $OutFile = 'vercel-env-list.json'
)
if (-not $Token) {
    $Token = Read-Host -AsSecureString -Prompt "Enter Vercel token"
    $Token = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($Token))
}
$uri = "https://api.vercel.com/v9/projects/$ProjectId/env"
try {
    $resp = Invoke-RestMethod -Method Get -Uri $uri -Headers @{ Authorization = "Bearer $Token" } -ErrorAction Stop
    $resp | ConvertTo-Json -Depth 5 | Out-File -Encoding utf8 $OutFile
    Write-Host "WROTE: $OutFile"
    Get-Content -Raw -Path $OutFile
} catch {
    Write-Error "Failed to list envs: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        try {
            $sr = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $txt = $sr.ReadToEnd()
            $txt | Out-File -Encoding utf8 $OutFile
            Write-Host "WROTE error body to: $OutFile"
            Get-Content -Raw -Path $OutFile
        } catch {
            Write-Error "Unable to capture error response body"
        }
    }
}
