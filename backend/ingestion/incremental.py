"""CLI: incremental NVD update via the lastModified watermark.

Queries only CVEs modified since the last successful run (stored in
ingestion_meta), upserts them, then recomputes the Prophet forecast so
forecast_results stays in sync with the freshest data. Intended to run on a
schedule (systemd timer / cron) against the live database — see
deploy/systemd/nvd-refresh.{service,timer}.

Usage:
    python -m ingestion.incremental
    python -m ingestion.incremental --db ../data/nvd.sqlite
"""
import argparse
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from ingestion import db_writer
from ingestion.backfill import load_api_key
from ingestion.forecasting import run_forecast
from ingestion.nvd_client import NvdClient, utcnow
from ingestion.parse import parse_cve

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
DEFAULT_DB_PATH = str(PROJECT_ROOT / "data" / "nvd.sqlite")
WATERMARK_KEY = "last_ingested_lastmodified"


def run_incremental(db_path: str) -> int:
    conn = db_writer.connect(db_path)
    db_writer.init_schema(conn)

    watermark = db_writer.get_meta(conn, WATERMARK_KEY)
    if not watermark:
        raise RuntimeError(
            f"No '{WATERMARK_KEY}' found in ingestion_meta — run backfill.py first to establish a starting point."
        )

    from datetime import datetime

    start = datetime.strptime(watermark[:19], "%Y-%m-%dT%H:%M:%S")
    end = utcnow()

    if start >= end:
        print(f"Watermark ({watermark}) is not before now — nothing to fetch.", flush=True)
        conn.close()
        return 0

    client = NvdClient(api_key=load_api_key())

    count = 0
    t0 = time.monotonic()
    max_last_modified = watermark

    for item in client.fetch_range(start, end, date_field="mod"):
        parsed = parse_cve(item)
        db_writer.upsert_cve(conn, parsed, ingested_at=utcnow().isoformat())
        count += 1

        if parsed["last_modified_date"] and parsed["last_modified_date"] > max_last_modified:
            max_last_modified = parsed["last_modified_date"]

        if count % 200 == 0:
            conn.commit()
            print(f"  ...{count} CVEs updated", flush=True)

    conn.commit()
    db_writer.set_meta(conn, WATERMARK_KEY, max_last_modified)
    db_writer.set_meta(conn, "last_incremental_run_at", utcnow().isoformat())
    conn.commit()

    elapsed = time.monotonic() - t0
    print(f"Incremental update complete: {count} CVEs touched in {elapsed:.1f}s", flush=True)

    print("Recomputing forecast...", flush=True)
    try:
        forecast_rows = run_forecast(conn)
        print(f"Forecast updated: {forecast_rows} rows written.", flush=True)
    except RuntimeError as exc:
        print(f"Skipped forecast recompute: {exc}", flush=True)

    conn.close()
    return count


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--db", default=DEFAULT_DB_PATH)
    args = parser.parse_args()
    run_incremental(args.db)
