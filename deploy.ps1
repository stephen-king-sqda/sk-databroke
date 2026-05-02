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
    .\deploy.ps1 -Stop      # stop the daemon (always cleans up)
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

function Get-EffectivePort { if ($Port -gt 0) { $Port } else { 4173 } }

# Returns $true if the given PID's command line looks like our daemon
# (cmd.exe wrapper running npm/vite preview), false otherwise.
function Test-IsOurDaemon {
    param([int]$ProcessId)
    if ($ProcessId -le 0) { return $false }
    try {
        $cli = (Get-CimInstance -ClassName Win32_Process `
                                -Filter "ProcessId=$ProcessId" `
                                -ErrorAction Stop).CommandLine
    } catch { return $false }
    if (-not $cli) { return $false }
    return ($cli -match 'vite' -or $cli -match 'npm\s+run\s+preview' -or $cli -match 'preview\.log')
}

# Resolve the PID currently listening on the daemon's TCP port (or $null).
function Get-PortListenerPid {
    param([int]$ListenPort)
    try {
        $conn = Get-NetTCPConnection -LocalPort $ListenPort -State Listen -ErrorAction Stop |
                Select-Object -First 1
        if ($conn) { return [int]$conn.OwningProcess }
    } catch {
        # netstat fallback for hosts without NetTCPIP module.
        $line = (& netstat.exe -ano) | Where-Object { $_ -match ":$ListenPort\s+.*LISTENING" } | Select-Object -First 1
        if ($line) {
            $parts = ($line -split '\s+') | Where-Object { $_ }
            if ($parts.Count -ge 5) { return [int]$parts[-1] }
        }
    }
    return $null
}

function Get-DaemonProcess {
    if (-not (Test-Path $PidFile)) { return $null }
    $raw = Get-Content $PidFile -ErrorAction SilentlyContinue | Select-Object -First 1
    if (-not $raw) { return $null }
    $procId = 0
    if (-not [int]::TryParse($raw.Trim(), [ref]$procId)) {
        Remove-Item $PidFile -ErrorAction SilentlyContinue
        return $null
    }
    $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
    if (-not $proc) {
        # Stale PID file — clean it up.
        Remove-Item $PidFile -ErrorAction SilentlyContinue
        return $null
    }
    # Verify the process is actually our daemon. PIDs get recycled by Windows;
    # otherwise an unrelated process happening to use our old PID would look
    # like a running daemon forever.
    if (-not (Test-IsOurDaemon -ProcessId $procId)) {
        Remove-Item $PidFile -ErrorAction SilentlyContinue
        return $null
    }
    return $proc
}

function Stop-Daemon {
    $stopped = @()
    $port = Get-EffectivePort

    # 1. Kill the recorded PID (if it's actually ours).
    if (Test-Path $PidFile) {
        $raw = Get-Content $PidFile -ErrorAction SilentlyContinue | Select-Object -First 1
        $procId = 0
        if ($raw -and [int]::TryParse($raw.Trim(), [ref]$procId)) {
            $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
            if ($proc -and (Test-IsOurDaemon -ProcessId $procId)) {
                Write-Host "Killing recorded daemon (PID $procId)..."
                & taskkill.exe /PID $procId /T /F 2>&1 | Out-Null
                $stopped += $procId
            }
        }
    }

    # 2. Belt-and-suspenders: kill anything bound to our port. Catches
    #    orphaned children when the recorded PID is gone but a node.exe is
    #    still listening.
    $portPid = Get-PortListenerPid -ListenPort $port
    if ($portPid -and ($stopped -notcontains $portPid)) {
        Write-Host "Killing process bound to port $port (PID $portPid)..."
        & taskkill.exe /PID $portPid /T /F 2>&1 | Out-Null
        $stopped += $portPid
    }

    # 3. Always remove the PID file.
    Remove-Item $PidFile -ErrorAction SilentlyContinue

    if ($stopped.Count -gt 0) {
        Write-Host ("Stopped {0} process(es): {1}" -f $stopped.Count, ($stopped -join ', '))
    } else {
        Write-Host "No daemon was running."
    }
}

function Show-Status {
    $port = Get-EffectivePort
    $proc = Get-DaemonProcess
    $portPid = Get-PortListenerPid -ListenPort $port

    if ($proc) {
        Write-Host "Daemon RUNNING (PID $($proc.Id))"
        Write-Host "Log: $LogFile"
        Write-Host "URL: http://localhost:$port/"
        if ($portPid -and $portPid -ne $proc.Id) {
            Write-Host "Note: a different PID ($portPid) is bound to port $port — investigate."
        }
    } else {
        Write-Host "Daemon NOT running."
        if ($portPid) {
            Write-Host "Note: port $port is in use by PID $portPid (not tracked by this script)."
            Write-Host "      Use '.\deploy.ps1 -Stop' to free it."
        }
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
    $port = Get-EffectivePort

    # Pre-flight: fail fast if our daemon is genuinely running, OR if
    # something else is squatting on our port.
    $existing = Get-DaemonProcess
    if ($existing) {
        Write-Host "Daemon already running (PID $($existing.Id)). Use '.\deploy.ps1 -Stop' first." -ForegroundColor Yellow
        exit 1
    }
    $portPid = Get-PortListenerPid -ListenPort $port
    if ($portPid) {
        Write-Host "Port $port is already in use by PID $portPid (not our daemon)." -ForegroundColor Yellow
        Write-Host "Run '.\deploy.ps1 -Stop' to free it, or use '-Port <other>'." -ForegroundColor Yellow
        exit 1
    }

    Write-Host "==> Building production bundle"
    & npm run build
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

    Write-Host "==> Starting preview server in background"
    $extra = (Get-ServerArgs) -join ' '
    # cmd /c lets us redirect stdout+stderr to one file. cmd.exe stays alive
    # until npm exits; killing it with taskkill /T also kills the children.
    $cmdLine = "npm run preview -- $extra > `"$LogFile`" 2>&1"
    $proc = Start-Process -FilePath 'cmd.exe' `
        -ArgumentList '/c', $cmdLine `
        -WindowStyle Hidden `
        -PassThru
    [System.IO.File]::WriteAllText($PidFile, "$($proc.Id)")
    Start-Sleep -Seconds 3

    if (Get-DaemonProcess) {
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
