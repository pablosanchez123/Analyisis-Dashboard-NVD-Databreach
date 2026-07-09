import sqlite3
from datetime import datetime

import pytest

from ingestion import db_writer
from ingestion.forecasting import build_quarterly_critical_counts, run_forecast


@pytest.fixture
def conn():
    c = sqlite3.connect(":memory:")
    db_writer.init_schema(c)
    yield c
    c.close()


def _insert_cve(conn, cve_id, published_date, severity="CRITICAL", version="v31"):
    conn.execute(
        "INSERT INTO cves (cve_id, published_date, last_modified_date, cvss_version, cvss_severity, ingested_at) "
        "VALUES (?, ?, ?, ?, ?, ?)",
        (cve_id, published_date, published_date, version, severity, "2026-01-01"),
    )


def _seed_quarters(conn):
    # 6 full quarters of CRITICAL history (2024-Q1 .. 2025-Q2), growing trend,
    # plus a partial "current" quarter (2025-Q3) that must be excluded from training.
    quarter_dates = [
        ("2024-01-15", 5),
        ("2024-04-15", 8),
        ("2024-07-15", 10),
        ("2024-10-15", 12),
        ("2025-01-15", 15),
        ("2025-04-15", 18),
        ("2025-07-15", 3),  # in-progress quarter, partial data only
    ]
    i = 0
    for date, count in quarter_dates:
        for _ in range(count):
            _insert_cve(conn, f"CVE-TEST-{i:04d}", f"{date}T00:00:00.000")
            i += 1
    conn.commit()


def test_build_quarterly_critical_counts_excludes_non_critical(conn):
    _insert_cve(conn, "CVE-A", "2024-01-01T00:00:00.000", severity="CRITICAL", version="v31")
    _insert_cve(conn, "CVE-B", "2024-01-02T00:00:00.000", severity="HIGH", version="v31")
    _insert_cve(conn, "CVE-C", "2024-01-03T00:00:00.000", severity="CRITICAL", version="v2")  # v2 has no CRITICAL bucket in practice, but filtered by version anyway
    conn.commit()

    df = build_quarterly_critical_counts(conn)

    assert len(df) == 1
    assert df.iloc[0]["y"] == 1


def test_run_forecast_writes_history_and_future_rows(conn):
    _seed_quarters(conn)
    now = datetime(2025, 8, 15)

    rows_written = run_forecast(conn, now=now)

    rows = conn.execute(
        "SELECT quarter, is_history, in_progress, actual, predicted, lower, upper FROM forecast_results ORDER BY quarter"
    ).fetchall()

    assert rows_written == len(rows)

    history_rows = [r for r in rows if r[1] == 1]
    forecast_rows = [r for r in rows if r[1] == 0]

    # 6 full history quarters + 1 in-progress quarter
    assert len(history_rows) == 7
    assert len(forecast_rows) == 4

    in_progress = [r for r in rows if r[2] == 1]
    assert len(in_progress) == 1
    assert in_progress[0][0] == "2025-Q3"
    assert in_progress[0][3] == 3  # actual count for the partial quarter

    for quarter, is_history, in_progress_flag, actual, predicted, lower, upper in forecast_rows:
        assert predicted is not None and predicted >= 0
        assert lower is not None and lower >= 0
        assert upper is not None and upper >= lower


def test_run_forecast_raises_with_insufficient_history(conn):
    _insert_cve(conn, "CVE-ONLY", "2025-07-15T00:00:00.000")
    conn.commit()

    with pytest.raises(RuntimeError, match="Not enough quarterly history"):
        run_forecast(conn, now=datetime(2025, 8, 1))
