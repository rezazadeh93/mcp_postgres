"""Stdio MCP server: Hermes research tools over local Postgres."""

from __future__ import annotations

import json
import os
from collections.abc import Iterator
from contextlib import contextmanager
from datetime import date, datetime
from typing import Any

import psycopg
from fastmcp import FastMCP
from psycopg.rows import dict_row

mcp = FastMCP("hermes-db")

LIST_LIMIT_DEFAULT = 20
LIST_LIMIT_MAX = 50

LIST_COLUMNS = (
    "id",
    "university",
    "program_name",
    "country",
    "degree_level",
    "overall_fit",
    "research_status",
    "eligibility_status",
    "application_deadline",
)

RESEARCH_STATUSES = {
    "discovered",
    "researching",
    "researched",
    "verified",
    "rejected",
}

ELIGIBILITY_STATUSES = {
    "unknown",
    "eligible",
    "likely_eligible",
    "conditional",
    "likely_ineligible",
    "ineligible",
}


def _database_url() -> str:
    url = os.environ.get("DATABASE_URL")
    if not url:
        raise RuntimeError(
            "DATABASE_URL is not set. Example: "
            "postgresql://hermes:hermes@127.0.0.1:5432/hermes_db"
        )
    return url


@contextmanager
def db() -> Iterator[psycopg.Connection]:
    with psycopg.connect(_database_url(), row_factory=dict_row) as conn:
        yield conn


def _jsonable(value: Any) -> Any:
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, date):
        return value.isoformat()
    if isinstance(value, list):
        return [_jsonable(item) for item in value]
    return value


def _row_to_dict(row: dict[str, Any] | None) -> dict[str, Any] | None:
    if row is None:
        return None
    return {key: _jsonable(val) for key, val in row.items()}


def _parse_date(value: str | None) -> date | None:
    if value is None or value == "":
        return None
    return date.fromisoformat(value)


def _clamp_limit(limit: int | None) -> int:
    if limit is None:
        return LIST_LIMIT_DEFAULT
    return max(1, min(limit, LIST_LIMIT_MAX))


@mcp.tool
def list_programs(
    research_status: str | None = None,
    country: str | None = None,
    min_overall_fit: int | None = None,
    q: str | None = None,
    limit: int = LIST_LIMIT_DEFAULT,
) -> str:
    """List programs as compact rows (no curriculum text). Filter by status, country, min fit, or name search."""
    if research_status is not None and research_status not in RESEARCH_STATUSES:
        raise ValueError(f"research_status must be one of: {sorted(RESEARCH_STATUSES)}")
    if min_overall_fit is not None and not (0 <= min_overall_fit <= 100):
        raise ValueError("min_overall_fit must be between 0 and 100")

    capped = _clamp_limit(limit)
    where: list[str] = []
    params: list[Any] = []

    if research_status:
        where.append("research_status = %s")
        params.append(research_status)
    if country:
        where.append("country ILIKE %s")
        params.append(country)
    if min_overall_fit is not None:
        where.append("overall_fit >= %s")
        params.append(min_overall_fit)
    if q:
        where.append("(university ILIKE %s OR program_name ILIKE %s)")
        like = f"%{q}%"
        params.extend([like, like])

    sql = (
        "SELECT "
        + ", ".join(LIST_COLUMNS)
        + " FROM programs"
    )
    if where:
        sql += " WHERE " + " AND ".join(where)
    sql += " ORDER BY overall_fit DESC NULLS LAST, id ASC LIMIT %s"
    params.append(capped)

    with db() as conn:
        rows = conn.execute(sql, params).fetchall()

    programs = [_row_to_dict(row) for row in rows]
    return json.dumps({"count": len(programs), "programs": programs}, ensure_ascii=False)


@mcp.tool
def get_program(program_id: int) -> str:
    """Return the full program row by id."""
    with db() as conn:
        row = conn.execute(
            "SELECT * FROM programs WHERE id = %s",
            (program_id,),
        ).fetchone()

    if row is None:
        return json.dumps({"error": "not_found", "id": program_id})
    return json.dumps(_row_to_dict(row), ensure_ascii=False)


@mcp.tool
def add_program(
    university: str,
    program_name: str,
    program_url: str,
    country: str | None = None,
    city: str | None = None,
    degree_type: str | None = None,
    degree_level: str | None = None,
    subject_area: str | None = None,
    curriculum_summary: str | None = None,
    backend_fit: int | None = None,
    overall_fit: int | None = None,
    academic_eligibility: str | None = None,
    english_requirement: str | None = None,
    work_experience_requirement: str | None = None,
    application_start: str | None = None,
    application_deadline: str | None = None,
    intake: str | None = None,
    research_status: str = "discovered",
    eligibility_status: str = "unknown",
    uncertainties: str | None = None,
    source_urls: list[str] | None = None,
) -> str:
    """Insert a program. If program_url already exists, return that id without inserting."""
    if research_status not in RESEARCH_STATUSES:
        raise ValueError(f"research_status must be one of: {sorted(RESEARCH_STATUSES)}")
    if eligibility_status not in ELIGIBILITY_STATUSES:
        raise ValueError(
            f"eligibility_status must be one of: {sorted(ELIGIBILITY_STATUSES)}"
        )

    urls = source_urls or []
    start = _parse_date(application_start)
    deadline = _parse_date(application_deadline)

    insert_sql = """
        INSERT INTO programs (
            university, program_name, country, city, degree_type, degree_level,
            program_url, subject_area, curriculum_summary, backend_fit, overall_fit,
            academic_eligibility, english_requirement, work_experience_requirement,
            application_start, application_deadline, intake,
            research_status, eligibility_status, uncertainties, source_urls
        )
        VALUES (
            %s, %s, %s, %s, %s, %s,
            %s, %s, %s, %s, %s,
            %s, %s, %s,
            %s, %s, %s,
            %s, %s, %s, %s
        )
        ON CONFLICT (program_url) DO NOTHING
        RETURNING id
    """
    values = (
        university,
        program_name,
        country,
        city,
        degree_type,
        degree_level,
        program_url,
        subject_area,
        curriculum_summary,
        backend_fit,
        overall_fit,
        academic_eligibility,
        english_requirement,
        work_experience_requirement,
        start,
        deadline,
        intake,
        research_status,
        eligibility_status,
        uncertainties,
        urls,
    )

    with db() as conn:
        inserted = conn.execute(insert_sql, values).fetchone()
        if inserted:
            conn.commit()
            return json.dumps({"id": inserted["id"], "created": True})

        existing = conn.execute(
            "SELECT id FROM programs WHERE program_url = %s",
            (program_url,),
        ).fetchone()
        return json.dumps(
            {
                "id": existing["id"] if existing else None,
                "created": False,
                "already_exists": True,
            }
        )


@mcp.tool
def update_program_fit(
    program_id: int,
    backend_fit: int | None = None,
    overall_fit: int | None = None,
    curriculum_summary: str | None = None,
    uncertainties: str | None = None,
) -> str:
    """Patch fit scores and optional research notes. Does not change verification status."""
    if backend_fit is None and overall_fit is None and curriculum_summary is None and uncertainties is None:
        raise ValueError("Provide at least one of backend_fit, overall_fit, curriculum_summary, uncertainties")
    for name, value in (("backend_fit", backend_fit), ("overall_fit", overall_fit)):
        if value is not None and not (0 <= value <= 100):
            raise ValueError(f"{name} must be between 0 and 100")

    sets: list[str] = []
    params: list[Any] = []
    if backend_fit is not None:
        sets.append("backend_fit = %s")
        params.append(backend_fit)
    if overall_fit is not None:
        sets.append("overall_fit = %s")
        params.append(overall_fit)
    if curriculum_summary is not None:
        sets.append("curriculum_summary = %s")
        params.append(curriculum_summary)
    if uncertainties is not None:
        sets.append("uncertainties = %s")
        params.append(uncertainties)

    params.append(program_id)
    sql = f"UPDATE programs SET {', '.join(sets)} WHERE id = %s RETURNING id, backend_fit, overall_fit"

    with db() as conn:
        row = conn.execute(sql, params).fetchone()
        if row is None:
            return json.dumps({"error": "not_found", "id": program_id})
        conn.commit()
        return json.dumps({"updated": True, **_row_to_dict(row)}, ensure_ascii=False)


@mcp.tool
def mark_program_verified(program_id: int) -> str:
    """Set research_status to verified and stamp last_verified_at."""
    with db() as conn:
        row = conn.execute(
            """
            UPDATE programs
            SET research_status = 'verified', last_verified_at = now()
            WHERE id = %s
            RETURNING id, research_status, last_verified_at
            """,
            (program_id,),
        ).fetchone()
        if row is None:
            return json.dumps({"error": "not_found", "id": program_id})
        conn.commit()
        return json.dumps({"verified": True, **_row_to_dict(row)}, ensure_ascii=False)


if __name__ == "__main__":
    transport = os.environ.get("MCP_TRANSPORT", "stdio").strip().lower()
    if transport in {"http", "streamable-http", "streamable_http"}:
        # FastMCP settings read FASTMCP_HOST / FASTMCP_PORT.
        os.environ.setdefault("FASTMCP_HOST", "127.0.0.1")
        os.environ.setdefault("FASTMCP_PORT", "8765")
        mcp.run(transport="streamable-http")
    elif transport in {"sse"}:
        os.environ.setdefault("FASTMCP_HOST", "127.0.0.1")
        os.environ.setdefault("FASTMCP_PORT", "8765")
        mcp.run(transport="sse")
    else:
        mcp.run()
