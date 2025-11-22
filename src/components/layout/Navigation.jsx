import React from 'react';

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
      {text}
    </button>
  );
}

export default function Navigation({ currentView, setCurrentView }) {
  return (
    <nav className="bg-white shadow-md overflow-x-auto">
      <div className="container mx-auto px-4">
        <div className="flex space-x-1">
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
        </div>
      </div>
    </nav>
  );
}
