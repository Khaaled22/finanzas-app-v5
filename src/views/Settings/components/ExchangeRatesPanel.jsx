// src/views/Settings/components/ExchangeRatesPanel.jsx
// ✅ M19.7 CORREGIDO: Panel unificado con edición/eliminación funcional
import React, { useState, useMemo } from 'react';
import { useApp } from '../../../context/AppContext';
import { useAutoRatesUpdate } from '../../../hooks/useAutoRatesUpdate';
import { ExchangeRateService } from '../../../services/ExchangeRateService';
import RateEditModal from './RateEditModal';

export default function ExchangeRatesPanel() {
  const { 
    exchangeRates,
    setExchangeRates, // ✅ Necesario para editar/eliminar
    updateExchangeRates,
    importHistoricalRates,
    autoUpdateConfig,
    setAutoUpdateEnabled 
  } = useApp();

  // ✅ M19.7: Hook de auto-update
  const {
    isUpdating,
    lastUpdateResult,
    updateNow
  } = useAutoRatesUpdate(updateExchangeRates, {
    enabled: autoUpdateConfig.enabled,
    intervalHours: 24, // Fijo 24h
    updateOnMount: true,
    lastUpdated: exchangeRates.lastUpdated
  });

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRate, setEditingRate] = useState(null);
  const [importMessage, setImportMessage] = useState(null);
  const [showAPITest, setShowAPITest] = useState(false);
  const [apiTestResults, setApiTestResults] = useState(null);
  const [testing, setTesting] = useState(false);
  
  // Estados para paginación y búsqueda
  const [currentPage, setCurrentPage] = useState(1);
  const [searchDate, setSearchDate] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // ✅ M19.7: Calcular tiempo desde última actualización
  const getTimeSinceUpdate = () => {
    if (!exchangeRates.lastUpdated) return 'Nunca';
    
    const lastUpdate = new Date(exchangeRates.lastUpdated);
    const now = new Date();
    const diffMs = now - lastUpdate;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours === 0) {
      return `Hace ${diffMins} min`;
    } else if (diffHours < 24) {
      return `Hace ${diffHours}h`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `Hace ${diffDays}d`;
    }
  };

  // Estadísticas de historial con paginación
  const historyStats = useMemo(() => {
    const history = exchangeRates.history || {};
    let dates = Object.keys(history).sort().reverse();
    
    if (searchDate) {
      dates = dates.filter(date => date.includes(searchDate));
    }
    
    const totalPages = Math.ceil(dates.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedDates = dates.slice(startIndex, endIndex);
    
    return {
      count: Object.keys(history).length,
      filteredCount: dates.length,
      firstDate: dates[dates.length - 1] || null,
      lastDate: dates[0] || null,
      recentRates: paginatedDates,
      totalPages,
      currentPage
    };
  }, [exchangeRates, currentPage, searchDate, itemsPerPage]);

  // ✅ M19.7: Log de actualizaciones (errores y success)
  const updateLog = useMemo(() => {
    const history = exchangeRates.updateHistory || [];
    return history
      .filter(h => h.source === 'api-auto' || h.source === 'api')
      .slice(-10)
      .reverse();
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

  const formatDateShort = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-CL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  const formatNumber = (num) => {
    if (!num) return '0.00';
    return new Intl.NumberFormat('es-CL', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    }).format(num);
  };

  // Test de APIs
  const handleTestAPIs = async () => {
    setTesting(true);
    try {
      const results = await ExchangeRateService.testAPIs();
      setApiTestResults(results);
      setShowAPITest(true);
    } catch (error) {
      console.error('Error testing APIs:', error);
    } finally {
      setTesting(false);
    }
  };

  // Importar tasas históricas
  const handleImportRates = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.history || typeof data.history !== 'object') {
        throw new Error('El JSON debe tener una propiedad "history" con las tasas');
      }

      const dates = Object.keys(data.history);
      if (dates.length === 0) {
        throw new Error('El historial está vacío');
      }

      const result = importHistoricalRates(data);
      setImportMessage({
        type: 'success',
        text: `✅ Importadas ${dates.length} fechas correctamente`
      });
    } catch (error) {
      setImportMessage({
        type: 'error',
        text: `❌ Error: ${error.message}`
      });
    }

    e.target.value = '';
    setTimeout(() => setImportMessage(null), 5000);
  };

  // ✅ M19.7 CORREGIDO: Editar registro del historial
  const handleEditRate = (date) => {
    const history = exchangeRates.history || {};
    const rateData = history[date];
    
    setEditingRate({ 
      date, 
      EUR_CLP: rateData.EUR_CLP,
      EUR_USD: rateData.EUR_USD,
      USD_CLP: rateData.USD_CLP,
      UF_CLP: rateData.UF_CLP || rateData.CLP_UF
    });
    setShowEditModal(true);
  };

  // ✅ M19.7 CORREGIDO: Guardar tasa editada
  const handleSaveRate = (rateData) => {
    const { date, ...rates } = rateData;
    
    // Actualizar el historial
    setExchangeRates(prev => ({
      ...prev,
      history: {
        ...prev.history,
        [date]: {
          EUR_CLP: rates.EUR_CLP,
          EUR_USD: rates.EUR_USD,
          USD_CLP: rates.USD_CLP,
          UF_CLP: rates.UF_CLP,
          CLP_UF: rates.UF_CLP, // Mantener ambos formatos
          source: rates.source || 'manual-edit',
          timestamp: new Date().toISOString()
        }
      }
    }));

    // También actualizar en localStorage para persistencia
    const historyData = JSON.parse(localStorage.getItem('exchangeRatesHistory') || '{}');
    historyData[date] = {
      EUR_CLP: rates.EUR_CLP,
      EUR_USD: rates.EUR_USD,
      USD_CLP: rates.USD_CLP,
      UF_CLP: rates.UF_CLP,
      source: 'manual-edit',
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('exchangeRatesHistory', JSON.stringify(historyData));

    console.log(`✅ Tasa del ${date} actualizada`);
    setShowEditModal(false);
    setEditingRate(null);
  };

  // ✅ M19.7 CORREGIDO: Eliminar registro del historial
  const handleDeleteRate = (date) => {
    if (!confirm(`¿Eliminar tasa del ${formatDateShort(date)}?`)) {
      return;
    }

    // Eliminar del estado
    setExchangeRates(prev => {
      const newHistory = { ...prev.history };
      delete newHistory[date];
      
      return {
        ...prev,
        history: newHistory
      };
    });

    // También eliminar de localStorage
    const historyData = JSON.parse(localStorage.getItem('exchangeRatesHistory') || '{}');
    delete historyData[date];
    localStorage.setItem('exchangeRatesHistory', JSON.stringify(historyData));

    console.log(`🗑️ Tasa del ${date} eliminada`);
  };

  // ✅ M19.7: Agregar nueva tasa
  const handleAddRate = () => {
    setEditingRate({
      date: new Date().toISOString().slice(0, 10),
      EUR_CLP: '',
      EUR_USD: '',
      USD_CLP: '',
      UF_CLP: ''
    });
    setShowEditModal(true);
  };

  return (
    <div className="space-y-6">
      {/* ===== HEADER CON BOTÓN ACTUALIZAR ===== */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-800 flex items-center">
              <i className="fas fa-exchange-alt mr-3 text-purple-600"></i>
              Tasas de Cambio
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Última actualización: {formatDate(exchangeRates.lastUpdated)}
            </p>
          </div>
          
          <button
            onClick={updateNow}
            disabled={isUpdating}
            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
              isUpdating
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
            }`}
          >
            <i className={`fas ${isUpdating ? 'fa-spinner fa-spin' : 'fa-sync-alt'}`}></i>
            {isUpdating ? 'Actualizando...' : 'Actualizar'}
          </button>
        </div>
      </div>

      {/* ===== CONFIGURACIÓN AUTO-UPDATE (TOGGLE) ===== */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h4 className="text-lg font-bold text-gray-800 mb-4">
          <i className="fas fa-cog mr-2 text-blue-600"></i>
          Actualización Automática
        </h4>
        
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Toggle funcional */}
              <button
                onClick={() => setAutoUpdateEnabled(!autoUpdateConfig.enabled)}
                className="relative focus:outline-none"
              >
                <div className={`w-14 h-8 rounded-full transition-all ${
                  autoUpdateConfig.enabled ? 'bg-green-500' : 'bg-gray-300'
                }`}>
                  <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${
                    autoUpdateConfig.enabled ? 'translate-x-7' : 'translate-x-1'
                  }`}></div>
                </div>
              </button>
              
              <div>
                <p className="font-bold text-gray-800">
                  {autoUpdateConfig.enabled ? 'Activado' : 'Desactivado'}
                </p>
                <p className="text-sm text-gray-600">
                  {autoUpdateConfig.enabled 
                    ? 'Las tasas se actualizan automáticamente cada 24 horas'
                    : 'Actualización manual solamente'}
                </p>
              </div>
            </div>

            {/* Test APIs */}
            <button
              onClick={handleTestAPIs}
              disabled={testing}
              className="text-sm bg-white border border-gray-300 hover:border-blue-500 text-gray-700 px-4 py-2 rounded-lg transition-all"
            >
              {testing ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Probando...
                </>
              ) : (
                <>
                  <i className="fas fa-network-wired mr-2"></i>
                  Test APIs
                </>
              )}
            </button>
          </div>

          {/* Status de última actualización */}
          {lastUpdateResult && (
            <div className={`mt-4 pt-4 border-t ${
              autoUpdateConfig.enabled ? 'border-blue-200' : 'border-gray-200'
            }`}>
              <div className={`flex items-center gap-2 text-sm ${
                lastUpdateResult.success ? 'text-green-700' : 'text-red-700'
              }`}>
                <i className={`fas ${
                  lastUpdateResult.success ? 'fa-check-circle' : 'fa-exclamation-circle'
                }`}></i>
                <span className="font-medium">
                  {lastUpdateResult.success ? 'Última actualización exitosa' : 'Error en última actualización'}
                </span>
                <span className="text-gray-600">- {getTimeSinceUpdate()}</span>
              </div>
            </div>
          )}
        </div>

        {/* Resultados Test APIs */}
        {showAPITest && apiTestResults && (
          <div className="mt-4 bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between mb-3">
              <h5 className="text-sm font-bold text-gray-800">
                <i className="fas fa-network-wired mr-2 text-blue-600"></i>
                Estado de APIs
              </h5>
              <button
                onClick={() => setShowAPITest(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="space-y-2">
              <div className="bg-white rounded p-3 flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700">exchangerate-api.com</span>
                <span className={apiTestResults.exchangerateAPI?.available ? 'text-green-600' : 'text-red-600'}>
                  {apiTestResults.exchangerateAPI?.message}
                </span>
              </div>
              
              <div className="bg-white rounded p-3 flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700">mindicador.cl</span>
                <span className={apiTestResults.mindicador?.available ? 'text-green-600' : 'text-red-600'}>
                  {apiTestResults.mindicador?.message}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ===== TASAS ACTUALES (3 CARDS) ===== */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h4 className="text-lg font-bold text-gray-800 mb-4">
          <i className="fas fa-coins mr-2 text-green-600"></i>
          Tasas Actuales
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* EUR → CLP */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border-2 border-blue-300">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-700">EUR → CLP</span>
              <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full">Principal</span>
            </div>
            <p className="text-2xl font-bold text-blue-900">
              ${formatNumber(exchangeRates.current?.EUR_CLP || 0)}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              1 EUR = {formatNumber(exchangeRates.current?.EUR_CLP || 0)} CLP
            </p>
          </div>

          {/* EUR → USD */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border-2 border-green-300">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-green-700">EUR → USD</span>
              <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full">API</span>
            </div>
            <p className="text-2xl font-bold text-green-900">
              ${formatNumber(exchangeRates.current?.EUR_USD || 0)}
            </p>
            <p className="text-xs text-green-600 mt-1">
              1 EUR = {formatNumber(exchangeRates.current?.EUR_USD || 0)} USD
            </p>
          </div>

          {/* CLP → UF */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border-2 border-purple-300">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-purple-700">CLP → UF</span>
              <span className="text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded-full">BC Chile</span>
            </div>
            <p className="text-2xl font-bold text-purple-900">
              ${formatNumber(exchangeRates.current?.CLP_UF || 0)}
            </p>
            <p className="text-xs text-purple-600 mt-1">
              1 UF = {formatNumber(exchangeRates.current?.CLP_UF || 0)} CLP
            </p>
          </div>
        </div>
      </div>

      {/* ===== HISTORIAL DE TASAS (EDITABLE) ===== */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-lg font-bold text-gray-800">
              <i className="fas fa-history mr-2 text-indigo-600"></i>
              Historial de Tasas
            </h4>
            <p className="text-sm text-gray-600 mt-1">
              {historyStats.count} fechas registradas
            </p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleAddRate}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all flex items-center gap-2"
            >
              <i className="fas fa-plus"></i>
              Agregar
            </button>
            <label className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer transition-all flex items-center gap-2">
              <i className="fas fa-file-import"></i>
              Importar JSON
              <input
                type="file"
                accept=".json"
                onChange={handleImportRates}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {importMessage && (
          <div className={`mb-4 p-3 rounded-lg ${
            importMessage.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {importMessage.text}
          </div>
        )}

        {/* Búsqueda */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Buscar por fecha (YYYY-MM-DD)..."
            value={searchDate}
            onChange={(e) => {
              setSearchDate(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b-2 border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Fecha</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">EUR/CLP</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">EUR/USD</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">USD/CLP</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">UF/CLP</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {historyStats.recentRates.map((date, index) => {
                const rates = exchangeRates.history[date];
                const isRecent = index === 0;
                
                return (
                  <tr 
                    key={date} 
                    className={`border-b border-gray-100 hover:bg-gray-50 ${
                      isRecent ? 'bg-blue-50' : ''
                    }`}
                  >
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {formatDateShort(date)}
                      {isRecent && (
                        <span className="ml-2 text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">
                          Reciente
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                      {formatNumber(rates.EUR_CLP || 0)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                      {formatNumber(rates.EUR_USD || 0)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                      {formatNumber(rates.USD_CLP || 0)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                      {formatNumber(rates.UF_CLP || rates.CLP_UF || 0)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleEditRate(date)}
                        className="text-blue-600 hover:text-blue-800 mr-3"
                        title="Editar"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        onClick={() => handleDeleteRate(date)}
                        className="text-red-600 hover:text-red-800"
                        title="Eliminar"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {historyStats.totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Mostrando {historyStats.recentRates.length} de {historyStats.filteredCount} fechas
            </p>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded border hover:bg-gray-50 disabled:opacity-50"
              >
                <i className="fas fa-angle-double-left"></i>
              </button>
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded border hover:bg-gray-50 disabled:opacity-50"
              >
                <i className="fas fa-angle-left"></i>
              </button>
              <span className="px-4 py-1 text-sm font-medium">
                Página {currentPage} de {historyStats.totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(historyStats.totalPages, currentPage + 1))}
                disabled={currentPage === historyStats.totalPages}
                className="px-3 py-1 rounded border hover:bg-gray-50 disabled:opacity-50"
              >
                <i className="fas fa-angle-right"></i>
              </button>
              <button
                onClick={() => setCurrentPage(historyStats.totalPages)}
                disabled={currentPage === historyStats.totalPages}
                className="px-3 py-1 rounded border hover:bg-gray-50 disabled:opacity-50"
              >
                <i className="fas fa-angle-double-right"></i>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ===== LOG DE ACTUALIZACIONES AUTOMÁTICAS ===== */}
      {updateLog.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h4 className="text-lg font-bold text-gray-800 mb-4">
            <i className="fas fa-clipboard-list mr-2 text-amber-600"></i>
            Log de Actualizaciones Automáticas
          </h4>
          
          <div className="space-y-2">
            {updateLog.map((log, index) => (
              <div 
                key={log.id || index}
                className={`p-3 rounded-lg border ${
                  log.error 
                    ? 'bg-red-50 border-red-200' 
                    : 'bg-green-50 border-green-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <i className={`fas ${
                      log.error ? 'fa-exclamation-circle text-red-600' : 'fa-check-circle text-green-600'
                    }`}></i>
                    <span className={`text-sm font-medium ${
                      log.error ? 'text-red-800' : 'text-green-800'
                    }`}>
                      {log.error ? 'Error' : 'Exitosa'}
                    </span>
                  </div>
                  <span className="text-xs text-gray-600">
                    {formatDate(log.date)}
                  </span>
                </div>
                {log.error && (
                  <p className="text-xs text-red-700 mt-1">{log.error}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de Edición */}
      {showEditModal && editingRate && (
        <RateEditModal
          rate={editingRate}
          onClose={() => {
            setShowEditModal(false);
            setEditingRate(null);
          }}
          onSave={handleSaveRate}
        />
      )}
    </div>
  );
}