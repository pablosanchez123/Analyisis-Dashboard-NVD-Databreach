import sqlite3

from fastapi import APIRouter, Depends, HTTPException, Query

from app.db import get_connection
from app.schemas import VendorCompareResponse, VendorDetailResponse, VendorSearchResponse
from app.services import queries

router = APIRouter()

MAX_COMPARE = 4


@router.get("/api/vendors/search", response_model=VendorSearchResponse)
def search_vendors(
    q: str = Query(..., min_length=2),
    limit: int = Query(10, ge=1, le=50),
    conn: sqlite3.Connection = Depends(get_connection),
):
    return {"data": queries.search_vendors(conn, query=q, limit=limit)}


@router.get("/api/vendors/detail", response_model=VendorDetailResponse)
def get_vendor_detail(
    vendor: str,
    product: str,
    conn: sqlite3.Connection = Depends(get_connection),
):
    result = queries.vendor_detail(conn, vendor=vendor, product=product)
    if result["total_cves"] == 0:
        raise HTTPException(status_code=404, detail="No CVEs found for this vendor/product")
    return result


@router.get("/api/vendors/compare", response_model=VendorCompareResponse)
def compare_vendors(
    pair: list[str] = Query(..., description="'vendor|product' entries, up to 4"),
    conn: sqlite3.Connection = Depends(get_connection),
):
    if not pair or len(pair) > MAX_COMPARE:
        raise HTTPException(status_code=400, detail=f"Provide between 1 and {MAX_COMPARE} 'pair' entries")

    parsed: list[tuple[str, str]] = []
    for entry in pair:
        if "|" not in entry:
            raise HTTPException(status_code=400, detail=f"Invalid pair format (expected 'vendor|product'): {entry}")
        vendor, product = entry.split("|", 1)
        parsed.append((vendor, product))

    return {"data": [queries.vendor_detail(conn, vendor=v, product=p, recent_limit=0) for v, p in parsed]}
