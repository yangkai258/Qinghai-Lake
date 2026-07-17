try {
    $r = Invoke-WebRequest -Uri 'http://localhost:3004/api/debug-auth' -Method POST -ErrorAction Stop
    Write-Host "Status: $($r.StatusCode)"
    Write-Host "Content: $($r.Content)"
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
