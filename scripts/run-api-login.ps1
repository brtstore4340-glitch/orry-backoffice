$url = 'http://localhost:3005/api/login'
$form = @{ email = 'dev@orry.test'; password = 'Password123!' }

Write-Host "Posting to $url"
try {
  $resp = Invoke-WebRequest -Uri $url -Method Post -Body $form -SessionVariable ses -MaximumRedirection 0 -ErrorAction Stop -OutFile api-login-response.html
  Write-Host "POST returned status:" $resp.StatusCode
} catch {
  if ($_.Exception.Response -ne $null) {
    $respStream = $_.Exception.Response.GetResponseStream()
    $sr = New-Object System.IO.StreamReader($respStream)
    $body = $sr.ReadToEnd()
    $body | Out-File api-login-response.html -Encoding utf8
    Write-Host "POST completed with non-2xx (saved api-login-response.html)."
  } else {
    Write-Host "POST failed: $_"
  }
}

# Save cookies from session
try {
  $uri = [System.Uri]$url
  $cookies = $ses.Cookies.GetCookies($uri)
  if ($cookies.Count -eq 0) {
    Write-Host "No cookies stored in session."
  } else {
    $out = @()
    foreach ($c in $cookies) {
      $out += "Name=$($c.Name); Value=$($c.Value); Domain=$($c.Domain); Path=$($c.Path); Expires=$($c.Expires)"
    }
    $out | Out-File api-cookies.txt -Encoding utf8
    Write-Host "Saved cookies to api-cookies.txt"
  }
} catch {
  Write-Host "Failed to extract cookies: $_"
}

Write-Host "Done. Files: api-login-response.html, api-cookies.txt (if created)"