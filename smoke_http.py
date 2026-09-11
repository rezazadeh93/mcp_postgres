"""Quick MCP streamable HTTP smoke test."""
import json
import urllib.request

URL = "http://127.0.0.1:8765/mcp"
HEADERS = {"Accept": "application/json, text/event-stream", "Content-Type": "application/json"}


def post(payload: dict, headers: dict | None = None) -> tuple[str, dict]:
    req = urllib.request.Request(
        URL,
        data=json.dumps(payload).encode(),
        headers=headers or HEADERS,
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=20) as resp:
        raw = resp.read().decode()
        sid = resp.headers.get("mcp-session-id")
        return raw, {"mcp-session-id": sid}


raw, hdrs = post(
    {
        "jsonrpc": "2.0",
        "method": "initialize",
        "params": {
            "protocolVersion": "2024-11-05",
            "capabilities": {},
            "clientInfo": {"name": "smoke", "version": "1"},
        },
        "id": 1,
    }
)
print("initialize raw:", raw)

sid = hdrs.get("mcp-session-id")
print("session id:", sid)
if sid:
    tools_raw, _ = post({"jsonrpc": "2.0", "method": "tools/list", "params": {}, "id": 2}, {**HEADERS, "mcp-session-id": sid})
    print("tools/list raw:", tools_raw[:800])
