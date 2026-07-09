import sqlite3

from fastapi import APIRouter, Depends

from app.db import get_connection
from app.schemas import ForecastResponse
from app.services import queries
from app.services.queries import FORECAST_CAVEAT

router = APIRouter()


@router.get("/api/metrics/forecast", response_model=ForecastResponse)
def get_forecast(conn: sqlite3.Connection = Depends(get_connection)):
    return {"data": queries.forecast_data(conn), "caveat": FORECAST_CAVEAT}
