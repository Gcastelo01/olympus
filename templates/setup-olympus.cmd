@echo off
rem Olympus Windows bootstrap launcher. Options: -Project, -Source, -SkipRuntimes, -Login.
setlocal
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup-olympus.ps1" %*
set "EXIT=%ERRORLEVEL%"
if not "%EXIT%"=="0" echo setup-olympus failed with exit code %EXIT%.
if not "%OLYMPUS_NO_PAUSE%"=="1" pause
exit /b %EXIT%
