Get-ChildItem -Path "C:\Users\YKing\Documents\data-tw\packages\db\src\schema" -Name | ForEach-Object {
    $fullPath = "C:\Users\YKing\Documents\data-tw\packages\db\src\schema\$_"
    $b = [System.IO.File]::ReadAllBytes($fullPath)[0..2]
    if ($b[0] -eq 239 -and $b[1] -eq 187 -and $b[2] -eq 191) { Write-Host "BOM: $_" }
}
