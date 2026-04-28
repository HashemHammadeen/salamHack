import { getItemMigrated, setItemMigrated } from './localStorageScope';

const STORAGE_KEY = 'ff_plugin_enabled_v1';

/** Persisted map: only `false` is stored; missing key means enabled. */
export function loadPluginToggles(): Record<string, boolean> {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = getItemMigrated(STORAGE_KEY);
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

export function savePluginToggles(toggles: Record<string, boolean>) {
  setItemMigrated(STORAGE_KEY, JSON.stringify(toggles));
}

export function isPluginToggledOn(toggles: Record<string, boolean>, pluginId: string): boolean {
  return toggles[pluginId] !== false;
}
