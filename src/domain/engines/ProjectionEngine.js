// src/domain/engines/ProjectionEngine.js

export const ProjectionEngine = {
  /**
   * Proyecta el cashflow para los próximos 12 meses
   * @param {Array} categories - Categorías con presupuestos
   * @param {Array} debts - Deudas con pagos mensuales
   * @param {Object} ynabConfig - Configuración con monthlyIncome
   * @returns {Array} - Proyección de 12 meses
   */
  projectCashflow(categories, debts, ynabConfig) {
    const projection = [];
    const monthlyExpenses = categories.reduce((sum, cat) => sum + cat.budget, 0);
    const monthlyDebtPayment = debts.reduce((sum, d) => sum + d.monthlyPayment, 0);
    const monthlyIncome = ynabConfig.monthlyIncome || 0;
    
    let cumulativeBalance = 0;
    
    for (let i = 0; i < 12; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() + i);
      
      const income = monthlyIncome;
      const expenses = monthlyExpenses;
      const debtPayments = monthlyDebtPayment;
      const netCashflow = income - expenses - debtPayments;
      
      cumulativeBalance += netCashflow;
      
      projection.push({
        month: date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }),
        monthIndex: i,
        income,
        expenses,
        debtPayments,
        netCashflow,
        cumulativeBalance
      });
    }
    
    return projection;
  },

  /**
   * Calcula estadísticas de la proyección
   */
  getProjectionStats(projection) {
    const deficitMonths = projection.filter(p => p.netCashflow < 0).length;
    const avgNetCashflow = projection.reduce((sum, p) => sum + p.netCashflow, 0) / projection.length;
    const finalBalance = projection[projection.length - 1].cumulativeBalance;
    const minBalance = Math.min(...projection.map(p => p.cumulativeBalance));
    
    return {
      deficitMonths,
      avgNetCashflow,
      finalBalance,
      minBalance,
      isHealthy: deficitMonths === 0 && finalBalance > 0
    };
  }
};