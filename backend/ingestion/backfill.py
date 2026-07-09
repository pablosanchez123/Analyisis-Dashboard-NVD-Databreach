"""CLI: full historical backfill of NVD CVE data (default: 2019-01-01 -> now).

Usage:
    python -m ingestion.backfill
    python -m ingestion.backfill --start-date 2019-01-01 --db ../data/nvd.sqlite
"""
import argparse
import os
import sys
import time
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from ingestion import db_writer
from ingestion.nvd_client import NvdClient, utcnow
from ingestion.parse import parse_cve

DEFAULT_START = datetime(2019, 1, 1)
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
DEFAULT_DB_PATH = str(PROJECT_ROOT / "data" / "nvd.sqlite")
ENV_PATH = PROJECT_ROOT / ".env"


def load_api_key() -> str:
    key = os.environ.get("NVD_API_KEY")
    if key:
        return key
    if ENV_PATH.exists():
        for line in ENV_PATH.read_text().splitlines():
            if line.startswith("NVD_API_KEY="):
                return line.split("=", 1)[1].strip()
    raise RuntimeError("NVD_API_KEY not found in environment or .env file")


def run_backfill(db_path: str, start: datetime, end: datetime) -> int:
    conn = db_writer.connect(db_path)
    db_writer.init_schema(conn)

    client = NvdClient(api_key=load_api_key())

    count = 0
    t0 = time.monotonic()
    max_last_modified = None

    for item in client.fetch_range(start, end, date_field="pub"):
        parsed = parse_cve(item)
        db_writer.upsert_cve(conn, parsed, ingested_at=utcnow().isoformat())
        count += 1

        if max_last_modified is None or parsed["last_modified_date"] > max_last_modified:
            max_last_modified = parsed["last_modified_date"]

        if count % 500 == 0:
            conn.commit()
            elapsed = time.monotonic() - t0
            print(f"  ...{count} CVEs ingested ({elapsed:.0f}s elapsed)", flush=True)

    conn.commit()

    if max_last_modified:
        db_writer.set_meta(conn, "last_ingested_lastmodified", max_last_modified)
    db_writer.set_meta(conn, "backfill_completed_at", utcnow().isoformat())
    db_writer.set_meta(conn, "backfill_start_date", start.isoformat())
    conn.commit()
    conn.close()

    elapsed = time.monotonic() - t0
    print(f"Backfill complete: {count} CVEs in {elapsed:.0f}s", flush=True)
    return count


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--start-date", default=DEFAULT_START.strftime("%Y-%m-%d"))
    parser.add_argument("--end-date", default=None, help="Defaults to now (UTC)")
    parser.add_argument("--db", default=DEFAULT_DB_PATH)
    args = parser.parse_args()

    start = datetime.strptime(args.start_date, "%Y-%m-%d")
    end = datetime.strptime(args.end_date, "%Y-%m-%d") if args.end_date else utcnow()

    Path(args.db).parent.mkdir(parents=True, exist_ok=True)
    print(f"Starting backfill from {start.date()} to {end.date()} into {args.db}", flush=True)
    run_backfill(args.db, start, end)
