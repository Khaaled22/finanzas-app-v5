// src/hooks/useAutoRatesUpdate.js
// ✅ M23: Fix memory leak - cleanup correcto en todos los useEffect

import { useEffect, useRef, useState, useCallback } from 'react';
import { ExchangeRateService } from '../services/ExchangeRateService';

/**
 * Hook para manejar actualización automática de tasas de cambio
 * 
 * @param {Function} updateRatesCallback - Función para actualizar tasas en el contexto
 * @param {Object} options - Opciones de configuración
 * @param {boolean} options.enabled - Activar/desactivar actualización automática
 * @param {number} options.intervalHours - Intervalo en horas para actualización (default: 24)
 * @param {boolean} options.updateOnMount - Actualizar al montar componente (default: false)
 * @param {string} options.lastUpdated - Última vez que se actualizaron las tasas
 * @returns {Object} Estado y funciones del auto-update
 */
export function useAutoRatesUpdate(updateRatesCallback, options = {}) {
  const {
    enabled = false,
    intervalHours = 24,
    updateOnMount = false,
    lastUpdated = null
  } = options;

  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdateAttempt, setLastUpdateAttempt] = useState(null);
  const [lastUpdateResult, setLastUpdateResult] = useState(null);
  const [error, setError] = useState(null);
  
  const intervalRef = useRef(null);
  const hasRunOnMount = useRef(false);
  // ✅ M23: Ref para controlar si el componente está montado
  const isMountedRef = useRef(true);

  /**
   * Verificar si necesita actualización
   */
  const checkIfNeedsUpdate = useCallback(() => {
    if (!lastUpdated) {
      return true;
    }
    return ExchangeRateService.needsUpdate(lastUpdated, intervalHours);
  }, [lastUpdated, intervalHours]);

  /**
   * Guardar tasas en el historial
   */
  const saveToHistory = useCallback(async (rates) => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const history = JSON.parse(localStorage.getItem('exchangeRatesHistory') || '{}');
      
      if (!history[today]) {
        history[today] = {
          EUR_CLP: rates.EUR_CLP,
          UF_CLP: rates.UF_CLP || rates.CLP_UF,
          USD_CLP: rates.USD_CLP,
          source: 'api-auto',
          timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('exchangeRatesHistory', JSON.stringify(history));
      }
    } catch (error) {
      console.error('Error guardando en historial:', error);
    }
  }, []);

  /**
   * Función para actualizar tasas manualmente
   */
  const updateNow = useCallback(async () => {
    if (isUpdating) {
      return;
    }

    setIsUpdating(true);
    setError(null);
    setLastUpdateAttempt(new Date().toISOString());

    try {
      const results = await ExchangeRateService.fetchAllRates();
      
      // ✅ M23: Verificar si el componente sigue montado antes de actualizar estado
      if (!isMountedRef.current) return;
      
      if (results.success) {
        const validation = ExchangeRateService.validateRates(results.rates);
        
        if (!validation.valid) {
          console.warn('⚠️ Tasas con valores inusuales:', validation.errors);
        }

        await updateRatesCallback(results.rates, 'api-auto');
        
        // ✅ M23: Verificar montaje antes de cada actualización de estado
        if (!isMountedRef.current) return;
        
        setLastUpdateResult({
          success: true,
          rates: results.rates,
          sources: results.sources,
          timestamp: new Date().toISOString()
        });

        await saveToHistory(results.rates);
        
      } else {
        throw new Error(results.errors.join(', '));
      }
    } catch (err) {
      // ✅ M23: Verificar montaje antes de actualizar estado de error
      if (!isMountedRef.current) return;
      
      console.error('❌ Error actualizando tasas:', err);
      setError(err.message);
      setLastUpdateResult({
        success: false,
        error: err.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      // ✅ M23: Verificar montaje antes de actualizar estado
      if (isMountedRef.current) {
        setIsUpdating(false);
      }
    }
  }, [isUpdating, updateRatesCallback, saveToHistory]);

  /**
   * ✅ M23: Efecto para trackear el estado de montaje
   */
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  /**
   * Efecto para actualización automática al montar
   */
  useEffect(() => {
    if (!enabled) return;
    if (hasRunOnMount.current) return;
    
    if (updateOnMount && checkIfNeedsUpdate()) {
      updateNow();
      hasRunOnMount.current = true;
    }
  }, [enabled, updateOnMount, checkIfNeedsUpdate, updateNow]);

  /**
   * Efecto para actualización periódica
   * ✅ M23: Cleanup correcto del intervalo
   */
  useEffect(() => {
    // Limpiar intervalo anterior si existe
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!enabled) {
      return;
    }

    // Configurar intervalo (convertir horas a milisegundos)
    const intervalMs = intervalHours * 60 * 60 * 1000;
    
    intervalRef.current = setInterval(() => {
      if (isMountedRef.current && checkIfNeedsUpdate()) {
        updateNow();
      }
    }, intervalMs);

    // ✅ M23: Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, intervalHours, checkIfNeedsUpdate, updateNow]);

  /**
   * Efecto para actualización al cambiar de pestaña/ventana
   * ✅ M23: Cleanup correcto del event listener
   */
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isMountedRef.current && checkIfNeedsUpdate()) {
        updateNow();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // ✅ M23: Cleanup function
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, checkIfNeedsUpdate, updateNow]);

  return {
    // Estado
    isUpdating,
    lastUpdateAttempt,
    lastUpdateResult,
    error,
    
    // Funciones
    updateNow,
    checkIfNeedsUpdate,
    
    // Helpers
    needsUpdate: checkIfNeedsUpdate()
  };
}