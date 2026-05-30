param(
    [string] $Token = $env:VERCEL_TOKEN,
    [string] $ProjectId = 'prj_SFP1kKZ3UQZEoc0HW96AtYm69Nfw',
    [string] $Key = 'NEXT_PUBLIC_SUPABASE_URL',
    [string] $Value = 'https://fvzfrucfydlusahgcgdc.supabase.co',
    [string] $OutFile = 'vercel-create-next-public-url.json'
)

if (-not $Token) {
    $Token = Read-Host -AsSecureString -Prompt "Enter Vercel token"
    $Token = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($Token))
}

$payload = @{ key = $Key; value = $Value; target = @('production'); type = 'encrypted' }
$body = ConvertTo-Json $payload -Depth 5

try {
    $resp = Invoke-RestMethod -Method Post -Uri "https://api.vercel.com/v9/projects/$ProjectId/env" -Headers @{ Authorization = "Bearer $Token"; 'Content-Type' = 'application/json' } -Body $body -ErrorAction Stop
    $resp | ConvertTo-Json -Depth 5 | Out-File -Encoding utf8 $OutFile
    Write-Host "WROTE_RESPONSE_TO: $OutFile"
} catch {
    if ($_.Exception.Response) {
        $sr = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $txt = $sr.ReadToEnd()
        $txt | Out-File -Encoding utf8 $OutFile
        Write-Host "WROTE_RESPONSE_TO: $OutFile (error)"
    } else {
        Write-Error "No response available: $($_.Exception.Message)"
    }
}
