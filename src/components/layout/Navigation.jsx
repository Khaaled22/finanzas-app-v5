// src/components/layout/Navigation.jsx
// ✅ M31: UserMenu integrado
import React from 'react';
import { UserMenu } from '../auth/AuthForms';
import { useAuth } from '../../context/AuthContext';

function NavButton({ icon, text, view, currentView, setCurrentView }) {
  return (
    <button
      onClick={() => setCurrentView(view)}
      className={`px-4 py-3 font-medium transition-colors whitespace-nowrap ${
        currentView === view 
          ? 'text-purple-600 border-b-2 border-purple-600' 
          : 'text-gray-600 hover:text-purple-600'
      }`}
    >
      <i className={`fas ${icon} mr-2`}></i>
      <span className="hidden sm:inline">{text}</span>
    </button>
  );
}

// Indicador de modo (local vs cloud)
function SyncIndicator() {
  const { isLocalMode } = useAuth();
  
  if (isLocalMode) {
    return (
      <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs">
        <i className="fas fa-database"></i>
        <span className="hidden md:inline">Local</span>
      </div>
    );
  }
  
  return (
    <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
      <i className="fas fa-cloud"></i>
      <span className="hidden md:inline">Sync</span>
    </div>
  );
}

export default function Navigation({ currentView, setCurrentView }) {
  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* Navigation buttons - scrollable en móvil */}
          <div className="flex space-x-1 overflow-x-auto flex-1">
            <NavButton 
              icon="fa-chart-line" 
              text="Dashboard" 
              view="dashboard" 
              currentView={currentView} 
              setCurrentView={setCurrentView} 
            />
            <NavButton 
              icon="fa-calculator" 
              text="Presupuesto" 
              view="budget" 
              currentView={currentView} 
              setCurrentView={setCurrentView} 
            />
            <NavButton 
              icon="fa-receipt" 
              text="Transacciones" 
              view="transactions" 
              currentView={currentView} 
              setCurrentView={setCurrentView} 
            />
            <NavButton 
              icon="fa-credit-card" 
              text="Deudas" 
              view="debts" 
              currentView={currentView} 
              setCurrentView={setCurrentView} 
            />
            <NavButton 
              icon="fa-piggy-bank" 
              text="Ahorros" 
              view="savings" 
              currentView={currentView} 
              setCurrentView={setCurrentView} 
            />
            <NavButton 
              icon="fa-chart-pie" 
              text="Inversiones" 
              view="investments" 
              currentView={currentView} 
              setCurrentView={setCurrentView} 
            />
            <NavButton 
              icon="fa-calendar-alt" 
              text="Cashflow" 
              view="cashflow" 
              currentView={currentView} 
              setCurrentView={setCurrentView} 
            />
            <NavButton 
              icon="fa-brain" 
              text="Análisis" 
              view="analysis" 
              currentView={currentView} 
              setCurrentView={setCurrentView} 
            />
            <NavButton 
              icon="fa-cog" 
              text="Ajustes" 
              view="settings" 
              currentView={currentView} 
              setCurrentView={setCurrentView} 
            />
          </div>

          {/* User section - fixed a la derecha */}
          <div className="flex items-center gap-2 pl-4 border-l ml-2">
            <SyncIndicator />
            <UserMenu />
          </div>
        </div>
      </div>
    </nav>
  );
}