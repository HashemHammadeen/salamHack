import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { FinanceDataProvider } from './context/FinanceDataContext';
import AppLayout from './components/AppLayout';
import Overview from './pages/Overview';
import Analytics from './pages/Analytics';
import Contacts from './pages/Contacts';
import Activity from './pages/Activity';
import BudgetCashFlow from './pages/BudgetCashFlow';
import Marketplace from './pages/Marketplace';
import PluginDocsPage from './pages/PluginDocsPage';
import PluginPage from './pages/PluginPage';

function App() {
  return (
    <Router>
      <FinanceDataProvider>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Overview />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/activity" element={<Activity />} />
            <Route path="/budget" element={<BudgetCashFlow />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/docs/plugins" element={<PluginDocsPage />} />
            <Route path="/plugin/:pluginId" element={<PluginPage />} />
          </Route>
        </Routes>
      </FinanceDataProvider>
    </Router>
  );
}

export default App;
