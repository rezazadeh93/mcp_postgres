# Hermes DB (MCP + Postgres)

Lightweight containerized MCP server backed by local Postgres so a Hermes agent can store university-program research. Hermes connects over HTTP, not stdio.

```mermaid
flowchart LR
    Hermes[Hermes Agent] -->|streamable HTTP| MCP[hermes_mcp container]
    MCP -->|psycopg| PG[hermes_db container]
```

## Prerequisites

- Docker Desktop
- [uv](https://docs.astral.sh/uv/) (for local server edits / testing)

## Start the stack

```bash
docker compose up -d
```

First start runs [sql/init.sql](sql/init.sql) (table, CHECKs, indexes, `updated_at` trigger). Postgres data lives in the `hermes_pg_data` volume.

Wait until both services are healthy:

```bash
docker compose ps
```

Resource caps: 384 MB Postgres + 512 MB MCP, 0.75 CPU each (~1 GB RAM total).

## Wire Hermes (streamable HTTP)

Hermes connects to the running MCP container at `http://127.0.0.1:8765/mcp`:

```yaml
mcp_servers:
  hermes-db:
    url: "http://127.0.0.1:8765/mcp"
```

or if your Hermes/Cursor config uses JSON:

```json
{
  "mcpServers": {
    "hermes-db": {
      "url": "http://127.0.0.1:8765/mcp"
    }
  }
}
```

The server stays up in Docker. Hermes treats it as a remote MCP endpoint.

## Tools

| Tool | Purpose |
|---|---|
| `list_programs` | Compact list. Filters: `research_status`, `country`, `min_overall_fit`, `q`. Default 20 rows, max 50. Does not return curriculum text. |
| `get_program` | Full row by `program_id`. |
| `add_program` | Insert. Duplicate `program_url` returns the existing id (`already_exists: true`). |
| `update_program_fit` | Patch `backend_fit` / `overall_fit` and optional notes. Does not mark verified. |
| `mark_program_verified` | Sets `research_status = verified` and `last_verified_at = now()`. |

## Local server testing (no Docker)

If you change `server.py` and want to test before rebuilding:

```bash
uv sync
copy .env.example .env   # edit DATABASE_URL to 127.0.0.1 if needed
uv run python server.py
```

This launches stdio by default. For local HTTP:

```powershell
$Env:DATABASE_URL="postgresql://hermes:hermes@127.0.0.1:5432/hermes_db"
uv run python server.py
```

You must have Postgres running (e.g. from `docker compose up postgres -d`).

## Rebuild after edits

```bash
docker compose up -d --build mcp
```

## Inspect the database

```bash
docker compose exec postgres psql -U hermes -d hermes_db -c "\d programs"
```
