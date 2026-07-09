"""Prophet-based quarterly forecast of CRITICAL CVEs.

Runs as part of the ingestion pipeline (backfill/incremental), never at
request time — writes precomputed rows into forecast_results so the API
endpoint is a plain table read with no Prophet dependency in the request path.
"""
import sqlite3
from datetime import datetime, timezone

import pandas as pd
from prophet import Prophet

# "Critical" is defined strictly as CVSS v3.x/v4.0 CRITICAL — v2 has no CRITICAL bucket.
CRITICAL_VERSIONS = ("v31", "v30", "v40")
FORECAST_PERIODS = 4  # quarters
MIN_HISTORY_QUARTERS = 4


def _quarter_label(ts: pd.Timestamp) -> str:
    return f"{ts.year}-Q{(ts.month - 1) // 3 + 1}"


def _current_quarter_start(now: datetime) -> pd.Timestamp:
    q_month = ((now.month - 1) // 3) * 3 + 1
    return pd.Timestamp(year=now.year, month=q_month, day=1)


def build_quarterly_critical_counts(conn: sqlite3.Connection) -> pd.DataFrame:
    """Quarterly counts of CVSS v3.x/v4.0 CRITICAL CVEs as a Prophet-ready ds/y frame."""
    placeholders = ", ".join("?" for _ in CRITICAL_VERSIONS)
    rows = conn.execute(
        f"""
        SELECT published_date FROM cves
        WHERE cvss_severity = 'CRITICAL' AND cvss_version IN ({placeholders})
        """,
        CRITICAL_VERSIONS,
    ).fetchall()

    if not rows:
        return pd.DataFrame(columns=["ds", "y"])

    dates = pd.to_datetime([r[0] for r in rows])
    quarter_starts = dates.to_period("Q").to_timestamp()
    counts = quarter_starts.value_counts().sort_index()
    return counts.rename_axis("ds").reset_index(name="y")


def run_forecast(conn: sqlite3.Connection, now: datetime | None = None) -> int:
    """Fit Prophet on history, write history+forecast rows into forecast_results.

    Returns the number of rows written. Raises if there isn't enough
    quarterly history yet (expected during very early development, never
    in a real backfill covering 2019+).
    """
    now = now or datetime.now(timezone.utc).replace(tzinfo=None)
    df = build_quarterly_critical_counts(conn)
    current_q_start = _current_quarter_start(now)

    history_df = df[df["ds"] < current_q_start].reset_index(drop=True)
    in_progress_row = df[df["ds"] == current_q_start]

    if len(history_df) < MIN_HISTORY_QUARTERS:
        raise RuntimeError(
            f"Not enough quarterly history to forecast: {len(history_df)} quarters "
            f"(need >= {MIN_HISTORY_QUARTERS})"
        )

    model = Prophet(yearly_seasonality=True, weekly_seasonality=False, daily_seasonality=False)
    model.fit(history_df)

    # Prophet's future dataframe starts right after the last *training* point.
    # If that's the in-progress quarter (the normal case — it already has a
    # partial actual count above), request one extra period and drop that
    # row so the forecast only covers quarters strictly after it.
    future = model.make_future_dataframe(periods=FORECAST_PERIODS + 1, freq="QS", include_history=False)
    forecast = model.predict(future)
    if not forecast.empty and forecast.iloc[0]["ds"] == current_q_start:
        forecast = forecast.iloc[1:]
    else:
        forecast = forecast.iloc[:-1]
    forecast = forecast.reset_index(drop=True)
    forecast["yhat"] = forecast["yhat"].clip(lower=0)
    forecast["yhat_lower"] = forecast["yhat_lower"].clip(lower=0)

    computed_at = now.isoformat()
    conn.execute("DELETE FROM forecast_results")

    rows_written = 0
    for _, row in history_df.iterrows():
        conn.execute(
            "INSERT INTO forecast_results "
            "(quarter, is_history, in_progress, actual, predicted, lower, upper, computed_at) "
            "VALUES (?, 1, 0, ?, NULL, NULL, NULL, ?)",
            (_quarter_label(row["ds"]), int(row["y"]), computed_at),
        )
        rows_written += 1

    if not in_progress_row.empty:
        y = int(in_progress_row.iloc[0]["y"])
        conn.execute(
            "INSERT INTO forecast_results "
            "(quarter, is_history, in_progress, actual, predicted, lower, upper, computed_at) "
            "VALUES (?, 1, 1, ?, NULL, NULL, NULL, ?)",
            (_quarter_label(current_q_start), y, computed_at),
        )
        rows_written += 1

    for _, row in forecast.iterrows():
        conn.execute(
            "INSERT INTO forecast_results "
            "(quarter, is_history, in_progress, actual, predicted, lower, upper, computed_at) "
            "VALUES (?, 0, 0, NULL, ?, ?, ?, ?)",
            (_quarter_label(row["ds"]), float(row["yhat"]), float(row["yhat_lower"]), float(row["yhat_upper"]), computed_at),
        )
        rows_written += 1

    conn.commit()
    return rows_written


if __name__ == "__main__":
    import sys
    from pathlib import Path

    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
    from ingestion.db_writer import connect

    db_path = sys.argv[1] if len(sys.argv) > 1 else str(
        Path(__file__).resolve().parent.parent.parent / "data" / "nvd.sqlite"
    )
    conn = connect(db_path)
    count = run_forecast(conn)
    print(f"Wrote {count} forecast_results rows to {db_path}")
