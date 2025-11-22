import { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useAnalytics } from '../../hooks/useAnalytics';
import BarChart from '../../components/charts/BarChart';
import LineChart from '../../components/charts/LineChart';
import DoughnutChart from '../../components/charts/DoughnutChart';

export default function Dashboard() {
  const { categories, displayCurrency, debts, savingsGoals, investments } = useApp();
  
  // M8: Integrar analytics con Índice Nauta
  const { nautaIndex, netWorth, savingsRate, emergencyFundMonths } = useAnalytics();
  
  const totals = useMemo(() => {
    const budgeted = categories.reduce((sum, cat) => sum + cat.budget, 0);
    const spent = categories.reduce((sum, cat) => sum + cat.spent, 0);
    const available = budgeted - spent;
    return { budgeted, spent, available };
  }, [categories]);

  const monthProjection = useMemo(() => {
    const now = new Date();
    const currentDay = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const projectedSpent = (totals.spent / currentDay) * daysInMonth;
    
    return {
      currentDay,
      daysInMonth,
      projectedSpent,
      remainingDays: daysInMonth - currentDay
    };
  }, [totals.spent]);

  const budgetChartData = useMemo(() => ({
    labels: ['Presupuestado', 'Gastado', 'Disponible'],
    datasets: [{
      label: 'Monto',
      data: [totals.budgeted, totals.spent, totals.available],
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
  }), [totals]);

  const projectionChartData = useMemo(() => ({
    labels: ['Inicio Mes', 'Hoy', 'Proyección Fin Mes'],
    datasets: [
      {
        label: 'Gasto Real',
        data: [0, totals.spent, null],
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 3,
        tension: 0.1,
        spanGaps: false
      },
      {
        label: 'Proyección',
        data: [0, totals.spent, monthProjection.projectedSpent],
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.05)',
        borderWidth: 2,
        borderDash: [5, 5],
        tension: 0.1
      }
    ]
  }), [totals.spent, monthProjection.projectedSpent]);

  const categoryChartData = useMemo(() => ({
    labels: categories.map(c => c.name),
    datasets: [{
      label: 'Gastado',
      data: categories.map(c => c.spent),
      backgroundColor: categories.map((_, i) => 
        `hsla(${i * 360 / categories.length}, 70%, 60%, 0.8)`
      ),
      borderColor: categories.map((_, i) => 
        `hsla(${i * 360 / categories.length}, 70%, 50%, 1)`
      ),
      borderWidth: 2
    }]
  }), [categories]);

  // Configuración de colores según nivel del índice Nauta
  const nautaColorConfig = {
    green: {
      bg: 'from-green-500 to-green-600',
      light: 'bg-green-50',
      border: 'border-green-500',
      text: 'text-green-600'
    },
    blue: {
      bg: 'from-blue-500 to-blue-600',
      light: 'bg-blue-50',
      border: 'border-blue-500',
      text: 'text-blue-600'
    },
    yellow: {
      bg: 'from-yellow-500 to-yellow-600',
      light: 'bg-yellow-50',
      border: 'border-yellow-500',
      text: 'text-yellow-600'
    },
    red: {
      bg: 'from-red-500 to-red-600',
      light: 'bg-red-50',
      border: 'border-red-500',
      text: 'text-red-600'
    }
  };

  const nautaColors = nautaColorConfig[nautaIndex.interpretation.color] || nautaColorConfig.blue;

  return (
    <div className="space-y-6 animate-in">
      {/* Banner Principal con Índice Nauta */}
      <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-8 text-white shadow-2xl">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="flex-1">
            <h2 className="text-3xl font-bold mb-2">Dashboard Financiero</h2>
            <p className="text-purple-100 text-lg">Visión completa de tus finanzas en tiempo real</p>
          </div>
          
          {/* M8: Índice Nauta destacado */}
          <div className="bg-white bg-opacity-20 backdrop-blur-lg rounded-xl p-6 min-w-[280px]">
            <p className="text-sm text-purple-100 mb-2">Índice de Tranquilidad</p>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-5xl font-bold">{nautaIndex.score}</p>
                <p className="text-sm opacity-90">de 100 puntos</p>
              </div>
              <span className="text-5xl">{nautaIndex.interpretation.icon}</span>
            </div>
            <div className="w-full bg-white bg-opacity-20 rounded-full h-2.5 mb-2">
              <div 
                className="h-2.5 rounded-full bg-white transition-all duration-1000"
                style={{ width: `${nautaIndex.score}%` }}
              ></div>
            </div>
            <p className="text-sm font-semibold">{nautaIndex.interpretation.level}</p>
          </div>
        </div>
      </div>

      {/* Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Presupuestado */}
        <MetricCard
          title="Presupuestado"
          value={totals.budgeted.toFixed(0)}
          currency={displayCurrency}
          icon="fa-wallet"
          color="blue"
        />

        {/* Gastado */}
        <MetricCard
          title="Gastado"
          value={totals.spent.toFixed(0)}
          currency={displayCurrency}
          icon="fa-credit-card"
          color="red"
          subtitle={`${((totals.spent / totals.budgeted) * 100).toFixed(1)}% usado`}
        />

        {/* Disponible */}
        <MetricCard
          title="Disponible"
          value={totals.available.toFixed(0)}
          currency={displayCurrency}
          icon="fa-piggy-bank"
          color="green"
          subtitle={`${((totals.available / totals.budgeted) * 100).toFixed(1)}% libre`}
        />

        {/* Patrimonio Neto */}
        <MetricCard
          title="Patrimonio Neto"
          value={netWorth.toFixed(0)}
          currency={displayCurrency}
          icon="fa-chart-line"
          color={netWorth >= 0 ? 'green' : 'red'}
          subtitle="Activos - Pasivos"
        />
      </div>

      {/* KPIs Rápidos (Mini Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MiniKPI
          label="Tasa Ahorro"
          value={`${savingsRate.toFixed(1)}%`}
          icon="fa-percentage"
          status={savingsRate >= 20 ? 'good' : savingsRate >= 10 ? 'warning' : 'danger'}
        />
        <MiniKPI
          label="Fondo Emergencia"
          value={`${emergencyFundMonths.toFixed(1)}m`}
          icon="fa-life-ring"
          status={emergencyFundMonths >= 6 ? 'good' : emergencyFundMonths >= 3 ? 'warning' : 'danger'}
        />
        <MiniKPI
          label="Deudas Activas"
          value={debts.length}
          icon="fa-credit-card"
          status={debts.length === 0 ? 'good' : debts.length <= 2 ? 'warning' : 'danger'}
        />
        <MiniKPI
          label="Objetivos Ahorro"
          value={savingsGoals.length}
          icon="fa-bullseye"
          status={savingsGoals.length > 0 ? 'good' : 'warning'}
        />
      </div>

      {/* Gráficos Fila 1: Presupuesto y Proyección */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Gráfico Presupuesto vs Gastado */}
        <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <i className="fas fa-chart-bar mr-2 text-indigo-600"></i>
            Presupuesto vs Gastado
          </h3>

          {/* Chart Container - M11 */}
          <div className="chart-container">
            <BarChart data={budgetChartData} height={300} />
          </div>
        </div>

        {/* Gráfico Proyección Fin de Mes */}
        <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <i className="fas fa-chart-line mr-2 text-red-600"></i>
            Proyección Fin de Mes
          </h3>

          <div className="mb-3 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <i className="fas fa-calendar-day mr-1"></i>
              Día {monthProjection.currentDay} de {monthProjection.daysInMonth} 
              <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium">
                {monthProjection.remainingDays} días restantes
              </span>
            </p>
            <p className="text-sm font-semibold text-red-600 mt-2">
              <i className="fas fa-arrow-trend-up mr-1"></i>
              Proyección: {monthProjection.projectedSpent.toFixed(2)} {displayCurrency}
              {monthProjection.projectedSpent > totals.budgeted && (
                <span className="ml-2 text-xs bg-red-100 px-2 py-1 rounded">
                  ⚠️ Sobre presupuesto
                </span>
              )}
            </p>
          </div>

          {/* Chart Container - M11 */}
          <div className="chart-container">
            <LineChart data={projectionChartData} height={260} />
          </div>
        </div>
      </div>

      {/* Gráfico Fila 2: Gastos por Categoría */}
      <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <i className="fas fa-chart-pie mr-2 text-purple-600"></i>
          Distribución de Gastos por Categoría
        </h3>

        {/* Chart Container - M11 */}
        <div className="chart-container">
          <DoughnutChart data={categoryChartData} height={350} />
        </div>
      </div>

      {/* Resumen Financiero Rápido */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Deudas */}
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
                {debt.currentBalance.toFixed(0)} {debt.currency}
              </span>
            </div>
          )}
        />

        {/* Objetivos de Ahorro */}
        <SummaryCard
          title="Objetivos de Ahorro"
          icon="fa-bullseye"
          iconColor="text-green-600"
          iconBg="bg-green-100"
          items={savingsGoals.slice(0, 3)}
          emptyMessage="Sin objetivos creados"
          renderItem={(goal) => {
            const progress = (goal.currentAmount / goal.targetAmount) * 100;
            return (
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-700">{goal.name}</span>
                  <span className="text-xs font-semibold text-green-600">
                    {progress.toFixed(0)}%
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

        {/* Inversiones */}
        <SummaryCard
          title="Inversiones"
          icon="fa-chart-line"
          iconColor="text-purple-600"
          iconBg="bg-purple-100"
          items={investments.slice(0, 3)}
          emptyMessage="Sin inversiones registradas"
          renderItem={(inv) => {
            const roi = ((inv.currentPrice - inv.purchasePrice) / inv.purchasePrice) * 100;
            return (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">{inv.symbol}</span>
                <span className={`text-sm font-semibold ${roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {roi >= 0 ? '+' : ''}{roi.toFixed(1)}%
                </span>
              </div>
            );
          }}
        />
      </div>
    </div>
  );
}

// Componente MetricCard
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

// Componente MiniKPI
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

// Componente SummaryCard
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
