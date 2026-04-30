import { useEffect, useState } from 'react';
import { Server, Key, Link as LinkIcon, AlertCircle } from 'lucide-react';

type McpStatus = {
  running: boolean;
  url: string;
  auth_type: string;
  api_key: string;
  claude_url: string;
  tools: { name: string; description: string }[];
};

export default function McpStatusPanel() {
  const [status, setStatus] = useState<McpStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // In local dev, MCP runs on port 8002. In prod, Vite injects a relative path.
    const mcpUrl = import.meta.env.VITE_MCP_URL || '/api/mcp/status';
    
    fetch(mcpUrl)
      .then(res => res.json())
      .then(data => {
        setStatus(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch MCP status", err);
        setError("Could not connect to MCP Server");
        setLoading(false);
      });
  }, []);

  const copyToClipboard = () => {
    if (status?.claude_url) {
      navigator.clipboard.writeText(status.claude_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="card p-6 mt-6 animate-pulse">
        <div className="h-6 w-48 bg-ink-black/10 rounded mb-4" />
        <div className="h-24 bg-ink-black/5 rounded" />
      </div>
    );
  }

  if (error || !status) {
    return (
      <div className="card p-6 mt-6 border-signal-orange/20 bg-signal-orange/5">
        <div className="flex items-center gap-2 mb-2 text-signal-orange">
          <AlertCircle size={20} />
          <h3 className="font-medium">MCP Server Offline</h3>
        </div>
        <p className="text-sm text-ink-black/60">Ensure your Piecemint Unified Server is running.</p>
      </div>
    );
  }

  return (
    <div className="card p-6 mt-6 border-emerald-500/20">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Server className="text-emerald-500" size={24} />
          <h3 className="text-lg font-bold tracking-tight text-ink-black">Model Context Protocol (MCP) Server</h3>
          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border border-emerald-300 bg-emerald-50 text-emerald-800 ml-2">
            Online
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-ink-black/60 mb-1 flex items-center gap-1">
              <LinkIcon size={14} /> Base URL
            </p>
            <code className="text-sm bg-ink-black/5 px-2 py-1 rounded block truncate">{status.url}</code>
          </div>
          
          <div>
            <p className="text-sm font-medium text-ink-black/60 mb-1 flex items-center gap-1">
              <Key size={14} /> Authentication
            </p>
            <p className="text-sm text-ink-black/80">
              Type: {status.auth_type === 'api_key' ? 'API Key / Bearer' : status.auth_type}
            </p>
          </div>

          <div className="pt-4">
            <p className="text-sm font-medium text-ink-black/85 mb-2">Claude Desktop Connector</p>
            <p className="text-xs text-ink-black/60 mb-3">
              Copy this URL and add it to your Claude Desktop or Web interface as a custom MCP server.
            </p>
            <div className="flex gap-2">
              <input 
                type="text" 
                readOnly 
                value={status.claude_url} 
                className="flex-1 rounded-lg border border-ink-black/15 bg-ink-black/5 px-3 py-2 text-xs outline-none font-mono truncate text-ink-black/70"
              />
              <button 
                onClick={copyToClipboard}
                className="pill-button px-4 py-2 text-sm whitespace-nowrap"
              >
                {copied ? 'Copied!' : 'Copy URL'}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-ink-black/5 rounded-xl p-4 max-h-[250px] overflow-y-auto">
          <p className="text-xs font-bold tracking-widest uppercase text-ink-black/50 mb-3">
            Registered Tools ({status.tools.length})
          </p>
          <ul className="space-y-2">
            {status.tools.map((tool, idx) => (
              <li key={idx} className="bg-white rounded-lg p-3 border border-ink-black/10">
                <p className="text-sm font-medium text-ink-black">{tool.name}</p>
                <p className="text-xs text-ink-black/60 mt-1 line-clamp-2" title={tool.description}>
                  {tool.description || 'No description provided'}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
