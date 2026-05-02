#Requires -Version 5.0
<#
.SYNOPSIS
    Bella Vista Weather - Windows deploy script.

.DESCRIPTION
    Install dependencies, build, and run the React weather app. Daemon mode
    runs the server detached from the current terminal so closing the window
    does not stop it.

.EXAMPLE
    .\deploy.ps1            # build + foreground preview on :4173
    .\deploy.ps1 -Daemon    # build + background preview, survives terminal close
    .\deploy.ps1 -Stop      # stop the daemon
    .\deploy.ps1 -Status    # is the daemon running?
    .\deploy.ps1 -Logs      # tail the daemon log
    .\deploy.ps1 -Dev       # foreground dev server with HMR
    .\deploy.ps1 -Build     # build only
    .\deploy.ps1 -LanHost   # bind to 0.0.0.0 (other devices on your LAN can connect)
    .\deploy.ps1 -Port 8080 # custom port
#>
[CmdletBinding()]
param(
    [switch]$Dev,
    [switch]$Build,
    [switch]$Daemon,
    [switch]$Stop,
    [switch]$Status,
    [switch]$Logs,
    [switch]$LanHost,
    [int]$Port = 0
)

$ErrorActionPreference = 'Stop'
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $ScriptDir

$PidFile = Join-Path $ScriptDir 'preview.pid'
$LogFile = Join-Path $ScriptDir 'preview.log'

function Get-DaemonProcess {
    if (-not (Test-Path $PidFile)) { return $null }
    $raw = Get-Content $PidFile -ErrorAction SilentlyContinue | Select-Object -First 1
    if (-not $raw) { return $null }
    $procId = 0
    if (-not [int]::TryParse($raw.Trim(), [ref]$procId)) { return $null }
    return Get-Process -Id $procId -ErrorAction SilentlyContinue
}

function Stop-Daemon {
    $proc = Get-DaemonProcess
    if ($proc) {
        Write-Host "Stopping daemon (PID $($proc.Id))..."
        & taskkill.exe /PID $proc.Id /T /F | Out-Null
        Start-Sleep -Milliseconds 500
        Remove-Item $PidFile -ErrorAction SilentlyContinue
        Write-Host "Stopped."
    } else {
        Write-Host "No daemon running."
        Remove-Item $PidFile -ErrorAction SilentlyContinue
    }
}

function Show-Status {
    $proc = Get-DaemonProcess
    if ($proc) {
        Write-Host "Daemon RUNNING (PID $($proc.Id))"
        Write-Host "Log: $LogFile"
        Write-Host "URL: http://localhost:$(if ($Port -gt 0) { $Port } else { 4173 })/"
    } else {
        Write-Host "Daemon NOT running."
    }
}

function Show-Logs {
    if (-not (Test-Path $LogFile)) {
        Write-Host "No log file at $LogFile"
        exit 1
    }
    Get-Content $LogFile -Wait -Tail 50
}

function Test-Prereqs {
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        Write-Host "ERROR: Node.js is not installed. Install Node 18+ from https://nodejs.org" -ForegroundColor Red
        exit 1
    }
    $nodeVersion = (& node --version) -replace '^v',''
    $major = [int]($nodeVersion -split '\.')[0]
    if ($major -lt 18) {
        Write-Host "ERROR: Node 18+ required (found v$nodeVersion)." -ForegroundColor Red
        exit 1
    }
    if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
        Write-Host "ERROR: npm is not installed." -ForegroundColor Red
        exit 1
    }
    Write-Host "==> Node v$nodeVersion / npm $(& npm --version)"
}

function Install-Deps {
    $needsInstall = $false
    if (-not (Test-Path 'node_modules')) {
        $needsInstall = $true
    } elseif (Test-Path 'package-lock.json') {
        $lockTime = (Get-Item 'package-lock.json').LastWriteTime
        $modulesTime = (Get-Item 'node_modules').LastWriteTime
        if ($lockTime -gt $modulesTime) { $needsInstall = $true }
    }
    if ($needsInstall) {
        Write-Host "==> Installing dependencies"
        & npm install
        if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    } else {
        Write-Host "==> Dependencies already installed (skipping)"
    }
}

function Get-ServerArgs {
    $a = @()
    if ($LanHost) { $a += '--host' }
    if ($Port -gt 0) { $a += '--port'; $a += "$Port" }
    return $a
}

# --- Mode dispatch -----------------------------------------------------------

if ($Stop)   { Stop-Daemon;  exit }
if ($Status) { Show-Status;  exit }
if ($Logs)   { Show-Logs;    exit }

Test-Prereqs
Install-Deps

if ($Build) {
    Write-Host "==> Building production bundle"
    & npm run build
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    Write-Host ""
    Write-Host "==> Build complete. Output in .\dist"
    exit
}

if ($Dev) {
    Write-Host "==> Starting dev server (Ctrl+C to stop)"
    $extra = Get-ServerArgs
    & npm run dev -- @extra
    exit
}

if ($Daemon) {
    if (Get-DaemonProcess) {
        Write-Host "Daemon already running (PID $((Get-DaemonProcess).Id)). Use '.\deploy.ps1 -Stop' first." -ForegroundColor Yellow
        exit 1
    }
    Write-Host "==> Building production bundle"
    & npm run build
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

    Write-Host "==> Starting preview server in background"
    $extra = (Get-ServerArgs) -join ' '
    # Use cmd /c so we can redirect both stdout and stderr to one file. The
    # cmd.exe wrapper stays alive until npm exits; killing it via taskkill /T
    # also kills the npm/node children.
    $cmdLine = "npm run preview -- $extra > `"$LogFile`" 2>&1"
    $proc = Start-Process -FilePath 'cmd.exe' `
        -ArgumentList '/c', $cmdLine `
        -WindowStyle Hidden `
        -PassThru
    [System.IO.File]::WriteAllText($PidFile, "$($proc.Id)")
    Start-Sleep -Seconds 3

    if (Get-DaemonProcess) {
        $port = if ($Port -gt 0) { $Port } else { 4173 }
        Write-Host ""
        Write-Host "    PID:    $($proc.Id)"
        Write-Host "    Log:    $LogFile"
        Write-Host "    URL:    http://localhost:$port/"
        Write-Host ""
        Write-Host "    Stop:   .\deploy.ps1 -Stop"
        Write-Host "    Status: .\deploy.ps1 -Status"
        Write-Host "    Logs:   .\deploy.ps1 -Logs"
    } else {
        Write-Host "ERROR: daemon failed to start. See $LogFile" -ForegroundColor Red
        if (Test-Path $LogFile) { Get-Content $LogFile | Select-Object -Last 20 }
        Remove-Item $PidFile -ErrorAction SilentlyContinue
        exit 1
    }
    exit
}

# Default: foreground preview
Write-Host "==> Building production bundle"
& npm run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Host "==> Starting preview server (Ctrl+C to stop)"
Write-Host "    Tip: run '.\deploy.ps1 -Daemon' to keep it running after closing this window."
$extra = Get-ServerArgs
& npm run preview -- @extra
