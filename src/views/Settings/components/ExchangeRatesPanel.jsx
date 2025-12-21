// src/views/Settings/components/ExchangeRatesPanel.jsx
import React, { useState, useMemo } from 'react';
import { useApp } from '../../../context/AppContext';
import UpdateRatesModal from './UpdateRatesModal';

export default function ExchangeRatesPanel() {
  const { exchangeRates } = useApp();
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  // Estadísticas
  const stats = useMemo(() => {
    const history = exchangeRates.updateHistory || [];
    return {
      totalUpdates: history.length,
      lastUpdate: exchangeRates.lastUpdated,
      manualUpdates: history.filter(h => h.source === 'manual').length,
      apiUpdates: history.filter(h => h.source === 'api').length
    };
  }, [exchangeRates]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Nunca';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-CL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('es-CL', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    }).format(num);
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Total Actualizaciones</p>
              <p className="text-2xl font-bold text-blue-900">{stats.totalUpdates}</p>
            </div>
            <div className="bg-blue-200 rounded-full p-3">
              <i className="fas fa-sync text-blue-600 text-xl"></i>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Por API</p>
              <p className="text-2xl font-bold text-green-900">{stats.apiUpdates}</p>
            </div>
            <div className="bg-green-200 rounded-full p-3">
              <i className="fas fa-cloud text-green-600 text-xl"></i>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Manuales</p>
              <p className="text-2xl font-bold text-purple-900">{stats.manualUpdates}</p>
            </div>
            <div className="bg-purple-200 rounded-full p-3">
              <i className="fas fa-edit text-purple-600 text-xl"></i>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600 font-medium">Última Actualización</p>
              <p className="text-xs font-semibold text-orange-900 mt-1">
                {formatDate(stats.lastUpdate).split(',')[0]}
              </p>
            </div>
            <div className="bg-orange-200 rounded-full p-3">
              <i className="fas fa-clock text-orange-600 text-xl"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Current Rates Card */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
              <i className="fas fa-coins mr-3 text-yellow-500"></i>
              Tasas de Cambio Actuales
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Última actualización: {formatDate(exchangeRates.lastUpdated)}
            </p>
          </div>
          <button
            onClick={() => setShowUpdateModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl flex items-center"
          >
            <i className="fas fa-sync-alt mr-2"></i>
            Actualizar Tasas
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* EUR/CLP */}
          <div className="border-2 border-blue-200 rounded-xl p-5 bg-gradient-to-br from-blue-50 to-white hover:shadow-lg transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center">
                <div className="bg-blue-100 rounded-lg p-2 mr-3">
                  <span className="text-2xl">🇪🇺</span>
                </div>
                <div className="bg-red-100 rounded-lg p-2">
                  <span className="text-2xl">🇨🇱</span>
                </div>
              </div>
              <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                Principal
              </span>
            </div>
            <p className="text-sm text-gray-600 font-medium mb-1">EUR → CLP</p>
            <p className="text-3xl font-bold text-gray-900">
              ${formatNumber(exchangeRates.EUR_CLP)}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              1 EUR = {formatNumber(exchangeRates.EUR_CLP)} CLP
            </p>
          </div>

          {/* EUR/USD */}
          <div className="border-2 border-green-200 rounded-xl p-5 bg-gradient-to-br from-green-50 to-white hover:shadow-lg transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center">
                <div className="bg-green-100 rounded-lg p-2 mr-3">
                  <span className="text-2xl">🇪🇺</span>
                </div>
                <div className="bg-blue-100 rounded-lg p-2">
                  <span className="text-2xl">🇺🇸</span>
                </div>
              </div>
              <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded-full">
                API Disponible
              </span>
            </div>
            <p className="text-sm text-gray-600 font-medium mb-1">EUR → USD</p>
            <p className="text-3xl font-bold text-gray-900">
              ${formatNumber(exchangeRates.EUR_USD)}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              1 EUR = {formatNumber(exchangeRates.EUR_USD)} USD
            </p>
          </div>

          {/* CLP/UF */}
          <div className="border-2 border-purple-200 rounded-xl p-5 bg-gradient-to-br from-purple-50 to-white hover:shadow-lg transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center">
                <div className="bg-purple-100 rounded-lg p-2 mr-3">
                  <span className="text-2xl">🇨🇱</span>
                </div>
                <div className="bg-purple-100 rounded-lg p-2">
                  <span className="text-2xl">📊</span>
                </div>
              </div>
              <span className="text-xs font-semibold text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                UF
              </span>
            </div>
            <p className="text-sm text-gray-600 font-medium mb-1">CLP → UF</p>
            <p className="text-3xl font-bold text-gray-900">
              ${formatNumber(exchangeRates.CLP_UF)}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              1 UF = {formatNumber(exchangeRates.CLP_UF)} CLP
            </p>
          </div>
        </div>
      </div>

      {/* Update History */}
      {exchangeRates.updateHistory && exchangeRates.updateHistory.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <i className="fas fa-history mr-3 text-gray-600"></i>
            Historial de Actualizaciones
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {exchangeRates.updateHistory.slice(0, 10).map((update, index) => (
              <div
                key={update.id}
                className={`border rounded-lg p-4 hover:bg-gray-50 transition-all ${
                  index === 0 ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold mr-3 ${
                          update.source === 'api'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-purple-100 text-purple-700'
                        }`}
                      >
                        <i
                          className={`fas ${
                            update.source === 'api' ? 'fa-cloud' : 'fa-edit'
                          } mr-1`}
                        ></i>
                        {update.source === 'api' ? 'API' : 'Manual'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(update.date)}
                      </span>
                      {index === 0 && (
                        <span className="ml-3 text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                          Más reciente
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">EUR/CLP:</span>
                        <span className="ml-2 font-semibold text-gray-800">
                          {formatNumber(update.rates.EUR_CLP)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">EUR/USD:</span>
                        <span className="ml-2 font-semibold text-gray-800">
                          {formatNumber(update.rates.EUR_USD)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">CLP/UF:</span>
                        <span className="ml-2 font-semibold text-gray-800">
                          {formatNumber(update.rates.CLP_UF)}
                        </span>
                      </div>
                    </div>
                    {update.user && (
                      <p className="text-xs text-gray-500 mt-2">
                        Por: {update.user}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Update Modal */}
      {showUpdateModal && (
        <UpdateRatesModal onClose={() => setShowUpdateModal(false)} />
      )}
    </div>
  );
}