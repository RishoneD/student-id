# Local server for testing (also from a phone on the same Wi-Fi).
# Run: right-click > Run with PowerShell, or double-click serve.cmd
# Note: over http://<LAN-IP> the barcode works, but install-to-home-screen and
# offline mode need HTTPS (e.g. GitHub Pages). On this computer, use http://localhost:8000
$port = 8000
Set-Location -LiteralPath $PSScriptRoot

Write-Host ""
Write-Host "On this computer:  http://localhost:$port"
Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
  Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' } |
  ForEach-Object { Write-Host ("From a phone:      http://{0}:{1}" -f $_.IPAddress, $port) }
Write-Host "Stop: Ctrl+C"
Write-Host ""

python -m http.server $port --bind 0.0.0.0
