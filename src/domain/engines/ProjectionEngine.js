// src/domain/engines/ProjectionEngine.js
// ✅ M19.3: EXTENDIDO con escenarios y eventos programados (mantiene compatibilidad con M18.5)

export const ProjectionEngine = {
  /**
   * Proyecta el cashflow para los próximos 12 meses
   * ✅ M18.5: Conversión de monedas
   * ✅ M19.3: EXTENDIDO con escenarios y eventos programados
   * 
   * @param {Array} categories - Categorías con presupuestos
   * @param {Array} debts - Deudas con pagos mensuales
   * @param {Object} ynabConfig - Configuración con monthlyIncome
   * @param {Function} convertCurrency - Función de conversión de monedas
   * @param {String} displayCurrency - Moneda de visualización
   * @param {Object} options - ✅ M19.3: NUEVO - Opciones de proyección
   * @returns {Array} - Proyección de 12 meses
   */
  projectCashflow(categories, debts, ynabConfig, convertCurrency, displayCurrency, options = {}) {
    // ✅ M19.3: NUEVO - Extraer opciones (con valores por defecto para compatibilidad)
    const {
      scenario = 'realistic',
      scheduledEvents = []
    } = options;

    const projection = [];
    
    // ✅ M18.5: Convertir gastos mensuales a displayCurrency (SIN CAMBIOS)
    const baseMonthlyExpenses = categories.reduce((sum, cat) => 
      sum + convertCurrency(cat.budget, cat.currency, displayCurrency), 0
    );
    
    // ✅ M18.5: Convertir pagos de deuda a displayCurrency (SIN CAMBIOS)
    const baseMonthlyDebtPayment = debts.reduce((sum, d) => 
      sum + convertCurrency(d.monthlyPayment || 0, d.currency, displayCurrency), 0
    );
    
    // ✅ M18.5: Convertir ingreso mensual a displayCurrency (SIN CAMBIOS)
    const baseMonthlyIncome = ynabConfig?.monthlyIncome
      ? convertCurrency(ynabConfig.monthlyIncome, ynabConfig.currency, displayCurrency)
      : 0;
    
    // ✅ M19.3: NUEVO - Factores de ajuste por escenario
    const scenarioFactors = this.getScenarioFactors(scenario);
    
    let cumulativeBalance = 0;
    
    for (let i = 0; i < 12; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() + i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      // ✅ M19.3: MODIFICADO - Aplicar factores de escenario
      let income = baseMonthlyIncome * scenarioFactors.income;
      let expenses = baseMonthlyExpenses * scenarioFactors.expenses;
      let debtPayments = baseMonthlyDebtPayment;
      
      // ✅ M19.3: NUEVO - Aplicar eventos programados para este mes
      const monthEvents = this.getEventsForMonth(scheduledEvents, monthKey);
      const eventsImpact = this.calculateEventsImpact(monthEvents, convertCurrency, displayCurrency);
      
      income += eventsImpact.income;
      expenses += eventsImpact.expenses;
      
      const netCashflow = income - expenses - debtPayments;
      cumulativeBalance += netCashflow;
      
      projection.push({
        month: date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }),
        monthIndex: i,
        monthKey, // ✅ M19.3: NUEVO
        income,
        expenses,
        debtPayments,
        netCashflow,
        cumulativeBalance,
        currency: displayCurrency,
        // ✅ M19.3: NUEVO - Información de eventos
        events: monthEvents,
        hasEvents: monthEvents.length > 0,
        scenario
      });
    }
    
    return projection;
  },

  /**
   * ✅ M19.3: NUEVO - Obtener factores de ajuste según escenario
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
   * ✅ M19.3: NUEVO - Filtrar eventos para un mes específico
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
   * ✅ M19.3: NUEVO - Calcular impacto de eventos en un mes
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
   * ✅ M18.5: Compatible con estructura actual
   * ✅ M19.3: EXTENDIDO con nuevas métricas
   */
  getProjectionStats(projection) {
    if (!projection || projection.length === 0) {
      return {
        deficitMonths: 0,
        avgNetCashflow: 0,
        finalBalance: 0,
        minBalance: 0,
        maxBalance: 0, // ✅ M19.3: NUEVO
        isHealthy: false,
        breakEvenMonth: null, // ✅ M19.3: NUEVO
        totalIncome: 0, // ✅ M19.3: NUEVO
        totalExpenses: 0, // ✅ M19.3: NUEVO
        totalDebtPayments: 0 // ✅ M19.3: NUEVO
      };
    }

    const deficitMonths = projection.filter(p => p.netCashflow < 0).length;
    const avgNetCashflow = projection.reduce((sum, p) => sum + p.netCashflow, 0) / projection.length;
    const finalBalance = projection[projection.length - 1].cumulativeBalance;
    const minBalance = Math.min(...projection.map(p => p.cumulativeBalance));
    const maxBalance = Math.max(...projection.map(p => p.cumulativeBalance)); // ✅ M19.3: NUEVO
    
    // ✅ M19.3: NUEVO - Calcular totales
    const totalIncome = projection.reduce((sum, p) => sum + p.income, 0);
    const totalExpenses = projection.reduce((sum, p) => sum + p.expenses, 0);
    const totalDebtPayments = projection.reduce((sum, p) => sum + p.debtPayments, 0);

    // ✅ M19.3: NUEVO - Encontrar mes de punto de equilibrio
    let breakEvenMonth = null;
    for (let i = 0; i < projection.length; i++) {
      if (projection[i].cumulativeBalance >= 0) {
        breakEvenMonth = i;
        break;
      }
    }
    
    return {
      deficitMonths,
      avgNetCashflow,
      finalBalance,
      minBalance,
      maxBalance, // ✅ M19.3: NUEVO
      isHealthy: deficitMonths === 0 && finalBalance > 0,
      breakEvenMonth, // ✅ M19.3: NUEVO
      totalIncome, // ✅ M19.3: NUEVO
      totalExpenses, // ✅ M19.3: NUEVO
      totalDebtPayments, // ✅ M19.3: NUEVO
      currency: projection[0]?.currency,
      scenario: projection[0]?.scenario // ✅ M19.3: NUEVO
    };
  },

  /**
   * ✅ M19.3: NUEVO - Comparar múltiples escenarios
   */
  compareScenarios(categories, debts, ynabConfig, convertCurrency, displayCurrency, scheduledEvents = []) {
    const scenarios = ['realistic', 'optimistic', 'pessimistic'];
    const comparisons = {};

    scenarios.forEach(scenario => {
      const projection = this.projectCashflow(
        categories,
        debts,
        ynabConfig,
        convertCurrency,
        displayCurrency,
        { scenario, scheduledEvents }
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
   * ✅ M19.3: NUEVO - Validar evento programado
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