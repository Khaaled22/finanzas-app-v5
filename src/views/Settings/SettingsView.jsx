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

// Panel de Preferencias con Export/Import
function PreferencesPanel({ displayCurrency, setDisplayCurrency }) {
  const {
    categories, transactions, monthlyBudgets, debts, investments, savingsGoals, ynabConfig
  } = useApp();
  const [importStatus, setImportStatus] = React.useState(null);

  const handleExport = () => {
    const backup = {
      _version: 'finanzas-pro-v5',
      _exportedAt: new Date().toISOString(),
      categories,
      transactions,
      monthlyBudgets,
      debts,
      investments,
      savingsGoals,
      ynabConfig
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finanzas-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data._version !== 'finanzas-pro-v5') {
          setImportStatus({ type: 'error', message: 'Archivo no compatible (version incorrecta)' });
          return;
        }
        // Validaciones de seguridad
        const rawText = event.target.result;
        if (rawText.includes('__proto__') || rawText.includes('constructor') || rawText.includes('prototype')) {
          setImportStatus({ type: 'error', message: 'Archivo contiene contenido no permitido' });
          return;
        }
        // File size guard (10MB max)
        if (rawText.length > 10 * 1024 * 1024) {
          setImportStatus({ type: 'error', message: 'Archivo demasiado grande (máximo 10MB)' });
          return;
        }
        const arrayKeys = ['categories', 'transactions', 'investments', 'debts', 'savingsGoals'];
        for (const key of arrayKeys) {
          if (data[key] !== undefined && !Array.isArray(data[key])) {
            setImportStatus({ type: 'error', message: `Formato inválido: ${key} debe ser un array` });
            return;
          }
        }
        if (data.transactions && data.transactions.length > 50000) {
          setImportStatus({ type: 'error', message: 'Archivo demasiado grande: máximo 50.000 transacciones' });
          return;
        }
        if (data.monthlyBudgets && (typeof data.monthlyBudgets !== 'object' || Array.isArray(data.monthlyBudgets))) {
          setImportStatus({ type: 'error', message: 'Formato inválido: monthlyBudgets debe ser un objeto' });
          return;
        }
        // Write each key to localStorage
        const keys = {
          categories_v5: data.categories,
          transactions_v5: data.transactions,
          monthlyBudgets_v5: data.monthlyBudgets,
          ynabConfig_v5: data.ynabConfig,
          debts_v5: data.debts,
          investments_v5: data.investments,
          savingsGoals_v5: data.savingsGoals
        };
        const written = [];
        Object.entries(keys).forEach(([key, value]) => {
          if (value !== undefined) {
            localStorage.setItem(key, JSON.stringify(value));
            written.push(key);
          }
        });

        // Sync to Supabase if backend is enabled
        try {
          const { saveToSupabase } = await import('../../modules/supabase/syncUtils');
          for (const [key, value] of Object.entries(keys)) {
            if (value !== undefined) await saveToSupabase(key, value);
          }
        } catch {
          // Supabase sync is optional
        }

        setImportStatus({
          type: 'success',
          message: `Importados: ${written.join(', ')}. Recargando...`
        });
        setTimeout(() => window.location.reload(), 1500);
      } catch {
        setImportStatus({ type: 'error', message: 'Error al leer el archivo JSON' });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <i className="fas fa-cog mr-3 text-purple-600"></i>
          Preferencias Generales
        </h3>
      </div>

      {/* Moneda de visualizacion */}
      <div className="bg-gray-50 rounded-lg p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <i className="fas fa-coins mr-2 text-yellow-500"></i>
          Moneda de Visualizacion
        </label>
        <select
          value={displayCurrency}
          onChange={(e) => setDisplayCurrency(e.target.value)}
          className="w-full md:w-64 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
        >
          <option value="EUR">EUR (Euro)</option>
          <option value="CLP">CLP $ (Peso Chileno)</option>
          <option value="USD">USD $ (Dolar)</option>
        </select>
        <p className="text-xs text-gray-500 mt-2">
          Todos los valores se convertiran a esta moneda para mostrar totales
        </p>
      </div>

      {/* Backup / Restore */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">
          <i className="fas fa-database mr-2 text-blue-500"></i>
          Backup y Restauracion
        </h4>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
          >
            <i className="fas fa-download mr-2"></i>
            Exportar Backup JSON
          </button>
          <label className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm cursor-pointer">
            <i className="fas fa-upload mr-2"></i>
            Importar Backup
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Exporta todos tus datos (categorias, transacciones, deudas, inversiones, ahorros) a un archivo JSON.
          Util como respaldo o para migrar entre dispositivos.
        </p>
        {importStatus && (
          <div className={`mt-3 p-3 rounded-lg text-sm ${
            importStatus.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            <i className={`fas ${importStatus.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} mr-2`}></i>
            {importStatus.message}
          </div>
        )}
      </div>
    </div>
  );
}