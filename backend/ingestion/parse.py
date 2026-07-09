"""Pure parsing/normalization functions for NVD CVE API 2.0 records.

No network or DB access here — keeps this module unit-testable against
saved JSON fixtures. See backend/tests/test_parse.py.
"""
import json
import re
from typing import Any

# Preferred order when a CVE carries multiple CVSS versions.
# v3.x preferred for cross-year comparability; v2 has no CRITICAL bucket.
_CVSS_METRIC_KEYS = ["cvssMetricV31", "cvssMetricV30", "cvssMetricV40", "cvssMetricV2"]

_PATCH_TAGS = {"Patch", "Vendor Advisory"}

_UNESCAPED_COLON = re.compile(r"(?<!\\):")
_ESCAPE_SEQ = re.compile(r"\\(.)")


def normalize_cvss(cve: dict[str, Any]) -> dict[str, Any]:
    """Pick the best available CVSS metric from a CVE's `metrics` object.

    Returns dict with cvss_version, cvss_score, cvss_severity, cvss_vector.
    All None if the CVE has no CVSS metrics at all (happens for very
    recently published / not-yet-analyzed CVEs).
    """
    metrics = cve.get("metrics", {})

    for key in _CVSS_METRIC_KEYS:
        entries = metrics.get(key)
        if not entries:
            continue

        entry = next((e for e in entries if e.get("type") == "Primary"), entries[0])
        cvss_data = entry.get("cvssData", {})
        # v2 puts baseSeverity as a sibling of cvssData; v3.x/v4.0 nest it inside.
        severity = cvss_data.get("baseSeverity") or entry.get("baseSeverity")

        version = cvss_data.get("version")
        version_tag = {"3.1": "v31", "3.0": "v30", "4.0": "v40", "2.0": "v2"}.get(version, version)

        return {
            "cvss_version": version_tag,
            "cvss_score": cvss_data.get("baseScore"),
            "cvss_severity": severity,
            "cvss_vector": cvss_data.get("vectorString"),
        }

    return {"cvss_version": None, "cvss_score": None, "cvss_severity": None, "cvss_vector": None}


def extract_cwes(cve: dict[str, Any]) -> list[str]:
    """All CWE IDs attached to a CVE (may include NVD placeholder values;
    callers filter those out at query time for the distribution metric)."""
    cwe_ids: list[str] = []
    for weakness in cve.get("weaknesses", []):
        for desc in weakness.get("description", []):
            if desc.get("lang") == "en" and desc.get("value"):
                cwe_ids.append(desc["value"])
    return cwe_ids


def _split_cpe23(cpe_string: str) -> list[str]:
    """Split a CPE 2.3 URI on unescaped colons, then unescape each field."""
    raw_fields = _UNESCAPED_COLON.split(cpe_string)
    return [_ESCAPE_SEQ.sub(r"\1", field) for field in raw_fields]


def extract_products(cve: dict[str, Any]) -> list[tuple[str, str]]:
    """(vendor, product) pairs for all vulnerable CPE matches, deduped."""
    seen: set[tuple[str, str]] = set()
    for config in cve.get("configurations", []):
        for node in config.get("nodes", []):
            for match in node.get("cpeMatch", []):
                if not match.get("vulnerable"):
                    continue
                criteria = match.get("criteria", "")
                fields = _split_cpe23(criteria)
                # fields: [cpe, 2.3, part, vendor, product, version, ...]
                if len(fields) > 4:
                    vendor, product = fields[3], fields[4]
                    if vendor and vendor != "*" and product and product != "*":
                        seen.add((vendor, product))
    return sorted(seen)


def extract_references(cve: dict[str, Any]) -> list[tuple[str, str]]:
    """(url, tags_json) pairs for every reference on the CVE."""
    refs = []
    for ref in cve.get("references", []):
        url = ref.get("url", "")
        tags = ref.get("tags", [])
        refs.append((url, json.dumps(tags)))
    return refs


def has_patch_reference(cve: dict[str, Any]) -> bool:
    for ref in cve.get("references", []):
        if _PATCH_TAGS & set(ref.get("tags", [])):
            return True
    return False


def get_description(cve: dict[str, Any]) -> str:
    for desc in cve.get("descriptions", []):
        if desc.get("lang") == "en":
            return desc.get("value", "")
    return ""


def parse_cve(item: dict[str, Any]) -> dict[str, Any]:
    """Parse one `{"cve": {...}}` item from the NVD API 2.0 `vulnerabilities[]` list."""
    cve = item["cve"]
    cvss = normalize_cvss(cve)

    return {
        "cve_id": cve["id"],
        "published_date": cve.get("published"),
        "last_modified_date": cve.get("lastModified"),
        "description": get_description(cve),
        "vuln_status": cve.get("vulnStatus"),
        "has_patch_reference": int(has_patch_reference(cve)),
        **cvss,
        "cwes": extract_cwes(cve),
        "products": extract_products(cve),
        "references": extract_references(cve),
    }
