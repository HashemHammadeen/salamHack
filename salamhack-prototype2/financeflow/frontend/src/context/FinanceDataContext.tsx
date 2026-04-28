import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import axios from 'axios';
import type { PluginsState } from '../types/plugins';
import {
  isPluginToggledOn,
  loadPluginToggles,
  savePluginToggles,
} from '../lib/pluginToggles';
import type { InvoiceExportConfig } from '../types/invoiceExport';
import { toInvoiceApiBody } from '../types/invoiceExport';
import { defaultInvoiceDocument } from '../types/invoiceDocument';
import { loadInvoiceExport, saveInvoiceExport } from '../lib/invoiceExportStorage';
import { appendInvoiceHistory, amountForHistory, buildHistoryDetail } from '../lib/invoiceHistoryStorage';
import { bumpInvoiceSequence } from '../lib/invoiceNumber';
import type { EntityKind } from '../lib/categoryTaxonomy';
import {
  applyAiLayer,
  loadAssignments,
  loadRegistryExtra,
  optionsForKind,
  saveRegistryExtra,
  saveAssignments,
  addLabelsToRegistry,
  type CategoryAssignments,
  type CategoryRegistryExtra,
} from '../lib/categoryStorage';
import { API_BASE as API_URL } from '../lib/apiBase';

type FinanceDataContextValue = {
  clients: any[];
  suppliers: any[];
  transactions: any[];
  stockholders: any[];
  plugins: PluginsState;
  pluginToggles: Record<string, boolean>;
  taxReserve: any | null;
  forecast: any[];
  refresh: () => Promise<void>;
  isPluginInstalled: (id: string) => boolean;
  isPluginEnabled: (id: string) => boolean;
  isPluginActive: (id: string) => boolean;
  setPluginEnabled: (id: string, enabled: boolean) => void;
  searchExpenses: (query: string) => Promise<any[]>;
  invoiceExportConfig: InvoiceExportConfig;
  setInvoiceExportConfig: (
    update:
      | Partial<InvoiceExportConfig>
      | ((prev: InvoiceExportConfig) => InvoiceExportConfig)
  ) => void;
  downloadInvoice: (clientId: string, configOverride?: InvoiceExportConfig) => Promise<void>;
  getOptionsForKind: (kind: EntityKind) => string[];
  getEntityCategory: (kind: EntityKind, id: string, fallback?: string) => string;
  entityHasCustomCategory: (kind: EntityKind, id: string) => boolean;
  setEntityCategory: (kind: EntityKind, id: string, value: string) => void;
  runSmartCategorize: () => Promise<void>;
  smartCategorizeBusy: boolean;
  smartCategorizeError: string | null;
  smartCategorizeSuccess: string | null;
};

const FinanceDataContext = createContext<FinanceDataContextValue | null>(null);

export function FinanceDataProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [stockholders, setStockholders] = useState<any[]>([]);
  const [plugins, setPlugins] = useState<PluginsState>({ installed: [], available: [] });
  const [pluginToggles, setPluginTogglesState] = useState<Record<string, boolean>>(() =>
    loadPluginToggles()
  );
  const [taxReserve, setTaxReserve] = useState<any | null>(null);
  const [forecast, setForecast] = useState<any[]>([]);
  const [invoiceExportConfig, setInvoiceExportState] = useState<InvoiceExportConfig>(() =>
    loadInvoiceExport()
  );
  const [regExtra, setRegExtra] = useState<CategoryRegistryExtra>(() => loadRegistryExtra());
  const [assignments, setAssignments] = useState<CategoryAssignments>(() => loadAssignments());
  const [smartCategorizeBusy, setSmartCategorizeBusy] = useState(false);
  const [smartCategorizeError, setSmartCategorizeError] = useState<string | null>(null);
  const [smartCategorizeSuccess, setSmartCategorizeSuccess] = useState<string | null>(null);
  const catRegRef = useRef(regExtra);
  const catAsgRef = useRef(assignments);
  useEffect(() => {
    catRegRef.current = regExtra;
  }, [regExtra]);
  useEffect(() => {
    catAsgRef.current = assignments;
  }, [assignments]);

  const setInvoiceExportConfig = useCallback(
    (
      update:
        | Partial<InvoiceExportConfig>
        | ((prev: InvoiceExportConfig) => InvoiceExportConfig)
    ) => {
      setInvoiceExportState((prev) => {
        const next = typeof update === 'function' ? update(prev) : { ...prev, ...update };
        saveInvoiceExport(next);
        return next;
      });
    },
    []
  );

  const refresh = useCallback(async () => {
    try {
      const [clientsRes, suppliersRes, transRes, stockRes, pluginsRes] = await Promise.all([
        axios.get(`${API_URL}/core/clients`),
        axios.get(`${API_URL}/core/suppliers`),
        axios.get(`${API_URL}/core/transactions`),
        axios.get(`${API_URL}/core/stockholders`),
        axios.get(`${API_URL}/plugins`),
      ]);
      setClients(clientsRes.data);
      setSuppliers(suppliersRes.data);
      setTransactions(transRes.data);
      setStockholders(stockRes.data);
      setPlugins(pluginsRes.data);

      const installedIds = (pluginsRes.data.installed as { id: string }[])
        .map((p) => p.id)
        .filter((id) => isPluginToggledOn(pluginToggles, id));
      if (installedIds.includes('tax_calculator')) {
        const taxRes = await axios.get(`${API_URL}/plugins/tax_calculator/estimate`);
        setTaxReserve(taxRes.data);
      } else {
        setTaxReserve(null);
      }
      if (installedIds.includes('ai_prediction')) {
        const forecastRes = await axios.get(`${API_URL}/plugins/ai_prediction/forecast`);
        setForecast(forecastRes.data.forecast);
      } else {
        setForecast([]);
      }
    } catch (e) {
      console.error('FinanceData refresh error:', e);
    }
  }, [pluginToggles]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const isPluginInstalled = useCallback(
    (id: string) => plugins.installed.some((p) => p.id === id),
    [plugins.installed]
  );

  const isPluginEnabled = useCallback(
    (id: string) => isPluginToggledOn(pluginToggles, id),
    [pluginToggles]
  );

  const isPluginActive = useCallback(
    (id: string) => isPluginInstalled(id) && isPluginEnabled(id),
    [isPluginInstalled, isPluginEnabled]
  );

  const setPluginEnabled = useCallback((id: string, enabled: boolean) => {
    setPluginTogglesState((prev) => {
      const next = { ...prev };
      if (enabled) {
        delete next[id];
      } else {
        next[id] = false;
      }
      savePluginToggles(next);
      return next;
    });
  }, []);

  const searchExpenses = useCallback(
    async (query: string) => {
      if (!isPluginToggledOn(pluginToggles, 'expense_categorizer')) {
        return [] as any[];
      }
      const res = await axios.get(
        `${API_URL}/plugins/expense_categorizer/search?query=${encodeURIComponent(query)}`
      );
      return res.data.results as any[];
    },
    [pluginToggles]
  );

  const downloadInvoice = useCallback(
    async (clientId: string, configOverride?: InvoiceExportConfig) => {
      if (!isPluginToggledOn(pluginToggles, 'invoice_gen')) {
        return;
      }
      const config = configOverride ?? invoiceExportConfig;
      const body = toInvoiceApiBody(config);
      try {
        const response = await axios.post<Blob>(
          `${API_URL}/plugins/invoice_gen/generate/${clientId}`,
          body,
          {
            headers: {
              'Content-Type': 'application/json',
            },
            responseType: 'blob',
          }
        );

        const ext = config.outputFormat;
        const num = (config.document?.invoiceNumber || '').replace(/[/\\?%*:|"<>]/g, '-').trim();
        const fileStem = num.length > 0 ? `invoice_${num}` : `invoice_${clientId}`;

        const clientRow = clients.find((x) => x.id === clientId);
        const doc = config.document ?? defaultInvoiceDocument();
        appendInvoiceHistory({
          clientId,
          clientName: (clientRow?.name as string) ?? clientId,
          invoiceNumber: (config.document?.invoiceNumber && config.document.invoiceNumber.trim()) || '—',
          issueDate: (config.document?.issueDate as string) || '—',
          dueDate: (config.document?.dueDate as string) || '—',
          amount: amountForHistory(
            doc,
            clientRow?.total_billed != null ? Number(clientRow.total_billed) : 0
          ),
          outputFormat: ext,
          detail: buildHistoryDetail(doc),
          presentationTitle: (doc.invoiceNumber || '').trim() || (clientRow?.name as string) || undefined,
        });
        bumpInvoiceSequence();

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${fileStem}.${ext}`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } catch (e: unknown) {
        let msg = 'Could not download the invoice. Check that the API is running and try again.';
        if (axios.isAxiosError(e) && e.response?.data instanceof Blob) {
          try {
            const t = await e.response.data.text();
            const j = JSON.parse(t) as { detail?: string | { msg?: string }[] };
            if (typeof j.detail === 'string') {
              msg = j.detail;
            } else if (Array.isArray(j.detail) && j.detail[0] && typeof j.detail[0] === 'object' && 'msg' in (j.detail[0] as object)) {
              msg = String((j.detail[0] as { msg: string }).msg);
            } else if (t && t.length < 400) {
              msg = t;
            }
          } catch {
            /* keep default */
          }
        } else if (e instanceof Error && e.message) {
          msg = e.message;
        }
        window.alert(msg);
        throw e;
      }
    },
    [pluginToggles, invoiceExportConfig, clients]
  );

  const getOptionsForKind = useCallback(
    (kind: EntityKind) => optionsForKind(kind, regExtra),
    [regExtra]
  );

  const getEntityCategory = useCallback(
    (kind: EntityKind, id: string, fallback?: string) => {
      const a = assignments[kind][id];
      if (a != null && a.length > 0) return a;
      return fallback ?? '';
    },
    [assignments]
  );

  const entityHasCustomCategory = useCallback(
    (kind: EntityKind, id: string) => {
      const a = assignments[kind][id];
      return a != null && String(a).trim().length > 0;
    },
    [assignments]
  );

  const setEntityCategory = useCallback((kind: EntityKind, id: string, value: string) => {
    if (!id) return;
    if (!value.trim()) {
      setAssignments((a) => {
        const nextMap = { ...a[kind] };
        delete nextMap[id];
        const n = { ...a, [kind]: nextMap };
        saveAssignments(n);
        return n;
      });
      return;
    }
    setRegExtra((re) => {
      const next = addLabelsToRegistry(kind, [value], re);
      saveRegistryExtra(next);
      return next;
    });
    setAssignments((a) => {
      const n = { ...a, [kind]: { ...a[kind], [id]: value } };
      saveAssignments(n);
      return n;
    });
  }, []);

  const runSmartCategorize = useCallback(async () => {
    if (!isPluginToggledOn(pluginToggles, 'expense_categorizer')) {
      setSmartCategorizeSuccess(null);
      setSmartCategorizeError('Turn on Smart Categorizer in the plugin library.');
      return;
    }
    const hasAppCategory = (kind: EntityKind, id: string) =>
      Boolean(assignments[kind][id]?.trim());

    const uncClients = clients.filter((c: { id: string }) => !hasAppCategory('client', c.id));
    const uncSuppliers = suppliers.filter((s: { id: string }) => !hasAppCategory('supplier', s.id));
    const uncTrans = transactions.filter(
      (t: { id: string; category?: string }) => {
        if (hasAppCategory('transaction', t.id)) return false;
        const c = (t.category || '').trim();
        if (!c) return true;
        if (c.toLowerCase() === 'uncategorized') return true;
        return false;
      }
    );
    const uncStock = stockholders.filter(
      (s: { id: string }) => !hasAppCategory('stockholder', s.id)
    );
    const n =
      uncClients.length + uncSuppliers.length + uncTrans.length + uncStock.length;
    if (n === 0) {
      setSmartCategorizeSuccess(null);
      setSmartCategorizeError(
        'Nothing to categorize right now: every client, supplier, and stockholder already has a category, and every transaction either has an app category or an API category other than empty/Uncategorized.'
      );
      return;
    }
    setSmartCategorizeBusy(true);
    setSmartCategorizeError(null);
    setSmartCategorizeSuccess(null);
    try {
      const { data } = await axios.post<{
        clients: Record<string, string>;
        suppliers: Record<string, string>;
        transactions: Record<string, string>;
        stockholders: Record<string, string>;
      }>(
        `${API_URL}/plugins/expense_categorizer/smart_categorize`,
        {
          clients: uncClients,
          suppliers: uncSuppliers,
          transactions: uncTrans,
          stockholders: uncStock,
        },
        { headers: { 'Content-Type': 'application/json' } }
      );
      const out = applyAiLayer(catRegRef.current, catAsgRef.current, {
        clients: data.clients,
        suppliers: data.suppliers,
        transactions: data.transactions,
        stockholders: data.stockholders,
      });
      setRegExtra(out.regExtra);
      setAssignments(out.assignments);
      const applied =
        Object.keys(data.clients).length +
        Object.keys(data.suppliers).length +
        Object.keys(data.transactions).length +
        Object.keys(data.stockholders).length;
      setSmartCategorizeSuccess(
        applied === 1
          ? 'Success: 1 category was applied.'
          : `Success: ${applied} categories were applied.`
      );
    } catch (e: unknown) {
      setSmartCategorizeSuccess(null);
      let msg = 'Request failed';
      if (axios.isAxiosError(e)) {
        const d = e.response?.data;
        if (d && typeof d === 'object' && 'detail' in d) {
          const det = (d as { detail: unknown }).detail;
          msg = Array.isArray(det) ? JSON.stringify(det) : String(det ?? e.message);
        } else {
          msg = e.message;
        }
      } else if (e instanceof Error) {
        msg = e.message;
      }
      setSmartCategorizeError(msg);
    } finally {
      setSmartCategorizeBusy(false);
    }
  }, [pluginToggles, clients, suppliers, transactions, stockholders, assignments]);

  const value = useMemo(
    () => ({
      clients,
      suppliers,
      transactions,
      stockholders,
      plugins,
      pluginToggles,
      taxReserve,
      forecast,
      refresh,
      isPluginInstalled,
      isPluginEnabled,
      isPluginActive,
      setPluginEnabled,
      searchExpenses,
      invoiceExportConfig,
      setInvoiceExportConfig,
      downloadInvoice,
      getOptionsForKind,
      getEntityCategory,
      entityHasCustomCategory,
      setEntityCategory,
      runSmartCategorize,
      smartCategorizeBusy,
      smartCategorizeError,
      smartCategorizeSuccess,
    }),
    [
      clients,
      suppliers,
      transactions,
      stockholders,
      plugins,
      pluginToggles,
      taxReserve,
      forecast,
      refresh,
      isPluginInstalled,
      isPluginEnabled,
      isPluginActive,
      setPluginEnabled,
      searchExpenses,
      invoiceExportConfig,
      setInvoiceExportConfig,
      downloadInvoice,
      getOptionsForKind,
      getEntityCategory,
      entityHasCustomCategory,
      setEntityCategory,
      runSmartCategorize,
      smartCategorizeBusy,
      smartCategorizeError,
      smartCategorizeSuccess,
    ]
  );

  return <FinanceDataContext.Provider value={value}>{children}</FinanceDataContext.Provider>;
}

export function useFinanceData() {
  const ctx = useContext(FinanceDataContext);
  if (!ctx) throw new Error('useFinanceData must be used within FinanceDataProvider');
  return ctx;
}
