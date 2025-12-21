// src/services/ExchangeRateService.js
// ✅ M19.7: Servicio simplificado con solo 2 APIs (sin exchangerate.host)

export class ExchangeRateService {
  /**
   * ✅ M19.7: Obtener todas las tasas de cambio desde APIs
   * Solo usa exchangerate-api.com y mindicador.cl
   * 
   * @returns {Promise<Object>} { success, rates, sources, errors }
   */
  static async fetchAllRates() {
    const results = {
      success: false,
      rates: {},
      sources: {},
      errors: []
    };

    try {
      // 1. Obtener EUR/CLP y EUR/USD desde exchangerate-api.com
      console.log('🔄 Consultando exchangerate-api.com...');
      const eurRates = await this.fetchFromExchangeRateAPI();
      console.log('📊 Respuesta exchangerate-api.com:', eurRates);
      
      if (eurRates.success) {
        results.rates.EUR_CLP = eurRates.rates.CLP;
        results.rates.EUR_USD = eurRates.rates.USD;
        
        // Calcular USD_CLP: EUR_CLP / EUR_USD = CLP por 1 USD
        if (eurRates.rates.CLP && eurRates.rates.USD) {
          results.rates.USD_CLP = eurRates.rates.CLP / eurRates.rates.USD;
          console.log('💱 USD_CLP calculado:', results.rates.USD_CLP);
        }
        
        results.sources.EUR_CLP = 'exchangerate-api.com';
        results.sources.EUR_USD = 'exchangerate-api.com';
        results.sources.USD_CLP = 'exchangerate-api.com (calculado)';
      } else {
        results.errors.push(`exchangerate-api.com: ${eurRates.error}`);
      }

      // 2. Obtener UF/CLP desde mindicador.cl
      console.log('🔄 Consultando mindicador.cl...');
      const ufRate = await this.fetchUFFromMindicador();
      console.log('📊 Respuesta mindicador.cl:', ufRate);
      
      if (ufRate.success) {
        results.rates.UF_CLP = ufRate.rate;
        results.rates.CLP_UF = ufRate.rate; // Mantener ambos formatos
        results.sources.UF_CLP = 'mindicador.cl';
      } else {
        results.errors.push(`mindicador.cl: ${ufRate.error}`);
      }

      // 3. Verificar si obtuvimos al menos una tasa
      results.success = Object.keys(results.rates).length > 0;

      console.log('✅ Resultado final:', results);
      return results;
    } catch (error) {
      results.errors.push(`Error general: ${error.message}`);
      console.error('❌ Error en fetchAllRates:', error);
      return results;
    }
  }

  /**
   * ✅ M19.7: Obtener tasas EUR desde exchangerate-api.com
   * API gratuita sin necesidad de key (1500 requests/día)
   * 
   * @returns {Promise<Object>} { success, rates, error }
   */
  static async fetchFromExchangeRateAPI() {
    try {
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/EUR', {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        success: true,
        rates: {
          CLP: data.rates.CLP || null,
          USD: data.rates.USD || null
        },
        date: data.date
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * ✅ M19.7: Obtener UF desde mindicador.cl
   * API pública del Banco Central de Chile
   * 
   * @returns {Promise<Object>} { success, rate, error }
   */
  static async fetchUFFromMindicador() {
    try {
      const response = await fetch('https://mindicador.cl/api/uf', {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.serie || data.serie.length === 0) {
        throw new Error('No hay datos de UF disponibles');
      }

      // Obtener el valor más reciente
      const latestUF = data.serie[0];

      return {
        success: true,
        rate: latestUF.valor,
        date: latestUF.fecha
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * ✅ M19.7: Verificar si las tasas necesitan actualización
   * 
   * @param {string} lastUpdated - ISO date string de última actualización
   * @param {number} hoursThreshold - Horas antes de considerar desactualizado (default: 24)
   * @returns {boolean} true si necesita actualización
   */
  static needsUpdate(lastUpdated, hoursThreshold = 24) {
    if (!lastUpdated) return true;

    const lastUpdate = new Date(lastUpdated);
    const now = new Date();
    const hoursSinceUpdate = (now - lastUpdate) / (1000 * 60 * 60);

    return hoursSinceUpdate >= hoursThreshold;
  }

  /**
   * ✅ M19.7: Validar tasas obtenidas
   * Verifica que las tasas estén en rangos razonables
   * 
   * @param {Object} rates - Objeto con tasas
   * @returns {Object} { valid, errors }
   */
  static validateRates(rates) {
    const errors = [];

    // Validar EUR_CLP (típicamente entre 800-1300)
    if (rates.EUR_CLP) {
      if (rates.EUR_CLP < 500 || rates.EUR_CLP > 2000) {
        errors.push(`EUR_CLP fuera de rango: ${rates.EUR_CLP}`);
      }
    }

    // Validar EUR_USD (típicamente entre 0.9-1.3)
    if (rates.EUR_USD) {
      if (rates.EUR_USD < 0.5 || rates.EUR_USD > 2.0) {
        errors.push(`EUR_USD fuera de rango: ${rates.EUR_USD}`);
      }
    }

    // Validar UF_CLP (típicamente entre 30000-50000)
    if (rates.UF_CLP) {
      if (rates.UF_CLP < 20000 || rates.UF_CLP > 70000) {
        errors.push(`UF_CLP fuera de rango: ${rates.UF_CLP}`);
      }
    }

    // Validar USD_CLP (típicamente entre 700-1100)
    if (rates.USD_CLP) {
      if (rates.USD_CLP < 500 || rates.USD_CLP > 1500) {
        errors.push(`USD_CLP fuera de rango: ${rates.USD_CLP}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * ✅ M19.7: Formatear respuesta para el usuario
   * 
   * @param {Object} results - Resultado de fetchAllRates
   * @returns {string} Mensaje formateado
   */
  static formatUpdateMessage(results) {
    if (!results.success) {
      return `❌ Error al actualizar tasas:\n${results.errors.join('\n')}`;
    }

    const lines = ['✅ Tasas actualizadas exitosamente:\n'];
    
    if (results.rates.EUR_CLP) {
      lines.push(`EUR → CLP: ${results.rates.EUR_CLP.toFixed(2)} (${results.sources.EUR_CLP})`);
    }
    
    if (results.rates.EUR_USD) {
      lines.push(`EUR → USD: ${results.rates.EUR_USD.toFixed(4)} (${results.sources.EUR_USD})`);
    }
    
    if (results.rates.USD_CLP) {
      lines.push(`USD → CLP: ${results.rates.USD_CLP.toFixed(2)} (${results.sources.USD_CLP})`);
    }
    
    if (results.rates.UF_CLP) {
      lines.push(`UF → CLP: ${results.rates.UF_CLP.toFixed(2)} (${results.sources.UF_CLP})`);
    }

    if (results.errors.length > 0) {
      lines.push('\n⚠️ Advertencias:');
      results.errors.forEach(err => lines.push(`  - ${err}`));
    }

    return lines.join('\n');
  }

  /**
   * ✅ M19.7: Test de conectividad con APIs
   * Solo 2 APIs: exchangerate-api.com y mindicador.cl
   * 
   * @returns {Promise<Object>} Estado de cada API
   */
  static async testAPIs() {
    const results = {
      exchangerateAPI: { available: false, message: '' },
      mindicador: { available: false, message: '' }
    };

    // Test exchangerate-api.com
    try {
      const apiTest = await this.fetchFromExchangeRateAPI();
      results.exchangerateAPI.available = apiTest.success;
      results.exchangerateAPI.message = apiTest.success 
        ? `✅ Funcionando (EUR/USD: ${apiTest.rates.USD})` 
        : `❌ ${apiTest.error}`;
    } catch (error) {
      results.exchangerateAPI.message = `❌ ${error.message}`;
    }

    // Test mindicador.cl
    try {
      const ufTest = await this.fetchUFFromMindicador();
      results.mindicador.available = ufTest.success;
      results.mindicador.message = ufTest.success 
        ? `✅ Funcionando (UF: $${ufTest.rate.toFixed(2)})` 
        : `❌ ${ufTest.error}`;
    } catch (error) {
      results.mindicador.message = `❌ ${error.message}`;
    }

    return results;
  }
}