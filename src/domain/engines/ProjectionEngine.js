// src/domain/engines/ProjectionEngine.js
// ✅ M36 Fase 5: EXTENDIDO con inversión flexible y separación flowKind
// ✅ M19.3: Mantiene escenarios y eventos programados

export const ProjectionEngine = {
  /**
   * Proyecta el cashflow para los próximos 12 meses
   * ✅ M36 Fase 5: Ahora incluye inversión flexible
   * 
   * @param {Array} categories - Categorías con presupuestos
   * @param {Array} debts - Deudas con pagos mensuales
   * @param {Object} ynabConfig - Configuración con monthlyIncome
   * @param {Function} convertCurrency - Función de conversión de monedas
   * @param {String} displayCurrency - Moneda de visualización
   * @param {Object} options - Opciones de proyección
   * @returns {Array} - Proyección de 12 meses
   */
  projectCashflow(categories, debts, ynabConfig, convertCurrency, displayCurrency, options = {}) {
    const {
      scenario = 'realistic',
      scheduledEvents = [],
      // ✅ M36 Fase 5: Nuevas opciones de inversión
      investmentMode = 'fixed', // 'fixed' | 'flexible' | 'none'
      flexibleInvestmentPercent = 20, // % del excedente para inversión flexible
      investments = [] // Para calcular proyección de crecimiento
    } = options;

    const projection = [];
    
    // ✅ M36 Fase 5: Separar categorías por flowKind
    const operatingCategories = categories.filter(cat => 
      this.getFlowKind(cat) === 'OPERATING_EXPENSE'
    );
    const debtCategories = categories.filter(cat => 
      this.getFlowKind(cat) === 'DEBT_PAYMENT'
    );
    const investmentCategories = categories.filter(cat => 
      this.getFlowKind(cat) === 'INVESTMENT_CONTRIBUTION'
    );
    
    // Gastos operativos base
    const baseOperatingExpenses = operatingCategories.reduce((sum, cat) => 
      sum + convertCurrency(cat.budget || 0, cat.currency, displayCurrency), 0
    );
    
    // Pagos de deuda (de categorías + deudas registradas)
    const baseDebtFromCategories = debtCategories.reduce((sum, cat) => 
      sum + convertCurrency(cat.budget || 0, cat.currency, displayCurrency), 0
    );
    const baseDebtFromDebts = debts.reduce((sum, d) => 
      sum + convertCurrency(d.monthlyPayment || 0, d.currency, displayCurrency), 0
    );
    // Usar el mayor para evitar duplicados
    const baseDebtPayments = Math.max(baseDebtFromCategories, baseDebtFromDebts);
    
    // Inversión presupuestada (fija)
    const baseInvestmentBudget = investmentCategories.reduce((sum, cat) => 
      sum + convertCurrency(cat.budget || 0, cat.currency, displayCurrency), 0
    );
    
    // Ingreso mensual
    const baseMonthlyIncome = ynabConfig?.monthlyIncome
      ? convertCurrency(ynabConfig.monthlyIncome, ynabConfig.currency, displayCurrency)
      : 0;
    
    // Factores de escenario
    const scenarioFactors = this.getScenarioFactors(scenario);
    
    let cumulativeBalance = 0;
    let cumulativeInvestment = this.calculateCurrentInvestmentValue(investments, convertCurrency, displayCurrency);
    
    for (let i = 0; i < 12; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() + i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      // Aplicar factores de escenario
      let income = baseMonthlyIncome * scenarioFactors.income;
      let operatingExpenses = baseOperatingExpenses * scenarioFactors.expenses;
      let debtPayments = baseDebtPayments;
      let investmentContribution = 0;
      
      // Aplicar eventos programados
      const monthEvents = this.getEventsForMonth(scheduledEvents, monthKey);
      const eventsImpact = this.calculateEventsImpact(monthEvents, convertCurrency, displayCurrency);
      
      income += eventsImpact.income;
      operatingExpenses += eventsImpact.expenses;
      
      // ✅ M36 Fase 5: Calcular inversión según modo
      const fixedCosts = operatingExpenses + debtPayments;
      const surplus = income - fixedCosts;
      
      if (investmentMode === 'fixed') {
        // Modo fijo: usar presupuesto de inversión
        investmentContribution = baseInvestmentBudget;
      } else if (investmentMode === 'flexible') {
        // Modo flexible: porcentaje del excedente
        if (surplus > 0) {
          investmentContribution = surplus * (flexibleInvestmentPercent / 100);
        }
      }
      // 'none': investmentContribution = 0
      
      // Calcular netos
      const totalOutflow = operatingExpenses + debtPayments + investmentContribution;
      const netCashflow = income - totalOutflow;
      const netOperational = income - operatingExpenses - debtPayments; // Sin inversión
      
      cumulativeBalance += netCashflow;
      
      // Proyectar crecimiento de inversiones (estimado 7% anual)
      const monthlyGrowthRate = Math.pow(1.07, 1/12) - 1;
      cumulativeInvestment = (cumulativeInvestment + investmentContribution) * (1 + monthlyGrowthRate);
      
      projection.push({
        month: date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }),
        monthIndex: i,
        monthKey,
        // Ingresos
        income,
        // ✅ M36 Fase 5: Gastos separados
        operatingExpenses,
        debtPayments,
        investmentContribution,
        // Legacy (para compatibilidad)
        expenses: operatingExpenses, // Solo operativos
        // Netos
        netCashflow,
        netOperational, // ✅ M36 Fase 5: Nuevo - sin inversión
        surplus, // ✅ M36 Fase 5: Nuevo
        cumulativeBalance,
        // ✅ M36 Fase 5: Proyección de inversiones
        cumulativeInvestment,
        projectedNetWorth: cumulativeBalance + cumulativeInvestment,
        // Meta
        currency: displayCurrency,
        events: monthEvents,
        hasEvents: monthEvents.length > 0,
        scenario,
        investmentMode
      });
    }
    
    return projection;
  },

  /**
   * ✅ M36 Fase 5: Helper para determinar flowKind
   */
  getFlowKind(category) {
    if (category.flowKind) return category.flowKind;
    if (category.type === 'income') return 'INCOME';
    if (category.type === 'investment') return 'INVESTMENT_CONTRIBUTION';
    
    const groupLower = (category.group || '').toLowerCase();
    const nameLower = (category.name || '').toLowerCase();
    
    if (groupLower.includes('debt') || groupLower.includes('deuda') || 
        groupLower.includes('loan') || groupLower.includes('préstamo') ||
        nameLower.includes('mortgage') || nameLower.includes('hipoteca') ||
        nameLower.includes('cae')) {
      return 'DEBT_PAYMENT';
    }
    
    return 'OPERATING_EXPENSE';
  },

  /**
   * ✅ M36 Fase 5: Calcular valor actual de inversiones
   */
  calculateCurrentInvestmentValue(investments, convertCurrency, displayCurrency) {
    if (!investments || investments.length === 0) return 0;
    
    return investments
      .filter(inv => !inv.isArchived)
      .reduce((sum, inv) => 
        sum + convertCurrency(inv.currentBalance || 0, inv.currency, displayCurrency), 0
      );
  },

  /**
   * Obtener factores de ajuste según escenario
   */
  getScenarioFactors(scenario) {
    const scenarios = {
      realistic: {
        name: 'Realista',
        income: 1.0,
        expenses: 1.0,
        description: 'Proyección basada en tus presupuestos actuales'
      },
      optimistic: {
        name: 'Optimista',
        income: 1.1,
        expenses: 0.9,
        description: 'Escenario favorable con ingresos extra y gastos reducidos'
      },
      pessimistic: {
        name: 'Pesimista',
        income: 0.9,
        expenses: 1.15,
        description: 'Escenario desfavorable con ingresos reducidos y gastos aumentados'
      }
    };

    return scenarios[scenario] || scenarios.realistic;
  },

  /**
   * Filtrar eventos para un mes específico
   */
  getEventsForMonth(scheduledEvents, monthKey) {
    if (!scheduledEvents || scheduledEvents.length === 0) return [];
    
    return scheduledEvents.filter(event => {
      if (!event.date) return false;
      
      const eventDate = new Date(event.date);
      const eventKey = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, '0')}`;
      
      return eventKey === monthKey && event.enabled !== false;
    });
  },

  /**
   * Calcular impacto de eventos en un mes
   */
  calculateEventsImpact(events, convertCurrency, displayCurrency) {
    let income = 0;
    let expenses = 0;

    events.forEach(event => {
      const amount = convertCurrency(
        event.amount || 0,
        event.currency || displayCurrency,
        displayCurrency
      );

      if (event.type === 'income') {
        income += amount;
      } else if (event.type === 'expense') {
        expenses += amount;
      }
    });

    return { income, expenses };
  },

  /**
   * Calcula estadísticas de la proyección
   * ✅ M36 Fase 5: Extendido con métricas de inversión
   */
  getProjectionStats(projection) {
    if (!projection || projection.length === 0) {
      return {
        deficitMonths: 0,
        avgNetCashflow: 0,
        avgNetOperational: 0,
        finalBalance: 0,
        minBalance: 0,
        maxBalance: 0,
        isHealthy: false,
        breakEvenMonth: null,
        totalIncome: 0,
        totalExpenses: 0,
        totalDebtPayments: 0,
        totalInvestmentContribution: 0,
        finalInvestmentValue: 0,
        finalNetWorth: 0
      };
    }

    const deficitMonths = projection.filter(p => p.netCashflow < 0).length;
    const deficitOperationalMonths = projection.filter(p => p.netOperational < 0).length;
    const avgNetCashflow = projection.reduce((sum, p) => sum + p.netCashflow, 0) / projection.length;
    const avgNetOperational = projection.reduce((sum, p) => sum + (p.netOperational || p.netCashflow), 0) / projection.length;
    const finalBalance = projection[projection.length - 1].cumulativeBalance;
    const minBalance = Math.min(...projection.map(p => p.cumulativeBalance));
    const maxBalance = Math.max(...projection.map(p => p.cumulativeBalance));
    
    // Totales
    const totalIncome = projection.reduce((sum, p) => sum + p.income, 0);
    const totalExpenses = projection.reduce((sum, p) => sum + (p.operatingExpenses || p.expenses), 0);
    const totalDebtPayments = projection.reduce((sum, p) => sum + p.debtPayments, 0);
    const totalInvestmentContribution = projection.reduce((sum, p) => sum + (p.investmentContribution || 0), 0);
    
    // ✅ M36 Fase 5: Inversiones y patrimonio
    const finalInvestmentValue = projection[projection.length - 1].cumulativeInvestment || 0;
    const finalNetWorth = projection[projection.length - 1].projectedNetWorth || finalBalance;

    // Punto de equilibrio
    let breakEvenMonth = null;
    for (let i = 0; i < projection.length; i++) {
      if (projection[i].cumulativeBalance >= 0) {
        breakEvenMonth = i;
        break;
      }
    }
    
    return {
      deficitMonths,
      deficitOperationalMonths,
      avgNetCashflow,
      avgNetOperational,
      finalBalance,
      minBalance,
      maxBalance,
      isHealthy: deficitOperationalMonths === 0 && finalBalance >= 0,
      breakEvenMonth,
      totalIncome,
      totalExpenses,
      totalDebtPayments,
      totalInvestmentContribution,
      finalInvestmentValue,
      finalNetWorth,
      currency: projection[0]?.currency,
      scenario: projection[0]?.scenario,
      investmentMode: projection[0]?.investmentMode
    };
  },

  /**
   * Comparar múltiples escenarios
   */
  compareScenarios(categories, debts, ynabConfig, convertCurrency, displayCurrency, scheduledEvents = [], options = {}) {
    const scenarios = ['realistic', 'optimistic', 'pessimistic'];
    const comparisons = {};

    scenarios.forEach(scenario => {
      const projection = this.projectCashflow(
        categories,
        debts,
        ynabConfig,
        convertCurrency,
        displayCurrency,
        { ...options, scenario, scheduledEvents }
      );
      
      comparisons[scenario] = {
        projection,
        stats: this.getProjectionStats(projection),
        factors: this.getScenarioFactors(scenario)
      };
    });

    return comparisons;
  },

  /**
   * ✅ M36 Fase 5: Comparar modos de inversión
   */
  compareInvestmentModes(categories, debts, ynabConfig, convertCurrency, displayCurrency, investments, scheduledEvents = []) {
    const modes = ['none', 'fixed', 'flexible'];
    const comparisons = {};

    modes.forEach(mode => {
      const projection = this.projectCashflow(
        categories,
        debts,
        ynabConfig,
        convertCurrency,
        displayCurrency,
        { 
          investmentMode: mode, 
          investments,
          scheduledEvents,
          flexibleInvestmentPercent: 20
        }
      );
      
      comparisons[mode] = {
        projection,
        stats: this.getProjectionStats(projection),
        mode
      };
    });

    return comparisons;
  },

  /**
   * Validar evento programado
   */
  validateScheduledEvent(event) {
    const errors = [];

    if (!event.name || event.name.trim() === '') {
      errors.push('El nombre del evento es obligatorio');
    }

    if (!event.date) {
      errors.push('La fecha es obligatoria');
    }

    if (!event.amount || event.amount <= 0) {
      errors.push('El monto debe ser mayor a 0');
    }

    if (!['income', 'expense'].includes(event.type)) {
      errors.push('El tipo debe ser "income" o "expense"');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
};