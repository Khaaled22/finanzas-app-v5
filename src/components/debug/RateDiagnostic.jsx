// src/components/debug/RateDiagnostic.jsx
// ✅ M19.2.1: Componente de diagnóstico para verificar conversión de tasas
// ✅ M24: Agregado botón para cerrar/minimizar
import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';

export default function RateDiagnostic({ onClose }) {
  const { getRateForDate, convertCurrencyAtDate, exchangeRates } = useApp();
  
  const [testDate, setTestDate] = useState(() => {
    const saved = localStorage.getItem('rateDiagnostic_date');
    return saved || new Date().toISOString().slice(0, 10);
  });
  
  const [testAmount, setTestAmount] = useState(() => {
    const saved = localStorage.getItem('rateDiagnostic_amount');
    return saved ? parseFloat(saved) : 100;
  });
  
  const [fromCurrency, setFromCurrency] = useState(() => {
    const saved = localStorage.getItem('rateDiagnostic_from');
    return saved || 'EUR';
  });
  
  const [toCurrency, setToCurrency] = useState(() => {
    const saved = localStorage.getItem('rateDiagnostic_to');
    return saved || 'CLP';
  });

  useEffect(() => {
    localStorage.setItem('rateDiagnostic_date', testDate);
  }, [testDate]);

  useEffect(() => {
    localStorage.setItem('rateDiagnostic_amount', testAmount.toString());
  }, [testAmount]);

  useEffect(() => {
    localStorage.setItem('rateDiagnostic_from', fromCurrency);
  }, [fromCurrency]);

  useEffect(() => {
    localStorage.setItem('rateDiagnostic_to', toCurrency);
  }, [toCurrency]);

  const runDiagnostic = () => {
    const rates = getRateForDate(testDate);
    const converted = convertCurrencyAtDate(testAmount, fromCurrency, toCurrency, testDate);
    
    return {
      rates,
      converted,
      formula: `${testAmount} ${fromCurrency} / ${rates.EUR_CLP} = ${converted.toFixed(2)} ${toCurrency}`
    };
  };

  const result = runDiagnostic();
  const historyDates = Object.keys(exchangeRates.history || {}).sort();

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-xl p-4 max-w-sm border border-purple-200 z-50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-800 flex items-center">
          <i className="fas fa-chart-line text-purple-600 mr-2"></i>
          Diagnóstico de Tasas
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-mono">M19.2.1</span>
          {/* ✅ M24: Botón para cerrar */}
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
            title="Cerrar diagnóstico"
          >
            <i className="fas fa-times text-sm"></i>
          </button>
        </div>
      </div>

      {/* Inputs de prueba */}
      <div className="space-y-2 mb-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Fecha:
          </label>
          <input
            type="date"
            value={testDate}
            onChange={(e) => setTestDate(e.target.value)}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Monto:
            </label>
            <input
              type="number"
              value={testAmount}
              onChange={(e) => setTestAmount(Number(e.target.value))}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              De → A:
            </label>
            <div className="flex gap-1">
              <select
                value={fromCurrency}
                onChange={(e) => setFromCurrency(e.target.value)}
                className="flex-1 px-1 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-purple-500"
              >
                <option value="CLP">CLP</option>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
                <option value="UF">UF</option>
              </select>
              <select
                value={toCurrency}
                onChange={(e) => setToCurrency(e.target.value)}
                className="flex-1 px-1 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-purple-500"
              >
                <option value="EUR">EUR</option>
                <option value="CLP">CLP</option>
                <option value="USD">USD</option>
                <option value="UF">UF</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Resultados */}
      <div className="space-y-2 bg-purple-50 p-3 rounded-lg border border-purple-200">
        <div>
          <p className="text-xs text-gray-600 font-medium mb-1">Tasa para {testDate}:</p>
          <div className="text-xs font-mono bg-white p-2 rounded border border-purple-100">
            EUR/CLP: {result.rates.EUR_CLP?.toFixed(2) || 'N/A'}<br/>
            UF/CLP: {result.rates.UF_CLP?.toFixed(2) || result.rates.CLP_UF?.toFixed(2) || 'N/A'}
          </div>
        </div>

        <div>
          <p className="text-xs text-gray-600 font-medium mb-1">Resultado:</p>
          <div className="text-base font-bold text-purple-600 bg-white p-2 rounded border border-purple-100">
            {result.converted.toFixed(2)} {toCurrency}
          </div>
        </div>

        <div>
          <p className="text-xs text-gray-600 font-medium mb-1">Fórmula:</p>
          <div className="text-xs font-mono bg-white p-2 rounded border border-purple-100 text-gray-700">
            {result.formula}
          </div>
        </div>
      </div>

      {/* Info del historial */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="text-xs bg-blue-50 p-2 rounded border border-blue-100">
          <strong className="text-blue-700">{historyDates.length} fechas</strong>
          <span className="text-gray-600"> • </span>
          <span className="text-gray-600">{historyDates[0] || 'N/A'}</span>
          <span className="text-gray-600"> → </span>
          <span className="text-gray-600">{historyDates[historyDates.length - 1] || 'N/A'}</span>
        </div>
      </div>

      {/* Advertencias */}
      {testDate > (historyDates[historyDates.length - 1] || '2000-01-01') && (
        <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded p-2">
          <p className="text-xs text-yellow-800">
            ⚠️ Fecha posterior al historial. Usando tasa más cercana.
          </p>
        </div>
      )}
    </div>
  );
}