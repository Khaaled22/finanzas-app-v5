// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
import InstallPWA from './components/common/InstallPWA';
import QuickAddButton from './components/common/QuickAddButton';

function AppContent() {
  return (
    <AppProvider>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <Header />
        <Navigation />

        <main className="container mx-auto px-4 py-6">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
            <Route path="/budget" element={<ErrorBoundary><BudgetView /></ErrorBoundary>} />
            <Route path="/transactions" element={<ErrorBoundary><TransactionsView /></ErrorBoundary>} />
            <Route path="/debts" element={<ErrorBoundary><DebtsView /></ErrorBoundary>} />
            <Route path="/savings" element={<ErrorBoundary><SavingsView /></ErrorBoundary>} />
            <Route path="/investments" element={<ErrorBoundary><InvestmentsView /></ErrorBoundary>} />
            <Route path="/cashflow" element={<ErrorBoundary><CashflowView /></ErrorBoundary>} />
            <Route path="/analysis" element={<ErrorBoundary><AnalysisView /></ErrorBoundary>} />
            <Route path="/settings" element={<ErrorBoundary><SettingsView /></ErrorBoundary>} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>

        <footer className="bg-white border-t mt-12 py-6">
          <div className="container mx-auto px-4 text-center text-gray-600">
            <p className="text-sm">
              <i className="fas fa-rocket mr-2"></i>
              Finanzas PRO v5.6 - M36 Quick Add
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Cloud Sync + Multi-device
            </p>
          </div>
        </footer>

        <InstallPWA />
        <QuickAddButton />

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
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </ProtectedRoute>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
