@echo off
title Amigos Chat
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo O Node.js nao esta instalado neste computador.
  echo Instale o Node.js e abra este arquivo novamente.
  echo.
  pause
  exit /b
)

if not exist "node_modules" (
  echo Instalando os componentes do Amigos Chat...
  call npm install
  if errorlevel 1 (
    echo.
    echo Nao foi possivel instalar os componentes.
    pause
    exit /b
  )
)

start "" "http://localhost:3000"
node server.js
pause
