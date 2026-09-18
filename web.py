"""Flask JSON API and static file server for the Hermes React web UI."""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any

from flask import Flask, abort, jsonify, request, send_from_directory

from db import connection as db
from db import row_to_dict as _row_to_dict

app = Flask(__name__, static_folder=None)

STATIC_DIR = Path(__file__).resolve().parent / "frontend" / "dist"

RESEARCH_STATUSES = [
    "discovered",
    "researching",
    "researched",
    "verified",
    "rejected",
]

ELIGIBILITY_STATUSES = [
    "unknown",
    "eligible",
    "likely_eligible",
    "conditional",
    "likely_ineligible",
    "ineligible",
]

VALID_FLAGS = {
    "snooze",
    "important",
    "low_possibility",
    "medium_possibility",
    "high_possibility",
    "for_applying",
    "no_fit",
    "NOT_RELEVANT",
}

POSSIBILITY_FLAGS = {"low_possibility", "medium_possibility", "high_possibility"}
EXCLUSION_FLAGS = {"no_fit", "NOT_RELEVANT"}

LIST_COLUMNS = [
    "p.id",
    "p.university",
    "p.program_name",
    "p.country",
    "p.degree_level",
    "p.overall_fit",
    "p.research_status",
    "p.eligibility_status",
    "p.application_deadline",
]

SORTABLE_COLUMNS = {
    "id": "p.id",
    "university": "p.university",
    "program_name": "p.program_name",
    "country": "p.country",
    "overall_fit": "p.overall_fit DESC NULLS LAST",
    "application_deadline": "p.application_deadline",
    "created_at": "p.created_at",
}

DEFAULT_PER_PAGE = 20


def _safe_int(value: Any, default: int, min_val: int | None = None, max_val: int | None = None) -> int:
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        return default
    if min_val is not None:
        parsed = max(parsed, min_val)
    if max_val is not None:
        parsed = min(parsed, max_val)
    return parsed


def _build_programs_query() -> tuple[str, list[Any], int, int, int]:
    page = _safe_int(request.args.get("page", "1"), 1, min_val=1)
    per_page = _safe_int(request.args.get("per_page", str(DEFAULT_PER_PAGE)), DEFAULT_PER_PAGE, min_val=1, max_val=200)

    research_status = request.args.get("research_status", "").strip() or None
    eligibility_status = request.args.get("eligibility_status", "").strip() or None
    country = request.args.get("country", "").strip() or None
    min_overall_fit = request.args.get("min_overall_fit", "").strip() or None
    q = request.args.get("q", "").strip() or None

    where: list[str] = []
    params: list[Any] = []

    if research_status:
        if research_status not in RESEARCH_STATUSES:
            abort(400, description=f"research_status must be one of: {RESEARCH_STATUSES}")
        where.append("p.research_status = %s")
        params.append(research_status)

    if eligibility_status:
        if eligibility_status not in ELIGIBILITY_STATUSES:
            abort(400, description=f"eligibility_status must be one of: {ELIGIBILITY_STATUSES}")
        where.append("p.eligibility_status = %s")
        params.append(eligibility_status)

    if country:
        where.append("p.country ILIKE %s")
        params.append(f"%{country}%")

    if min_overall_fit:
        try:
            fit = int(min_overall_fit)
        except ValueError:
            abort(400, description="min_overall_fit must be an integer")
        if not 0 <= fit <= 100:
            abort(400, description="min_overall_fit must be between 0 and 100")
        where.append("p.overall_fit >= %s")
        params.append(fit)

    if q:
        where.append("(p.university ILIKE %s OR p.program_name ILIKE %s)")
        like = f"%{q}%"
        params.extend([like, like])

    where_sql = " WHERE " + " AND ".join(where) if where else ""

    count_sql = f"SELECT COUNT(*) FROM programs p{where_sql}"
    with db() as conn:
        total = conn.execute(count_sql, list(params)).fetchone()["count"]

    sort_key = request.args.get("sort", "overall_fit")
    if sort_key not in SORTABLE_COLUMNS:
        sort_key = "overall_fit"
    order_clause = SORTABLE_COLUMNS[sort_key]

    data_sql = (
        "SELECT "
        + ", ".join(LIST_COLUMNS)
        + ", t.visited_at, COALESCE(t.flags, ARRAY[]::TEXT[]) AS flags"
        + " FROM programs p"
        + " LEFT JOIN program_tags t ON t.program_id = p.id"
        + where_sql
        + f" ORDER BY {order_clause}, p.id ASC LIMIT %s OFFSET %s"
    )
    total_pages = max(1, (total + per_page - 1) // per_page)
    page = min(page, total_pages)
    offset = (page - 1) * per_page

    data_params = list(params) + [per_page, offset]

    return data_sql, data_params, total, page, per_page


@app.route("/api/programs", methods=["GET"])
def api_list_programs():
    sql, params, total, page, per_page = _build_programs_query()

    with db() as conn:
        rows = conn.execute(sql, params).fetchall()

    programs = [_row_to_dict(row) for row in rows]
    total_pages = max(1, (total + per_page - 1) // per_page)

    return jsonify(
        {
            "programs": programs,
            "total": total,
            "page": page,
            "per_page": per_page,
            "total_pages": total_pages,
        }
    )


@app.route("/api/programs/<int:program_id>", methods=["GET"])
def api_get_program(program_id: int):
    with db() as conn:
        row = conn.execute(
            """
            SELECT p.*, t.visited_at, COALESCE(t.flags, ARRAY[]::TEXT[]) AS flags
            FROM programs p
            LEFT JOIN program_tags t ON t.program_id = p.id
            WHERE p.id = %s
            """,
            (program_id,),
        ).fetchone()

    if row is None:
        abort(404, description="Program not found")

    return jsonify(_row_to_dict(row))


@app.route("/api/programs/<int:program_id>/visit", methods=["POST"])
def api_visit_program(program_id: int):
    with db() as conn:
        exists = conn.execute("SELECT 1 FROM programs WHERE id = %s", (program_id,)).fetchone()
        if not exists:
            abort(404, description="Program not found")

        conn.execute(
            """
            INSERT INTO program_tags (program_id, visited_at)
            VALUES (%s, now())
            ON CONFLICT (program_id)
            DO UPDATE SET visited_at = now()
            """,
            (program_id,),
        )
        conn.commit()

    return jsonify({"visited": True})


def _normalize_flags(data: dict[str, Any]) -> list[str]:
    """Return a validated, de-duplicated flag list from the request body."""
    if "flags" in data:
        raw = data["flags"]
        if not isinstance(raw, list):
            abort(400, description="flags must be an array")
        flags = [str(item).strip() for item in raw if item is not None and str(item).strip()]
    elif "marker" in data:
        marker = data.get("marker")
        if marker is None:
            return []
        if marker == "want_to_apply":
            marker = "for_applying"
        if marker not in VALID_FLAGS:
            abort(400, description=f"marker must be one of: {sorted(VALID_FLAGS)} or null")
        return [marker]
    else:
        abort(400, description="request must include 'flags' array or legacy 'marker' field")

    invalid = sorted({f for f in flags if f not in VALID_FLAGS})
    if invalid:
        abort(400, description=f"invalid flags: {invalid}; allowed: {sorted(VALID_FLAGS)}")

    # Enforce mutual exclusion and dependency rules.
    flag_set = set(flags)
    possibilities = flag_set & POSSIBILITY_FLAGS
    exclusions = flag_set & EXCLUSION_FLAGS

    if len(possibilities) > 1:
        abort(400, description=f"only one possibility flag allowed: {sorted(POSSIBILITY_FLAGS)}")
    if len(exclusions) > 1:
        abort(400, description=f"only one exclusion flag allowed: {sorted(EXCLUSION_FLAGS)}")
    if exclusions and possibilities:
        abort(400, description="exclusion flags cannot be set with possibility flags")
    if "for_applying" in flag_set and not possibilities:
        abort(400, description="for_applying requires a possibility flag")
    if "for_applying" in flag_set and exclusions:
        abort(400, description="for_applying cannot be set with exclusion flags")

    return list(dict.fromkeys(flags))


@app.route("/api/programs/<int:program_id>/marker", methods=["POST"])
def api_set_marker(program_id: int):
    data = request.get_json(silent=True) or {}
    flags = _normalize_flags(data)

    with db() as conn:
        exists = conn.execute("SELECT 1 FROM programs WHERE id = %s", (program_id,)).fetchone()
        if not exists:
            abort(404, description="Program not found")

        conn.execute(
            """
            INSERT INTO program_tags (program_id, visited_at, flags)
            VALUES (%s, now(), %s)
            ON CONFLICT (program_id)
            DO UPDATE SET flags = %s, visited_at = now()
            """,
            (program_id, flags, flags),
        )
        conn.commit()

    return jsonify({"flags": flags})


@app.route("/api/filters", methods=["GET"])
def api_filters():
    with db() as conn:
        countries = [
            row["country"]
            for row in conn.execute(
                "SELECT DISTINCT country FROM programs WHERE country IS NOT NULL AND country <> '' ORDER BY country"
            ).fetchall()
        ]

    return jsonify(
        {
            "research_statuses": RESEARCH_STATUSES,
            "eligibility_statuses": ELIGIBILITY_STATUSES,
            "flags": sorted(VALID_FLAGS),
            "countries": countries,
        }
    )


@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_static(path: str):
    if not STATIC_DIR.exists():
        abort(503, description="Frontend build not found. Run 'npm run build' in the frontend directory.")

    requested = STATIC_DIR / path
    if path and requested.is_file():
        return send_from_directory(STATIC_DIR, path)

    index = STATIC_DIR / "index.html"
    if index.is_file():
        return send_from_directory(STATIC_DIR, "index.html")

    abort(503, description="Frontend build not found. Run 'npm run build' in the frontend directory.")


if __name__ == "__main__":
    host = os.environ.get("FLASK_RUN_HOST", "127.0.0.1")
    port = _safe_int(os.environ.get("FLASK_RUN_PORT", "8080"), 8080, min_val=1, max_val=65535)
    debug = os.environ.get("FLASK_DEBUG", "false").lower() in {"1", "true", "yes"}
    app.run(host=host, port=port, debug=debug)
