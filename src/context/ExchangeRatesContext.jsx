// src/context/ExchangeRatesContext.jsx
// ✅ M26: Sub-contexto para gestión de tasas de cambio
// ✅ M37: Sincronización con Supabase (cron diario)
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import StorageManager from '../modules/storage/StorageManager';

const ExchangeRatesContext = createContext();

const DEFAULT_RATES = {
  EUR_CLP: 1050,
  EUR_USD: 1.09,
  CLP_UF: 36000
};

// ✅ M37: Obtener cliente Supabase de forma segura (import dinámico)
const getSupabaseClient = async () => {
  try {
    const { supabase } = await import('../modules/supabase/client');
    return supabase;
  } catch (e) {
    console.log('⚠️ Supabase client no disponible');
    return null;
  }
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
      enabled: true, // ✅ M37: Habilitado por defecto
      intervalHours: 24,
      lastCheck: null
    })
  );

  const [syncStatus, setSyncStatus] = useState({
    lastSync: null,
    syncing: false,
    error: null
  });

  const hasSyncedRef = useRef(false);

  // Auto-save to localStorage
  useEffect(() => { 
    StorageManager.save('exchangeRates_v5', exchangeRates); 
  }, [exchangeRates]);

  useEffect(() => {
    StorageManager.save('autoUpdateConfig_v5', autoUpdateConfig);
  }, [autoUpdateConfig]);

  // ✅ M37: Sincronizar con Supabase
  const syncFromSupabase = useCallback(async () => {
    setSyncStatus(prev => ({ ...prev, syncing: true, error: null }));

    try {
      const supabase = await getSupabaseClient();
      
      if (!supabase) {
        setSyncStatus({ lastSync: null, syncing: false, error: null });
        return { success: false, message: 'Supabase no configurado' };
      }

      if (import.meta.env.DEV) console.log('🔄 Sincronizando tasas desde Supabase...');

      // Obtener todas las tasas de Supabase
      const { data, error } = await supabase
        .from('exchange_rates')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        setSyncStatus({ lastSync: new Date().toISOString(), syncing: false, error: null });
        return { success: true, message: 'No hay datos nuevos' };
      }

      // Construir historial desde Supabase
      const history = {};
      data.forEach(rate => {
        history[rate.date] = {
          EUR_CLP: parseFloat(rate.eur_clp) || null,
          EUR_USD: parseFloat(rate.eur_usd) || null,
          UF_CLP: parseFloat(rate.clp_uf) || null,
          CLP_UF: parseFloat(rate.clp_uf) || null,
          USD_CLP: rate.eur_clp && rate.eur_usd 
            ? parseFloat(rate.eur_clp) / parseFloat(rate.eur_usd) 
            : null,
          source: rate.source || 'supabase',
          timestamp: rate.created_at
        };
      });

      // La tasa más reciente es la actual
      const latestRate = data[0];
      const current = {
        EUR_CLP: parseFloat(latestRate.eur_clp) || DEFAULT_RATES.EUR_CLP,
        EUR_USD: parseFloat(latestRate.eur_usd) || DEFAULT_RATES.EUR_USD,
        CLP_UF: parseFloat(latestRate.clp_uf) || DEFAULT_RATES.CLP_UF
      };

      // Merge con historial local existente
      setExchangeRates(prev => ({
        current,
        history: { ...prev.history, ...history },
        lastUpdated: new Date().toISOString(),
        source: 'supabase-sync'
      }));

      // También actualizar localStorage del historial
      const localHistory = JSON.parse(localStorage.getItem('exchangeRatesHistory') || '{}');
      const mergedHistory = { ...localHistory, ...history };
      localStorage.setItem('exchangeRatesHistory', JSON.stringify(mergedHistory));

      if (import.meta.env.DEV) console.log(`✅ Sincronizadas ${data.length} tasas desde Supabase`);
      
      setSyncStatus({ 
        lastSync: new Date().toISOString(), 
        syncing: false, 
        error: null 
      });

      return { 
        success: true, 
        count: data.length,
        message: `${data.length} tasas sincronizadas` 
      };

    } catch (error) {
      console.error('❌ Error sincronizando con Supabase:', error);
      setSyncStatus({ 
        lastSync: null, 
        syncing: false, 
        error: error.message 
      });
      return { success: false, message: error.message };
    }
  }, []);

  // ✅ M37: Sincronizar al montar el componente (una sola vez)
  useEffect(() => {
    if (autoUpdateConfig.enabled && !hasSyncedRef.current) {
      hasSyncedRef.current = true;
      syncFromSupabase();
    }
  }, [autoUpdateConfig.enabled, syncFromSupabase]);

  // ✅ M37: Sincronizar al volver a la app (visibility change)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && autoUpdateConfig.enabled) {
        // Solo sincronizar si han pasado más de 1 hora desde la última sync
        const lastSync = syncStatus.lastSync ? new Date(syncStatus.lastSync) : null;
        const now = new Date();
        const hoursSinceSync = lastSync ? (now - lastSync) / (1000 * 60 * 60) : Infinity;
        
        if (hoursSinceSync >= 1) {
          syncFromSupabase();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [autoUpdateConfig.enabled, syncStatus.lastSync, syncFromSupabase]);

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
    
    return exchangeRates.current || DEFAULT_RATES;
  }, [exchangeRates]);

  // ✅ Conversión con tasa histórica (con guard contra division by 0/null/undefined)
  const convertCurrencyAtDate = useCallback((amount, fromCurrency, toCurrency, date) => {
    if (fromCurrency === toCurrency) return amount;
    if (!amount || isNaN(amount)) return 0;

    const rates = getRateForDate(date);
    const safeEUR_CLP = rates.EUR_CLP || DEFAULT_RATES.EUR_CLP;
    const safeEUR_USD = rates.EUR_USD || DEFAULT_RATES.EUR_USD;
    const safeCLP_UF = rates.UF_CLP || rates.CLP_UF || DEFAULT_RATES.CLP_UF;

    let amountInEUR;

    switch (fromCurrency) {
      case 'EUR':
        amountInEUR = amount;
        break;
      case 'CLP':
        amountInEUR = amount / safeEUR_CLP;
        break;
      case 'USD':
        amountInEUR = amount / safeEUR_USD;
        break;
      case 'UF':
        const clpAmount = amount * safeCLP_UF;
        amountInEUR = clpAmount / safeEUR_CLP;
        break;
      default:
        amountInEUR = amount;
    }

    switch (toCurrency) {
      case 'EUR':
        return amountInEUR;
      case 'CLP':
        return amountInEUR * safeEUR_CLP;
      case 'USD':
        return amountInEUR * safeEUR_USD;
      case 'UF':
        const clpValue = amountInEUR * safeEUR_CLP;
        return clpValue / safeCLP_UF;
      default:
        return amountInEUR;
    }
  }, [getRateForDate]);

  // ✅ Conversión con tasas actuales (con guard contra division by 0/null/undefined)
  const convertCurrency = useCallback((amount, fromCurrency, toCurrency) => {
    if (fromCurrency === toCurrency) return amount;
    if (!amount || isNaN(amount)) return 0;

    const rates = exchangeRates.current || exchangeRates;
    const safeEUR_CLP = rates.EUR_CLP || DEFAULT_RATES.EUR_CLP;
    const safeEUR_USD = rates.EUR_USD || DEFAULT_RATES.EUR_USD;
    const safeCLP_UF = rates.CLP_UF || rates.UF_CLP || DEFAULT_RATES.CLP_UF;

    let amountInEUR;

    switch (fromCurrency) {
      case 'EUR':
        amountInEUR = amount;
        break;
      case 'CLP':
        amountInEUR = amount / safeEUR_CLP;
        break;
      case 'USD':
        amountInEUR = amount / safeEUR_USD;
        break;
      case 'UF':
        const clpAmount = amount * safeCLP_UF;
        amountInEUR = clpAmount / safeEUR_CLP;
        break;
      default:
        amountInEUR = amount;
    }

    switch (toCurrency) {
      case 'EUR':
        return amountInEUR;
      case 'CLP':
        return amountInEUR * safeEUR_CLP;
      case 'USD':
        return amountInEUR * safeEUR_USD;
      case 'UF':
        const clpValue = amountInEUR * safeEUR_CLP;
        return clpValue / safeCLP_UF;
      default:
        return amountInEUR;
    }
  }, [exchangeRates]);

  // ✅ Actualizar tasas (manual o desde API)
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

      // Guardar en historial local
      const today = new Date().toISOString().slice(0, 10);
      const historyData = JSON.parse(localStorage.getItem('exchangeRatesHistory') || '{}');
      
      if (!historyData[today] || source === 'manual') {
        historyData[today] = {
          EUR_CLP: newRates.EUR_CLP || prev.current.EUR_CLP,
          UF_CLP: newRates.UF_CLP || newRates.CLP_UF || prev.current.CLP_UF,
          USD_CLP: newRates.USD_CLP,
          EUR_USD: newRates.EUR_USD || prev.current.EUR_USD,
          source: source,
          timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('exchangeRatesHistory', JSON.stringify(historyData));
      }

      if (!updated.history) updated.history = {};
      updated.history[today] = historyData[today];

      return updated;
    });

    // ✅ M37: También guardar en Supabase si es actualización manual
    if (source === 'manual') {
      try {
        const supabase = await getSupabaseClient();
        if (supabase) {
          const today = new Date().toISOString().slice(0, 10);
          
          const { error } = await supabase
            .from('exchange_rates')
            .upsert({
              date: today,
              base_currency: 'EUR',
              eur_clp: newRates.EUR_CLP,
              eur_usd: newRates.EUR_USD,
              clp_uf: newRates.CLP_UF || newRates.UF_CLP,
              source: 'manual'
            }, {
              onConflict: 'date,base_currency'
            });

          if (error) {
            console.error('Error guardando en Supabase:', error);
          } else {
            console.log('✅ Tasa guardada en Supabase');
          }
        }
      } catch (err) {
        console.error('Error guardando en Supabase:', err);
      }
    }

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
      // ✅ M37: Intentar obtener de Supabase primero
      const syncResult = await syncFromSupabase();
      
      if (syncResult.success) {
        return {
          success: true,
          rates: exchangeRates.current,
          source: 'supabase',
          message: syncResult.message
        };
      }
      
      return {
        success: true,
        rates: exchangeRates.current,
        source: 'cached',
        message: 'Tasas actuales (cache)'
      };
    } catch (error) {
      return {
        success: false,
        rates: exchangeRates.current,
        source: 'error',
        message: error.message
      };
    }
  }, [exchangeRates.current, syncFromSupabase]);

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
    fetchExchangeRates,
    // ✅ M37: Nuevas funciones de sync
    syncFromSupabase,
    syncStatus
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
    setUpdateInterval,
    syncFromSupabase,
    syncStatus
  ]);

  return (
    <ExchangeRatesContext.Provider value={value}>
      {children}
    </ExchangeRatesContext.Provider>
  );
}