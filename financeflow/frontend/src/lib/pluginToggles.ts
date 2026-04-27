const key = (tenantId: string) => `ff_plugin_enabled_v1_${tenantId}`;

/** Persisted map: only `false` is stored; missing key means enabled. */
export function loadPluginToggles(tenantId: string): Record<string, boolean> {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(key(tenantId));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, boolean>;
    }
    return {};
  } catch {
    return {};
  }
}

export function savePluginToggles(tenantId: string, toggles: Record<string, boolean>) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(key(tenantId), JSON.stringify(toggles));
  } catch (e) {
    console.error('Plugin toggles save failed', e);
  }
}

export function isPluginToggledOn(toggles: Record<string, boolean>, pluginId: string): boolean {
  return toggles[pluginId] !== false;
}
