import json
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

FIXTURES_DIR = Path(__file__).parent / "fixtures"


@pytest.fixture
def sample_vulnerabilities() -> list[dict]:
    data = json.loads((FIXTURES_DIR / "sample_cves.json").read_text())
    return data["vulnerabilities"]


@pytest.fixture
def log4shell(sample_vulnerabilities) -> dict:
    return next(v for v in sample_vulnerabilities if v["cve"]["id"] == "CVE-2021-44228")


@pytest.fixture
def cvss_v2_only(sample_vulnerabilities) -> dict:
    return next(v for v in sample_vulnerabilities if v["cve"]["id"] == "CVE-2020-00001")


@pytest.fixture
def cvss_v40_only(sample_vulnerabilities) -> dict:
    return next(v for v in sample_vulnerabilities if v["cve"]["id"] == "CVE-2024-99999")


@pytest.fixture
def no_cvss(sample_vulnerabilities) -> dict:
    return next(v for v in sample_vulnerabilities if v["cve"]["id"] == "CVE-2024-00042")
