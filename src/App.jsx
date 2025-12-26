// src/App.jsx
// ✅ M31: Integración con Supabase Auth
// ✅ M36 Fase 7: Quick Add Button
import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/AuthForms';
import { AppProvider } from './context/AppContext';
import ErrorBoundary from './components/common/ErrorBoundary';
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
import SettingsView from './views/Settings/SettingsView';

// Importación PWA (M10)
import InstallPWA from './components/common/InstallPWA';

// ✅ M36 Fase 7: Quick Add Button
import QuickAddButton from './components/common/QuickAddButton';

function AppContent() {
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
      case 'settings':
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
          <ErrorBoundary>
            {renderView()}
          </ErrorBoundary>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t mt-12 py-6">
          <div className="container mx-auto px-4 text-center text-gray-600">
            <p className="text-sm">
              <i className="fas fa-rocket mr-2"></i>
              Finanzas PRO v5.6 - M36 Quick Add ✅
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Cloud Sync + Multi-device
            </p>
          </div>
        </footer>

        {/* M10: Componente para instalar la PWA */}
        <InstallPWA />

        {/* ✅ M36 Fase 7: Botón flotante para agregar transacción */}
        <QuickAddButton />

        {/* Indicador visual de guardado automático */}
        <div 
          id="save-indicator"
          className="fixed bottom-4 left-4 bg-green-500 text-white px-4 py-2 rounded-full text-sm shadow-lg opacity-0 transition-opacity duration-300 pointer-events-none z-50"
        >
          <i className="fas fa-check mr-2"></i>
          Guardado
        </div>
      </div>
    </AppProvider>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ProtectedRoute>
          <AppContent />
        </ProtectedRoute>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;