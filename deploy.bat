@echo off
REM Bella Vista Weather - Windows double-click launcher.
REM
REM   deploy.bat            -> start daemon (localhost only) + open browser
REM   deploy.bat lan        -> start daemon bound to 0.0.0.0 so other devices
REM                            on your home network can connect
REM   deploy.bat stop       -> stop daemon
REM   deploy.bat status     -> show daemon status
REM   deploy.bat logs       -> tail the daemon log
REM   deploy.bat dev        -> run the dev server in this window (HMR)

setlocal
cd /d "%~dp0"

if /i "%1"=="stop"   goto :stop
if /i "%1"=="status" goto :status
if /i "%1"=="logs"   goto :logs
if /i "%1"=="dev"    goto :dev
if /i "%1"=="lan"    goto :lan

REM Default: start in daemon mode (localhost only)
powershell.exe -ExecutionPolicy Bypass -NoProfile -File "%~dp0deploy.ps1" -Daemon
if errorlevel 1 (
    echo.
    echo Startup failed. See preview.log for details.
    pause
    exit /b 1
)

echo.
echo Opening http://localhost:4173/ ...
start "" "http://localhost:4173/"
echo.
echo You can close this window. The server keeps running.
echo To stop later:    deploy.bat stop
echo To check:         deploy.bat status
echo To enable LAN:    deploy.bat stop ^&^& deploy.bat lan
echo.
pause
exit /b 0

:lan
powershell.exe -ExecutionPolicy Bypass -NoProfile -File "%~dp0deploy.ps1" -Daemon -LanHost
if errorlevel 1 (
    echo.
    echo Startup failed. See preview.log for details.
    pause
    exit /b 1
)
echo.
echo Opening http://localhost:4173/ ...
start "" "http://localhost:4173/"
echo.
echo IMPORTANT: If Windows Firewall pops up, click ALLOW (at least for Private networks).
echo            Other devices need to be on the SAME Wi-Fi / network.
echo.
pause
exit /b 0

:stop
powershell.exe -ExecutionPolicy Bypass -NoProfile -File "%~dp0deploy.ps1" -Stop
pause
exit /b 0

:status
powershell.exe -ExecutionPolicy Bypass -NoProfile -File "%~dp0deploy.ps1" -Status
pause
exit /b 0

:logs
powershell.exe -ExecutionPolicy Bypass -NoProfile -File "%~dp0deploy.ps1" -Logs
exit /b 0

:dev
powershell.exe -ExecutionPolicy Bypass -NoProfile -File "%~dp0deploy.ps1" -Dev
exit /b 0
