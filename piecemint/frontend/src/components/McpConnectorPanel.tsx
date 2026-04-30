import { useEffect, useState } from 'react';
import {
  Server,
  Key,
  Link as LinkIcon,
  AlertCircle,
  CheckCircle2,
  Copy,
  Check,
  Wrench,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

type McpTool = { name: string; description: string };

type McpStatus = {
  running: boolean;
  url: string;
  auth_type: string;
  api_key: string;
  claude_url: string;
  transport: string;
  tools: McpTool[];
};

export default function McpConnectorPanel() {
  const [status, setStatus] = useState<McpStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const mcpUrl =
    import.meta.env.VITE_MCP_URL || '/api/mcp/status';

  const fetchStatus = async () => {
    try {
      setRefreshing(true);
      const res = await fetch(mcpUrl);
      const data: McpStatus = await res.json();
      setStatus(data);
      setError(null);
    } catch {
      setError('Could not connect to the MCP server.');
      setStatus(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void fetchStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const copy = (text: string, setter: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  /* ─── Loading skeleton ─── */
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="card p-6">
          <div className="h-6 w-52 bg-ink-black/10 rounded mb-4" />
          <div className="h-40 bg-ink-black/5 rounded-xl" />
        </div>
      </div>
    );
  }

  /* ─── Offline state ─── */
  if (error || !status) {
    return (
      <div className="space-y-6">
        <section className="card p-8 border-signal-orange/20 bg-signal-orange/[0.04]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-signal-orange/10 flex items-center justify-center">
              <AlertCircle className="text-signal-orange" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-medium text-ink-black">
                MCP Server Offline
              </h2>
              <p className="text-sm text-ink-black/60">
                The server could not be reached
              </p>
            </div>
          </div>
          <div className="bg-white/80 rounded-xl p-5 border border-ink-black/10 space-y-3">
            <p className="text-sm text-ink-black/75 leading-relaxed">
              Make sure the Piecemint Unified Server is running.
              In local development, start it with:
            </p>
            <code className="block text-xs bg-ink-black/5 px-4 py-3 rounded-lg font-mono text-ink-black/80">
              python -m uvicorn unified_app:app --port 10000
            </code>
            <p className="text-xs text-ink-black/50">
              In production (Render/Railway), the MCP server runs automatically alongside the app.
            </p>
          </div>
          <button
            onClick={() => {
              setLoading(true);
              void fetchStatus();
            }}
            className="pill-button mt-5 inline-flex items-center gap-2"
          >
            <RefreshCw size={16} /> Retry connection
          </button>
        </section>
      </div>
    );
  }

  /* ─── Online state ─── */
  return (
    <div className="space-y-6">
      {/* Connection status banner */}
      <section className="card p-6 border-emerald-200/60">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center border border-emerald-200">
              <Server className="text-emerald-600" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-medium text-ink-black">
                MCP Server
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
                <span className="text-xs font-medium text-emerald-700">
                  Online
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => void fetchStatus()}
            disabled={refreshing}
            className="pill-button-secondary inline-flex items-center gap-2 text-sm"
            title="Refresh status"
          >
            <RefreshCw
              size={14}
              className={refreshing ? 'animate-spin' : ''}
            />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Connection details */}
          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold tracking-widest uppercase text-ink-black/45 mb-2 flex items-center gap-1.5">
                <LinkIcon size={12} /> Endpoint
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm bg-ink-black/[0.04] border border-ink-black/10 px-3 py-2 rounded-xl font-mono text-ink-black/75 truncate">
                  {status.url}
                </code>
              </div>
            </div>
            <div>
              <p className="text-xs font-bold tracking-widest uppercase text-ink-black/45 mb-2 flex items-center gap-1.5">
                <Key size={12} /> API Key
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm bg-ink-black/[0.04] border border-ink-black/10 px-3 py-2 rounded-xl font-mono text-ink-black/75 truncate">
                  {status.api_key
                    ? `${status.api_key.slice(0, 8)}${'•'.repeat(Math.max(0, status.api_key.length - 8))}`
                    : '(not set)'}
                </code>
                {status.api_key && (
                  <button
                    onClick={() => copy(status.api_key, setCopiedKey)}
                    className="shrink-0 h-9 w-9 rounded-xl border border-ink-black/10 bg-white flex items-center justify-center text-ink-black/60 hover:text-ink-black hover:border-ink-black/25 transition-colors"
                    title="Copy API key"
                  >
                    {copiedKey ? (
                      <Check size={16} className="text-emerald-500" />
                    ) : (
                      <Copy size={16} />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-ink-black/[0.03] border border-ink-black/8 p-4">
              <p className="text-xs text-ink-black/50 mb-1">Transport</p>
              <p className="text-sm font-medium text-ink-black">
                {status.transport === 'sse' ? 'SSE (Server-Sent Events)' : 'Streamable HTTP'}
              </p>
            </div>
            <div className="rounded-xl bg-ink-black/[0.03] border border-ink-black/8 p-4">
              <p className="text-xs text-ink-black/50 mb-1">Auth</p>
              <p className="text-sm font-medium text-ink-black">
                {status.auth_type === 'api_key' ? 'Bearer / Query' : status.auth_type}
              </p>
            </div>
            <div className="rounded-xl bg-ink-black/[0.03] border border-ink-black/8 p-4">
              <p className="text-xs text-ink-black/50 mb-1">Tools</p>
              <p className="text-sm font-medium text-ink-black">
                {status.tools.length} registered
              </p>
            </div>
            <div className="rounded-xl bg-ink-black/[0.03] border border-ink-black/8 p-4">
              <p className="text-xs text-ink-black/50 mb-1">Status</p>
              <p className="text-sm font-medium text-emerald-600 flex items-center gap-1">
                <CheckCircle2 size={14} /> Healthy
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Claude connector URL */}
      <section className="card p-6">
        <h3 className="text-sm font-bold tracking-widest uppercase text-ink-black/50 mb-4">
          Connect to Claude
        </h3>
        <p className="text-sm text-ink-black/70 mb-4 max-w-2xl leading-relaxed">
          Copy the URL below and paste it into{' '}
          <strong>Claude Desktop → Settings → MCP Servers → Add</strong> or into
          the Claude web interface as a custom MCP server.
        </p>
        <div className="flex gap-2 items-center">
          <input
            type="text"
            readOnly
            value={status.claude_url}
            className="flex-1 rounded-xl border border-ink-black/15 bg-ink-black/[0.03] px-4 py-2.5 text-sm font-mono outline-none truncate text-ink-black/70"
          />
          <button
            onClick={() => copy(status.claude_url, setCopiedUrl)}
            className="pill-button inline-flex items-center gap-2 shrink-0"
          >
            {copiedUrl ? (
              <>
                <Check size={16} /> Copied!
              </>
            ) : (
              <>
                <Copy size={16} /> Copy URL
              </>
            )}
          </button>
        </div>
        <a
          href="https://modelcontextprotocol.io/quickstart/user"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-signal-orange font-medium mt-3 hover:underline"
        >
          MCP setup guide <ExternalLink size={12} />
        </a>
      </section>

      {/* Tool registry */}
      <section className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold tracking-widest uppercase text-ink-black/50 flex items-center gap-2">
            <Wrench size={14} /> Registered Tools
          </h3>
          <span className="text-xs font-medium text-ink-black/40 bg-ink-black/5 px-2.5 py-1 rounded-full">
            {status.tools.length}
          </span>
        </div>
        {status.tools.length === 0 ? (
          <p className="text-sm text-ink-black/60">
            No tools registered. Make sure plugins with{' '}
            <code className="text-xs">mcp_tools.py</code> files are in the{' '}
            <code className="text-xs">plugins/</code> directory.
          </p>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {status.tools.map((tool, idx) => (
              <li
                key={idx}
                className="rounded-xl border border-ink-black/10 bg-white/70 p-4 hover:bg-white/90 transition-colors"
              >
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 shrink-0 w-6 h-6 rounded-lg bg-signal-orange/10 flex items-center justify-center">
                    <Wrench size={12} className="text-signal-orange" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink-black truncate">
                      {tool.name}
                    </p>
                    <p
                      className="text-xs text-ink-black/55 mt-1 line-clamp-2"
                      title={tool.description}
                    >
                      {tool.description || 'No description'}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
