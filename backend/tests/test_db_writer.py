import sqlite3

import pytest

from ingestion import db_writer
from ingestion.parse import parse_cve


@pytest.fixture
def conn():
    c = sqlite3.connect(":memory:")
    db_writer.init_schema(c)
    yield c
    c.close()


def test_upsert_inserts_cve_and_children(conn, log4shell):
    parsed = parse_cve(log4shell)
    db_writer.upsert_cve(conn, parsed, ingested_at="2026-01-01T00:00:00")
    conn.commit()

    row = conn.execute("SELECT cve_id, cvss_severity FROM cves WHERE cve_id = ?", ("CVE-2021-44228",)).fetchone()
    assert row == ("CVE-2021-44228", "CRITICAL")

    cwe_count = conn.execute("SELECT count(*) FROM cve_weaknesses WHERE cve_id = ?", ("CVE-2021-44228",)).fetchone()[0]
    assert cwe_count == 2

    product_count = conn.execute("SELECT count(*) FROM cve_products WHERE cve_id = ?", ("CVE-2021-44228",)).fetchone()[0]
    assert product_count == 1


def test_reingesting_does_not_duplicate_child_rows(conn, log4shell):
    """Regression guard for the incremental-refresh duplication bug the plan calls out."""
    parsed = parse_cve(log4shell)

    db_writer.upsert_cve(conn, parsed, ingested_at="2026-01-01T00:00:00")
    db_writer.upsert_cve(conn, parsed, ingested_at="2026-01-08T00:00:00")
    conn.commit()

    cwe_count = conn.execute("SELECT count(*) FROM cve_weaknesses WHERE cve_id = ?", ("CVE-2021-44228",)).fetchone()[0]
    ref_count = conn.execute("SELECT count(*) FROM cve_references WHERE cve_id = ?", ("CVE-2021-44228",)).fetchone()[0]
    product_count = conn.execute("SELECT count(*) FROM cve_products WHERE cve_id = ?", ("CVE-2021-44228",)).fetchone()[0]

    assert cwe_count == 2
    assert ref_count == 3
    assert product_count == 1

    ingested_at = conn.execute("SELECT ingested_at FROM cves WHERE cve_id = ?", ("CVE-2021-44228",)).fetchone()[0]
    assert ingested_at == "2026-01-08T00:00:00"


def test_meta_get_set_roundtrip(conn):
    assert db_writer.get_meta(conn, "watermark") is None
    db_writer.set_meta(conn, "watermark", "2026-01-01T00:00:00.000")
    conn.commit()
    assert db_writer.get_meta(conn, "watermark") == "2026-01-01T00:00:00.000"

    db_writer.set_meta(conn, "watermark", "2026-02-01T00:00:00.000")
    conn.commit()
    assert db_writer.get_meta(conn, "watermark") == "2026-02-01T00:00:00.000"
