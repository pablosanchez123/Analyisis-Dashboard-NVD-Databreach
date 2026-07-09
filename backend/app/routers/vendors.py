import sqlite3

from fastapi import APIRouter, Depends, Query

from app.db import get_connection
from app.schemas import TopVendorsResponse
from app.services import queries

router = APIRouter()


@router.get("/api/metrics/top-vendors", response_model=TopVendorsResponse)
def get_top_vendors(
    limit: int = Query(10, ge=1, le=100),
    start_date: str | None = None,
    end_date: str | None = None,
    conn: sqlite3.Connection = Depends(get_connection),
):
    return {"data": queries.top_vendors(conn, limit=limit, start_date=start_date, end_date=end_date)}
