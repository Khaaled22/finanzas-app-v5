/**
 * StorageManager - Gestiona el almacenamiento en localStorage
 * ✅ M25: Optimizado con debounce para evitar escrituras excesivas
 * ✅ M18.6 - Con indicador visual de guardado automático
 */

// ✅ M25: Cola de escrituras pendientes y timeouts por key
const pendingWrites = new Map();
const DEBOUNCE_MS = 1000; // 1 segundo de debounce

const StorageManager = {
  /**
   * Guarda datos en localStorage con debounce
   * @param {string} key - Clave de almacenamiento
   * @param {any} data - Datos a guardar
   * @returns {boolean} - true si se programó el guardado
   */
  save(key, data) {
    try {
      // ✅ M25: Cancelar timeout anterior si existe
      if (pendingWrites.has(key)) {
        clearTimeout(pendingWrites.get(key).timeoutId);
      }

      // ✅ M25: Programar nueva escritura con debounce
      const timeoutId = setTimeout(() => {
        this._writeToStorage(key, data);
        pendingWrites.delete(key);
      }, DEBOUNCE_MS);

      // Guardar referencia al timeout y datos
      pendingWrites.set(key, { timeoutId, data });

      return true;
    } catch (error) {
      console.error('Error programando guardado:', error);
      return false;
    }
  },

  /**
   * ✅ M25: Escritura inmediata (bypass debounce)
   * Usar para operaciones críticas o antes de cerrar
   */
  saveImmediate(key, data) {
    // Cancelar cualquier escritura pendiente
    if (pendingWrites.has(key)) {
      clearTimeout(pendingWrites.get(key).timeoutId);
      pendingWrites.delete(key);
    }
    return this._writeToStorage(key, data);
  },

  /**
   * ✅ M25: Forzar escritura de todos los pendientes
   * Llamar antes de cerrar la app
   */
  flushAll() {
    pendingWrites.forEach(({ timeoutId, data }, key) => {
      clearTimeout(timeoutId);
      this._writeToStorage(key, data);
    });
    pendingWrites.clear();
  },

  /**
   * ✅ M25: Escritura real a localStorage
   * @private
   */
  _writeToStorage(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      
      // Mostrar indicador visual de guardado
      const indicator = document.getElementById('save-indicator');
      if (indicator) {
        indicator.style.opacity = '1';
        setTimeout(() => { 
          indicator.style.opacity = '0'; 
        }, 1500);
      }
      
      return true;
    } catch (error) {
      console.error('Error guardando en localStorage:', error);
      
      // ✅ M25: Si es error de cuota, intentar limpiar datos antiguos
      if (error.name === 'QuotaExceededError') {
        console.warn('LocalStorage lleno, intentando liberar espacio...');
        this._cleanupOldData();
        // Reintentar una vez
        try {
          localStorage.setItem(key, JSON.stringify(data));
          return true;
        } catch (retryError) {
          console.error('No se pudo guardar después de limpieza:', retryError);
        }
      }
      return false;
    }
  },

  /**
   * ✅ M25: Limpieza de datos antiguos cuando localStorage está lleno
   * @private
   */
  _cleanupOldData() {
    try {
      // Eliminar historial de tasas antiguo (mantener últimos 90 días)
      const ratesHistory = this.load('exchangeRatesHistory', {});
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 90);
      const cutoffStr = cutoffDate.toISOString().slice(0, 10);
      
      const cleanedHistory = {};
      Object.keys(ratesHistory).forEach(date => {
        if (date >= cutoffStr) {
          cleanedHistory[date] = ratesHistory[date];
        }
      });
      
      localStorage.setItem('exchangeRatesHistory', JSON.stringify(cleanedHistory));
      console.log('Limpieza de historial completada');
    } catch (error) {
      console.error('Error en limpieza:', error);
    }
  },

  /**
   * Carga datos desde localStorage
   * @param {string} key - Clave de almacenamiento
   * @param {any} defaultValue - Valor por defecto si no existe
   * @returns {any} - Datos cargados o valor por defecto
   */
  load(key, defaultValue) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Error cargando desde localStorage:', error);
      return defaultValue;
    }
  },

  /**
   * Elimina un item de localStorage
   * @param {string} key - Clave a eliminar
   */
  remove(key) {
    try {
      // Cancelar escritura pendiente si existe
      if (pendingWrites.has(key)) {
        clearTimeout(pendingWrites.get(key).timeoutId);
        pendingWrites.delete(key);
      }
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error eliminando de localStorage:', error);
    }
  },

  /**
   * Limpia todo el localStorage
   */
  clear() {
    try {
      // Cancelar todas las escrituras pendientes
      pendingWrites.forEach(({ timeoutId }) => clearTimeout(timeoutId));
      pendingWrites.clear();
      localStorage.clear();
    } catch (error) {
      console.error('Error limpiando localStorage:', error);
    }
  },

  /**
   * ✅ M25: Obtener tamaño aproximado del localStorage
   * @returns {object} - { used, total, percentage }
   */
  getStorageInfo() {
    try {
      let totalSize = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          totalSize += localStorage[key].length * 2; // UTF-16 = 2 bytes per char
        }
      }
      
      const usedMB = totalSize / (1024 * 1024);
      const totalMB = 5; // Típicamente 5MB
      
      return {
        used: usedMB.toFixed(2),
        total: totalMB,
        percentage: ((usedMB / totalMB) * 100).toFixed(1)
      };
    } catch (error) {
      return { used: 0, total: 5, percentage: 0 };
    }
  }
};

// ✅ M25: Guardar pendientes antes de cerrar la página
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    StorageManager.flushAll();
  });
}

export default StorageManager;