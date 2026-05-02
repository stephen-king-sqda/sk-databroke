#!/usr/bin/env bash
# Bella Vista Weather - one-shot deploy script
#
# Usage:
#   ./deploy.sh             Install deps, build, and serve a production preview
#   ./deploy.sh --dev       Install deps and start the Vite dev server (HMR)
#   ./deploy.sh --build     Install deps and build only (no server)
#   ./deploy.sh --host      Bind the server to 0.0.0.0 so other devices on
#                           your LAN can reach it
#   ./deploy.sh --port 4173 Override the port
#
# Requires: Node 18+ and npm. Install from https://nodejs.org if missing.

set -euo pipefail

MODE="preview"
HOST_FLAG=""
PORT=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dev)    MODE="dev"; shift ;;
    --build)  MODE="build"; shift ;;
    --host)   HOST_FLAG="--host"; shift ;;
    --port)   PORT="$2"; shift 2 ;;
    -h|--help)
      sed -n '2,12p' "$0" | sed 's/^# \{0,1\}//'
      exit 0 ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 1 ;;
  esac
done

cd "$(dirname "$0")"

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

case "$MODE" in
  dev)
    echo "==> Starting dev server (Ctrl+C to stop)"
    CMD=(npm run dev --)
    [[ -n "$HOST_FLAG" ]] && CMD+=("$HOST_FLAG")
    [[ -n "$PORT" ]] && CMD+=(--port "$PORT")
    exec "${CMD[@]}"
    ;;

  build)
    echo "==> Building production bundle"
    npm run build
    echo
    echo "==> Build complete. Output in ./dist"
    echo "    Serve it with any static file server, e.g.:"
    echo "      npx serve dist"
    ;;

  preview)
    echo "==> Building production bundle"
    npm run build
    echo
    echo "==> Starting preview server (Ctrl+C to stop)"
    CMD=(npm run preview --)
    [[ -n "$HOST_FLAG" ]] && CMD+=("$HOST_FLAG")
    [[ -n "$PORT" ]] && CMD+=(--port "$PORT")
    exec "${CMD[@]}"
    ;;
esac
