import sqlite3

from fastapi import APIRouter, Depends, HTTPException, Query

from app.db import get_connection
from app.schemas import BriefingResponse
from app.services import queries

router = APIRouter()


@router.get("/api/briefing", response_model=BriefingResponse)
def get_briefing(
    year: int | None = Query(None, ge=2019),
    quarter: int | None = Query(None, ge=1, le=4),
    conn: sqlite3.Connection = Depends(get_connection),
):
    if (year is None) != (quarter is None):
        raise HTTPException(status_code=400, detail="Provide both 'year' and 'quarter', or neither")
    try:
        return queries.quarterly_briefing(conn, year=year, quarter=quarter)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
