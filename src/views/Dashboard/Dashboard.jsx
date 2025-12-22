// src/views/Dashboard/Dashboard.jsx
// ✅ M33: Dashboard mejorado con formateo de números y proyección de gasto
import { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useAnalytics } from '../../hooks/useAnalytics';
import { formatNumber, formatPercent, formatCompact, getValueColors } from '../../utils/formatters';
import BarChart from '../../components/charts/BarChart';
import LineChart from '../../components/charts/LineChart';
import DoughnutChart from '../../components/charts/DoughnutChart';
import AchievementsPanel from '../../components/investments/AchievementsPanel';

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
    convertCurrency
  } = useApp();
  
  const { nautaIndex, netWorth, savingsRate, emergencyFundMonths } = useAnalytics();

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

  // Proyección del mes con estado
  const monthProjection = useMemo(() => {
    const now = new Date();
    const [selectedYear, selectedMonth] = selectedBudgetMonth.split('-').map(Number);
    const isCurrentMonth = now.getFullYear() === selectedYear && (now.getMonth() + 1) === selectedMonth;
    
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    const currentDay = isCurrentMonth ? now.getDate() : daysInMonth;
    const percentDaysPassed = (currentDay / daysInMonth) * 100;
    
    // Calcular presupuesto total (de categorías de gasto)
    const totalBudget = categoriesWithMonthlyBudget
      .filter(cat => cat.type === 'Gasto' || !cat.type)
      .reduce((sum, cat) => sum + (cat.budgetInDisplayCurrency || 0), 0);
    
    // Calcular gasto real
    const totalSpent = totals.spent || 0;
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
    
    const remainingBudget = Math.max(0, totalBudget - totalSpent);
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
  }, [totals.spent, selectedBudgetMonth, categoriesWithMonthlyBudget]);

  // Calcular totales de inversiones
  const investmentsTotals = useMemo(() => {
    const totalValue = investments.reduce((sum, inv) => {
      const balance = inv.currentBalance || 0;
      return sum + convertCurrency(balance, inv.currency, displayCurrency);
    }, 0);
    
    return { totalValue };
  }, [investments, displayCurrency, convertCurrency]);

  // Calcular deuda total
  const debtTotal = useMemo(() => {
    return debts.reduce((sum, debt) => 
      sum + convertCurrency(debt.currentBalance || 0, debt.currency, displayCurrency), 0
    );
  }, [debts, displayCurrency, convertCurrency]);

  // Datos para gráfico de barras
  const budgetChartData = useMemo(() => ({
    labels: ['Presupuestado', 'Gastado', 'Disponible'],
    datasets: [{
      label: 'Monto',
      data: [
        monthProjection.totalBudget, 
        monthProjection.totalSpent, 
        monthProjection.remainingBudget
      ],
      backgroundColor: [
        'rgba(59, 130, 246, 0.6)',
        'rgba(239, 68, 68, 0.6)',
        'rgba(34, 197, 94, 0.6)'
      ],
      borderColor: [
        'rgb(59, 130, 246)',
        'rgb(239, 68, 68)',
        'rgb(34, 197, 94)'
      ],
      borderWidth: 2
    }]
  }), [monthProjection]);

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

  // Datos para gráfico de categorías
  const categoryChartData = useMemo(() => {
    const categoriesWithSpent = categoriesWithMonthlyBudget.filter(c => c.spentInDisplayCurrency > 0);
    
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
  }, [categoriesWithMonthlyBudget]);

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

      {/* Selector de Mes */}
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
          </div>
          
          {monthProjection.isCurrentMonth && (
            <p className="text-sm text-gray-500">
              Día {monthProjection.currentDay} de {monthProjection.daysInMonth} • {monthProjection.remainingDays} días restantes
            </p>
          )}
        </div>
      </div>

      {/* Tarjetas KPI principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Presupuestado"
          value={formatNumber(monthProjection.totalBudget)}
          currency={displayCurrency}
          subtitle={monthProjection.totalBudget === 0 ? 'Sin presupuesto' : selectedMonthName}
          icon="fa-calculator"
          color="blue"
        />
        
        <MetricCard
          title="Gastado"
          value={formatNumber(monthProjection.totalSpent)}
          currency={displayCurrency}
          subtitle={monthProjection.totalBudget > 0 ? `${formatPercent(monthProjection.percentSpent)} del presupuesto` : ''}
          icon="fa-receipt"
          color="red"
        />
        
        <MetricCard
          title="Disponible"
          value={formatNumber(monthProjection.remainingBudget)}
          currency={displayCurrency}
          subtitle={monthProjection.totalBudget === 0 ? 'Sin presupuesto' : `${formatNumber(monthProjection.dailyBudget)}/día`}
          icon="fa-piggy-bank"
          color={monthProjection.remainingBudget >= 0 ? 'green' : 'red'}
        />
        
        <MetricCard
          title="Patrimonio Neto"
          value={formatNumber(netWorth)}
          currency={displayCurrency}
          subtitle="Activos - Pasivos"
          icon="fa-chart-line"
          color="purple"
        />
      </div>

      {/* Mini KPIs secundarios */}
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
          label="Deuda Total" 
          value={formatCompact(debtTotal, displayCurrency)} 
          icon="fa-credit-card"
          status={debtTotal === 0 ? 'good' : debtTotal < 10000 ? 'warning' : 'danger'}
        />
        <MiniKPI 
          label="Inversiones" 
          value={formatCompact(investmentsTotals.totalValue, displayCurrency)} 
          icon="fa-chart-pie"
          status={investmentsTotals.totalValue > 0 ? 'good' : 'warning'}
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resumen del mes */}
        <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <i className="fas fa-chart-bar mr-2 text-blue-600"></i>
            Resumen del Mes
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

      {/* Gráfico Doughnut */}
      <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <i className="fas fa-chart-pie mr-2 text-purple-600"></i>
          Distribución de Gastos por Grupo
          <span className="ml-2 text-sm font-normal text-gray-500">({selectedMonthName})</span>
        </h3>
        <div className="chart-container">
          <DoughnutChart 
            data={categoryChartData} 
            height={350} 
            groupByCategory={true}
            topN={10}
          />
        </div>
      </div>

      {/* Panel de Logros */}
      <AchievementsPanel />

      {/* Resumen Financiero Rápido */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SummaryCard
          title="Deudas"
          icon="fa-credit-card"
          iconColor="text-red-600"
          iconBg="bg-red-100"
          items={debts.slice(0, 3)}
          emptyMessage="Sin deudas activas"
          renderItem={(debt) => (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700">{debt.name}</span>
              <span className="text-sm font-semibold text-red-600">
                {formatNumber(debt.currentBalance)} {debt.currency}
              </span>
            </div>
          )}
        />

        <SummaryCard
          title="Objetivos de Ahorro"
          icon="fa-bullseye"
          iconColor="text-green-600"
          iconBg="bg-green-100"
          items={savingsGoals.slice(0, 3)}
          emptyMessage="Sin objetivos creados"
          renderItem={(goal) => {
            const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
            return (
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-700">{goal.name}</span>
                  <span className="text-xs font-semibold text-green-600">
                    {formatPercent(progress)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className="h-1.5 rounded-full bg-green-500"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  ></div>
                </div>
              </div>
            );
          }}
        />

        <SummaryCard
          title="Inversiones"
          icon="fa-chart-line"
          iconColor="text-purple-600"
          iconBg="bg-purple-100"
          items={investments.filter(inv => !inv.isArchived).slice(0, 3)}
          emptyMessage="Sin inversiones registradas"
          renderItem={(inv) => {
            const history = inv.balanceHistory || [];
            let changePercent = 0;
            
            if (history.length >= 2) {
              const sorted = [...history].sort((a, b) => new Date(a.date) - new Date(b.date));
              const oldest = sorted[0].balance;
              const current = inv.currentBalance || 0;
              changePercent = oldest > 0 ? ((current - oldest) / oldest * 100) : 0;
            }
            
            return (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">{inv.name}</span>
                <span className={`text-sm font-semibold ${changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {changePercent >= 0 ? '+' : ''}{changePercent.toFixed(1)}%
                </span>
              </div>
            );
          }}
        />
      </div>
    </div>
  );
}

function MetricCard({ title, value, currency, icon, color, subtitle }) {
  const colorClasses = {
    blue: { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-500' },
    red: { bg: 'bg-red-100', text: 'text-red-600', border: 'border-red-500' },
    green: { bg: 'bg-green-100', text: 'text-green-600', border: 'border-green-500' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-500' },
    orange: { bg: 'bg-orange-100', text: 'text-orange-600', border: 'border-orange-500' }
  };

  const colors = colorClasses[color] || colorClasses.blue;

  return (
    <div className={`bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all border-l-4 ${colors.border}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-gray-600 text-sm font-medium mb-1">{title}</p>
          <p className={`text-3xl font-bold ${colors.text}`}>{value}</p>
          <p className="text-xs text-gray-500 mt-1">{currency}</p>
          {subtitle && <p className="text-xs text-gray-600 mt-1">{subtitle}</p>}
        </div>
        <div className={`${colors.bg} p-4 rounded-full`}>
          <i className={`fas ${icon} text-2xl ${colors.text}`}></i>
        </div>
      </div>
    </div>
  );
}

function MiniKPI({ label, value, icon, status }) {
  const statusConfig = {
    good: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', icon: 'text-green-600' },
    warning: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', icon: 'text-yellow-600' },
    danger: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: 'text-red-600' }
  };

  const config = statusConfig[status];

  return (
    <div className={`${config.bg} border-2 ${config.border} rounded-lg p-4 text-center hover:shadow-md transition-shadow`}>
      <i className={`fas ${icon} text-2xl ${config.icon} mb-2`}></i>
      <p className="text-xs text-gray-600 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${config.text}`}>{value}</p>
    </div>
  );
}

function SummaryCard({ title, icon, iconColor, iconBg, items, emptyMessage, renderItem }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
      <div className="flex items-center mb-4">
        <div className={`${iconBg} p-3 rounded-lg mr-3`}>
          <i className={`fas ${icon} ${iconColor} text-xl`}></i>
        </div>
        <h3 className="text-lg font-bold text-gray-800">{title}</h3>
      </div>
      
      {items.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">{emptyMessage}</p>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={item.id || index}>
              {renderItem(item)}
            </div>
          ))}
          {items.length > 3 && (
            <p className="text-xs text-gray-500 text-center pt-2">
              +{items.length - 3} más
            </p>
          )}
        </div>
      )}
    </div>
  );
}