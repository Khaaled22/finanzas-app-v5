// src/App.jsx
import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/AuthForms';
import { AppProvider } from './context/AppContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import LoadingSpinner from './components/common/LoadingSpinner';
import Header from './components/layout/Header';
import Navigation from './components/layout/Navigation';
const Dashboard = lazy(() => import('./views/Dashboard/Dashboard'));
import InstallPWA from './components/common/InstallPWA';
import QuickAddButton from './components/common/QuickAddButton';

const BudgetView = lazy(() => import('./views/Budget/BudgetView'));
const TransactionsView = lazy(() => import('./views/Transactions/TransactionsView'));
const DebtsView = lazy(() => import('./views/Debts/DebtsView'));
const SavingsView = lazy(() => import('./views/Savings/SavingsView'));
const InvestmentsView = lazy(() => import('./views/Investments/InvestmentsView'));
const CashflowView = lazy(() => import('./views/Cashflow/CashflowView'));
const AnalysisView = lazy(() => import('./views/Analysis/AnalysisView'));
const SettingsView = lazy(() => import('./views/Settings/SettingsView'));

function AppContent() {
  return (
    <AppProvider>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <Header />
        <Navigation />

        <main className="container mx-auto px-4 py-6">
          <Suspense fallback={<LoadingSpinner />}>
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
          </Suspense>
        </main>

        <footer className="bg-white border-t mt-12 py-6">
          <div className="container mx-auto px-4 text-center text-gray-600">
            <p className="text-sm">
              <i className="fas fa-rocket mr-2"></i>
              Finanzas PRO
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Sync en la nube
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
