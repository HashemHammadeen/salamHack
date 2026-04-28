# MCP (Model Context Protocol) stdio server

**Source file:** `financeflow/backend/mcp_server.py`

## Overview

- Uses **`mcp.server.fastmcp.FastMCP`** with **`mcp.run()`** (stdio transport) for Cursor/Claude Desktop style hosts.

- Shares the same SQLite file as the FastAPI app via **`api.database`**.

- Tools: **`list_tenants`**, **`get_clients`**, **`get_stockholders`**, **`add_stockholder`**, **`list_transactions`**—resolve tenant by id or name.

- Entry: `python mcp_server.py` from `financeflow/backend` (with venv activated).
