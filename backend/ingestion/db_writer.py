"""SQLite schema definition and upsert logic. Plain sqlite3, no ORM."""
import sqlite3
from typing import Any

SCHEMA = """
CREATE TABLE IF NOT EXISTS cves (
    cve_id              TEXT PRIMARY KEY,
    published_date      TEXT NOT NULL,
    last_modified_date  TEXT NOT NULL,
    description         TEXT,
    cvss_version         TEXT,
    cvss_score          REAL,
    cvss_severity       TEXT,
    cvss_vector          TEXT,
    vuln_status          TEXT,
    has_patch_reference INTEGER DEFAULT 0,
    ingested_at          TEXT
);
CREATE INDEX IF NOT EXISTS idx_cves_published ON cves(published_date);
CREATE INDEX IF NOT EXISTS idx_cves_severity ON cves(cvss_severity);

CREATE TABLE IF NOT EXISTS cve_weaknesses (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    cve_id  TEXT REFERENCES cves(cve_id),
    cwe_id  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_weak_cwe ON cve_weaknesses(cwe_id);
CREATE INDEX IF NOT EXISTS idx_weak_cve ON cve_weaknesses(cve_id);

CREATE TABLE IF NOT EXISTS cve_products (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    cve_id  TEXT REFERENCES cves(cve_id),
    vendor  TEXT NOT NULL,
    product TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_prod_vendor_product ON cve_products(vendor, product);
CREATE INDEX IF NOT EXISTS idx_prod_cve ON cve_products(cve_id);

CREATE TABLE IF NOT EXISTS cve_references (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    cve_id  TEXT REFERENCES cves(cve_id),
    url     TEXT,
    tags    TEXT
);
CREATE INDEX IF NOT EXISTS idx_ref_cve ON cve_references(cve_id);

CREATE TABLE IF NOT EXISTS forecast_results (
    quarter      TEXT PRIMARY KEY,
    is_history   INTEGER,
    in_progress  INTEGER DEFAULT 0,
    actual       INTEGER,
    predicted    REAL,
    lower        REAL,
    upper        REAL,
    computed_at  TEXT
);

CREATE TABLE IF NOT EXISTS ingestion_meta (
    key   TEXT PRIMARY KEY,
    value TEXT
);
"""


def connect(db_path: str) -> sqlite3.Connection:
    conn = sqlite3.connect(db_path, check_same_thread=False)
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_schema(conn: sqlite3.Connection) -> None:
    conn.executescript(SCHEMA)
    conn.commit()


def upsert_cve(conn: sqlite3.Connection, parsed: dict[str, Any], ingested_at: str) -> None:
    """Insert or fully replace a CVE and its child rows.

    Child tables are deleted before reinsertion — required for correctness
    on incremental re-ingestion, otherwise weekly deltas duplicate
    weakness/product/reference rows and inflate every downstream count.
    """
    cve_id = parsed["cve_id"]

    conn.execute(
        """
        INSERT INTO cves (
            cve_id, published_date, last_modified_date, description,
            cvss_version, cvss_score, cvss_severity, cvss_vector,
            vuln_status, has_patch_reference, ingested_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(cve_id) DO UPDATE SET
            published_date=excluded.published_date,
            last_modified_date=excluded.last_modified_date,
            description=excluded.description,
            cvss_version=excluded.cvss_version,
            cvss_score=excluded.cvss_score,
            cvss_severity=excluded.cvss_severity,
            cvss_vector=excluded.cvss_vector,
            vuln_status=excluded.vuln_status,
            has_patch_reference=excluded.has_patch_reference,
            ingested_at=excluded.ingested_at
        """,
        (
            cve_id,
            parsed["published_date"],
            parsed["last_modified_date"],
            parsed["description"],
            parsed["cvss_version"],
            parsed["cvss_score"],
            parsed["cvss_severity"],
            parsed["cvss_vector"],
            parsed["vuln_status"],
            parsed["has_patch_reference"],
            ingested_at,
        ),
    )

    conn.execute("DELETE FROM cve_weaknesses WHERE cve_id = ?", (cve_id,))
    conn.executemany(
        "INSERT INTO cve_weaknesses (cve_id, cwe_id) VALUES (?, ?)",
        [(cve_id, cwe) for cwe in parsed["cwes"]],
    )

    conn.execute("DELETE FROM cve_products WHERE cve_id = ?", (cve_id,))
    conn.executemany(
        "INSERT INTO cve_products (cve_id, vendor, product) VALUES (?, ?, ?)",
        [(cve_id, vendor, product) for vendor, product in parsed["products"]],
    )

    conn.execute("DELETE FROM cve_references WHERE cve_id = ?", (cve_id,))
    conn.executemany(
        "INSERT INTO cve_references (cve_id, url, tags) VALUES (?, ?, ?)",
        [(cve_id, url, tags) for url, tags in parsed["references"]],
    )


def get_meta(conn: sqlite3.Connection, key: str) -> str | None:
    row = conn.execute("SELECT value FROM ingestion_meta WHERE key = ?", (key,)).fetchone()
    return row[0] if row else None


def set_meta(conn: sqlite3.Connection, key: str, value: str) -> None:
    conn.execute(
        "INSERT INTO ingestion_meta (key, value) VALUES (?, ?) "
        "ON CONFLICT(key) DO UPDATE SET value=excluded.value",
        (key, value),
    )
