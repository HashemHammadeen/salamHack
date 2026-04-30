import re
import os

with open('mcp_server.py', 'r', encoding='utf-8') as f:
    code = f.read()

# Imports
new_imports = '''import importlib.util
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
'''
code = re.sub(r'import json\nimport os\nimport sys\n', 'import json\nimport os\nimport sys\n' + new_imports, code)

# Rename FastMCP instance
code = code.replace('mcp = FastMCP(', 'mcp_core = FastMCP(')
code = code.replace('@mcp.tool()', '@mcp_core.tool()')

# At the end of the file, replace the __main__ block and add our new code
new_tail = '''
def load_plugins():
    plugins_dir = os.path.join(_BACKEND_ROOT, "plugins")
    if not os.path.isdir(plugins_dir):
        return
    for entry in os.scandir(plugins_dir):
        if entry.is_dir():
            mcp_tools_path = os.path.join(entry.path, "mcp_tools.py")
            if os.path.isfile(mcp_tools_path):
                spec = importlib.util.spec_from_file_location(f"plugins.{entry.name}.mcp_tools", mcp_tools_path)
                if spec and spec.loader:
                    module = importlib.util.module_from_spec(spec)
                    sys.modules[f"plugins.{entry.name}.mcp_tools"] = module
                    spec.loader.exec_module(module)
                    if hasattr(module, "register_mcp_tools"):
                        module.register_mcp_tools(mcp_core, session_scope, resolve_tenant_id, db_models)

load_plugins()

mcp = FastAPI(title="Piecemint MCP")

mcp.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@mcp.middleware("http")
async def mcp_auth(request: Request, call_next):
    if request.url.path.startswith("/mcp"):
        api_key = os.environ.get("MCP_API_KEY", "")
        if api_key:
            auth_header = request.headers.get("Authorization", "")
            query_key = request.query_params.get("api_key", "")
            
            provided_key = None
            if auth_header.startswith("Bearer "):
                provided_key = auth_header.split(" ")[1]
            elif query_key:
                provided_key = query_key
                
            if provided_key != api_key:
                return JSONResponse(status_code=401, content={"error": "Unauthorized"})

    return await call_next(request)

@mcp.get("/api/mcp/status")
def mcp_status(request: Request):
    api_key = os.environ.get("MCP_API_KEY", "")
    base_url = str(request.base_url).rstrip("/")
    url = f"{base_url}/mcp"
    claude_url = f"{base_url}/mcp?api_key={api_key}" if api_key else url
    
    # Attempt to list tools from FastMCP internals
    tool_list = []
    try:
        # In fastmcp 1.0.0, tools might be in _tool_manager.tools or mcp_core.tools
        tools_dict = None
        if hasattr(mcp_core, "_tool_manager") and hasattr(mcp_core._tool_manager, "tools"):
            tools_dict = mcp_core._tool_manager.tools
        elif hasattr(mcp_core, "tools"):
            tools_dict = mcp_core.tools
            
        if tools_dict:
            for name, t in tools_dict.items():
                tool_list.append({"name": name, "description": getattr(t, "description", getattr(t, "docstring", ""))})
        else:
            tool_list = [{"name": "tools_loaded", "description": "Tools active but could not be enumerated."}]
    except Exception:
        pass
        
    return {
        "running": True,
        "url": url,
        "auth_type": "api_key",
        "api_key": api_key,
        "claude_url": claude_url,
        "tools": tool_list
    }

mcp.mount("/mcp", mcp_core.streamable_http_app())

@mcp.on_event("startup")
def print_startup():
    port = os.environ.get("PORT", "8000")
    print("MCP Server running at:")
    print(f"- Bearer auth: http://0.0.0.0:{port}/mcp")
    print(f"- Query auth (Claude Web): http://0.0.0.0:{port}/mcp?api_key=<key>")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("mcp_server:mcp", host="0.0.0.0", port=int(os.environ.get("PORT", 8000)), reload=True)
'''

code = re.sub(r'if __name__ == "__main__":\n    mcp\.run\(\)\n?$', new_tail, code)

with open('mcp_server.py', 'w', encoding='utf-8') as f:
    f.write(code)

print('Success')
