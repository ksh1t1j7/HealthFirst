#!/bin/zsh
set -e

ROOT="/Users/kshitijyadav/Desktop/healthfirst-project"

echo "Starting HealthFirst backend with project venv..."
cd "$ROOT"
"$ROOT/.venv/bin/python" -m uvicorn ml.local_api:app --host 127.0.0.1 --port 8000
