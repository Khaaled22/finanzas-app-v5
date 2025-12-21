// src/modules/storage/DataCompressor.js
// ✅ M28: Compresión y archivado de datos históricos
// Reduce tamaño de localStorage comprimiendo datos antiguos

/**
 * DataCompressor - Gestiona compresión de datos históricos
 * 
 * Estrategias:
 * 1. Archivar transacciones > 6 meses (solo totales por categoría)
 * 2. Comprimir historial de tasas > 90 días (solo primera de cada semana)
 * 3. Limpiar datos temporales no necesarios
 */
export const DataCompressor = {
  
  /**
   * Analiza uso actual de localStorage
   */
  analyzeStorage() {
    const analysis = {
      total: 0,
      byKey: {},
      recommendations: []
    }

    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        const size = localStorage[key].length * 2 // UTF-16
        analysis.total += size
        analysis.byKey[key] = {
          sizeBytes: size,
          sizeMB: (size / (1024 * 1024)).toFixed(3)
        }
      }
    }

    analysis.totalMB = (analysis.total / (1024 * 1024)).toFixed(2)
    analysis.percentUsed = ((analysis.total / (5 * 1024 * 1024)) * 100).toFixed(1)

    // Generar recomendaciones
    if (analysis.byKey['transactions_v5']?.sizeBytes > 500000) {
      analysis.recommendations.push({
        type: 'archive_transactions',
        message: 'Las transacciones ocupan más de 500KB. Considera archivar las antiguas.',
        potential: '30-50% reducción'
      })
    }

    if (analysis.byKey['exchangeRatesHistory_v5']?.sizeBytes > 200000) {
      analysis.recommendations.push({
        type: 'compress_rates',
        message: 'El historial de tasas es grande. Considera comprimir datos antiguos.',
        potential: '60-80% reducción'
      })
    }

    return analysis
  },

  /**
   * Archiva transacciones antiguas
   * Convierte transacciones > monthsOld en resúmenes mensuales
   * 
   * @param {Array} transactions - Todas las transacciones
   * @param {number} monthsOld - Meses de antigüedad para archivar (default: 6)
   * @returns {Object} { active: [], archived: {} }
   */
  archiveOldTransactions(transactions, monthsOld = 6) {
    const cutoffDate = new Date()
    cutoffDate.setMonth(cutoffDate.getMonth() - monthsOld)
    
    const active = []
    const toArchive = []

    transactions.forEach(tx => {
      const txDate = new Date(tx.date)
      if (txDate >= cutoffDate) {
        active.push(tx)
      } else {
        toArchive.push(tx)
      }
    })

    // Crear resúmenes por mes/categoría
    const archived = {}
    toArchive.forEach(tx => {
      const month = tx.date.slice(0, 7) // YYYY-MM
      if (!archived[month]) {
        archived[month] = {
          totalTransactions: 0,
          totalAmount: 0,
          byCategory: {},
          byCurrency: {}
        }
      }

      archived[month].totalTransactions++
      archived[month].totalAmount += tx.amount

      // Por categoría
      const catId = tx.categoryId || 'uncategorized'
      if (!archived[month].byCategory[catId]) {
        archived[month].byCategory[catId] = { count: 0, total: 0 }
      }
      archived[month].byCategory[catId].count++
      archived[month].byCategory[catId].total += tx.amount

      // Por moneda
      const currency = tx.currency || 'EUR'
      if (!archived[month].byCurrency[currency]) {
        archived[month].byCurrency[currency] = { count: 0, total: 0 }
      }
      archived[month].byCurrency[currency].count++
      archived[month].byCurrency[currency].total += tx.amount
    })

    return {
      active,
      archived,
      stats: {
        activeCount: active.length,
        archivedCount: toArchive.length,
        monthsArchived: Object.keys(archived).length
      }
    }
  },

  /**
   * Comprime historial de tasas de cambio
   * Mantiene: últimos 30 días completos, luego solo 1 por semana
   * 
   * @param {Object} ratesHistory - { 'YYYY-MM-DD': { EUR_CLP, EUR_USD, ... } }
   * @param {number} keepFullDays - Días a mantener completos (default: 30)
   * @returns {Object} Historial comprimido
   */
  compressRatesHistory(ratesHistory, keepFullDays = 30) {
    const dates = Object.keys(ratesHistory).sort()
    if (dates.length === 0) return {}

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - keepFullDays)
    const cutoffStr = cutoffDate.toISOString().split('T')[0]

    const compressed = {}
    let lastKeptWeek = null

    dates.forEach(date => {
      if (date >= cutoffStr) {
        // Últimos N días: mantener todo
        compressed[date] = ratesHistory[date]
      } else {
        // Datos antiguos: mantener solo 1 por semana (lunes)
        const d = new Date(date)
        const weekKey = `${d.getFullYear()}-W${String(Math.ceil((d.getDate() + 6 - d.getDay()) / 7)).padStart(2, '0')}`
        
        if (weekKey !== lastKeptWeek) {
          compressed[date] = ratesHistory[date]
          lastKeptWeek = weekKey
        }
      }
    })

    return compressed
  },

  /**
   * Limpia datos temporales y de debug
   */
  cleanupTemporaryData() {
    const keysToRemove = []
    
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        // Remover datos de debug, temporales, o versiones antiguas
        if (key.startsWith('debug_') || 
            key.startsWith('temp_') ||
            key.includes('_v4') ||  // Versiones antiguas
            key.includes('_v3') ||
            key.includes('_backup_')) {
          keysToRemove.push(key)
        }
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key))
    
    return {
      removedKeys: keysToRemove,
      count: keysToRemove.length
    }
  },

  /**
   * Ejecuta compresión completa
   * @returns {Object} Reporte de compresión
   */
  runFullCompression() {
    const report = {
      before: this.analyzeStorage(),
      actions: [],
      after: null
    }

    // 1. Limpiar temporales
    const cleanup = this.cleanupTemporaryData()
    if (cleanup.count > 0) {
      report.actions.push({
        type: 'cleanup',
        message: `Eliminados ${cleanup.count} keys temporales`,
        keys: cleanup.removedKeys
      })
    }

    // 2. Comprimir tasas de cambio
    try {
      const ratesHistory = JSON.parse(localStorage.getItem('exchangeRatesHistory_v5') || '{}')
      const ratesBefore = Object.keys(ratesHistory).length
      
      if (ratesBefore > 60) {
        const compressed = this.compressRatesHistory(ratesHistory)
        const ratesAfter = Object.keys(compressed).length
        
        localStorage.setItem('exchangeRatesHistory_v5', JSON.stringify(compressed))
        
        report.actions.push({
          type: 'compress_rates',
          message: `Comprimido historial de tasas: ${ratesBefore} → ${ratesAfter} días`,
          reduction: `${((1 - ratesAfter/ratesBefore) * 100).toFixed(0)}%`
        })
      }
    } catch (e) {
      report.actions.push({ type: 'error', message: 'Error comprimiendo tasas: ' + e.message })
    }

    // 3. Archivar transacciones antiguas (solo análisis, no ejecutar automático)
    try {
      const transactions = JSON.parse(localStorage.getItem('transactions_v5') || '[]')
      if (transactions.length > 500) {
        const archivePreview = this.archiveOldTransactions(transactions, 6)
        
        report.actions.push({
          type: 'archive_preview',
          message: `${archivePreview.stats.archivedCount} transacciones podrían archivarse`,
          note: 'Usa archiveOldTransactions() manualmente para ejecutar'
        })
      }
    } catch (e) {
      report.actions.push({ type: 'error', message: 'Error analizando transacciones: ' + e.message })
    }

    report.after = this.analyzeStorage()
    report.saved = {
      bytes: report.before.total - report.after.total,
      mb: ((report.before.total - report.after.total) / (1024 * 1024)).toFixed(2)
    }

    return report
  }
}

export default DataCompressor