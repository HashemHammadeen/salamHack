import { useFinanceData } from '../context/FinanceDataContext';
import { defaultInvoiceExportConfig } from '../types/invoiceExport';
import InvoiceExportForm from './InvoiceExportForm';

export default function InvoiceExportSettings() {
  const { invoiceExportConfig, setInvoiceExportConfig } = useFinanceData();

  return (
    <InvoiceExportForm
      idPrefix="plugin-inv"
      value={invoiceExportConfig}
      onChange={(p) => setInvoiceExportConfig(p)}
      onResetToDefaults={() => setInvoiceExportConfig({ ...defaultInvoiceExportConfig })}
    />
  );
}
