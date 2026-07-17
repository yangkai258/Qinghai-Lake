Get-ChildItem -Path "C:\Users\YKing\Documents\data-tw\apps\admin\node_modules\@data-tw\db\src\schema" -Name | ForEach-Object {
    $b = [System.IO.File]::ReadAllBytes("C:\Users\YKing\Documents\data-tw\apps\admin\node_modules\@data-tw\db\src\schema\$_")[0..2]
    if ($b[0] -eq 239 -and $b[1] -eq 187 -and $b[2] -eq 191) { Write-Host "BOM: $_" }
}
