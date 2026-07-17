$pairs = [System.Collections.Specialized.NameValueCollection]::new()
$pairs.Add('email', 'admin@local')
$pairs.Add('password', 'admin1234')
try {
    $r = Invoke-WebRequest -Uri 'http://localhost:3004/api/auth/login' -Method POST -Body $pairs -SessionVariable sesh -ErrorAction Stop
    Write-Host "Status: $($r.StatusCode)"
    Write-Host "Content: $($r.Content)"
    $sesh.Cookies.GetCookies('http://localhost:3004') | ForEach-Object { Write-Host "Cookie: $($_.Name)=$($_.Value)" }
} catch {
    $ex = $_.Exception
    $resp = $ex.Response
    if ($resp) {
        Write-Host "HTTP Error: $($resp.StatusCode)"
        $sr = $resp.GetResponseStream()
        $sr.Position = 0
        $rd = New-Object System.IO.StreamReader($sr)
        Write-Host "Body: $($rd.ReadToEnd())"
    } else {
        Write-Host "Error: $($ex.Message)"
    }
}
