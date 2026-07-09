from ingestion.parse import (
    extract_cwes,
    extract_products,
    extract_references,
    has_patch_reference,
    normalize_cvss,
    parse_cve,
)


class TestNormalizeCvss:
    def test_prefers_v31_over_v2(self, log4shell):
        result = normalize_cvss(log4shell["cve"])
        assert result["cvss_version"] == "v31"
        assert result["cvss_score"] == 10.0
        assert result["cvss_severity"] == "CRITICAL"
        assert result["cvss_vector"].startswith("CVSS:3.1")

    def test_v2_only_reads_sibling_base_severity(self, cvss_v2_only):
        result = normalize_cvss(cvss_v2_only["cve"])
        assert result["cvss_version"] == "v2"
        assert result["cvss_score"] == 7.5
        assert result["cvss_severity"] == "HIGH"

    def test_v40_only(self, cvss_v40_only):
        result = normalize_cvss(cvss_v40_only["cve"])
        assert result["cvss_version"] == "v40"
        assert result["cvss_score"] == 9.8
        assert result["cvss_severity"] == "CRITICAL"

    def test_no_metrics_returns_none(self, no_cvss):
        result = normalize_cvss(no_cvss["cve"])
        assert result["cvss_version"] is None
        assert result["cvss_score"] is None
        assert result["cvss_severity"] is None


class TestExtractCwes:
    def test_multiple_cwes_english_only(self, log4shell):
        assert extract_cwes(log4shell["cve"]) == ["CWE-502", "CWE-20"]

    def test_placeholder_cwe_still_extracted(self, cvss_v2_only):
        # placeholders are extracted here; filtering happens at query time
        assert extract_cwes(cvss_v2_only["cve"]) == ["NVD-CWE-noinfo"]

    def test_no_weaknesses(self, no_cvss):
        assert extract_cwes(no_cvss["cve"]) == []


class TestExtractProducts:
    def test_only_vulnerable_entries_included(self, log4shell):
        products = extract_products(log4shell["cve"])
        assert products == [("apache", "log4j")]

    def test_escaped_colon_in_cpe_field(self, cvss_v2_only):
        products = extract_products(cvss_v2_only["cve"])
        assert products == [("acme_corp", "widget:pro")]

    def test_no_configurations(self, no_cvss):
        assert extract_products(no_cvss["cve"]) == []


class TestExtractReferences:
    def test_returns_url_and_tags(self, log4shell):
        refs = extract_references(log4shell["cve"])
        assert len(refs) == 3
        urls = [url for url, _ in refs]
        assert "https://github.com/apache/logging-log4j2/pull/608" in urls


class TestHasPatchReference:
    def test_true_when_patch_tag_present(self, log4shell):
        assert has_patch_reference(log4shell["cve"]) is True

    def test_false_when_no_patch_tag(self, cvss_v2_only):
        assert has_patch_reference(cvss_v2_only["cve"]) is False

    def test_false_when_no_references(self, no_cvss):
        assert has_patch_reference(no_cvss["cve"]) is False


class TestParseCve:
    def test_full_parse_shape(self, log4shell):
        parsed = parse_cve(log4shell)
        assert parsed["cve_id"] == "CVE-2021-44228"
        assert parsed["cvss_severity"] == "CRITICAL"
        assert parsed["has_patch_reference"] == 1
        assert parsed["cwes"] == ["CWE-502", "CWE-20"]
        assert parsed["products"] == [("apache", "log4j")]
        assert "Log4Shell" in parsed["description"]
        assert parsed["published_date"] == "2021-12-10T10:15:00.000"
