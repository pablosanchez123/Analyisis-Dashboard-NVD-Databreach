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
    conn: sqlite3.Connection = Depends(get_connection),
):
    data = queries.severity_trend(conn, granularity=granularity)
    return {"granularity": granularity, "data": data}
