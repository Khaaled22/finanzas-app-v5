// src/utils/TransactionImporter.js
import * as XLSX from 'xlsx';
import categoryMapping from '../config/category-mapping-M16.json';

/**
 * Clase para procesar e importar transacciones desde Excel
 */
export class TransactionImporter {
  constructor() {
    this.categoryMapping = categoryMapping;
  }

  /**
   * Lee el archivo Excel y extrae las transacciones
   */
  async readExcelFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          resolve(jsonData);
        } catch (error) {
          reject(new Error(`Error leyendo Excel: ${error.message}`));
        }
      };
      
      reader.onerror = () => reject(new Error('Error cargando archivo'));
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Mapea Category + Subcategory + Type → categoryId
   */
  getCategoryId(category, subcategory, type) {
    const key = `${category}|${subcategory}|${type}`;
    const categoryId = this.categoryMapping[key];
    
    if (!categoryId) {
      console.warn(`⚠️ No mapping found for: ${key}`);
      return null;
    }
    
    return categoryId;
  }

  /**
   * Valida una fila del Excel
   */
  validateRow(row, index) {
    const errors = [];
    
    // Validar campos obligatorios
    if (!row.Date) errors.push(`Fila ${index + 2}: Falta fecha`);
    if (!row.Category) errors.push(`Fila ${index + 2}: Falta categoría`);
    if (!row.Subcategory) errors.push(`Fila ${index + 2}: Falta subcategoría`);
    if (!row.Type) errors.push(`Fila ${index + 2}: Falta tipo (Income/Expense)`);
    if (row.Amount === undefined || row.Amount === null) {
      errors.push(`Fila ${index + 2}: Falta monto`);
    }
    if (!row.Currency) errors.push(`Fila ${index + 2}: Falta moneda`);
    
    // Validar que exista mapeo de categoría
    const categoryId = this.getCategoryId(row.Category, row.Subcategory, row.Type);
    if (!categoryId) {
      errors.push(`Fila ${index + 2}: No se encontró mapeo para ${row.Category} → ${row.Subcategory}`);
    }
    
    // Validar moneda
    const validCurrencies = ['EUR', 'CLP', 'USD', 'UF'];
    if (row.Currency && !validCurrencies.includes(row.Currency)) {
      errors.push(`Fila ${index + 2}: Moneda inválida: ${row.Currency}`);
    }
    
    // Validar tipo
    if (row.Type && !['Income', 'Expense'].includes(row.Type)) {
      errors.push(`Fila ${index + 2}: Tipo inválido: ${row.Type} (debe ser Income o Expense)`);
    }
    
    return errors;
  }

  /**
   * Convierte fila de Excel a formato de transacción de la app
   */
  convertToTransaction(row, index) {
    const categoryId = this.getCategoryId(row.Category, row.Subcategory, row.Type);
    
    if (!categoryId) {
      throw new Error(`No mapping for: ${row.Category} → ${row.Subcategory} (${row.Type})`);
    }
    
    // Convertir fecha Excel a ISO string
    let dateISO;
    if (row.Date instanceof Date) {
      dateISO = row.Date.toISOString();
    } else if (typeof row.Date === 'string') {
      dateISO = new Date(row.Date).toISOString();
    } else {
      // Excel serial date
      const excelEpoch = new Date(1899, 11, 30);
      const date = new Date(excelEpoch.getTime() + row.Date * 86400000);
      dateISO = date.toISOString();
    }
    
    // Manejar Description (puede ser NaN/null)
    let description = row.Description || '';
    if (typeof description !== 'string') {
      description = '';
    }
    
    return {
      id: `imported_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
      date: dateISO,
      categoryId: categoryId,
      amount: Math.abs(parseFloat(row.Amount)),
      currency: row.Currency,
      description: description.trim() || `${row.Category} - ${row.Subcategory}`,
      comment: '',
      paymentMethod: 'Tarjeta', // Default según decisión M15
      user: 'Usuario 1', // Default según decisión M15
      imported: true, // Flag para identificar transacciones importadas
      importedAt: new Date().toISOString()
    };
  }

  /**
   * Procesa todo el archivo Excel
   */
  async processFile(file) {
    try {
      // 1. Leer Excel
      const rows = await this.readExcelFile(file);
      
      // 2. Validar todas las filas
      const allErrors = [];
      rows.forEach((row, index) => {
        const errors = this.validateRow(row, index);
        allErrors.push(...errors);
      });
      
      if (allErrors.length > 0) {
        return {
          success: false,
          errors: allErrors,
          transactions: [],
          stats: null
        };
      }
      
      // 3. Convertir a transacciones
      const transactions = [];
      const conversionErrors = [];
      
      rows.forEach((row, index) => {
        try {
          const transaction = this.convertToTransaction(row, index);
          transactions.push(transaction);
        } catch (error) {
          conversionErrors.push(`Fila ${index + 2}: ${error.message}`);
        }
      });
      
      if (conversionErrors.length > 0) {
        return {
          success: false,
          errors: conversionErrors,
          transactions: [],
          stats: null
        };
      }
      
      // 4. Generar estadísticas
      const stats = this.generateStats(transactions);
      
      return {
        success: true,
        errors: [],
        transactions: transactions,
        stats: stats
      };
      
    } catch (error) {
      return {
        success: false,
        errors: [error.message],
        transactions: [],
        stats: null
      };
    }
  }

  /**
   * Genera estadísticas del archivo procesado
   */
  generateStats(transactions) {
    const stats = {
      total: transactions.length,
      byType: {},
      byCurrency: {},
      byMonth: {},
      dateRange: {
        oldest: null,
        newest: null
      },
      totalAmount: {
        EUR: 0,
        CLP: 0,
        USD: 0,
        UF: 0
      }
    };
    
    transactions.forEach(trans => {
      // Por tipo (basado en categoría)
      const type = trans.categoryId.includes('income') ? 'Income' : 'Expense';
      stats.byType[type] = (stats.byType[type] || 0) + 1;
      
      // Por moneda
      stats.byCurrency[trans.currency] = (stats.byCurrency[trans.currency] || 0) + 1;
      
      // Por mes
      const month = trans.date.substring(0, 7); // YYYY-MM
      stats.byMonth[month] = (stats.byMonth[month] || 0) + 1;
      
      // Rango de fechas
      const transDate = new Date(trans.date);
      if (!stats.dateRange.oldest || transDate < new Date(stats.dateRange.oldest)) {
        stats.dateRange.oldest = trans.date;
      }
      if (!stats.dateRange.newest || transDate > new Date(stats.dateRange.newest)) {
        stats.dateRange.newest = trans.date;
      }
      
      // Total por moneda
      stats.totalAmount[trans.currency] += trans.amount;
    });
    
    return stats;
  }

  /**
   * Filtra transacciones por rango de fechas
   */
  filterByDateRange(transactions, startDate, endDate) {
    return transactions.filter(trans => {
      const transDate = new Date(trans.date);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      
      if (start && transDate < start) return false;
      if (end && transDate > end) return false;
      return true;
    });
  }
}

export default new TransactionImporter();