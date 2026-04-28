import { baseCategoriesForKind, ENTITY_KINDS, type EntityKind } from './categoryTaxonomy';
import { getItemMigrated, setItemMigrated } from './localStorageScope';

const REG_KEY = 'ff_category_registry_v1';
const ASG_KEY = 'ff_category_assignments_v1';

/** User + AI custom labels by kind (merged with base at runtime). */
export type CategoryRegistryExtra = Record<EntityKind, string[]>;
export type CategoryAssignments = Record<EntityKind, Record<string, string>>;

const emptyReg = (): CategoryRegistryExtra => ({
  client: [],
  supplier: [],
  transaction: [],
  stockholder: [],
});

const emptyAsg = (): CategoryAssignments => ({
  client: {},
  supplier: {},
  transaction: {},
  stockholder: {},
});

function uniqSorted(arr: string[]): string[] {
  return [...new Set(arr.map((s) => s.trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b)
  );
}

export function loadRegistryExtra(): CategoryRegistryExtra {
  if (typeof localStorage === 'undefined') return emptyReg();
  try {
    const raw = getItemMigrated(REG_KEY);
    if (!raw) return emptyReg();
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return emptyReg();
    const o = parsed as Record<string, unknown>;
    const out = emptyReg();
    for (const key of ENTITY_KINDS) {
      const v = o[key];
      if (Array.isArray(v)) {
        out[key] = v.map((x) => String(x)).filter(Boolean);
      }
    }
    return out;
  } catch {
    return emptyReg();
  }
}

export function saveRegistryExtra(reg: CategoryRegistryExtra): void {
  setItemMigrated(REG_KEY, JSON.stringify(reg));
}

export function loadAssignments(): CategoryAssignments {
  if (typeof localStorage === 'undefined') return emptyAsg();
  try {
    const raw = getItemMigrated(ASG_KEY);
    if (!raw) return emptyAsg();
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return emptyAsg();
    const o = parsed as Record<string, unknown>;
    const out = emptyAsg();
    for (const key of ENTITY_KINDS) {
      const v = o[key];
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        out[key] = { ...(v as Record<string, string>) };
      }
    }
    return out;
  } catch {
    return emptyAsg();
  }
}

export function saveAssignments(a: CategoryAssignments): void {
  setItemMigrated(ASG_KEY, JSON.stringify(a));
}

export function optionsForKind(
  kind: EntityKind,
  regExtra: CategoryRegistryExtra
): string[] {
  return uniqSorted([...baseCategoriesForKind(kind), ...(regExtra[kind] || [])]);
}

/**
 * Add label to extra registry if not already covered by base+existing extra.
 */
export function addLabelsToRegistry(
  kind: EntityKind,
  labels: string[],
  regExtra: CategoryRegistryExtra
): CategoryRegistryExtra {
  const base = new Set(baseCategoriesForKind(kind).map((s) => s.toLowerCase()));
  const nextExtra = [...(regExtra[kind] || [])];
  const have = new Set([...base, ...optionsForKind(kind, regExtra).map((s) => s.toLowerCase())]);
  for (const raw of labels) {
    const s = String(raw).trim();
    if (!s) continue;
    const low = s.toLowerCase();
    if (have.has(low)) continue;
    have.add(low);
    nextExtra.push(s);
  }
  return { ...regExtra, [kind]: nextExtra };
}

/**
 * Apply AI map: merge new categories, set assignments. Unknown ids are ignored.
 */
export function applyAiLayer(
  regExtra: CategoryRegistryExtra,
  assignments: CategoryAssignments,
  layer: {
    clients?: Record<string, string>;
    suppliers?: Record<string, string>;
    transactions?: Record<string, string>;
    stockholders?: Record<string, string>;
  }
): { regExtra: CategoryRegistryExtra; assignments: CategoryAssignments } {
  let re: CategoryRegistryExtra = {
    client: [...regExtra.client],
    supplier: [...regExtra.supplier],
    transaction: [...regExtra.transaction],
    stockholder: [...regExtra.stockholder],
  };
  const asg: CategoryAssignments = {
    client: { ...assignments.client },
    supplier: { ...assignments.supplier },
    transaction: { ...assignments.transaction },
    stockholder: { ...assignments.stockholder },
  };

  const apply = (kind: EntityKind, m: Record<string, string> | undefined) => {
    if (!m) return;
    const labels = Object.values(m);
    re = addLabelsToRegistry(kind, labels, re);
    for (const [id, cat] of Object.entries(m)) {
      if (!id || !String(cat).trim()) continue;
      asg[kind] = { ...asg[kind], [id]: String(cat).trim() };
    }
  };

  apply('client', layer.clients);
  apply('supplier', layer.suppliers);
  apply('transaction', layer.transactions);
  apply('stockholder', layer.stockholders);

  saveRegistryExtra(re);
  saveAssignments(asg);
  return { regExtra: re, assignments: asg };
}
