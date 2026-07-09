import sqlite3

from fastapi import APIRouter, Depends

from app.db import get_connection
from app.schemas import MetaResponse
from app.services import queries

router = APIRouter()


@router.get("/api/meta", response_model=MetaResponse)
def get_meta(conn: sqlite3.Connection = Depends(get_connection)):
    return queries.meta(conn)
