/** Base URL for the FinanceFlow API (paths like `core/...`, `dev/...` are appended). */
// Vite injects import.meta.env at build time; fall back for local dev.
const viteUrl = import.meta.env.VITE_API_URL;
export const API_BASE: string =
  typeof viteUrl === 'string' && viteUrl.length > 0 ? viteUrl : 'http://localhost:8000/api';
