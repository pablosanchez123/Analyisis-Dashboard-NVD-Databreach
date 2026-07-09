import sqlite3
from collections.abc import Generator

from app.config import settings


def connect() -> sqlite3.Connection:
    conn = sqlite3.connect(settings.database_path, check_same_thread=False)
    conn.execute("PRAGMA query_only=ON")
    return conn


_connection: sqlite3.Connection | None = None


def get_connection() -> Generator[sqlite3.Connection, None, None]:
    global _connection
    if _connection is None:
        _connection = connect()
    yield _connection
