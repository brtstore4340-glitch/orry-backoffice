$paramBase = $args[0]
$base = if ($paramBase) { $paramBase } else { 'http://localhost:3000' }
$loginUrl = "$base/login"

Write-Host "Fetching $loginUrl"
$r = Invoke-WebRequest -Uri $loginUrl -UseBasicParsing -SessionVariable ses -OutFile login.html -ErrorAction Stop

$html = Get-Content -Path login.html -Raw
$actionMatch = [regex]::Match($html, 'name="(\$ACTION_ID_[^"]+)"\s*value="([^"]*)"', 'IgnoreCase')
if (-not $actionMatch.Success) {
  Write-Host "Could not find server-action hidden input; trying looser match..."
  $actionMatch = [regex]::Match($html, 'name="(\$ACTION_ID_[^"]+)"', 'IgnoreCase')
}

if ($actionMatch.Success) {
  $actionName = $actionMatch.Groups[1].Value
  $actionValue = if ($actionMatch.Groups.Count -ge 3) { $actionMatch.Groups[2].Value } else { '' }
  Write-Host "Found action input: $actionName -> $actionValue"
} else {
  Write-Host "ERROR: no action input found in login page"
  exit 2
}

# Build form fields
$form = @{
  email = 'dev@orry.test'
  password = 'Password123!'
}
$form[$actionName] = $actionValue

Write-Host "Posting form to $loginUrl"
try {
  $resp = Invoke-WebRequest -Uri $loginUrl -WebSession $ses -Method Post -Body $form -MaximumRedirection 0 -ErrorAction Stop -OutFile login-response.html
  Write-Host "POST returned status: $($resp.StatusCode)"
} catch {
  # Capture response body if redirect or non-2xx
  if ($_.Exception.Response -ne $null) {
    $respStream = $_.Exception.Response.GetResponseStream()
    $sr = New-Object System.IO.StreamReader($respStream)
    $body = $sr.ReadToEnd()
    $body | Out-File login-response.html -Encoding utf8
    Write-Host "POST completed with non-2xx (saved login-response.html)."
  } else {
    Write-Host "POST failed: $_"
  }
}

# Save cookies from session
try {
  $uri = [System.Uri]$base
  $cookies = $ses.Cookies.GetCookies($uri)
  if ($cookies.Count -eq 0) {
    Write-Host "No cookies stored in session."
  } else {
    $out = @()
    foreach ($c in $cookies) {
      $out += "Name=$($c.Name); Value=$($c.Value); Domain=$($c.Domain); Path=$($c.Path); Expires=$($c.Expires)"
    }
    $out | Out-File cookies.txt -Encoding utf8
    Write-Host "Saved cookies to cookies.txt"
  }
} catch {
  Write-Host "Failed to extract cookies: $_"
}

Write-Host "Done. Files: login.html, login-response.html, cookies.txt (if created)"
