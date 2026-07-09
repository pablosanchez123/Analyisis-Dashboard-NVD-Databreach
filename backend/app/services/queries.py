"""Parameterized SQL for each dashboard metric. Plain sqlite3, no ORM."""
import sqlite3

from app.core.cwe_lookup import CWE_PLACEHOLDERS, cwe_friendly_name

_QUARTER_EXPR = (
    "strftime('%Y', published_date) || '-Q' || "
    "((CAST(strftime('%m', published_date) AS INTEGER) - 1) / 3 + 1)"
)
_MONTH_EXPR = "strftime('%Y-%m', published_date)"

PATCH_TIME_CAVEAT = (
    "Approximated as days between publication and last modification, filtered to "
    "CVEs with a Patch or Vendor Advisory reference. Not a verified patch-release date, "
    "since last_modified changes on any metadata edit."
)

FORECAST_CAVEAT = (
    "Forecast generated with Facebook Prophet on quarterly counts of CVSS v3.x/v4.0 "
    "CRITICAL-severity CVEs from Q1 2019 onward. Confidence intervals widen with forecast "
    "horizon — treat as directional trend, not a precise prediction. Published CVE volume "
    "reflects reporting/disclosure practices, not necessarily real-world vulnerability incidence."
)


def severity_trend(conn: sqlite3.Connection, granularity: str = "quarter") -> list[dict]:
    period_expr = _QUARTER_EXPR if granularity == "quarter" else _MONTH_EXPR
    rows = conn.execute(
        f"""
        SELECT
            {period_expr} AS period,
            SUM(CASE WHEN cvss_severity = 'CRITICAL' THEN 1 ELSE 0 END) AS CRITICAL,
            SUM(CASE WHEN cvss_severity = 'HIGH' THEN 1 ELSE 0 END) AS HIGH,
            SUM(CASE WHEN cvss_severity = 'MEDIUM' THEN 1 ELSE 0 END) AS MEDIUM,
            SUM(CASE WHEN cvss_severity = 'LOW' THEN 1 ELSE 0 END) AS LOW
        FROM cves
        WHERE published_date IS NOT NULL
        GROUP BY period
        ORDER BY period
        """
    ).fetchall()
    columns = ["period", "CRITICAL", "HIGH", "MEDIUM", "LOW"]
    return [dict(zip(columns, row)) for row in rows]


def top_vendors(conn: sqlite3.Connection, limit: int = 10) -> list[dict]:
    rows = conn.execute(
        """
        SELECT vendor, product, COUNT(DISTINCT cve_id) AS cve_count
        FROM cve_products
        GROUP BY vendor, product
        ORDER BY cve_count DESC
        LIMIT ?
        """,
        (limit,),
    ).fetchall()
    return [{"vendor": v, "product": p, "cve_count": c} for v, p, c in rows]


def patch_time(conn: sqlite3.Connection) -> dict:
    total_cves = conn.execute("SELECT COUNT(*) FROM cves").fetchone()[0]

    row = conn.execute(
        """
        SELECT
            AVG(julianday(last_modified_date) - julianday(published_date)) AS avg_days,
            COUNT(*) AS sample_size
        FROM cves
        WHERE has_patch_reference = 1
        """
    ).fetchone()
    avg_days, sample_size = row

    coverage_pct = (100.0 * sample_size / total_cves) if total_cves else 0.0

    return {
        "avg_days_to_patch_reference": round(avg_days, 1) if avg_days is not None else None,
        "coverage_pct": round(coverage_pct, 1),
        "sample_size": sample_size,
        "total_cves": total_cves,
        "caveat": PATCH_TIME_CAVEAT,
    }


def cwe_distribution(conn: sqlite3.Connection, limit: int = 10) -> list[dict]:
    placeholders_sql = ", ".join("?" for _ in CWE_PLACEHOLDERS)
    rows = conn.execute(
        f"""
        SELECT cwe_id, COUNT(DISTINCT cve_id) AS cve_count
        FROM cve_weaknesses
        WHERE cwe_id NOT IN ({placeholders_sql})
        GROUP BY cwe_id
        ORDER BY cve_count DESC
        LIMIT ?
        """,
        (*CWE_PLACEHOLDERS, limit),
    ).fetchall()
    return [{"cwe_id": cwe_id, "name": cwe_friendly_name(cwe_id), "cve_count": count} for cwe_id, count in rows]


def forecast_data(conn: sqlite3.Connection) -> list[dict]:
    rows = conn.execute(
        """
        SELECT quarter, is_history, in_progress, actual, predicted, lower, upper
        FROM forecast_results
        ORDER BY quarter
        """
    ).fetchall()
    return [
        {
            "quarter": quarter,
            "is_history": bool(is_history),
            "in_progress": bool(in_progress),
            "actual": actual,
            "predicted": predicted,
            "lower": lower,
            "upper": upper,
        }
        for quarter, is_history, in_progress, actual, predicted, lower, upper in rows
    ]


def meta(conn: sqlite3.Connection) -> dict:
    total_cves, date_min, date_max = conn.execute(
        "SELECT COUNT(*), MIN(published_date), MAX(published_date) FROM cves"
    ).fetchone()

    last_ingested = conn.execute(
        "SELECT value FROM ingestion_meta WHERE key = 'last_ingested_lastmodified'"
    ).fetchone()
    backfill_completed = conn.execute(
        "SELECT value FROM ingestion_meta WHERE key = 'backfill_completed_at'"
    ).fetchone()

    return {
        "total_cves": total_cves,
        "date_range_start": date_min,
        "date_range_end": date_max,
        "last_ingested_lastmodified": last_ingested[0] if last_ingested else None,
        "backfill_completed_at": backfill_completed[0] if backfill_completed else None,
    }
