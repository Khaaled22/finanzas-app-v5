// src/views/Settings/components/UpdateRatesModal.jsx
import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import Modal from '../../../components/common/Modal';

export default function UpdateRatesModal({ onClose }) {
  const { exchangeRates, updateExchangeRates, fetchExchangeRates } = useApp();
  
  const [mode, setMode] = useState('manual'); // 'manual' o 'api'
  const [rates, setRates] = useState({
    EUR_CLP: exchangeRates.EUR_CLP,
    EUR_USD: exchangeRates.EUR_USD,
    CLP_UF: exchangeRates.CLP_UF
  });
  
  const [loading, setLoading] = useState(false);
  const [apiResults, setApiResults] = useState(null);
  const [error, setError] = useState('');

  // Actualización manual
  const handleManualUpdate = () => {
    if (!rates.EUR_CLP || !rates.EUR_USD || !rates.CLP_UF) {
      setError('Todos los campos son obligatorios');
      return;
    }

    if (rates.EUR_CLP <= 0 || rates.EUR_USD <= 0 || rates.CLP_UF <= 0) {
      setError('Las tasas deben ser mayores a 0');
      return;
    }

    updateExchangeRates(rates, 'manual');
    onClose();
  };

  // Actualización desde APIs
  const handleApiFetch = async () => {
    setLoading(true);
    setError('');
    setApiResults(null);

    try {
      const results = await fetchExchangeRates();
      setApiResults(results);

      // Si alguna tasa se obtuvo, actualizar el estado local
      const newRates = { ...rates };
      if (results.EUR_USD) newRates.EUR_USD = results.EUR_USD;
      if (results.EUR_CLP) newRates.EUR_CLP = results.EUR_CLP;
      if (results.CLP_UF) newRates.CLP_UF = results.CLP_UF;
      
      setRates(newRates);
      setLoading(false);
    } catch (err) {
      setError('Error al consultar las APIs');
      setLoading(false);
    }
  };

  // Aplicar tasas obtenidas por API
  const handleApplyApiRates = () => {
    const updatedRates = { ...rates };
    let updated = false;

    if (apiResults.EUR_USD) {
      updatedRates.EUR_USD = apiResults.EUR_USD;
      updated = true;
    }
    if (apiResults.EUR_CLP) {
      updatedRates.EUR_CLP = apiResults.EUR_CLP;
      updated = true;
    }
    if (apiResults.CLP_UF) {
      updatedRates.CLP_UF = apiResults.CLP_UF;
      updated = true;
    }

    if (updated) {
      updateExchangeRates(updatedRates, 'api');
      onClose();
    } else {
      setError('No hay tasas disponibles para aplicar');
    }
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('es-CL', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    }).format(num);
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Actualizar Tasas de Cambio" size="lg">
      <div className="space-y-6">
        {/* Mode Selector */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setMode('manual')}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
              mode === 'manual'
                ? 'bg-white text-purple-600 shadow-md'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <i className="fas fa-edit mr-2"></i>
            Manual
          </button>
          <button
            onClick={() => setMode('api')}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
              mode === 'api'
                ? 'bg-white text-blue-600 shadow-md'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <i className="fas fa-cloud mr-2"></i>
            Desde API
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
            <i className="fas fa-exclamation-circle text-red-500 mr-3 mt-1"></i>
            <div>
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Manual Mode */}
        {mode === 'manual' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Ingresa manualmente las tasas de cambio actuales
            </p>

            {/* EUR/CLP */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <span className="mr-2">🇪🇺🇨🇱</span>
                EUR → CLP
              </label>
              <input
                type="number"
                step="0.01"
                value={rates.EUR_CLP}
                onChange={(e) => setRates({ ...rates, EUR_CLP: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="1050.00"
              />
              <p className="text-xs text-gray-500 mt-1">
                Actual: {formatNumber(exchangeRates.EUR_CLP)}
              </p>
            </div>

            {/* EUR/USD */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <span className="mr-2">🇪🇺🇺🇸</span>
                EUR → USD
              </label>
              <input
                type="number"
                step="0.0001"
                value={rates.EUR_USD}
                onChange={(e) => setRates({ ...rates, EUR_USD: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="1.09"
              />
              <p className="text-xs text-gray-500 mt-1">
                Actual: {formatNumber(exchangeRates.EUR_USD)}
              </p>
            </div>

            {/* CLP/UF */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <span className="mr-2">🇨🇱📊</span>
                CLP → UF
              </label>
              <input
                type="number"
                step="1"
                value={rates.CLP_UF}
                onChange={(e) => setRates({ ...rates, CLP_UF: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="36000"
              />
              <p className="text-xs text-gray-500 mt-1">
                Actual: {formatNumber(exchangeRates.CLP_UF)}
              </p>
            </div>
          </div>
        )}

        {/* API Mode */}
        {mode === 'api' && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <i className="fas fa-info-circle mr-2"></i>
                Las tasas se consultarán desde APIs gratuitas. Solo EUR/USD está disponible sin configuración adicional.
              </p>
            </div>

            {!apiResults && (
              <button
                onClick={handleApiFetch}
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Consultando APIs...
                  </>
                ) : (
                  <>
                    <i className="fas fa-download mr-2"></i>
                    Obtener Tasas Actuales
                  </>
                )}
              </button>
            )}

            {apiResults && (
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-800">Resultados:</h4>
                
                {/* EUR/USD */}
                <div className={`p-4 rounded-lg border-2 ${
                  apiResults.EUR_USD 
                    ? 'bg-green-50 border-green-300' 
                    : 'bg-gray-50 border-gray-300'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-800">EUR → USD</p>
                      {apiResults.EUR_USD ? (
                        <p className="text-lg font-bold text-green-700">
                          {formatNumber(apiResults.EUR_USD)}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-500">No disponible</p>
                      )}
                    </div>
                    {apiResults.EUR_USD && (
                      <i className="fas fa-check-circle text-green-500 text-xl"></i>
                    )}
                  </div>
                </div>

                {/* EUR/CLP */}
                <div className={`p-4 rounded-lg border-2 ${
                  apiResults.EUR_CLP 
                    ? 'bg-green-50 border-green-300' 
                    : 'bg-gray-50 border-gray-300'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-800">EUR → CLP</p>
                      {apiResults.EUR_CLP ? (
                        <p className="text-lg font-bold text-green-700">
                          {formatNumber(apiResults.EUR_CLP)}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-500">Requiere API key</p>
                      )}
                    </div>
                    {apiResults.EUR_CLP ? (
                      <i className="fas fa-check-circle text-green-500 text-xl"></i>
                    ) : (
                      <i className="fas fa-lock text-gray-400 text-xl"></i>
                    )}
                  </div>
                </div>

                {/* CLP/UF */}
                <div className={`p-4 rounded-lg border-2 ${
                  apiResults.CLP_UF 
                    ? 'bg-green-50 border-green-300' 
                    : 'bg-gray-50 border-gray-300'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-800">CLP → UF</p>
                      {apiResults.CLP_UF ? (
                        <p className="text-lg font-bold text-green-700">
                          {formatNumber(apiResults.CLP_UF)}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-500">Requiere API key</p>
                      )}
                    </div>
                    {apiResults.CLP_UF ? (
                      <i className="fas fa-check-circle text-green-500 text-xl"></i>
                    ) : (
                      <i className="fas fa-lock text-gray-400 text-xl"></i>
                    )}
                  </div>
                </div>

                {apiResults.errors && apiResults.errors.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-xs font-medium text-yellow-800 mb-1">Advertencias:</p>
                    {apiResults.errors.map((err, idx) => (
                      <p key={idx} className="text-xs text-yellow-700">• {err}</p>
                    ))}
                  </div>
                )}

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={handleApiFetch}
                    disabled={loading}
                    className="flex-1 py-2 border-2 border-blue-600 text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-all disabled:opacity-50"
                  >
                    <i className="fas fa-redo mr-2"></i>
                    Reintentar
                  </button>
                  <button
                    onClick={handleApplyApiRates}
                    disabled={!apiResults.EUR_USD && !apiResults.EUR_CLP && !apiResults.CLP_UF}
                    className="flex-1 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <i className="fas fa-check mr-2"></i>
                    Aplicar Tasas
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        {mode === 'manual' && (
          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={onClose}
              className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={handleManualUpdate}
              className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all"
            >
              <i className="fas fa-save mr-2"></i>
              Guardar Tasas
            </button>
          </div>
        )}

        {mode === 'api' && !apiResults && (
          <div className="pt-4 border-t">
            <button
              onClick={onClose}
              className="w-full py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all"
            >
              Cancelar
            </button>
          </div>
        )}

        {mode === 'api' && apiResults && (
          <div className="pt-4 border-t">
            <button
              onClick={onClose}
              className="w-full py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all"
            >
              Cerrar
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}