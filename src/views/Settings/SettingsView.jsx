// src/views/Settings/SettingsView.jsx
import React, { useState } from 'react';
import CategoriesPanel from './components/CategoriesPanel';

export default function SettingsView() {
  const [activeTab, setActiveTab] = useState('categories');

  const tabs = [
    { id: 'categories', label: 'Categorías', icon: 'fa-folder-open' },
    { id: 'rates', label: 'Tasas de Cambio', icon: 'fa-exchange-alt', disabled: true },
    { id: 'preferences', label: 'Preferencias', icon: 'fa-cog', disabled: true }
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
          <nav className="flex space-x-1 p-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => !tab.disabled && setActiveTab(tab.id)}
                disabled={tab.disabled}
                className={`px-6 py-3 font-medium rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-purple-600 text-white'
                    : tab.disabled
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <i className={`fas ${tab.icon} mr-2`}></i>
                {tab.label}
                {tab.disabled && (
                  <span className="ml-2 text-xs">(Próximamente)</span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'categories' && <CategoriesPanel />}
          {activeTab === 'rates' && (
            <div className="text-center py-12 text-gray-500">
              <i className="fas fa-exchange-alt text-6xl mb-4 text-gray-300"></i>
              <p className="text-lg font-medium">Tasas de Cambio</p>
              <p className="text-sm">Disponible en M14</p>
            </div>
          )}
          {activeTab === 'preferences' && (
            <div className="text-center py-12 text-gray-500">
              <i className="fas fa-cog text-6xl mb-4 text-gray-300"></i>
              <p className="text-lg font-medium">Preferencias</p>
              <p className="text-sm">Próximamente</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
