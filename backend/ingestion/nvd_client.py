"""Rate-limited, paginating client for the NVD CVE API 2.0."""
import time
from collections.abc import Iterator
from datetime import datetime, timedelta, timezone
from typing import Any

import requests

NVD_BASE_URL = "https://services.nvd.nist.gov/rest/json/cves/2.0"
MAX_RESULTS_PER_PAGE = 2000
MAX_DATE_SPAN_DAYS = 120
REQUEST_INTERVAL_SECONDS = 0.7  # under the 50 req/30s keyed rate limit
MAX_RETRIES = 5


def _iso(dt: datetime) -> str:
    return dt.strftime("%Y-%m-%dT%H:%M:%S.000")


def chunk_date_range(start: datetime, end: datetime, max_days: int = MAX_DATE_SPAN_DAYS) -> Iterator[tuple[datetime, datetime]]:
    """Split [start, end] into windows no longer than max_days (NVD's hard limit)."""
    window_start = start
    while window_start < end:
        window_end = min(window_start + timedelta(days=max_days), end)
        yield window_start, window_end
        window_start = window_end


class NvdClient:
    def __init__(self, api_key: str, session: requests.Session | None = None):
        self.api_key = api_key
        self.session = session or requests.Session()
        self._last_request_time = 0.0

    def _throttle(self) -> None:
        elapsed = time.monotonic() - self._last_request_time
        if elapsed < REQUEST_INTERVAL_SECONDS:
            time.sleep(REQUEST_INTERVAL_SECONDS - elapsed)

    def _get(self, params: dict[str, Any]) -> dict[str, Any]:
        headers = {"apiKey": self.api_key} if self.api_key else {}
        last_exc: Exception | None = None

        for attempt in range(MAX_RETRIES):
            self._throttle()
            self._last_request_time = time.monotonic()
            try:
                resp = self.session.get(NVD_BASE_URL, params=params, headers=headers, timeout=30)
                if resp.status_code in (403, 429) or resp.status_code >= 500:
                    wait = 2**attempt
                    time.sleep(wait)
                    continue
                resp.raise_for_status()
                return resp.json()
            except requests.RequestException as exc:
                last_exc = exc
                time.sleep(2**attempt)

        raise RuntimeError(f"NVD request failed after {MAX_RETRIES} retries: {last_exc}")

    def fetch_window(
        self,
        start: datetime,
        end: datetime,
        date_field: str = "pub",
    ) -> Iterator[dict[str, Any]]:
        """Yield raw `{"cve": {...}}` items published/modified in [start, end).

        date_field: "pub" for pubStartDate/pubEndDate (backfill),
                    "mod" for lastModStartDate/lastModEndDate (incremental).
        """
        start_key, end_key = (
            ("pubStartDate", "pubEndDate") if date_field == "pub" else ("lastModStartDate", "lastModEndDate")
        )

        start_index = 0
        total_results = None

        while total_results is None or start_index < total_results:
            params = {
                start_key: _iso(start),
                end_key: _iso(end),
                "resultsPerPage": MAX_RESULTS_PER_PAGE,
                "startIndex": start_index,
                "noRejected": "",
            }
            data = self._get(params)
            total_results = data.get("totalResults", 0)
            vulnerabilities = data.get("vulnerabilities", [])

            yield from vulnerabilities

            start_index += len(vulnerabilities)
            if not vulnerabilities:
                break

    def fetch_range(
        self,
        start: datetime,
        end: datetime,
        date_field: str = "pub",
    ) -> Iterator[dict[str, Any]]:
        """Yield raw CVE items across an arbitrarily long range, chunked into
        NVD's 120-day max window internally."""
        for window_start, window_end in chunk_date_range(start, end):
            yield from self.fetch_window(window_start, window_end, date_field=date_field)


def utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)
