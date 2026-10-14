@echo off
where node.exe >nul 2>&1
if errorlevel 1 (
  echo Node.js não foi encontrado no PATH do processo do Chrome. 1>&2
  exit /b 1
)

node.exe "%~dp0..\src\host.mjs" %*
