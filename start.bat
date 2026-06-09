@echo off
cd /d "%~dp0"
set "NODE_DIR=C:\Program Files\nodejs"
set "PATH=%NODE_DIR%;%PATH%"
title MNPR Capital - Servidor

if not exist "%NODE_DIR%\node.exe" (
  echo Node.js nao encontrado. Instale em https://nodejs.org
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo Instalando dependencias...
  call "%NODE_DIR%\npm.cmd" install
)

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do (
  echo Encerrando processo antigo na porta 3000...
  taskkill /PID %%a /F >nul 2>&1
)

echo.
echo Iniciando servidor em http://localhost:3000
echo Pressione Ctrl+C para parar.
echo.
"%NODE_DIR%\node.exe" server/index.js
