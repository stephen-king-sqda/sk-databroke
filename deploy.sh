#!/usr/bin/env bash
# Bella Vista Weather - one-shot deploy script
#
# Usage:
#   ./deploy.sh             Install + build + foreground production preview
#   ./deploy.sh --dev       Install + dev server with HMR (foreground)
#   ./deploy.sh --build     Install + build only (no server)
#   ./deploy.sh --daemon    Install + build + run preview in the BACKGROUND
#                           (survives closing the terminal). Logs to
#                           ./preview.log, PID in ./preview.pid.
#   ./deploy.sh --stop      Stop the daemon
#   ./deploy.sh --status    Show whether the daemon is running
#   ./deploy.sh --logs      Tail the daemon log
#   ./deploy.sh --host      Bind the server to 0.0.0.0 (LAN access)
#   ./deploy.sh --port 4173 Override the port
#
# Requires: Node 18+ and npm. Install from https://nodejs.org if missing.

set -euo pipefail

cd "$(dirname "$0")"

PID_FILE="./preview.pid"
LOG_FILE="./preview.log"

MODE="preview"
HOST_FLAG=""
PORT=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dev)     MODE="dev"; shift ;;
    --build)   MODE="build"; shift ;;
    --daemon)  MODE="daemon"; shift ;;
    --stop)    MODE="stop"; shift ;;
    --status)  MODE="status"; shift ;;
    --logs)    MODE="logs"; shift ;;
    --host)    HOST_FLAG="--host"; shift ;;
    --port)    PORT="$2"; shift 2 ;;
    -h|--help)
      sed -n '2,18p' "$0" | sed 's/^# \{0,1\}//'
      exit 0 ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 1 ;;
  esac
done

# --- Daemon control commands (don't need Node) -------------------------------

daemon_running() {
  [[ -f "$PID_FILE" ]] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null
}

case "$MODE" in
  stop)
    if daemon_running; then
      PID=$(cat "$PID_FILE")
      kill "$PID"
      sleep 1
      kill -9 "$PID" 2>/dev/null || true
      rm -f "$PID_FILE"
      echo "Stopped daemon (PID $PID)"
    else
      echo "No daemon running."
      rm -f "$PID_FILE"
    fi
    exit 0 ;;
  status)
    if daemon_running; then
      echo "Daemon RUNNING (PID $(cat "$PID_FILE"))"
      echo "Log: $LOG_FILE"
    else
      echo "Daemon NOT running."
    fi
    exit 0 ;;
  logs)
    [[ -f "$LOG_FILE" ]] || { echo "No log file at $LOG_FILE"; exit 1; }
    exec tail -f "$LOG_FILE" ;;
esac

# --- Sanity checks -----------------------------------------------------------

if ! command -v node >/dev/null 2>&1; then
  echo "ERROR: Node.js is not installed. Install Node 18+ from https://nodejs.org" >&2
  exit 1
fi

NODE_MAJOR=$(node -p "process.versions.node.split('.')[0]")
if [[ "$NODE_MAJOR" -lt 18 ]]; then
  echo "ERROR: Node 18+ required (found $(node --version))." >&2
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "ERROR: npm is not installed." >&2
  exit 1
fi

echo "==> Node $(node --version) / npm $(npm --version)"

# --- Install deps ------------------------------------------------------------

if [[ ! -d node_modules ]] || [[ package-lock.json -nt node_modules ]]; then
  echo "==> Installing dependencies"
  npm install
else
  echo "==> Dependencies already installed (skipping)"
fi

# --- Run requested mode ------------------------------------------------------

build_args() {
  local cmd=("$@")
  [[ -n "$HOST_FLAG" ]] && cmd+=("$HOST_FLAG")
  [[ -n "$PORT" ]] && cmd+=(--port "$PORT")
  printf '%s\n' "${cmd[@]}"
}

case "$MODE" in
  dev)
    echo "==> Starting dev server (Ctrl+C to stop)"
    mapfile -t CMD < <(build_args npm run dev --)
    exec "${CMD[@]}"
    ;;

  build)
    echo "==> Building production bundle"
    npm run build
    echo
    echo "==> Build complete. Output in ./dist"
    ;;

  preview)
    echo "==> Building production bundle"
    npm run build
    echo
    echo "==> Starting preview server (Ctrl+C to stop)"
    echo "    Tip: run './deploy.sh --daemon' to keep it running after you close this terminal."
    mapfile -t CMD < <(build_args npm run preview --)
    exec "${CMD[@]}"
    ;;

  daemon)
    if daemon_running; then
      echo "Daemon already running (PID $(cat "$PID_FILE")). Use './deploy.sh --stop' first."
      exit 1
    fi
    echo "==> Building production bundle"
    npm run build
    echo "==> Starting preview server in background"
    mapfile -t CMD < <(build_args npm run preview --)
    # nohup + setsid + & detaches fully from this shell so it survives logout.
    nohup setsid "${CMD[@]}" > "$LOG_FILE" 2>&1 < /dev/null &
    PID=$!
    echo "$PID" > "$PID_FILE"
    sleep 2
    if daemon_running; then
      echo
      echo "    PID:  $PID"
      echo "    Log:  $LOG_FILE"
      echo "    URL:  $(grep -m1 -oE 'http://[^ ]+' "$LOG_FILE" 2>/dev/null || echo 'http://localhost:4173/')"
      echo
      echo "    Stop:    ./deploy.sh --stop"
      echo "    Status:  ./deploy.sh --status"
      echo "    Logs:    ./deploy.sh --logs"
    else
      echo "ERROR: daemon failed to start. See $LOG_FILE" >&2
      rm -f "$PID_FILE"
      exit 1
    fi
    ;;
esac
