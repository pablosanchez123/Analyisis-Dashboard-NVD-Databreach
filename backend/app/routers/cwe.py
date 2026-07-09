import sqlite3

from fastapi import APIRouter, Depends, Query

from app.db import get_connection
from app.schemas import CweDistributionResponse
from app.services import queries

router = APIRouter()


@router.get("/api/metrics/cwe-distribution", response_model=CweDistributionResponse)
def get_cwe_distribution(
    limit: int = Query(10, ge=1, le=100),
    start_date: str | None = None,
    end_date: str | None = None,
    conn: sqlite3.Connection = Depends(get_connection),
):
    return {"data": queries.cwe_distribution(conn, limit=limit, start_date=start_date, end_date=end_date)}
