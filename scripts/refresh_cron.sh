#!/usr/bin/env bash
# Weekly incremental refresh, invoked by deploy/systemd/nvd-refresh.timer.
# Runs the incremental ingestion + forecast recompute inside the already-running
# backend container, against the persistent /data volume shared with docker-compose.
set -euo pipefail
cd "$(dirname "$0")/.."

docker compose exec -T backend python -m ingestion.incremental --db /data/nvd.sqlite
