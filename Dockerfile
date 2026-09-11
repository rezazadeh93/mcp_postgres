# Build the React frontend.
FROM node:20-slim AS frontend-build
WORKDIR /frontend
COPY frontend/package.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Runtime image for MCP and web services.
FROM python:3.13-slim-bookworm

COPY --from=ghcr.io/astral-sh/uv:0.12.12 /uv /uvx /bin/

WORKDIR /app

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project

COPY sql/init.sql ./sql/init.sql
COPY db.py ./
COPY server.py ./
COPY web.py ./
COPY --from=frontend-build /frontend/dist ./frontend/dist

ENV MCP_TRANSPORT=streamable-http
ENV FASTMCP_HOST=0.0.0.0
ENV FASTMCP_PORT=8765
ENV FASTMCP_LOG_LEVEL=INFO

EXPOSE 8765

CMD ["uv", "run", "--no-sync", "python", "server.py"]
