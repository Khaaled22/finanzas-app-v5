// src/utils/ratesImporter.js
// ✅ M19.2: Utilidad para importar y validar tasas históricas

/**
 * Valida la estructura del JSON de tasas históricas
 * @param {Object} data - Datos del JSON parseado
 * @returns {Object} { valid: boolean, error: string | null }
 */
export function validateRatesJSON(data) {
  // Verificar que sea un objeto
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'El archivo no contiene un objeto JSON válido' };
  }

  // Verificar que tenga la propiedad history
  if (!data.history || typeof data.history !== 'object') {
    return { valid: false, error: 'El JSON debe tener una propiedad "history"' };
  }

  // Verificar que history tenga al menos una fecha
  const dates = Object.keys(data.history);
  if (dates.length === 0) {
    return { valid: false, error: 'El historial está vacío' };
  }

  // Verificar formato de fechas (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  const invalidDates = dates.filter(date => !dateRegex.test(date));
  if (invalidDates.length > 0) {
    return { 
      valid: false, 
      error: `Fechas con formato inválido: ${invalidDates.slice(0, 3).join(', ')}...` 
    };
  }

  // Verificar que cada fecha tenga las tasas requeridas
  for (const date of dates.slice(0, 10)) { // Revisar solo las primeras 10
    const rates = data.history[date];
    
    if (!rates || typeof rates !== 'object') {
      return { 
        valid: false, 
        error: `La fecha ${date} no tiene un objeto de tasas válido` 
      };
    }

    // Verificar que tenga al menos EUR_CLP
    if (!rates.EUR_CLP || typeof rates.EUR_CLP !== 'number') {
      return { 
        valid: false, 
        error: `La fecha ${date} no tiene EUR_CLP válido` 
      };
    }

    // Advertir si faltan otras tasas (pero no fallar)
    if (!rates.UF_CLP && !rates.CLP_UF) {
      console.warn(`⚠️ La fecha ${date} no tiene UF_CLP`);
    }
  }

  return { valid: true, error: null };
}

/**
 * Lee y parsea un archivo JSON
 * @param {File} file - Archivo a leer
 * @returns {Promise<Object>} Datos parseados
 */
export async function readJSONFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        resolve(data);
      } catch (error) {
        reject(new Error('El archivo no es un JSON válido'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error al leer el archivo'));
    };
    
    reader.readAsText(file);
  });
}

/**
 * Obtiene estadísticas del historial a importar
 * @param {Object} data - Datos del JSON
 * @returns {Object} Estadísticas
 */
export function getRatesStats(data) {
  if (!data.history) return null;

  const dates = Object.keys(data.history).sort();
  const firstDate = dates[0];
  const lastDate = dates[dates.length - 1];

  // Calcular diferencia en días
  const first = new Date(firstDate);
  const last = new Date(lastDate);
  const daysDiff = Math.floor((last - first) / (1000 * 60 * 60 * 24));

  // Detectar frecuencia (diaria, mensual)
  const frequency = dates.length > 300 ? 'diaria' : 'mensual';

  return {
    count: dates.length,
    firstDate,
    lastDate,
    daysDiff,
    frequency,
    hasCurrent: !!data.current
  };
}

/**
 * Exporta el historial actual a JSON
 * @param {Object} exchangeRates - Estado completo de exchangeRates
 * @returns {string} JSON stringificado
 */
export function exportRatesToJSON(exchangeRates) {
  const exportData = {
    current: exchangeRates.current || {
      EUR_CLP: exchangeRates.EUR_CLP,
      EUR_USD: exchangeRates.EUR_USD,
      CLP_UF: exchangeRates.CLP_UF
    },
    history: exchangeRates.history || {},
    lastUpdated: exchangeRates.lastUpdated,
    source: 'finanzas-app-export',
    exportDate: new Date().toISOString()
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Descarga el JSON del historial
 * @param {Object} exchangeRates - Estado completo de exchangeRates
 */
export function downloadRatesJSON(exchangeRates) {
  const json = exportRatesToJSON(exchangeRates);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `exchange-rates-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}