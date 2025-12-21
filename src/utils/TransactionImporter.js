// ✅ M22 FINAL: src/utils/TransactionImporter.js
// Búsqueda flexible: Con emojis Y sin emojis (normalizado)

import * as XLSX from 'xlsx';
import categoryMapping from '../config/category-mapping-M16.json';

export class TransactionImporter {
  constructor() {
    this.categoryMapping = categoryMapping;
  }

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

  // ✅ M22: Función para remover emojis de strings
  removeEmojis(str) {
    if (!str) return '';
    // Regex que captura todos los emojis Unicode
    return str
      .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')  // Emojis básicos
      .replace(/[\u{2600}-\u{26FF}]/gu, '')    // Símbolos misceláneos
      .replace(/[\u{2700}-\u{27BF}]/gu, '')    // Dingbats
      .trim();
  }

  // ✅ M22: Búsqueda flexible con fallback
  getCategoryId(category, subcategory, type) {
    // Intento 1: Búsqueda exacta (con emojis)
    const key = `${category}|${subcategory}|${type}`;
    let categoryId = this.categoryMapping[key];
    
    if (categoryId) {
      console.log(`✅ Match exacto: ${key} → ${categoryId}`);
      return categoryId;
    }
    
    // Intento 2: Búsqueda sin emojis (normalizada)
    const normalizedCategory = this.removeEmojis(category);
    const normalizedSubcategory = this.removeEmojis(subcategory);
    const normalizedKey = `${normalizedCategory}|${normalizedSubcategory}|${type}`;
    
    // Buscar en el mapping comparando sin emojis
    for (const [mappingKey, mappingId] of Object.entries(this.categoryMapping)) {
      const [mapCat, mapSubcat, mapType] = mappingKey.split('|');
      const normalizedMapCat = this.removeEmojis(mapCat);
      const normalizedMapSubcat = this.removeEmojis(mapSubcat);
      
      if (normalizedMapCat === normalizedCategory && 
          normalizedMapSubcat === normalizedSubcategory && 
          mapType === type) {
        console.log(`✅ Match normalizado: ${key} → ${mappingKey} → ${mappingId}`);
        return mappingId;
      }
    }
    
    console.warn(`❌ No mapping found for: ${key}`);
    console.warn(`❌ Also tried normalized: ${normalizedKey}`);
    return null;
  }

  validateRow(row, index) {
    const errors = [];
    
    if (!row.Date) errors.push(`Fila ${index + 2}: Falta fecha`);
    if (!row.Category) errors.push(`Fila ${index + 2}: Falta categoría`);
    if (!row.Subcategory) errors.push(`Fila ${index + 2}: Falta subcategoría`);
    if (!row.Type) errors.push(`Fila ${index + 2}: Falta tipo (Income/Expense)`);
    if (row.Amount === undefined || row.Amount === null) {
      errors.push(`Fila ${index + 2}: Falta monto`);
    }
    if (!row.Currency) errors.push(`Fila ${index + 2}: Falta moneda`);
    
    const categoryId = this.getCategoryId(row.Category, row.Subcategory, row.Type);
    if (!categoryId) {
      errors.push(`Fila ${index + 2}: No se encontró mapeo para ${row.Category} → ${row.Subcategory}`);
    }
    
    const validCurrencies = ['EUR', 'CLP', 'USD', 'UF'];
    if (row.Currency && !validCurrencies.includes(row.Currency)) {
      errors.push(`Fila ${index + 2}: Moneda inválida: ${row.Currency}`);
    }
    
    if (row.Type && !['Income', 'Expense'].includes(row.Type)) {
      errors.push(`Fila ${index + 2}: Tipo inválido: ${row.Type} (debe ser Income o Expense)`);
    }
    
    return errors;
  }

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
      const excelEpoch = new Date(1899, 11, 30);
      const date = new Date(excelEpoch.getTime() + row.Date * 86400000);
      dateISO = date.toISOString();
    }
    
    // ✅ M22: Description priority: Excel Description > Subcategory > Fallback
    let description = '';
    if (row.Description && typeof row.Description === 'string' && row.Description.trim()) {
      description = row.Description.trim();
    } else if (row.Subcategory) {
      // Solo usar Subcategory sin Category
      description = row.Subcategory;
    } else {
      // Fallback (raro caso)
      description = `${row.Category} - ${row.Subcategory}`;
    }
    
    return {
      id: `imported_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
      date: dateISO,
      categoryId: categoryId,
      amount: Math.abs(parseFloat(row.Amount)),
      currency: row.Currency,
      description: description,
      
      // ✅ M21: Extended fields
      paymentMethod: row.PaymentMethod || 'Tarjeta',
      notes: row.Notes || '',
      
      // ✅ M21: Import metadata
      imported: true,
      importedAt: new Date().toISOString(),
      
      user: row.User || 'Usuario 1'
    };
  }

  async processFile(file) {
    try {
      const rows = await this.readExcelFile(file);
      
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
      const type = trans.categoryId.includes('income') ? 'Income' : 'Expense';
      stats.byType[type] = (stats.byType[type] || 0) + 1;
      
      stats.byCurrency[trans.currency] = (stats.byCurrency[trans.currency] || 0) + 1;
      
      const month = trans.date.substring(0, 7);
      stats.byMonth[month] = (stats.byMonth[month] || 0) + 1;
      
      const transDate = new Date(trans.date);
      if (!stats.dateRange.oldest || transDate < new Date(stats.dateRange.oldest)) {
        stats.dateRange.oldest = trans.date;
      }
      if (!stats.dateRange.newest || transDate > new Date(stats.dateRange.newest)) {
        stats.dateRange.newest = trans.date;
      }
      
      stats.totalAmount[trans.currency] += trans.amount;
    });
    
    return stats;
  }

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