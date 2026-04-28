# Tenant resolution for MCP and scripts

**Source file:** `financeflow/backend/api/tenant_query.py`

## Overview

- **`resolve_tenant_id(db, tenant_id_or_name)`** finds a tenant by **primary id** (e.g. `tenant_a`) or by **case-insensitive display `name`** (e.g. `Acme Corp`).

- Used by **`mcp_server.py`** so tools can accept either form from an LLM.
