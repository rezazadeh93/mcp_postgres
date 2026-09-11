FROM python:3.13-slim-bookworm

COPY --from=ghcr.io/astral-sh/uv:0.12.12 /uv /uvx /bin/

WORKDIR /app

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project

COPY sql/init.sql ./sql/init.sql
COPY server.py ./

ENV MCP_TRANSPORT=streamable-http
ENV FASTMCP_HOST=0.0.0.0
ENV FASTMCP_PORT=8765
ENV FASTMCP_LOG_LEVEL=INFO

EXPOSE 8765

CMD ["uv", "run", "--no-sync", "python", "server.py"]
