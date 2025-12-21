// src/context/ExchangeRatesContext.jsx
// ✅ M26: Sub-contexto para gestión de tasas de cambio
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import StorageManager from '../modules/storage/StorageManager';

const ExchangeRatesContext = createContext();

const DEFAULT_RATES = {
  EUR_CLP: 1050,
  EUR_USD: 1.09,
  CLP_UF: 36000
};

export const useExchangeRates = () => {
  const context = useContext(ExchangeRatesContext);
  if (!context) {
    throw new Error('useExchangeRates debe usarse dentro de ExchangeRatesProvider');
  }
  return context;
};

export function ExchangeRatesProvider({ children, currentUser }) {
  const [exchangeRates, setExchangeRates] = useState(() => {
    const stored = StorageManager.load('exchangeRates_v5', null);
    
    if (stored && stored.current) {
      return stored;
    }
    
    if (stored && stored.EUR_CLP) {
      return {
        current: {
          EUR_CLP: stored.EUR_CLP || DEFAULT_RATES.EUR_CLP,
          EUR_USD: stored.EUR_USD || DEFAULT_RATES.EUR_USD,
          CLP_UF: stored.CLP_UF || DEFAULT_RATES.CLP_UF
        },
        history: {},
        lastUpdated: stored.lastUpdated || null,
        source: 'migrated'
      };
    }
    
    return {
      current: DEFAULT_RATES,
      history: {},
      lastUpdated: null,
      source: 'default'
    };
  });

  const [autoUpdateConfig, setAutoUpdateConfig] = useState(() =>
    StorageManager.load('autoUpdateConfig_v5', {
      enabled: false,
      intervalHours: 24,
      lastCheck: null
    })
  );

  // Auto-save
  useEffect(() => { 
    StorageManager.save('exchangeRates_v5', exchangeRates); 
  }, [exchangeRates]);

  useEffect(() => {
    StorageManager.save('autoUpdateConfig_v5', autoUpdateConfig);
  }, [autoUpdateConfig]);

  // ✅ Obtener tasa para una fecha
  const getRateForDate = useCallback((date) => {
    const dateStr = date instanceof Date 
      ? date.toISOString().split('T')[0] 
      : date;
    
    if (exchangeRates.history && exchangeRates.history[dateStr]) {
      return exchangeRates.history[dateStr];
    }
    
    if (exchangeRates.history) {
      const dates = Object.keys(exchangeRates.history).sort();
      const closestDate = dates.filter(d => d <= dateStr).pop();
      if (closestDate) {
        return exchangeRates.history[closestDate];
      }
    }
    
    return exchangeRates.current;
  }, [exchangeRates]);

  // ✅ Conversión con tasa histórica
  const convertCurrencyAtDate = useCallback((amount, fromCurrency, toCurrency, date) => {
    if (fromCurrency === toCurrency) return amount;
    if (!amount || isNaN(amount)) return 0;
    
    const rates = getRateForDate(date);
    
    let amountInEUR;
    
    switch (fromCurrency) {
      case 'EUR':
        amountInEUR = amount;
        break;
      case 'CLP':
        amountInEUR = amount / rates.EUR_CLP;
        break;
      case 'USD':
        amountInEUR = rates.EUR_USD 
          ? amount / rates.EUR_USD
          : amount / ((rates.USD_CLP || 920) / rates.EUR_CLP);
        break;
      case 'UF':
        const clpAmount = amount * (rates.UF_CLP || rates.CLP_UF || 36000);
        amountInEUR = clpAmount / rates.EUR_CLP;
        break;
      default:
        amountInEUR = amount;
    }
    
    switch (toCurrency) {
      case 'EUR':
        return amountInEUR;
      case 'CLP':
        return amountInEUR * rates.EUR_CLP;
      case 'USD':
        return rates.EUR_USD 
          ? amountInEUR * rates.EUR_USD
          : amountInEUR * (rates.EUR_CLP / (rates.USD_CLP || 920));
      case 'UF':
        const clpValue = amountInEUR * rates.EUR_CLP;
        return clpValue / (rates.UF_CLP || rates.CLP_UF || 36000);
      default:
        return amountInEUR;
    }
  }, [getRateForDate]);

  // ✅ Conversión con tasas actuales
  const convertCurrency = useCallback((amount, fromCurrency, toCurrency) => {
    if (fromCurrency === toCurrency) return amount;
    if (!amount || isNaN(amount)) return 0;
    
    const rates = exchangeRates.current || exchangeRates;
    
    let amountInEUR;
    
    switch (fromCurrency) {
      case 'EUR':
        amountInEUR = amount;
        break;
      case 'CLP':
        amountInEUR = amount / rates.EUR_CLP;
        break;
      case 'USD':
        amountInEUR = amount / rates.EUR_USD;
        break;
      case 'UF':
        const clpAmount = amount * (rates.CLP_UF || rates.UF_CLP || 36000);
        amountInEUR = clpAmount / rates.EUR_CLP;
        break;
      default:
        amountInEUR = amount;
    }
    
    switch (toCurrency) {
      case 'EUR':
        return amountInEUR;
      case 'CLP':
        return amountInEUR * rates.EUR_CLP;
      case 'USD':
        return amountInEUR * rates.EUR_USD;
      case 'UF':
        const clpValue = amountInEUR * rates.EUR_CLP;
        return clpValue / (rates.CLP_UF || rates.UF_CLP || 36000);
      default:
        return amountInEUR;
    }
  }, [exchangeRates]);

  // ✅ Actualizar tasas
  const updateExchangeRates = useCallback(async (newRates, source = 'manual') => {
    setExchangeRates(prev => {
      const update = {
        id: Date.now(),
        date: new Date().toISOString(),
        source: source,
        rates: newRates,
        user: currentUser
      };

      const updated = {
        ...prev,
        current: { ...prev.current, ...newRates },
        lastUpdated: new Date().toISOString(),
        updateHistory: [...(prev.updateHistory || []), update].slice(-10)
      };

      if (source === 'api-auto') {
        const today = new Date().toISOString().slice(0, 10);
        const historyData = JSON.parse(localStorage.getItem('exchangeRatesHistory') || '{}');
        
        if (!historyData[today]) {
          historyData[today] = {
            EUR_CLP: newRates.EUR_CLP || prev.current.EUR_CLP,
            UF_CLP: newRates.UF_CLP || newRates.CLP_UF || prev.current.CLP_UF,
            USD_CLP: newRates.USD_CLP,
            EUR_USD: newRates.EUR_USD || prev.current.EUR_USD,
            source: 'api-auto',
            timestamp: new Date().toISOString()
          };
          
          localStorage.setItem('exchangeRatesHistory', JSON.stringify(historyData));
        }

        if (!updated.history) updated.history = {};
        updated.history[today] = historyData[today];
      }

      return updated;
    });
    return true;
  }, [currentUser]);

  // ✅ Importar tasas históricas
  const importHistoricalRates = useCallback((ratesData) => {
    try {
      if (!ratesData || typeof ratesData !== 'object') {
        throw new Error('Datos de tasas inválidos');
      }

      setExchangeRates(prev => ({
        current: ratesData.current || prev.current,
        history: { 
          ...(prev.history || {}), 
          ...(ratesData.history || {}) 
        },
        lastUpdated: new Date().toISOString(),
        source: ratesData.source || 'imported'
      }));

      const importedCount = Object.keys(ratesData.history || {}).length;
      return {
        success: true,
        count: importedCount,
        message: `${importedCount} fechas importadas correctamente`
      };
    } catch (error) {
      return {
        success: false,
        count: 0,
        message: error.message
      };
    }
  }, []);

  const fetchExchangeRates = useCallback(async () => {
    try {
      return {
        success: true,
        rates: exchangeRates.current,
        source: 'cached',
        message: 'Tasas actuales'
      };
    } catch (error) {
      return {
        success: false,
        rates: exchangeRates.current,
        source: 'error',
        message: error.message
      };
    }
  }, [exchangeRates.current]);

  const setAutoUpdateEnabled = useCallback((enabled) => {
    setAutoUpdateConfig(prev => ({ ...prev, enabled }));
  }, []);

  const setUpdateInterval = useCallback((hours) => {
    setAutoUpdateConfig(prev => ({ ...prev, intervalHours: hours }));
  }, []);

  const value = useMemo(() => ({
    exchangeRates,
    setExchangeRates,
    autoUpdateConfig,
    setAutoUpdateEnabled,
    setUpdateInterval,
    getRateForDate,
    convertCurrency,
    convertCurrencyAtDate,
    updateExchangeRates,
    importHistoricalRates,
    fetchExchangeRates
  }), [
    exchangeRates,
    autoUpdateConfig,
    getRateForDate,
    convertCurrency,
    convertCurrencyAtDate,
    updateExchangeRates,
    importHistoricalRates,
    fetchExchangeRates,
    setAutoUpdateEnabled,
    setUpdateInterval
  ]);

  return (
    <ExchangeRatesContext.Provider value={value}>
      {children}
    </ExchangeRatesContext.Provider>
  );
}