# Hermes DB (MCP + Postgres)

Lightweight containerized MCP server backed by local Postgres so a Hermes agent can store university-program research. Hermes connects over HTTP, not stdio.

```mermaid
flowchart LR
    Hermes[Hermes Agent] -->|streamable HTTP| MCP[hermes_mcp container]
    MCP -->|psycopg| PG[hermes_db container]
    User[Browser] -->|HTTP 8080| Web[hermes_web container]
    Web -->|static files| React[React SPA]
    Web -->|/api JSON| PG
```

## Prerequisites

- Docker Desktop
- [uv](https://docs.astral.sh/uv/) (for local server edits / testing)

## Start the stack

```bash
docker compose up -d
```

First start runs [sql/init.sql](sql/init.sql) (table, CHECKs, indexes, `updated_at` trigger). Postgres data lives in the `hermes_pg_data` volume.

For **existing** Postgres volumes, apply the marker/visit tracking migration before starting the web service:

```bash
docker compose cp sql/migration_001_tags.sql postgres:/tmp/migration_001_tags.sql
docker compose exec postgres psql -U hermes -d hermes_db -f /tmp/migration_001_tags.sql
```

Wait until both services are healthy:

```bash
docker compose ps
```

Resource caps: 384 MB Postgres + 512 MB MCP + 256 MB web, 0.75/0.75/0.5 CPU (~1.15 GB RAM total).

## Web UI

A lightweight React + TypeScript SPA is served by the Flask web service on port `8080`. After starting the stack:

- **List page:** [http://127.0.0.1:8080](http://127.0.0.1:8080) — filter, sort, and paginate programs.
- **Detail page:** click any row to see the full program record.

Supported filters on the list page:

- Free-text search (`university` or `program_name`)
- `research_status` and `eligibility_status`
- `country` (with autocomplete from existing rows)
- `min_overall_fit` (0–100)

Sortable columns: `overall_fit`, `university`, `program_name`, `country`, `application_deadline`, `created_at`, `id`.

### Persistent markers

Clicking a program marks it as visited and tints the row blue. You can also tag programs with:

| Marker | Button | Tint | Meaning |
|---|---|---|---|
| `snooze` | Snooze | amber | Must see again |
| `important` | Important | rose | High priority |
| `want_to_apply` | Apply | green | Plan to apply |

Markers are stored in the `program_tags` Postgres table and persist across sessions.

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

### Web UI only (no Docker)

To develop the React frontend locally:

```bash
# Terminal 1: run the Flask API
uv sync
$Env:DATABASE_URL="postgresql://hermes:hermes@127.0.0.1:5432/hermes_db"
uv run python web.py

# Terminal 2: run the Vite dev server
cd frontend
npm install
npm run dev
```

Vite proxies `/api` calls to Flask. Open [http://127.0.0.1:5173](http://127.0.0.1:5173).

To run just the Flask API and built static files without Vite:

```bash
cd frontend
npm install
npm run build
cd ..
$Env:DATABASE_URL="postgresql://hermes:hermes@127.0.0.1:5432/hermes_db"
uv run python web.py
```

Then open [http://127.0.0.1:8080](http://127.0.0.1:8080).

## Rebuild after edits

```bash
docker compose up -d --build
```

To rebuild only the MCP service:

```bash
docker compose up -d --build mcp
```

To rebuild only the web UI service:

```bash
docker compose up -d --build web
```

## Inspect the database

```bash
docker compose exec postgres psql -U hermes -d hermes_db -c "\d programs"
```

## Manage Postgres with pgAdmin

A lightweight pgAdmin container is included. After starting the stack, open it at [http://127.0.0.1:5050](http://127.0.0.1:5050):

- **Email:** `admin@hermes.dev`
- **Password:** `admin`

Then add a new server with:

- **Host:** `postgres`
- **Port:** `5432`
- **Database:** `hermes_db`
- **Username:** `hermes`
- **Password:** `hermes`
