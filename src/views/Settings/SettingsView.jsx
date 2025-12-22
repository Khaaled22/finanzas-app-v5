// src/views/Settings/SettingsView.jsx
// ✅ M32: Agregada configuración de Seguros + Preferencias habilitadas
import React, { useState } from 'react';
import CategoriesPanel from './components/CategoriesPanel';
import ExchangeRatesPanel from './components/ExchangeRatesPanel';
import InsurancePanel from './components/InsurancePanel';
import { useApp } from '../../context/AppContext';

export default function SettingsView() {
  const [activeTab, setActiveTab] = useState('categories');
  const { displayCurrency, setDisplayCurrency } = useApp();

  const tabs = [
    { id: 'categories', label: 'Categorías', icon: 'fa-folder-open' },
    { id: 'rates', label: 'Tasas de Cambio', icon: 'fa-exchange-alt' },
    { id: 'insurance', label: 'Seguros', icon: 'fa-shield-alt' },
    { id: 'preferences', label: 'Preferencias', icon: 'fa-cog' }
  ];

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center">
          <i className="fas fa-cog mr-3 text-purple-600"></i>
          Ajustes
        </h1>
        <p className="text-gray-600 mt-2">
          Configura y personaliza tu aplicación
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex flex-wrap gap-1 p-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => !tab.disabled && setActiveTab(tab.id)}
                disabled={tab.disabled}
                className={`px-4 py-2 md:px-6 md:py-3 font-medium rounded-lg transition-all text-sm md:text-base ${
                  activeTab === tab.id
                    ? 'bg-purple-600 text-white'
                    : tab.disabled
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <i className={`fas ${tab.icon} mr-2`}></i>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'categories' && <CategoriesPanel />}
          
          {activeTab === 'rates' && <ExchangeRatesPanel />}
          
          {/* ✅ M32: Panel de Seguros */}
          {activeTab === 'insurance' && <InsurancePanel />}
          
          {/* ✅ M32: Preferencias habilitadas */}
          {activeTab === 'preferences' && (
            <PreferencesPanel 
              displayCurrency={displayCurrency}
              setDisplayCurrency={setDisplayCurrency}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ✅ M32: Panel de Preferencias
function PreferencesPanel({ displayCurrency, setDisplayCurrency }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <i className="fas fa-cog mr-3 text-purple-600"></i>
          Preferencias Generales
        </h3>
      </div>

      {/* Moneda de visualización */}
      <div className="bg-gray-50 rounded-lg p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <i className="fas fa-coins mr-2 text-yellow-500"></i>
          Moneda de Visualización
        </label>
        <select
          value={displayCurrency}
          onChange={(e) => setDisplayCurrency(e.target.value)}
          className="w-full md:w-64 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
        >
          <option value="EUR">EUR € (Euro)</option>
          <option value="CLP">CLP $ (Peso Chileno)</option>
          <option value="USD">USD $ (Dólar)</option>
        </select>
        <p className="text-xs text-gray-500 mt-2">
          Todos los valores se convertirán a esta moneda para mostrar totales
        </p>
      </div>

      {/* Placeholder para más preferencias */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <i className="fas fa-info-circle text-blue-600 mt-1 mr-3"></i>
          <div>
            <p className="font-medium text-blue-800">Más opciones próximamente</p>
            <p className="text-sm text-blue-600 mt-1">
              Tema oscuro, notificaciones, formato de fecha, y más...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}