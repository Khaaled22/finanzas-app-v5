// src/views/Dashboard/Dashboard.jsx
// ✅ M36: Dashboard mejorado con métricas separadas por flowKind
// ✅ M36 Fase 6: Sección de Cash/Banco prominente
// - Disponible Operativo (principal)
// - Invertido este mes
// - Pagado a deudas
// - Ingresos reales
// - Cash/Banco vs Inversiones separados

import { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useAnalytics } from '../../hooks/useAnalytics';
import { formatNumber, formatPercent, formatCompact, getValueColors } from '../../utils/formatters';
import BarChart from '../../components/charts/BarChart';
import LineChart from '../../components/charts/LineChart';
import DoughnutChart from '../../components/charts/DoughnutChart';
import AchievementsPanel from '../../components/investments/AchievementsPanel';
import MetricCard from '../../components/dashboard/MetricCard';
import MiniKPI from '../../components/dashboard/MiniKPI';

export default function Dashboard() {
  const { 
    displayCurrency, 
    debts, 
    savingsGoals, 
    investments, 
    totals,
    selectedBudgetMonth,
    setSelectedBudgetMonth,
    categoriesWithMonthlyBudget,
    convertCurrency,
    isOperatingExpense,
    ynabConfig
  } = useApp();
  
  const { nautaIndex, netWorth, savingsRate, emergencyFundMonths } = useAnalytics();

  // ✅ M36 Fase 6: Separar Cash/Banco de Inversiones
  const { cashPlatforms, investmentPlatforms, totalCash, totalInvestmentsValue } = useMemo(() => {
    const cash = investments.filter(inv => 
      !inv.isArchived && (inv.isCash || inv.goal === 'cash')
    );
    const invs = investments.filter(inv => 
      !inv.isArchived && !inv.isCash && inv.goal !== 'cash'
    );
    
    const cashTotal = cash.reduce((sum, inv) => 
      sum + convertCurrency(inv.currentBalance || 0, inv.currency, displayCurrency), 0
    );
    const invsTotal = invs.reduce((sum, inv) => 
      sum + convertCurrency(inv.currentBalance || 0, inv.currency, displayCurrency), 0
    );
    
    return {
      cashPlatforms: cash,
      investmentPlatforms: invs,
      totalCash: cashTotal,
      totalInvestmentsValue: invsTotal
    };
  }, [investments, convertCurrency, displayCurrency]);

  // Generar lista de meses disponibles
  const availableMonths = useMemo(() => {
    const months = [];
    const now = new Date();
    
    for (let i = -12; i <= 3; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' });
      months.push({ value: monthStr, label: monthName });
    }
    
    return months;
  }, []);

  // ✅ M36: Detectar si es mes futuro (PLAN) o actual/pasado (REAL)
  const monthStatus = useMemo(() => {
    const now = new Date();
    const [selectedYear, selectedMonth] = selectedBudgetMonth.split('-').map(Number);
    const selectedDate = new Date(selectedYear, selectedMonth - 1, 1);
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    if (selectedDate > currentMonthStart) {
      return { isPlan: true, label: 'PLAN', color: 'bg-amber-100 text-amber-800' };
    }
    return { isPlan: false, label: 'REAL', color: 'bg-green-100 text-green-800' };
  }, [selectedBudgetMonth]);

  // Proyección del mes con estado
  const monthProjection = useMemo(() => {
    const now = new Date();
    const [selectedYear, selectedMonth] = selectedBudgetMonth.split('-').map(Number);
    const isCurrentMonth = now.getFullYear() === selectedYear && (now.getMonth() + 1) === selectedMonth;
    
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    const currentDay = isCurrentMonth ? now.getDate() : daysInMonth;
    const percentDaysPassed = (currentDay / daysInMonth) * 100;
    
    // ✅ M36: Usar presupuesto operativo (gastos + deuda, sin inversión)
    const totalBudget = totals.operationalBudgeted || 0;
    
    // ✅ M36: Gastado = solo gastos operativos
    const totalSpent = totals.operatingSpent || 0;
    const percentSpent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
    
    // Proyección
    const projectedSpent = isCurrentMonth && currentDay > 0
      ? (totalSpent / currentDay) * daysInMonth
      : totalSpent;
    
    // Determinar estado
    let status = 'on_track';
    let statusMessage = '';
    
    if (totalBudget === 0) {
      status = 'no_budget';
      statusMessage = 'Sin presupuesto asignado';
    } else if (isCurrentMonth) {
      const expectedSpent = (totalBudget * percentDaysPassed) / 100;
      const difference = totalSpent - expectedSpent;
      const percentDifference = (difference / totalBudget) * 100;
      
      if (percentSpent > 100) {
        status = 'over_budget';
        statusMessage = `¡Presupuesto excedido por ${formatNumber(totalSpent - totalBudget)}!`;
      } else if (percentDifference > 10) {
        status = 'warning';
        statusMessage = `Gastando más rápido de lo esperado`;
      } else if (percentDifference < -10) {
        status = 'under_budget';
        statusMessage = 'Excelente control del gasto';
      } else {
        status = 'on_track';
        statusMessage = 'Vas bien, mantén el ritmo';
      }
    }
    
    const remainingBudget = Math.max(0, totalBudget - totalSpent - (totals.debtPaid || 0));
    const remainingDays = Math.max(0, daysInMonth - currentDay);
    const dailyBudget = remainingDays > 0 ? remainingBudget / remainingDays : 0;
    
    return {
      currentDay,
      daysInMonth,
      percentDaysPassed,
      totalBudget,
      totalSpent,
      percentSpent,
      projectedSpent,
      remainingBudget,
      remainingDays,
      dailyBudget,
      status,
      statusMessage,
      isCurrentMonth
    };
  }, [totals, selectedBudgetMonth]);

  // Calcular totales de inversiones (stock) - ahora usa totalInvestmentsValue
  const investmentsTotals = useMemo(() => {
    return { totalValue: totalInvestmentsValue };
  }, [totalInvestmentsValue]);

  // Calcular deuda total (stock)
  const debtTotal = useMemo(() => {
    return debts.reduce((sum, debt) => 
      sum + convertCurrency(debt.currentBalance || 0, debt.currency, displayCurrency), 0
    );
  }, [debts, displayCurrency, convertCurrency]);

  // ✅ M36: Calcular "Sin Asignar" YNAB style
  const unassigned = useMemo(() => {
    const income = monthStatus.isPlan 
      ? (ynabConfig?.monthlyIncome || 0)
      : (totals.incomeReal || 0);
    
    const totalAssigned = totals.budgeted || 0;
    
    return income - totalAssigned;
  }, [totals, ynabConfig, monthStatus.isPlan]);

  // Datos para gráfico de barras
  const budgetChartData = useMemo(() => ({
    labels: ['Presupuesto Op.', 'Gastado', 'Pagado Deuda', 'Disponible'],
    datasets: [{
      label: 'Monto',
      data: [
        totals.operationalBudgeted || 0, 
        totals.operatingSpent || 0, 
        totals.debtPaid || 0,
        totals.availableOperational || 0
      ],
      backgroundColor: [
        'rgba(59, 130, 246, 0.6)',
        'rgba(239, 68, 68, 0.6)',
        'rgba(249, 115, 22, 0.6)',
        'rgba(34, 197, 94, 0.6)'
      ],
      borderColor: [
        'rgb(59, 130, 246)',
        'rgb(239, 68, 68)',
        'rgb(249, 115, 22)',
        'rgb(34, 197, 94)'
      ],
      borderWidth: 2
    }]
  }), [totals]);

  // Datos para gráfico de proyección
  const projectionChartData = useMemo(() => {
    const labels = ['Inicio', `Día ${monthProjection.currentDay}`, 'Fin de Mes'];
    
    const realData = [0, monthProjection.totalSpent, null];
    const projectionData = [0, monthProjection.totalSpent, monthProjection.projectedSpent];
    const budgetLine = [0, 
      (monthProjection.totalBudget * monthProjection.currentDay) / monthProjection.daysInMonth,
      monthProjection.totalBudget
    ];
    
    return {
      labels,
      datasets: [
        {
          label: 'Gasto Real',
          data: realData,
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderWidth: 3,
          tension: 0.1,
          spanGaps: false,
          pointRadius: 6
        },
        {
          label: 'Proyección',
          data: projectionData,
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.05)',
          borderWidth: 2,
          borderDash: [5, 5],
          tension: 0.1,
          pointRadius: 4
        },
        {
          label: 'Presupuesto',
          data: budgetLine,
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderDash: [10, 5],
          tension: 0,
          pointRadius: 0
        }
      ]
    };
  }, [monthProjection]);

  // Datos para gráfico de categorías (solo gastos operativos)
  const categoryChartData = useMemo(() => {
    const categoriesWithSpent = categoriesWithMonthlyBudget
      .filter(c => isOperatingExpense(c) && c.spentInDisplayCurrency > 0);
    
    if (categoriesWithSpent.length === 0) {
      return {
        labels: ['Sin gastos registrados'],
        datasets: [{
          label: 'Gastado',
          data: [1],
          backgroundColor: ['rgba(200, 200, 200, 0.5)'],
          borderColor: ['rgba(200, 200, 200, 1)'],
          borderWidth: 1
        }]
      };
    }
    
    return {
      labels: categoriesWithSpent.map(c => c.name),
      datasets: [{
        label: 'Gastado',
        data: categoriesWithSpent.map(c => c.spentInDisplayCurrency),
        backgroundColor: categoriesWithSpent.map((_, i) => 
          `hsla(${i * 360 / categoriesWithSpent.length}, 70%, 60%, 0.8)`
        ),
        borderColor: categoriesWithSpent.map((_, i) => 
          `hsla(${i * 360 / categoriesWithSpent.length}, 70%, 50%, 1)`
        ),
        borderWidth: 2
      }]
    };
  }, [categoriesWithMonthlyBudget, isOperatingExpense]);

  // ✅ M36 Fase 6: Datos para gráfico de patrimonio
  const wealthDistributionData = useMemo(() => {
    // Si ambos son 0, no mostrar datos engañosos
    const hasData = totalCash > 0 || totalInvestmentsValue > 0;
    
    if (!hasData) {
      return {
        labels: ['Sin datos'],
        datasets: [{
          data: [1],
          backgroundColor: ['rgba(209, 213, 219, 0.5)'],
          borderWidth: 0
        }]
      };
    }
    
    return {
      labels: ['Cash/Banco', 'Inversiones'],
      datasets: [{
        data: [totalCash, totalInvestmentsValue],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(59, 130, 246, 0.8)'
        ],
        borderWidth: 0
      }]
    };
  }, [totalCash, totalInvestmentsValue]);

  // Formatear nombre del mes seleccionado
  const selectedMonthName = useMemo(() => {
    const [year, month] = selectedBudgetMonth.split('-').map(Number);
    return new Date(year, month - 1).toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'long' 
    });
  }, [selectedBudgetMonth]);

  // Colores según status
  const statusColors = {
    on_track: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: '✓' },
    under_budget: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', icon: '🎉' },
    warning: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', icon: '⚠️' },
    over_budget: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: '🚨' },
    no_budget: { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', icon: '📝' }
  };

  return (
    <div className="space-y-6 animate-in">
      {/* Banner Principal con Índice Nauta */}
      <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-8 text-white shadow-2xl">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="flex-1">
            <h2 className="text-3xl font-bold mb-2">Dashboard Financiero</h2>
            <p className="text-purple-100 text-lg">Visión completa de tus finanzas en tiempo real</p>
          </div>
          
          {/* Índice Nauta */}
          <div className="bg-white bg-opacity-20 backdrop-blur-lg rounded-xl p-6 min-w-[280px]">
            <p className="text-sm text-purple-100 mb-2">Índice de Tranquilidad</p>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-5xl font-bold">{nautaIndex.score.toFixed(1)}</p>
                <p className="text-sm opacity-90">de 100 puntos</p>
              </div>
              <span className="text-5xl">
                {nautaIndex.score >= 80 ? '🎉' : 
                 nautaIndex.score >= 60 ? '👍' : 
                 nautaIndex.score >= 40 ? '⚠️' : '⚠️'}
              </span>
            </div>
            <div className="w-full bg-white bg-opacity-20 rounded-full h-2.5 mb-2">
              <div 
                className="h-2.5 rounded-full bg-white transition-all duration-1000"
                style={{ width: `${nautaIndex.score}%` }}
              ></div>
            </div>
            <p className="text-sm font-semibold">{nautaIndex.status}</p>
          </div>
        </div>
      </div>

      {/* Selector de Mes + Badge REAL/PLAN */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-3">
            <label className="text-gray-700 font-medium">
              <i className="fas fa-calendar-alt mr-2 text-blue-600"></i>
              Período:
            </label>
            <select
              value={selectedBudgetMonth}
              onChange={(e) => setSelectedBudgetMonth(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              {availableMonths.map(month => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
            
            {/* ✅ M36: Badge REAL/PLAN */}
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${monthStatus.color}`}>
              {monthStatus.label}
            </span>
          </div>
          
          {monthProjection.isCurrentMonth && (
            <p className="text-sm text-gray-500">
              Día {monthProjection.currentDay} de {monthProjection.daysInMonth} • {monthProjection.remainingDays} días restantes
            </p>
          )}
        </div>
      </div>

      {/* ✅ M36: NUEVAS Tarjetas KPI principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card Principal: Disponible Operativo */}
        <MetricCard
          title="Disponible Operativo"
          value={formatNumber(totals.availableOperational || 0)}
          currency={displayCurrency}
          subtitle={`${formatNumber(monthProjection.dailyBudget)}/día restante`}
          icon="fa-wallet"
          color={totals.availableOperational >= 0 ? 'green' : 'red'}
          highlight={true}
        />
        
        {/* Gastado (solo operativo) */}
        <MetricCard
          title="Gastado"
          value={formatNumber(totals.operatingSpent || 0)}
          currency={displayCurrency}
          subtitle={`${formatPercent(monthProjection.percentSpent)} del presupuesto`}
          icon="fa-receipt"
          color="red"
        />
        
        {/* Invertido este mes */}
        <MetricCard
          title="Invertido"
          value={formatNumber(totals.investmentContributed || 0)}
          currency={displayCurrency}
          subtitle={`de ${formatNumber(totals.investmentBudgeted || 0)} planificado`}
          icon="fa-chart-line"
          color="purple"
        />
        
        {/* Patrimonio Neto */}
        <MetricCard
          title="Patrimonio Neto"
          value={formatNumber(netWorth)}
          currency={displayCurrency}
          subtitle="Activos - Pasivos"
          icon="fa-landmark"
          color="blue"
        />
      </div>

      {/* ✅ M36: Fila secundaria con Sin Asignar y pagos de deuda */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MiniKPI 
          label="Ingresos del Mes" 
          value={formatNumber(monthStatus.isPlan ? (ynabConfig?.monthlyIncome || 0) : (totals.incomeReal || 0))} 
          suffix={displayCurrency}
          icon="fa-arrow-down"
          status="good"
        />
        <MiniKPI 
          label="Sin Asignar" 
          value={formatNumber(unassigned)} 
          suffix={displayCurrency}
          icon="fa-question-circle"
          status={unassigned >= 0 ? 'good' : 'danger'}
        />
        <MiniKPI 
          label="Pagado a Deudas" 
          value={formatNumber(totals.debtPaid || 0)} 
          suffix={displayCurrency}
          icon="fa-credit-card"
          status={totals.debtPaid > 0 ? 'good' : 'neutral'}
        />
        <MiniKPI 
          label="Deuda Restante" 
          value={formatCompact(debtTotal, displayCurrency)} 
          icon="fa-balance-scale"
          status={debtTotal === 0 ? 'good' : debtTotal < 50000 ? 'warning' : 'danger'}
        />
      </div>

      {/* ✅ M36 Fase 6: Nueva fila Cash/Banco vs Inversiones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cash/Banco */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800">
              <i className="fas fa-university mr-2 text-emerald-600"></i>
              Cash / Banco
            </h3>
            <span className="text-xl font-bold text-emerald-600">{formatNumber(totalCash)} {displayCurrency}</span>
          </div>
          
          {cashPlatforms.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <i className="fas fa-piggy-bank text-3xl mb-2 text-gray-300"></i>
              <p className="text-sm">Sin cuentas bancarias</p>
              <p className="text-xs mt-1">Inversiones → Agregar → Cash/Banco</p>
            </div>
          ) : (
            <div className="space-y-2">
              {cashPlatforms.slice(0, 4).map(account => (
                <div 
                  key={account.id}
                  className="flex items-center justify-between p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-100"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🏦</span>
                    <div>
                      <h4 className="font-medium text-gray-800 text-sm">{account.name}</h4>
                      <p className="text-xs text-gray-500">{account.institution || account.currency}</p>
                    </div>
                  </div>
                  <span className="font-bold text-emerald-700 text-sm">
                    {formatNumber(account.currentBalance)} {account.currency}
                  </span>
                </div>
              ))}
              {cashPlatforms.length > 4 && (
                <p className="text-center text-xs text-gray-500">+{cashPlatforms.length - 4} más</p>
              )}
            </div>
          )}
        </div>

        {/* Inversiones */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800">
              <i className="fas fa-chart-line mr-2 text-blue-600"></i>
              Inversiones
            </h3>
            <span className="text-xl font-bold text-blue-600">{formatNumber(totalInvestmentsValue)} {displayCurrency}</span>
          </div>
          
          {investmentPlatforms.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <i className="fas fa-chart-pie text-3xl mb-2 text-gray-300"></i>
              <p className="text-sm">Sin inversiones registradas</p>
            </div>
          ) : (
            <div className="space-y-2">
              {investmentPlatforms.slice(0, 4).map(inv => (
                <div 
                  key={inv.id}
                  className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📈</span>
                    <div>
                      <h4 className="font-medium text-gray-800 text-sm">{inv.name}</h4>
                      <p className="text-xs text-gray-500">{inv.goal}</p>
                    </div>
                  </div>
                  <span className="font-bold text-blue-700 text-sm">
                    {formatNumber(inv.currentBalance)} {inv.currency}
                  </span>
                </div>
              ))}
              {investmentPlatforms.length > 4 && (
                <p className="text-center text-xs text-gray-500">+{investmentPlatforms.length - 4} más</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mini KPIs de salud financiera */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MiniKPI 
          label="Tasa de Ahorro" 
          value={formatPercent(savingsRate)} 
          icon="fa-piggy-bank"
          status={savingsRate >= 20 ? 'good' : savingsRate >= 10 ? 'warning' : 'danger'}
        />
        <MiniKPI 
          label="Fondo Emergencia" 
          value={`${emergencyFundMonths.toFixed(1)} meses`} 
          icon="fa-shield-alt"
          status={emergencyFundMonths >= 6 ? 'good' : emergencyFundMonths >= 3 ? 'warning' : 'danger'}
        />
        <MiniKPI 
          label="Total Cash + Inv." 
          value={formatCompact(totalCash + totalInvestmentsValue, displayCurrency)} 
          icon="fa-coins"
          status={totalCash + totalInvestmentsValue > 0 ? 'good' : 'warning'}
        />
        <MiniKPI 
          label="% Invertido del Ingreso" 
          value={totals.incomeReal > 0 ? formatPercent((totals.investmentContributed / totals.incomeReal) * 100) : '0%'} 
          icon="fa-percentage"
          status={totals.investmentContributed > 0 ? 'good' : 'neutral'}
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resumen del mes */}
        <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <i className="fas fa-chart-bar mr-2 text-blue-600"></i>
            Resumen Operativo
            <span className="ml-2 text-sm font-normal text-gray-500">({selectedMonthName})</span>
          </h3>
          <div className="chart-container">
            <BarChart data={budgetChartData} height={300} />
          </div>
        </div>

        {/* Proyección de Gasto */}
        <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <i className="fas fa-chart-line mr-2 text-purple-600"></i>
            {monthProjection.isCurrentMonth ? 'Proyección de Gasto' : 'Gasto del Mes'}
          </h3>
          
          {/* Status card */}
          {monthProjection.isCurrentMonth && (
            <div className={`mb-4 p-4 rounded-lg border-2 ${statusColors[monthProjection.status].bg} ${statusColors[monthProjection.status].border}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`font-semibold ${statusColors[monthProjection.status].text}`}>
                    {statusColors[monthProjection.status].icon} {monthProjection.statusMessage}
                  </p>
                  {monthProjection.status !== 'no_budget' && (
                    <p className="text-sm text-gray-600 mt-1">
                      Proyección fin de mes: <span className="font-bold">{formatNumber(monthProjection.projectedSpent)} {displayCurrency}</span>
                      {monthProjection.totalBudget > 0 && (
                        <span className={monthProjection.projectedSpent > monthProjection.totalBudget ? 'text-red-600' : 'text-green-600'}>
                          {' '}({monthProjection.projectedSpent > monthProjection.totalBudget ? '+' : ''}{formatNumber(monthProjection.projectedSpent - monthProjection.totalBudget)})
                        </span>
                      )}
                    </p>
                  )}
                </div>
                {monthProjection.remainingDays > 0 && monthProjection.dailyBudget > 0 && (
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-800">{formatNumber(monthProjection.dailyBudget)}</p>
                    <p className="text-xs text-gray-500">{displayCurrency}/día disponible</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div className="chart-container">
            <LineChart data={projectionChartData} height={250} />
          </div>
        </div>
      </div>

      {/* Gráficos Doughnut lado a lado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribución de Gastos Operativos */}
        <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <i className="fas fa-chart-pie mr-2 text-red-600"></i>
            Gastos Operativos
            <span className="ml-2 text-sm font-normal text-gray-500">({selectedMonthName})</span>
          </h3>
          <div className="chart-container h-64">
            <DoughnutChart 
              data={categoryChartData}
              height={250}
              topN={9}
              legendPosition="right"
            />
          </div>
        </div>

        {/* ✅ M36 Fase 6: Distribución del Patrimonio */}
        <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <i className="fas fa-gem mr-2 text-emerald-600"></i>
            Distribución del Patrimonio
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="chart-container h-48">
              <DoughnutChart 
                data={wealthDistributionData} 
                height={180}
                showLegend={false}
                topN={3}
              />
            </div>
            <div className="space-y-3 flex flex-col justify-center">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Cash/Banco</span>
                </div>
                <span className="font-semibold text-emerald-600">{formatNumber(totalCash)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Inversiones</span>
                </div>
                <span className="font-semibold text-blue-600">{formatNumber(totalInvestmentsValue)}</span>
              </div>
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Deuda</span>
                  <span className="font-semibold text-red-600">{debtTotal > 0 ? `-${formatNumber(debtTotal)}` : '0'}</span>
                </div>
              </div>
              <div className="pt-2 border-t-2 border-gray-300">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-700">Patrimonio</span>
                  <span className={`font-bold text-lg ${netWorth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatNumber(netWorth)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Panel de Logros */}
      <AchievementsPanel />
    </div>
  );
}

