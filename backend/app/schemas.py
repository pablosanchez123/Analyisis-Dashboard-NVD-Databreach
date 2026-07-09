from pydantic import BaseModel


class SeverityTrendPoint(BaseModel):
    period: str
    CRITICAL: int
    HIGH: int
    MEDIUM: int
    LOW: int


class SeverityTrendResponse(BaseModel):
    granularity: str
    data: list[SeverityTrendPoint]


class TopVendorEntry(BaseModel):
    vendor: str
    product: str
    cve_count: int


class TopVendorsResponse(BaseModel):
    data: list[TopVendorEntry]


class PatchTimeResponse(BaseModel):
    avg_days_to_patch_reference: float | None
    coverage_pct: float
    sample_size: int
    total_cves: int
    caveat: str


class CweEntry(BaseModel):
    cwe_id: str
    name: str
    cve_count: int


class CweDistributionResponse(BaseModel):
    data: list[CweEntry]


class ForecastPoint(BaseModel):
    quarter: str
    is_history: bool
    in_progress: bool = False
    actual: int | None
    predicted: float | None
    lower: float | None
    upper: float | None


class ForecastResponse(BaseModel):
    data: list[ForecastPoint]
    caveat: str


class MetaResponse(BaseModel):
    total_cves: int
    date_range_start: str | None
    date_range_end: str | None
    last_ingested_lastmodified: str | None
    backfill_completed_at: str | None


class VendorSearchEntry(BaseModel):
    vendor: str
    product: str
    cve_count: int
    critical_count: int


class VendorSearchResponse(BaseModel):
    data: list[VendorSearchEntry]


class VendorTrendPoint(BaseModel):
    period: str
    cve_count: int


class VendorRecentCve(BaseModel):
    cve_id: str
    published_date: str
    cvss_severity: str | None
    cvss_score: float | None
    description: str
    has_exploit_reference: bool


class VendorDetailResponse(BaseModel):
    vendor: str
    product: str
    total_cves: int
    critical_count: int
    critical_pct: float
    trend: list[VendorTrendPoint]
    recent_cves: list[VendorRecentCve]


class VendorCompareResponse(BaseModel):
    data: list[VendorDetailResponse]


class BriefingResponse(BaseModel):
    quarter: str
    previous_quarter: str
    total_cves: int
    critical_cves: int
    pct_change_vs_previous: float | None
    top_vendor: str | None
    top_product: str | None
    top_vendor_cve_count: int
    top_cwe_id: str | None
    top_cwe_name: str | None
