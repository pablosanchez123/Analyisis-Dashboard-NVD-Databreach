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
