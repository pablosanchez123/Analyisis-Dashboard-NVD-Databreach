import sqlite3
from typing import Literal

from fastapi import APIRouter, Depends

from app.db import get_connection
from app.schemas import SeverityTrendResponse
from app.services import queries

router = APIRouter()


@router.get("/api/metrics/severity-trend", response_model=SeverityTrendResponse)
def get_severity_trend(
    granularity: Literal["quarter", "month"] = "quarter",
    start_date: str | None = None,
    end_date: str | None = None,
    conn: sqlite3.Connection = Depends(get_connection),
):
    data = queries.severity_trend(conn, granularity=granularity, start_date=start_date, end_date=end_date)
    return {"granularity": granularity, "data": data}
