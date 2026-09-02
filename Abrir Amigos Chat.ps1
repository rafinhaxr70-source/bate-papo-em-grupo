$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$nodeDir = Join-Path $root "node-portable"
$nodeExe = Join-Path $nodeDir "node.exe"

if (!(Test-Path $nodeExe)) {
  Write-Host "Baixando o Node.js portátil (uma única vez)..."
  $zip = Join-Path $env:TEMP "node-portable.zip"
  Invoke-WebRequest "https://nodejs.org/dist/latest-v22.x/node-v22.20.0-win-x64.zip" -OutFile $zip
  Expand-Archive $zip -DestinationPath $env:TEMP -Force
  $folder = Get-ChildItem $env:TEMP -Directory | Where-Object {$_.Name -like "node-v22*-win-x64"} | Sort-Object LastWriteTime -Descending | Select-Object -First 1
  New-Item -ItemType Directory $nodeDir -Force | Out-Null
  Copy-Item "$($folder.FullName)\*" $nodeDir -Recurse -Force
}
Start-Process $nodeExe -ArgumentList "`"$root\server.js`""
Start-Sleep -Seconds 2
Start-Process "http://localhost:3000"
