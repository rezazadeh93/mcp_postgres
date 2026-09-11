"""Shared PostgreSQL helpers for Hermes DB services."""

from __future__ import annotations

from collections.abc import Iterator
from contextlib import contextmanager
from datetime import date, datetime
from typing import Any

import psycopg
from psycopg.rows import dict_row


def database_url() -> str:
    url = __import__("os").environ.get("DATABASE_URL")
    if not url:
        raise RuntimeError(
            "DATABASE_URL is not set. Example: "
            "postgresql://hermes:hermes@127.0.0.1:5432/hermes_db"
        )
    return url


@contextmanager
def connection() -> Iterator[psycopg.Connection]:
    with psycopg.connect(database_url(), row_factory=dict_row) as conn:
        yield conn


def jsonable(value: Any) -> Any:
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, date):
        return value.isoformat()
    if isinstance(value, list):
        return [jsonable(item) for item in value]
    return value


def row_to_dict(row: dict[str, Any] | None) -> dict[str, Any] | None:
    if row is None:
        return None
    return {key: jsonable(val) for key, val in row.items()}
