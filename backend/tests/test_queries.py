import sqlite3
from datetime import datetime

import pytest

from app.services import queries
from ingestion import db_writer


@pytest.fixture
def conn():
    c = sqlite3.connect(":memory:")
    db_writer.init_schema(c)
    yield c
    c.close()


def _insert_cve(conn, cve_id, published_date, severity="HIGH", vendor="acme", product="widget", cwe="CWE-79"):
    conn.execute(
        "INSERT INTO cves (cve_id, published_date, last_modified_date, cvss_version, cvss_severity, "
        "has_patch_reference, ingested_at) VALUES (?, ?, ?, 'v31', ?, 1, '2026-01-01')",
        (cve_id, published_date, published_date, severity),
    )
    conn.execute("INSERT INTO cve_products (cve_id, vendor, product) VALUES (?, ?, ?)", (cve_id, vendor, product))
    conn.execute("INSERT INTO cve_weaknesses (cve_id, cwe_id) VALUES (?, ?)", (cve_id, cwe))


def _seed(conn):
    _insert_cve(conn, "CVE-2023-0001", "2023-06-15T00:00:00.000", vendor="old-vendor")
    _insert_cve(conn, "CVE-2024-0001", "2024-06-15T00:00:00.000", vendor="mid-vendor")
    _insert_cve(conn, "CVE-2025-0001", "2025-06-15T00:00:00.000", vendor="new-vendor")
    conn.commit()


class TestSeverityTrendDateFilter:
    def test_no_filter_returns_all(self, conn):
        _seed(conn)
        result = queries.severity_trend(conn)
        assert len(result) == 3

    def test_filter_excludes_outside_range(self, conn):
        _seed(conn)
        result = queries.severity_trend(conn, start_date="2024-01-01", end_date="2024-12-31")
        assert len(result) == 1
        assert result[0]["period"] == "2024-Q2"

    def test_end_date_is_inclusive_of_whole_day(self, conn):
        _seed(conn)
        result = queries.severity_trend(conn, start_date="2025-06-15", end_date="2025-06-15")
        assert len(result) == 1


class TestTopVendorsDateFilter:
    def test_filter_restricts_to_range(self, conn):
        _seed(conn)
        result = queries.top_vendors(conn, start_date="2023-01-01", end_date="2023-12-31")
        assert [r["vendor"] for r in result] == ["old-vendor"]

    def test_no_filter_returns_all_vendors(self, conn):
        _seed(conn)
        result = queries.top_vendors(conn)
        assert len(result) == 3


class TestPatchTimeDateFilter:
    def test_totals_scoped_to_range(self, conn):
        _seed(conn)
        result = queries.patch_time(conn, start_date="2024-01-01", end_date="2025-12-31")
        assert result["total_cves"] == 2
        assert result["sample_size"] == 2

    def test_no_filter_covers_all(self, conn):
        _seed(conn)
        result = queries.patch_time(conn)
        assert result["total_cves"] == 3


class TestCweDistributionDateFilter:
    def test_filter_restricts_cwe_counts(self, conn):
        _seed(conn)
        result = queries.cwe_distribution(conn, start_date="2025-01-01", end_date="2025-12-31")
        assert len(result) == 1
        assert result[0]["cve_count"] == 1

    def test_no_filter_counts_all(self, conn):
        _seed(conn)
        result = queries.cwe_distribution(conn)
        assert result[0]["cve_count"] == 3


class TestSearchVendors:
    def test_matches_vendor_substring(self, conn):
        _seed(conn)
        result = queries.search_vendors(conn, query="new")
        assert [r["vendor"] for r in result] == ["new-vendor"]

    def test_matches_product_substring(self, conn):
        _insert_cve(conn, "CVE-2023-9999", "2023-01-01T00:00:00.000", vendor="apache", product="log4j")
        conn.commit()
        result = queries.search_vendors(conn, query="log4")
        assert result[0]["vendor"] == "apache"
        assert result[0]["product"] == "log4j"

    def test_case_insensitive(self, conn):
        _seed(conn)
        result = queries.search_vendors(conn, query="NEW-VENDOR")
        assert len(result) == 1

    def test_no_match_returns_empty(self, conn):
        _seed(conn)
        result = queries.search_vendors(conn, query="nonexistent-xyz")
        assert result == []

    def test_critical_count_included(self, conn):
        _insert_cve(conn, "CVE-A", "2024-01-01T00:00:00.000", severity="CRITICAL", vendor="foo", product="bar")
        _insert_cve(conn, "CVE-B", "2024-02-01T00:00:00.000", severity="LOW", vendor="foo", product="bar")
        conn.commit()
        result = queries.search_vendors(conn, query="foo")
        assert result[0]["cve_count"] == 2
        assert result[0]["critical_count"] == 1


class TestVendorDetail:
    def test_aggregates_and_trend(self, conn):
        _insert_cve(conn, "CVE-A", "2024-01-15T00:00:00.000", severity="CRITICAL", vendor="foo", product="bar")
        _insert_cve(conn, "CVE-B", "2024-04-15T00:00:00.000", severity="LOW", vendor="foo", product="bar")
        conn.commit()

        result = queries.vendor_detail(conn, vendor="foo", product="bar")

        assert result["total_cves"] == 2
        assert result["critical_count"] == 1
        assert result["critical_pct"] == 50.0
        assert [t["period"] for t in result["trend"]] == ["2024-Q1", "2024-Q2"]
        assert len(result["recent_cves"]) == 2
        # most recent first
        assert result["recent_cves"][0]["cve_id"] == "CVE-B"

    def test_no_data_returns_zeroed_result(self, conn):
        result = queries.vendor_detail(conn, vendor="nope", product="nope")
        assert result["total_cves"] == 0
        assert result["critical_pct"] == 0.0
        assert result["recent_cves"] == []

    def test_exploit_flag_detected_from_references(self, conn):
        _insert_cve(conn, "CVE-EXPLOIT", "2024-01-01T00:00:00.000", vendor="foo", product="bar")
        _insert_cve(conn, "CVE-NO-EXPLOIT", "2024-01-02T00:00:00.000", vendor="foo", product="bar")
        conn.execute(
            "INSERT INTO cve_references (cve_id, url, tags) VALUES (?, ?, ?)",
            ("CVE-EXPLOIT", "https://example.com/poc", '["Exploit", "Third Party Advisory"]'),
        )
        conn.execute(
            "INSERT INTO cve_references (cve_id, url, tags) VALUES (?, ?, ?)",
            ("CVE-NO-EXPLOIT", "https://example.com/advisory", '["Vendor Advisory"]'),
        )
        conn.commit()

        result = queries.vendor_detail(conn, vendor="foo", product="bar")
        by_id = {c["cve_id"]: c for c in result["recent_cves"]}

        assert by_id["CVE-EXPLOIT"]["has_exploit_reference"] is True
        assert by_id["CVE-NO-EXPLOIT"]["has_exploit_reference"] is False

    def test_recent_limit_zero_returns_no_cves(self, conn):
        _insert_cve(conn, "CVE-A", "2024-01-01T00:00:00.000", vendor="foo", product="bar")
        conn.commit()
        result = queries.vendor_detail(conn, vendor="foo", product="bar", recent_limit=0)
        assert result["total_cves"] == 1
        assert result["recent_cves"] == []


class TestQuarterlyBriefing:
    """now is fixed to 2026-04-15 (Q2 2026) throughout — last complete quarter
    is 2026-Q1, previous is 2025-Q4, and 2026-Q2 is in-progress (excluded)."""

    NOW = datetime(2026, 4, 15)

    def _seed_briefing_data(self, conn):
        # 2026-Q1 (last complete): 3 CVEs, foo/bar x2 (top vendor), CWE-79 x2 (top cwe)
        _insert_cve(conn, "CVE-Q1-A", "2026-01-10T00:00:00.000", severity="CRITICAL", vendor="foo", product="bar", cwe="CWE-79")
        _insert_cve(conn, "CVE-Q1-B", "2026-02-10T00:00:00.000", severity="HIGH", vendor="foo", product="bar", cwe="CWE-79")
        _insert_cve(conn, "CVE-Q1-C", "2026-03-10T00:00:00.000", severity="LOW", vendor="baz", product="qux", cwe="CWE-89")
        # 2025-Q4 (previous): 2 CVEs
        _insert_cve(conn, "CVE-Q4-A", "2025-10-10T00:00:00.000", vendor="old", product="thing")
        _insert_cve(conn, "CVE-Q4-B", "2025-11-10T00:00:00.000", vendor="old", product="thing")
        # 2026-Q2 (in-progress, must be excluded)
        _insert_cve(conn, "CVE-Q2-X", "2026-04-05T00:00:00.000", vendor="foo", product="bar")
        conn.commit()

    def test_last_complete_quarter_facts(self, conn):
        self._seed_briefing_data(conn)
        result = queries.quarterly_briefing(conn, now=self.NOW)

        assert result["quarter"] == "2026-Q1"
        assert result["previous_quarter"] == "2025-Q4"
        assert result["total_cves"] == 3
        assert result["critical_cves"] == 1
        assert result["pct_change_vs_previous"] == 50.0
        assert result["top_vendor"] == "foo"
        assert result["top_product"] == "bar"
        assert result["top_vendor_cve_count"] == 2
        assert result["top_cwe_id"] == "CWE-79"
        assert result["top_cwe_name"] == "Cross-Site Scripting (XSS)"

    def test_excludes_in_progress_quarter(self, conn):
        self._seed_briefing_data(conn)
        result = queries.quarterly_briefing(conn, now=self.NOW)
        # CVE-Q2-X (in 2026-Q2) must not be counted in the 2026-Q1 total
        assert result["total_cves"] == 3

    def test_no_previous_quarter_data_pct_change_is_none(self, conn):
        _insert_cve(conn, "CVE-Q1-ONLY", "2026-01-10T00:00:00.000", vendor="foo", product="bar")
        conn.commit()
        result = queries.quarterly_briefing(conn, now=self.NOW)
        assert result["pct_change_vs_previous"] is None

    def test_no_data_at_all(self, conn):
        result = queries.quarterly_briefing(conn, now=self.NOW)
        assert result["total_cves"] == 0
        assert result["critical_cves"] == 0
        assert result["top_vendor"] is None
        assert result["top_cwe_id"] is None
