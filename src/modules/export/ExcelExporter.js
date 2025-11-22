import * as XLSX from 'xlsx';

export class ExcelExporter {
  /**
   * Genera un reporte completo en formato Excel
   */
  static generateReport(data) {
    const wb = XLSX.utils.book_new();
    
    // 1. Hoja de Resumen
    this.createSummarySheet(wb, data);
    
    // 2. Hoja de Presupuesto
    this.createBudgetSheet(wb, data);
    
    // 3. Hoja de Transacciones
    this.createTransactionsSheet(wb, data);
    
    // 4. Hoja de Deudas
    this.createDebtsSheet(wb, data);
    
    // 5. Hoja de Ahorros
    this.createSavingsSheet(wb, data);
    
    // 6. Hoja de Inversiones
    this.createInvestmentsSheet(wb, data);
    
    // Descargar archivo
    const filename = `finanzas-completo-${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, filename);
  }

  /**
   * Crea la hoja de resumen ejecutivo
   */
  static createSummarySheet(wb, data) {
    const summaryData = [
      ['RESUMEN FINANCIERO'],
      ['Fecha de Generación', new Date().toLocaleDateString('es-ES')],
      [''],
      ['=== PRESUPUESTO ==='],
      ['Presupuesto Total', data.totals.budgeted.toFixed(2), data.displayCurrency],
      ['Gastado Total', data.totals.spent.toFixed(2), data.displayCurrency],
      ['Disponible', data.totals.available.toFixed(2), data.displayCurrency],
      ['Porcentaje Usado', `${((data.totals.spent / data.totals.budgeted) * 100).toFixed(1)}%`],
      [''],
      ['=== PATRIMONIO ==='],
      ['Patrimonio Neto', data.netWorth.toFixed(2), data.displayCurrency],
      ['Salud Financiera', `${data.financialHealth}/100`],
      [''],
      ['=== DEUDAS ==='],
      ['Deudas Totales', data.totalDebt.toFixed(2), data.displayCurrency],
      ['Pago Mensual Total', data.debts.reduce((sum, d) => sum + d.monthlyPayment, 0).toFixed(2), data.displayCurrency],
      ['Número de Deudas', data.debts.length],
      [''],
      ['=== AHORROS ==='],
      ['Ahorros Totales', data.totalSavings.toFixed(2), data.displayCurrency],
      ['Objetivos Activos', data.savingsGoals.length],
      ['Progreso Promedio', data.savingsGoals.length > 0 
        ? `${((data.savingsGoals.reduce((sum, g) => sum + (g.currentAmount / g.targetAmount), 0) / data.savingsGoals.length) * 100).toFixed(1)}%`
        : '0%'
      ],
      [''],
      ['=== INVERSIONES ==='],
      ['Inversiones Totales', data.totalInvestments.toFixed(2), data.displayCurrency],
      ['Número de Inversiones', data.investments.length],
      ['ROI Promedio', this.calculateAverageROI(data.investments).toFixed(2) + '%']
    ];
    
    const ws = XLSX.utils.aoa_to_sheet(summaryData);
    
    // Ajustar anchos de columna
    ws['!cols'] = [
      { wch: 25 }, // Columna A
      { wch: 15 }, // Columna B
      { wch: 10 }  // Columna C
    ];
    
    XLSX.utils.book_append_sheet(wb, ws, 'Resumen');
  }

  /**
   * Crea la hoja de presupuesto detallado
   */
  static createBudgetSheet(wb, data) {
    const budgetData = [
      ['PRESUPUESTO DETALLADO'],
      [''],
      ['Grupo', 'Categoría', 'Presupuestado', 'Gastado', 'Disponible', 'Moneda', '% Usado']
    ];
    
    // Agrupar por categoría
    const grouped = {};
    data.categories.forEach(cat => {
      if (!grouped[cat.group]) grouped[cat.group] = [];
      grouped[cat.group].push(cat);
    });
    
    Object.entries(grouped).forEach(([group, cats]) => {
      cats.forEach((cat, index) => {
        const available = cat.budget - cat.spent;
        const percentUsed = cat.budget > 0 ? ((cat.spent / cat.budget) * 100).toFixed(1) : '0';
        
        budgetData.push([
          index === 0 ? group : '', // Solo mostrar grupo en primera fila
          cat.name,
          cat.budget.toFixed(2),
          cat.spent.toFixed(2),
          available.toFixed(2),
          cat.currency,
          percentUsed + '%'
        ]);
      });
      
      // Fila de subtotal por grupo
      const groupTotal = cats.reduce((sum, c) => sum + c.spent, 0);
      budgetData.push([
        '', `TOTAL ${group}`, '', groupTotal.toFixed(2), '', '', ''
      ]);
      budgetData.push([]); // Fila vacía
    });
    
    const ws = XLSX.utils.aoa_to_sheet(budgetData);
    
    // Ajustar anchos
    ws['!cols'] = [
      { wch: 20 },
      { wch: 25 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 10 },
      { wch: 10 }
    ];
    
    XLSX.utils.book_append_sheet(wb, ws, 'Presupuesto');
  }

  /**
   * Crea la hoja de transacciones
   */
  static createTransactionsSheet(wb, data) {
    const transData = [
      ['TRANSACCIONES'],
      [''],
      ['Fecha', 'Descripción', 'Categoría', 'Monto', 'Moneda', 'Método Pago', 'Usuario', 'Comentario']
    ];
    
    // Limitar a últimas 500 transacciones
    data.transactions.slice(0, 500).forEach(trans => {
      const cat = data.categories.find(c => c.id === trans.categoryId);
      
      transData.push([
        new Date(trans.date).toLocaleDateString('es-ES'),
        trans.description || '',
        cat?.name || 'N/A',
        trans.amount.toFixed(2),
        trans.currency,
        trans.paymentMethod || '',
        trans.user || '',
        trans.comment || ''
      ]);
    });
    
    // Fila de total
    transData.push([]);
    transData.push([
      '', '', 'TOTAL', 
      data.transactions.slice(0, 500).reduce((sum, t) => sum + t.amount, 0).toFixed(2)
    ]);
    
    const ws = XLSX.utils.aoa_to_sheet(transData);
    
    ws['!cols'] = [
      { wch: 12 },
      { wch: 30 },
      { wch: 20 },
      { wch: 12 },
      { wch: 8 },
      { wch: 15 },
      { wch: 12 },
      { wch: 30 }
    ];
    
    XLSX.utils.book_append_sheet(wb, ws, 'Transacciones');
  }

  /**
   * Crea la hoja de deudas
   */
  static createDebtsSheet(wb, data) {
    const debtData = [
      ['DEUDAS'],
      [''],
      ['Nombre', 'Tipo', 'Monto Original', 'Saldo Actual', 'Tasa %', 'Cuota Mensual', 'Moneda', 'Pagos Realizados', 'Fecha Inicio']
    ];
    
    data.debts.forEach(debt => {
      debtData.push([
        debt.name,
        debt.type,
        debt.originalAmount.toFixed(2),
        debt.currentBalance.toFixed(2),
        debt.interestRate.toFixed(2),
        debt.monthlyPayment.toFixed(2),
        debt.currency,
        debt.paymentsMade,
        debt.startDate ? new Date(debt.startDate).toLocaleDateString('es-ES') : ''
      ]);
    });
    
    // Totales
    debtData.push([]);
    debtData.push([
      '', 'TOTALES',
      data.debts.reduce((sum, d) => sum + d.originalAmount, 0).toFixed(2),
      data.debts.reduce((sum, d) => sum + d.currentBalance, 0).toFixed(2),
      '',
      data.debts.reduce((sum, d) => sum + d.monthlyPayment, 0).toFixed(2)
    ]);
    
    const ws = XLSX.utils.aoa_to_sheet(debtData);
    
    ws['!cols'] = [
      { wch: 25 },
      { wch: 20 },
      { wch: 15 },
      { wch: 15 },
      { wch: 10 },
      { wch: 15 },
      { wch: 8 },
      { wch: 15 },
      { wch: 12 }
    ];
    
    XLSX.utils.book_append_sheet(wb, ws, 'Deudas');
  }

  /**
   * Crea la hoja de ahorros
   */
  static createSavingsSheet(wb, data) {
    const savingsData = [
      ['OBJETIVOS DE AHORRO'],
      [''],
      ['Nombre', 'Descripción', 'Meta', 'Actual', 'Falta', 'Progreso %', 'Moneda', 'Fecha Límite', 'Prioridad']
    ];
    
    data.savingsGoals.forEach(goal => {
      const remaining = goal.targetAmount - goal.currentAmount;
      const progress = goal.targetAmount > 0 ? ((goal.currentAmount / goal.targetAmount) * 100).toFixed(1) : '0';
      
      savingsData.push([
        goal.name,
        goal.description || '',
        goal.targetAmount.toFixed(2),
        goal.currentAmount.toFixed(2),
        remaining.toFixed(2),
        progress + '%',
        goal.currency,
        goal.deadline ? new Date(goal.deadline).toLocaleDateString('es-ES') : '',
        goal.priority || ''
      ]);
    });
    
    // Totales
    savingsData.push([]);
    savingsData.push([
      '', 'TOTALES',
      data.savingsGoals.reduce((sum, g) => sum + g.targetAmount, 0).toFixed(2),
      data.savingsGoals.reduce((sum, g) => sum + g.currentAmount, 0).toFixed(2),
      data.savingsGoals.reduce((sum, g) => sum + (g.targetAmount - g.currentAmount), 0).toFixed(2)
    ]);
    
    const ws = XLSX.utils.aoa_to_sheet(savingsData);
    
    ws['!cols'] = [
      { wch: 25 },
      { wch: 30 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 12 },
      { wch: 8 },
      { wch: 12 },
      { wch: 12 }
    ];
    
    XLSX.utils.book_append_sheet(wb, ws, 'Ahorros');
  }

  /**
   * Crea la hoja de inversiones
   */
  static createInvestmentsSheet(wb, data) {
    const invData = [
      ['PORTAFOLIO DE INVERSIONES'],
      [''],
      ['Tipo', 'Símbolo', 'Nombre', 'Plataforma', 'Cantidad', 'Precio Compra', 'Precio Actual', 'Valor Total', 'Ganancia/Pérdida', 'ROI %', 'Moneda']
    ];
    
    data.investments.forEach(inv => {
      const currentValue = inv.quantity * inv.currentPrice;
      const purchaseValue = inv.quantity * inv.purchasePrice;
      const gainLoss = currentValue - purchaseValue;
      const roi = purchaseValue > 0 ? ((gainLoss / purchaseValue) * 100).toFixed(2) : '0';
      
      invData.push([
        inv.type,
        inv.symbol,
        inv.name,
        inv.platform || '',
        inv.quantity,
        inv.purchasePrice.toFixed(2),
        inv.currentPrice.toFixed(2),
        currentValue.toFixed(2),
        gainLoss.toFixed(2),
        roi + '%',
        inv.currency
      ]);
    });
    
    // Totales
    const totalValue = data.investments.reduce((sum, inv) => sum + (inv.quantity * inv.currentPrice), 0);
    const totalCost = data.investments.reduce((sum, inv) => sum + (inv.quantity * inv.purchasePrice), 0);
    const totalGainLoss = totalValue - totalCost;
    const totalROI = totalCost > 0 ? ((totalGainLoss / totalCost) * 100).toFixed(2) : '0';
    
    invData.push([]);
    invData.push([
      '', '', '', 'TOTALES', '',
      totalCost.toFixed(2),
      '',
      totalValue.toFixed(2),
      totalGainLoss.toFixed(2),
      totalROI + '%'
    ]);
    
    const ws = XLSX.utils.aoa_to_sheet(invData);
    
    ws['!cols'] = [
      { wch: 12 },
      { wch: 10 },
      { wch: 25 },
      { wch: 20 },
      { wch: 10 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 15 },
      { wch: 10 },
      { wch: 8 }
    ];
    
    XLSX.utils.book_append_sheet(wb, ws, 'Inversiones');
  }

  /**
   * Calcula el ROI promedio del portafolio
   */
  static calculateAverageROI(investments) {
    if (investments.length === 0) return 0;
    
    const totalROI = investments.reduce((sum, inv) => {
      const currentValue = inv.quantity * inv.currentPrice;
      const purchaseValue = inv.quantity * inv.purchasePrice;
      const roi = purchaseValue > 0 ? ((currentValue - purchaseValue) / purchaseValue) * 100 : 0;
      return sum + roi;
    }, 0);
    
    return totalROI / investments.length;
  }
}

export default ExcelExporter;