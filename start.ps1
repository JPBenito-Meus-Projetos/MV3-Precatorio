$nodeDir = "C:\Program Files\nodejs"
$env:Path = "$nodeDir;$env:Path"
Set-Location $PSScriptRoot

if (-not (Test-Path "$nodeDir\node.exe")) {
  Write-Host "Node.js nao encontrado. Instale em https://nodejs.org"
  exit 1
}

if (-not (Test-Path "node_modules")) {
  Write-Host "Instalando dependencias..."
  & "$nodeDir\npm.cmd" install
}

$conn = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
if ($conn) {
  Write-Host "Encerrando processo antigo na porta 3000..."
  Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
  Start-Sleep -Seconds 2
}

Write-Host ""
Write-Host "Iniciando servidor em http://localhost:3000"
Write-Host "Pressione Ctrl+C para parar."
Write-Host ""
& "$nodeDir\node.exe" server/index.js
