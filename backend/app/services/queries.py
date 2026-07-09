"""Parameterized SQL for each dashboard metric. Plain sqlite3, no ORM."""
import sqlite3
from datetime import date, datetime, timedelta, timezone

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


def _date_filter(
    start_date: str | None, end_date: str | None, column: str = "published_date"
) -> tuple[str, list[str]]:
    """Build a ' AND col >= ? AND col <= ?'-style SQL fragment + matching params.

    start_date/end_date are plain 'YYYY-MM-DD' strings; end_date is treated as
    inclusive of the whole day by comparing against the next day's start.
    """
    clauses = []
    params: list[str] = []
    if start_date:
        clauses.append(f"{column} >= ?")
        params.append(start_date)
    if end_date:
        clauses.append(f"{column} < date(?, '+1 day')")
        params.append(end_date)
    return (" AND " + " AND ".join(clauses) if clauses else ""), params


def severity_trend(
    conn: sqlite3.Connection,
    granularity: str = "quarter",
    start_date: str | None = None,
    end_date: str | None = None,
) -> list[dict]:
    period_expr = _QUARTER_EXPR if granularity == "quarter" else _MONTH_EXPR
    date_sql, date_params = _date_filter(start_date, end_date)
    rows = conn.execute(
        f"""
        SELECT
            {period_expr} AS period,
            SUM(CASE WHEN cvss_severity = 'CRITICAL' THEN 1 ELSE 0 END) AS CRITICAL,
            SUM(CASE WHEN cvss_severity = 'HIGH' THEN 1 ELSE 0 END) AS HIGH,
            SUM(CASE WHEN cvss_severity = 'MEDIUM' THEN 1 ELSE 0 END) AS MEDIUM,
            SUM(CASE WHEN cvss_severity = 'LOW' THEN 1 ELSE 0 END) AS LOW
        FROM cves
        WHERE published_date IS NOT NULL{date_sql}
        GROUP BY period
        ORDER BY period
        """,
        date_params,
    ).fetchall()
    columns = ["period", "CRITICAL", "HIGH", "MEDIUM", "LOW"]
    return [dict(zip(columns, row)) for row in rows]


def top_vendors(
    conn: sqlite3.Connection,
    limit: int = 10,
    start_date: str | None = None,
    end_date: str | None = None,
) -> list[dict]:
    date_sql, date_params = _date_filter(start_date, end_date, column="c.published_date")
    rows = conn.execute(
        f"""
        SELECT p.vendor, p.product, COUNT(DISTINCT p.cve_id) AS cve_count
        FROM cve_products p
        JOIN cves c ON c.cve_id = p.cve_id
        WHERE 1=1{date_sql}
        GROUP BY p.vendor, p.product
        ORDER BY cve_count DESC
        LIMIT ?
        """,
        (*date_params, limit),
    ).fetchall()
    return [{"vendor": v, "product": p, "cve_count": c} for v, p, c in rows]


def patch_time(
    conn: sqlite3.Connection,
    start_date: str | None = None,
    end_date: str | None = None,
) -> dict:
    date_sql, date_params = _date_filter(start_date, end_date)

    total_cves = conn.execute(
        f"SELECT COUNT(*) FROM cves WHERE 1=1{date_sql}", date_params
    ).fetchone()[0]

    row = conn.execute(
        f"""
        SELECT
            AVG(julianday(last_modified_date) - julianday(published_date)) AS avg_days,
            COUNT(*) AS sample_size
        FROM cves
        WHERE has_patch_reference = 1{date_sql}
        """,
        date_params,
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


def cwe_distribution(
    conn: sqlite3.Connection,
    limit: int = 10,
    start_date: str | None = None,
    end_date: str | None = None,
) -> list[dict]:
    placeholders_sql = ", ".join("?" for _ in CWE_PLACEHOLDERS)
    date_sql, date_params = _date_filter(start_date, end_date, column="c.published_date")
    rows = conn.execute(
        f"""
        SELECT w.cwe_id, COUNT(DISTINCT w.cve_id) AS cve_count
        FROM cve_weaknesses w
        JOIN cves c ON c.cve_id = w.cve_id
        WHERE w.cwe_id NOT IN ({placeholders_sql}){date_sql}
        GROUP BY w.cwe_id
        ORDER BY cve_count DESC
        LIMIT ?
        """,
        (*CWE_PLACEHOLDERS, *date_params, limit),
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


def search_vendors(conn: sqlite3.Connection, query: str, limit: int = 10) -> list[dict]:
    """Vendor/product pairs matching a free-text query, ranked by CVE count.

    SQLite's LIKE is case-insensitive for ASCII, which covers real-world
    vendor/product names (they're lowercased in CPE strings already).
    """
    like_pattern = f"%{query}%"
    rows = conn.execute(
        """
        SELECT p.vendor, p.product, COUNT(DISTINCT p.cve_id) AS cve_count,
               SUM(CASE WHEN c.cvss_severity = 'CRITICAL' THEN 1 ELSE 0 END) AS critical_count
        FROM cve_products p
        JOIN cves c ON c.cve_id = p.cve_id
        WHERE p.vendor LIKE ?
           OR p.product LIKE ?
           OR (p.vendor || ' ' || p.product) LIKE ?
        GROUP BY p.vendor, p.product
        ORDER BY cve_count DESC
        LIMIT ?
        """,
        (like_pattern, like_pattern, like_pattern, limit),
    ).fetchall()
    return [
        {"vendor": vendor, "product": product, "cve_count": count, "critical_count": critical or 0}
        for vendor, product, count, critical in rows
    ]


def vendor_detail(conn: sqlite3.Connection, vendor: str, product: str, recent_limit: int = 10) -> dict:
    """Trend + recent-CVE detail for one vendor/product pair — the 'watchlist' view.

    has_exploit_reference is derived on the fly from cve_references.tags
    (no schema change / re-ingestion needed): NVD tags a reference "Exploit"
    when it points at public exploit code or a PoC, which is a sharper
    prioritization signal than CVSS score alone.
    """
    total_row = conn.execute(
        """
        SELECT COUNT(DISTINCT p.cve_id),
               SUM(CASE WHEN c.cvss_severity = 'CRITICAL' THEN 1 ELSE 0 END)
        FROM cve_products p
        JOIN cves c ON c.cve_id = p.cve_id
        WHERE p.vendor = ? AND p.product = ?
        """,
        (vendor, product),
    ).fetchone()
    total_cves, critical_count = total_row
    total_cves = total_cves or 0
    critical_count = critical_count or 0

    trend_rows = conn.execute(
        f"""
        SELECT {_QUARTER_EXPR} AS period, COUNT(DISTINCT p.cve_id) AS cve_count
        FROM cve_products p
        JOIN cves c ON c.cve_id = p.cve_id
        WHERE p.vendor = ? AND p.product = ?
        GROUP BY period
        ORDER BY period
        """,
        (vendor, product),
    ).fetchall()

    recent_rows = conn.execute(
        """
        SELECT c.cve_id, c.published_date, c.cvss_severity, c.cvss_score, c.description,
               EXISTS (
                   SELECT 1 FROM cve_references r
                   WHERE r.cve_id = c.cve_id AND r.tags LIKE '%"Exploit"%'
               ) AS has_exploit_reference
        FROM cve_products p
        JOIN cves c ON c.cve_id = p.cve_id
        WHERE p.vendor = ? AND p.product = ?
        ORDER BY c.published_date DESC
        LIMIT ?
        """,
        (vendor, product, recent_limit),
    ).fetchall()

    return {
        "vendor": vendor,
        "product": product,
        "total_cves": total_cves,
        "critical_count": critical_count,
        "critical_pct": round(100.0 * critical_count / total_cves, 1) if total_cves else 0.0,
        "trend": [{"period": period, "cve_count": count} for period, count in trend_rows],
        "recent_cves": [
            {
                "cve_id": cve_id,
                "published_date": published_date,
                "cvss_severity": severity,
                "cvss_score": score,
                "description": description,
                "has_exploit_reference": bool(has_exploit),
            }
            for cve_id, published_date, severity, score, description, has_exploit in recent_rows
        ],
    }


def _quarter_start(d: date) -> date:
    q_month = ((d.month - 1) // 3) * 3 + 1
    return date(d.year, q_month, 1)


def _previous_quarter_start(d: date) -> date:
    if d.month == 1:
        return date(d.year - 1, 10, 1)
    return date(d.year, d.month - 3, 1)


def _next_quarter_start(d: date) -> date:
    if d.month == 10:
        return date(d.year + 1, 1, 1)
    return date(d.year, d.month + 3, 1)


def _quarter_label(d: date) -> str:
    return f"{d.year}-Q{(d.month - 1) // 3 + 1}"


def quarterly_briefing(
    conn: sqlite3.Connection,
    now: datetime | None = None,
    year: int | None = None,
    quarter: int | None = None,
) -> dict:
    """Facts for the auto-generated executive briefing.

    Defaults to the last *complete* quarter relative to `now` (never the
    in-progress one, which would read as an artificial drop). Pass year+quarter
    together to request a specific past quarter instead — raises ValueError for
    an in-progress or future quarter, since there'd be nothing honest to report.
    Returns structured numbers; the frontend templates the narrative sentence
    per language so the prose itself stays in the i18n layer, not the API.
    """
    now = now or datetime.now(timezone.utc)
    current_start = _quarter_start(now.date())

    if year is not None and quarter is not None:
        if not (1 <= quarter <= 4):
            raise ValueError("quarter must be between 1 and 4")
        target_start = date(year, (quarter - 1) * 3 + 1, 1)
        if target_start >= current_start:
            raise ValueError("Cannot request the in-progress or a future quarter")
    else:
        target_start = _previous_quarter_start(current_start)

    last_complete_start = target_start
    last_complete_end = _next_quarter_start(target_start) - timedelta(days=1)
    prev_start = _previous_quarter_start(last_complete_start)
    prev_end = last_complete_start - timedelta(days=1)

    def totals(start: date, end: date) -> tuple[int, int]:
        date_sql, params = _date_filter(str(start), str(end))
        total, critical = conn.execute(
            f"SELECT COUNT(*), SUM(CASE WHEN cvss_severity = 'CRITICAL' THEN 1 ELSE 0 END) "
            f"FROM cves WHERE 1=1{date_sql}",
            params,
        ).fetchone()
        return total or 0, critical or 0

    total_cves, critical_cves = totals(last_complete_start, last_complete_end)
    prev_total, _prev_critical = totals(prev_start, prev_end)

    pct_change = round(100.0 * (total_cves - prev_total) / prev_total, 1) if prev_total else None

    date_sql, date_params = _date_filter(str(last_complete_start), str(last_complete_end), column="c.published_date")
    top_vendor_row = conn.execute(
        f"""
        SELECT p.vendor, p.product, COUNT(DISTINCT p.cve_id) AS cnt
        FROM cve_products p
        JOIN cves c ON c.cve_id = p.cve_id
        WHERE 1=1{date_sql}
        GROUP BY p.vendor, p.product
        ORDER BY cnt DESC
        LIMIT 1
        """,
        date_params,
    ).fetchone()

    placeholders_sql = ", ".join("?" for _ in CWE_PLACEHOLDERS)
    top_cwe_row = conn.execute(
        f"""
        SELECT w.cwe_id, COUNT(DISTINCT w.cve_id) AS cnt
        FROM cve_weaknesses w
        JOIN cves c ON c.cve_id = w.cve_id
        WHERE w.cwe_id NOT IN ({placeholders_sql}){date_sql}
        GROUP BY w.cwe_id
        ORDER BY cnt DESC
        LIMIT 1
        """,
        (*CWE_PLACEHOLDERS, *date_params),
    ).fetchone()

    return {
        "quarter": _quarter_label(last_complete_start),
        "previous_quarter": _quarter_label(prev_start),
        "total_cves": total_cves,
        "critical_cves": critical_cves,
        "pct_change_vs_previous": pct_change,
        "top_vendor": top_vendor_row[0] if top_vendor_row else None,
        "top_product": top_vendor_row[1] if top_vendor_row else None,
        "top_vendor_cve_count": top_vendor_row[2] if top_vendor_row else 0,
        "top_cwe_id": top_cwe_row[0] if top_cwe_row else None,
        "top_cwe_name": cwe_friendly_name(top_cwe_row[0]) if top_cwe_row else None,
    }
