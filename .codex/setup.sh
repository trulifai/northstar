#!/usr/bin/env bash
set -euo pipefail
cloud_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$cloud_root"
export CI=true
export NEXT_TELEMETRY_DISABLED=1
npm ci
npm run db:generate
(cd frontend && npm ci)
printf "%s\n" "Setup complete. Run bash .codex/check.sh. Services are started separately."
