import React, { useState } from 'react';
import { AppProvider } from './context/AppContext';
import Header from './components/layout/Header';
import Navigation from './components/layout/Navigation';
import Dashboard from './views/Dashboard/Dashboard';
import BudgetView from './views/Budget/BudgetView';
import TransactionsView from './views/Transactions/TransactionsView';
import DebtsView from './views/Debts/DebtsView';
import SavingsView from './views/Savings/SavingsView';
import InvestmentsView from './views/Investments/InvestmentsView';
import CashflowView from './views/Cashflow/CashflowView';
import AnalysisView from './views/Analysis/AnalysisView';
import SettingsView from './views/Settings/SettingsView'; // ⭐ M13 - NUEVO

// ⭐ Nueva importación (M10 - PWA)
import InstallPWA from './components/common/InstallPWA';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');

  const renderView = () => {
    switch(currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'budget':
        return <BudgetView />;
      case 'transactions':
        return <TransactionsView />;
      case 'debts':
        return <DebtsView />;
      case 'savings':
        return <SavingsView />;
      case 'investments':
        return <InvestmentsView />;
      case 'cashflow':
        return <CashflowView />;
      case 'analysis':
        return <AnalysisView />;
      case 'settings': // ⭐ M13 - NUEVO
        return <SettingsView />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <AppProvider>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <Header />
        <Navigation currentView={currentView} setCurrentView={setCurrentView} />
        
        <main className="container mx-auto px-4 py-6">
          {renderView()}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t mt-12 py-6">
          <div className="container mx-auto px-4 text-center text-gray-600">
            <p className="text-sm">
              <i className="fas fa-rocket mr-2"></i>
              Finanzas PRO v5.1 - M13 Categorías ✅
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Sistema de categorías editable implementado
            </p>
          </div>
        </footer>

        {/* ⭐ M10: Componente para instalar la PWA */}
        <InstallPWA />
      </div>
    </AppProvider>
  );
}

export default App;