// src/modules/cache/CalculationCache.js
// ✅ M28: Sistema de caché para cálculos pesados
// Evita recalcular totales, conversiones, y análisis repetidamente

/**
 * CalculationCache - Memoización inteligente de cálculos
 * 
 * Cachea:
 * - Totales por categoría/mes
 * - Conversiones de moneda frecuentes
 * - Índice Nauta y KPIs
 * - Proyecciones de cashflow
 */
class CalculationCacheClass {
  constructor() {
    this.cache = new Map()
    this.maxSize = 500 // Máximo de entries en caché
    this.ttlMs = 5 * 60 * 1000 // 5 minutos TTL por defecto
    this.hits = 0
    this.misses = 0
  }

  /**
   * Genera key única para el caché
   */
  _generateKey(prefix, ...args) {
    const argsHash = args.map(arg => {
      if (arg === null || arg === undefined) return 'null'
      if (typeof arg === 'object') {
        // Para objetos, usar un hash simple
        return JSON.stringify(arg).slice(0, 100)
      }
      return String(arg)
    }).join('|')
    
    return `${prefix}:${argsHash}`
  }

  /**
   * Obtener valor del caché
   */
  get(key) {
    const entry = this.cache.get(key)
    
    if (!entry) {
      this.misses++
      return null
    }

    // Verificar TTL
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      this.misses++
      return null
    }

    this.hits++
    entry.lastAccess = Date.now()
    return entry.value
  }

  /**
   * Guardar valor en caché
   */
  set(key, value, ttlMs = this.ttlMs) {
    // Si alcanzamos el máximo, eliminar entries más antiguas
    if (this.cache.size >= this.maxSize) {
      this._evictOldest()
    }

    this.cache.set(key, {
      value,
      createdAt: Date.now(),
      lastAccess: Date.now(),
      expiresAt: Date.now() + ttlMs
    })
  }

  /**
   * Eliminar entries más antiguas (LRU)
   */
  _evictOldest() {
    let oldestKey = null
    let oldestAccess = Infinity

    for (const [key, entry] of this.cache) {
      if (entry.lastAccess < oldestAccess) {
        oldestAccess = entry.lastAccess
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
    }
  }

  /**
   * Invalidar caché por prefijo
   * Útil cuando cambian transacciones de un mes específico
   */
  invalidateByPrefix(prefix) {
    const keysToDelete = []
    
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key))
    return keysToDelete.length
  }

  /**
   * Invalidar todo el caché
   */
  invalidateAll() {
    const count = this.cache.size
    this.cache.clear()
    return count
  }

  /**
   * Obtener estadísticas del caché
   */
  getStats() {
    const total = this.hits + this.misses
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? ((this.hits / total) * 100).toFixed(1) + '%' : '0%'
    }
  }

  // =========================================
  // MÉTODOS ESPECÍFICOS PARA FINANZAS APP
  // =========================================

  /**
   * Cachear cálculo de gastos por categoría/mes
   */
  getCategorySpent(categoryId, month, calculateFn) {
    const key = this._generateKey('categorySpent', categoryId, month)
    
    let result = this.get(key)
    if (result !== null) return result

    result = calculateFn()
    this.set(key, result)
    return result
  }

  /**
   * Cachear totales mensuales
   */
  getMonthlyTotals(month, transactions, convertFn, displayCurrency) {
    const txHash = transactions.length + '_' + (transactions[0]?.id || 'empty')
    const key = this._generateKey('monthlyTotals', month, txHash, displayCurrency)
    
    let result = this.get(key)
    if (result !== null) return result

    // Calcular totales
    result = {
      income: 0,
      expenses: 0,
      byCategory: {}
    }

    transactions.forEach(tx => {
      if (tx.date.startsWith(month)) {
        const amount = convertFn(tx.amount, tx.currency, displayCurrency)
        result.expenses += amount
        
        const catId = tx.categoryId || 'uncategorized'
        result.byCategory[catId] = (result.byCategory[catId] || 0) + amount
      }
    })

    this.set(key, result)
    return result
  }

  /**
   * Cachear índice Nauta
   */
  getNautaIndex(dataHash, calculateFn) {
    const key = this._generateKey('nautaIndex', dataHash)
    
    let result = this.get(key)
    if (result !== null) return result

    result = calculateFn()
    this.set(key, result, 10 * 60 * 1000) // 10 min TTL para análisis
    return result
  }

  /**
   * Cachear proyección de cashflow
   */
  getCashflowProjection(dataHash, calculateFn) {
    const key = this._generateKey('cashflow', dataHash)
    
    let result = this.get(key)
    if (result !== null) return result

    result = calculateFn()
    this.set(key, result, 10 * 60 * 1000) // 10 min TTL
    return result
  }

  /**
   * Cachear conversión de moneda
   * TTL más corto porque las tasas pueden cambiar
   */
  getConversion(amount, from, to, rate) {
    if (from === to) return amount
    
    const key = this._generateKey('convert', amount, from, to, rate)
    
    let result = this.get(key)
    if (result !== null) return result

    result = amount * rate
    this.set(key, result, 60 * 1000) // 1 min TTL para conversiones
    return result
  }

  /**
   * Invalidar caché cuando cambian datos de un mes
   */
  invalidateMonth(month) {
    let count = 0
    count += this.invalidateByPrefix(`categorySpent:`)
    count += this.invalidateByPrefix(`monthlyTotals:${month}`)
    return count
  }

  /**
   * Invalidar caché de análisis
   */
  invalidateAnalysis() {
    let count = 0
    count += this.invalidateByPrefix('nautaIndex:')
    count += this.invalidateByPrefix('cashflow:')
    return count
  }
}

// Singleton instance
export const CalculationCache = new CalculationCacheClass()

/**
 * Hook para usar el caché en componentes React
 */
export const useCalculationCache = () => {
  return {
    cache: CalculationCache,
    invalidateMonth: (month) => CalculationCache.invalidateMonth(month),
    invalidateAll: () => CalculationCache.invalidateAll(),
    getStats: () => CalculationCache.getStats()
  }
}

export default CalculationCache