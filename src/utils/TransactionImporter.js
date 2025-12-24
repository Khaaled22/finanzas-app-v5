// ✅ M35: src/utils/TransactionImporter.js
// Genera mapping dinámico desde categorías del context

import * as XLSX from 'xlsx';

export class TransactionImporter {
  constructor(categories = []) {
    this.categories = categories;
    this.categoryMapping = this.generateDynamicMapping(categories);
  }

  generateDynamicMapping(categories) {
    const mapping = {};
    
    categories.forEach(cat => {
      const type = cat.type === 'income' ? 'Income' : 'Expense';
      
      // Key con el grupo y nombre tal cual están
      const key = `${cat.group}|${cat.name}|${type}`;
      mapping[key] = cat.id;
      
      // Key normalizada (sin emojis)
      const groupNoEmoji = this.removeEmojis(cat.group);
      const nameNoEmoji = this.removeEmojis(cat.name);
      const keyNorm = `${groupNoEmoji}|${nameNoEmoji}|${type}`;
      mapping[keyNorm] = cat.id;
    });
    
    return mapping;
  }

  setCategories(categories) {
    this.categories = categories;
    this.categoryMapping = this.generateDynamicMapping(categories);
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

  removeEmojis(str) {
    if (!str) return '';
    return str
      .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
      .replace(/[\u{2600}-\u{26FF}]/gu, '')
      .replace(/[\u{2700}-\u{27BF}]/gu, '')
      .replace(/[\u{FE00}-\u{FE0F}]/gu, '')
      .replace(/[\u{1F000}-\u{1F02F}]/gu, '')
      .replace(/[\u{1F0A0}-\u{1F0FF}]/gu, '')
      .replace(/[\u{200D}]/gu, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  getCategoryId(category, subcategory, type) {
    // Intento 1: Búsqueda exacta
    const key = `${category}|${subcategory}|${type}`;
    let categoryId = this.categoryMapping[key];
    
    if (categoryId) {
      console.log(`✅ Match exacto: ${key} → ${categoryId}`);
      return categoryId;
    }
    
    // Intento 2: Búsqueda normalizada
    const normalizedCategory = this.removeEmojis(category);
    const normalizedSubcategory = this.removeEmojis(subcategory);
    const normalizedKey = `${normalizedCategory}|${normalizedSubcategory}|${type}`;
    
    categoryId = this.categoryMapping[normalizedKey];
    if (categoryId) {
      console.log(`✅ Match normalizado: ${normalizedKey} → ${categoryId}`);
      return categoryId;
    }
    
    // Intento 3: Buscar comparando sin emojis
    for (const [mappingKey, mappingId] of Object.entries(this.categoryMapping)) {
      const [mapCat, mapSubcat, mapType] = mappingKey.split('|');
      const normalizedMapCat = this.removeEmojis(mapCat);
      const normalizedMapSubcat = this.removeEmojis(mapSubcat);
      
      if (normalizedMapCat === normalizedCategory && 
          normalizedMapSubcat === normalizedSubcategory && 
          mapType === type) {
        console.log(`✅ Match fuzzy: ${key} → ${mappingKey} → ${mappingId}`);
        return mappingId;
      }
    }
    
    // Intento 4: Búsqueda por nombre similar
    if (this.categories.length > 0) {
      const typeFilter = type === 'Income' ? 'income' : 'expense';
      const found = this.categories.find(cat => {
        const catNameNorm = this.removeEmojis(cat.name).toLowerCase();
        const catGroupNorm = this.removeEmojis(cat.group).toLowerCase();
        const subNorm = normalizedSubcategory.toLowerCase();
        const catNorm = normalizedCategory.toLowerCase();
        
        return cat.type === typeFilter &&
               catNameNorm === subNorm && 
               catGroupNorm === catNorm;
      });
      
      if (found) {
        console.log(`✅ Match por categoría: ${key} → ${found.id}`);
        return found.id;
      }
    }
    
    console.warn(`❌ No mapping found for: ${key}`);
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
      errors.push(`Fila ${index + 2}: No se encontró categoría "${row.Category}" → "${row.Subcategory}" (${row.Type})`);
    }
    
    const validCurrencies = ['EUR', 'CLP', 'USD', 'UF'];
    if (row.Currency && !validCurrencies.includes(row.Currency)) {
      errors.push(`Fila ${index + 2}: Moneda inválida: ${row.Currency}`);
    }
    
    if (row.Type && !['Income', 'Expense'].includes(row.Type)) {
      errors.push(`Fila ${index + 2}: Tipo inválido: ${row.Type}`);
    }
    
    return errors;
  }

  convertToTransaction(row, index) {
    const categoryId = this.getCategoryId(row.Category, row.Subcategory, row.Type);
    
    if (!categoryId) {
      throw new Error(`No mapping for: ${row.Category} → ${row.Subcategory} (${row.Type})`);
    }
    
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
    
    let description = '';
    if (row.Description && typeof row.Description === 'string' && row.Description.trim()) {
      description = row.Description.trim();
    } else if (row.Subcategory) {
      description = this.removeEmojis(row.Subcategory) || row.Subcategory;
    } else {
      description = 'Sin descripción';
    }
    
    return {
      id: `imported_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
      date: dateISO,
      categoryId: categoryId,
      amount: Math.abs(parseFloat(row.Amount)),
      currency: row.Currency,
      description: description,
      paymentMethod: row.PaymentMethod || 'Tarjeta',
      notes: row.Notes || '',
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
      dateRange: { oldest: null, newest: null },
      totalAmount: { EUR: 0, CLP: 0, USD: 0, UF: 0 }
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
}

export const createTransactionImporter = (categories) => {
  return new TransactionImporter(categories);
};

export default new TransactionImporter([]);