import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen } from 'lucide-react';

export default function PluginDocsPage() {
  return (
    <div className="space-y-12 max-w-3xl pb-16">
      <header>
        <Link
          to="/marketplace"
          className="inline-flex items-center gap-2 text-sm font-medium text-signal-orange hover:underline underline-offset-2 mb-6"
        >
          <ArrowLeft size={16} aria-hidden />
          Back to plugin library
        </Link>
        <div className="flex items-start gap-3">
          <BookOpen className="shrink-0 text-ink-black/50 mt-1" size={28} aria-hidden />
          <div>
            <h1 className="text-3xl md:text-4xl font-medium tracking-tight mb-2">Build your own plugin</h1>
            <p className="text-ink-black/70 text-lg">
              How FinanceFlow discovers modules under <code className="text-sm bg-ink-black/5 px-1.5 py-0.5 rounded">plugins/</code> and
              exposes them in the app.
            </p>
          </div>
        </div>
      </header>

      <section className="space-y-4">
        <h2 className="text-xl font-medium">1. Folder layout</h2>
        <p className="text-ink-black/80">
          Each plugin is a directory next to the backend code, for example{' '}
          <code className="text-sm bg-ink-black/5 px-1.5 py-0.5 rounded">financeflow/backend/plugins/my_plugin/</code>.
          Two files are required:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-ink-black/80">
          <li>
            <strong>manifest.yaml</strong> — metadata: <code className="text-xs">name</code>,{' '}
            <code className="text-xs">description</code>, <code className="text-xs">version</code>.
          </li>
          <li>
            <strong>logic.py</strong> — Python module that defines a FastAPI{' '}
            <code className="text-xs">router</code> your routes attach to.
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-medium">2. manifest.yaml</h2>
        <pre className="text-sm bg-ink-black/5 p-4 rounded-2xl overflow-x-auto border border-ink-black/10">
{`name: "My Plugin"
description: "What it does in one line."
version: "1.0.0"`}
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-medium">3. logic.py and routes</h2>
        <p className="text-ink-black/80">
          Import <code className="text-xs bg-ink-black/5 px-1 rounded">APIRouter</code> from FastAPI, create{' '}
          <code className="text-xs bg-ink-black/5 px-1 rounded">router = APIRouter()</code>, and register paths. The
          plugin manager mounts your router under the prefix{' '}
          <code className="text-xs bg-ink-black/5 px-1 rounded">/api/plugins</code>, so a route like{' '}
          <code className="text-xs">@router.get(&quot;/my_plugin/hello&quot;)</code> is served at{' '}
          <code className="text-xs">/api/plugins/my_plugin/hello</code>.
        </p>
        <pre className="text-sm bg-ink-black/5 p-4 rounded-2xl overflow-x-auto border border-ink-black/10">
{`from fastapi import APIRouter

router = APIRouter()

@router.get("/my_plugin/hello")
def hello():
    return {"message": "Hello from my plugin"}`}
        </pre>
        <p className="text-ink-black/70 text-sm">
          You can use shared app modules (e.g. database) by importing from the backend package the same way existing
          plugins do; keep imports stable when you upgrade FinanceFlow.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-medium">4. Enable in the UI</h2>
        <p className="text-ink-black/80">
          After files are on disk, restart the API process so routes are registered. Open{' '}
          <strong>Plugin library</strong> and use <strong>Refresh plugin list</strong>. Turn the plugin on with the
          switch; it appears in the sidebar when enabled.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-medium">5. Add your plugin from the app</h2>
        <p className="text-ink-black/80">
          On the plugin library page, <strong>Add your plugin</strong> can write <code className="text-xs">logic.py</code> and
          a generated or pasted <code className="text-xs">manifest.yaml</code> into <code className="text-xs">plugins/&lt;id&gt;/</code> on
          the machine running the API. For production, set <code className="text-xs">FF_DISABLE_PLUGIN_UPLOAD=1</code> on the server
          to disable this. Always restart the API after installing.
        </p>
      </section>

      <p className="text-sm text-ink-black/55">
        Reference: see existing plugins under <code className="text-xs">backend/plugins/</code> in this repository for
        full examples (e.g. tax calculator, invoice generator).
      </p>
    </div>
  );
}
