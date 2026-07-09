import sqlite3

from fastapi import APIRouter, Depends

from app.db import get_connection
from app.schemas import PatchTimeResponse
from app.services import queries

router = APIRouter()


@router.get("/api/metrics/patch-time", response_model=PatchTimeResponse)
def get_patch_time(
    start_date: str | None = None,
    end_date: str | None = None,
    conn: sqlite3.Connection = Depends(get_connection),
):
    return queries.patch_time(conn, start_date=start_date, end_date=end_date)
