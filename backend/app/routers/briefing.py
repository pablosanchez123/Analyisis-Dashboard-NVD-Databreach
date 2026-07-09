import sqlite3

from fastapi import APIRouter, Depends

from app.db import get_connection
from app.schemas import BriefingResponse
from app.services import queries

router = APIRouter()


@router.get("/api/briefing", response_model=BriefingResponse)
def get_briefing(conn: sqlite3.Connection = Depends(get_connection)):
    return queries.quarterly_briefing(conn)
