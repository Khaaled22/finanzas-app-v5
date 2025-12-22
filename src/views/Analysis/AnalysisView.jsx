// src/views/Analysis/AnalysisView.jsx
// ✅ M32: Agregado gráfico de evolución de patrimonio neto
import { useAnalytics } from '../../hooks/useAnalytics'
import { useApp } from '../../context/AppContext'
import NautaIndexCard from './NautaIndexCard'
import NetWorthHistoryChart from './NetWorthHistoryChart'

export default function AnalysisView() {
  const { displayCurrency, ynabConfig } = useApp()
  const {
    nautaIndex,
    debtToIncomeRatio,
    savingsRate,
    debtServiceRatio,
    emergencyFundMonths,
    netWorth,
    netWorthHistory // ✅ M32: Nuevo
  } = useAnalytics()

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-800 flex items-center">
          <i className="fas fa-brain mr-3 text-purple-600"></i>
          Análisis Financiero Completo
        </h2>
        <p className="text-gray-600 mt-1">
          Evaluación integral de tu salud financiera
        </p>
      </div>

      {/* M8: Índice de Tranquilidad Financiera (Nauta) */}
      <NautaIndexCard nautaIndex={nautaIndex} />

      {/* ✅ M32: Gráfico de Patrimonio Neto */}
      <NetWorthHistoryChart 
        history={netWorthHistory} 
        currentNetWorth={netWorth}
        displayCurrency={displayCurrency}
      />

      {/* M9: KPIs Adicionales */}
      <div>
        <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
          <i className="fas fa-chart-bar mr-3 text-indigo-600"></i>
          Indicadores Clave (KPIs)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* M9.1: Ratio Deuda/Ingreso */}
          <KPICard
            title="Ratio Deuda/Ingreso Anual"
            value={`${debtToIncomeRatio.toFixed(1)}%`}
            icon="fa-balance-scale"
            status={
              debtToIncomeRatio < 36 ? 'good' :
              debtToIncomeRatio < 50 ? 'warning' : 'danger'
            }
            description={
              debtToIncomeRatio < 36 ? 'Saludable - Nivel de deuda manejable' :
              debtToIncomeRatio < 50 ? 'Moderado - Monitorear de cerca' :
              'Alto - Requiere acción inmediata'
            }
            benchmark="Recomendado: < 36%"
          />

          {/* M9.2: Tasa de Ahorro */}
          <KPICard
            title="Tasa de Ahorro"
            value={`${savingsRate.toFixed(1)}%`}
            icon="fa-piggy-bank"
            status={
              savingsRate >= 20 ? 'good' :
              savingsRate >= 10 ? 'warning' : 'danger'
            }
            description={
              savingsRate >= 20 ? 'Excelente - Muy por encima del promedio' :
              savingsRate >= 10 ? 'Bueno - Puede mejorar' :
              'Bajo - Incrementar ahorro'
            }
            benchmark="Recomendado: ≥ 20%"
          />

          {/* M9.3: Ratio Servicio de Deuda */}
          <KPICard
            title="Ratio Servicio de Deuda"
            value={`${debtServiceRatio.toFixed(1)}%`}
            icon="fa-money-bill-wave"
            status={
              debtServiceRatio < 20 ? 'good' :
              debtServiceRatio < 36 ? 'warning' : 'danger'
            }
            description={
              debtServiceRatio < 20 ? 'Saludable - Deuda controlada' :
              debtServiceRatio < 36 ? 'Moderado - Revisar presupuesto' :
              'Alto - Reducir cuotas urgente'
            }
            benchmark="Recomendado: < 20%"
          />

          {/* M9.4: Fondo de Emergencia */}
          <KPICard
            title="Fondo de Emergencia"
            value={`${emergencyFundMonths.toFixed(1)} meses`}
            icon="fa-life-ring"
            status={
              emergencyFundMonths >= 6 ? 'good' :
              emergencyFundMonths >= 3 ? 'warning' : 'danger'
            }
            description={
              emergencyFundMonths >= 6 ? 'Excelente - Bien protegido' :
              emergencyFundMonths >= 3 ? 'Básico - Aumentar gradualmente' :
              'Insuficiente - Prioridad alta'
            }
            benchmark="Recomendado: 6 meses"
          />

          {/* Patrimonio Neto */}
          <KPICard
            title="Patrimonio Neto"
            value={`${netWorth.toFixed(0)} ${displayCurrency}`}
            icon="fa-wallet"
            status={netWorth >= 0 ? 'good' : 'danger'}
            description={
              netWorth >= 0 
                ? 'Positivo - Activos superan pasivos' 
                : 'Negativo - Reducir deudas urgente'
            }
            benchmark="Objetivo: Positivo y creciente"
          />

          {/* Ingreso Mensual Configurado */}
          <KPICard
            title="Ingreso Mensual"
            value={`${(ynabConfig?.monthlyIncome || 0).toFixed(0)} ${displayCurrency}`}
            icon="fa-hand-holding-usd"
            status={ynabConfig?.monthlyIncome > 0 ? 'good' : 'warning'}
            description={
              ynabConfig?.monthlyIncome > 0 
                ? 'Configurado correctamente' 
                : 'Sin configurar - Ir a Presupuesto'
            }
            benchmark="Base para cálculos"
          />
        </div>
      </div>

      {/* Consejos personalizados */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <i className="fas fa-lightbulb mr-3 text-yellow-500"></i>
          Recomendaciones Personalizadas
        </h3>
        
        <div className="space-y-3">
          {nautaIndex.score < 60 && (
            <RecommendationItem
              icon="fa-exclamation-circle"
              color="text-red-600"
              text="Tu índice de tranquilidad está bajo. Prioriza crear un fondo de emergencia."
            />
          )}
          
          {savingsRate < 10 && (
            <RecommendationItem
              icon="fa-arrow-up"
              color="text-orange-600"
              text="Intenta aumentar tu tasa de ahorro al menos al 10% de tus ingresos."
            />
          )}
          
          {emergencyFundMonths < 3 && (
            <RecommendationItem
              icon="fa-shield-alt"
              color="text-blue-600"
              text="Aumenta tu fondo de emergencia para cubrir al menos 3 meses de gastos."
            />
          )}
          
          {debtToIncomeRatio > 50 && (
            <RecommendationItem
              icon="fa-chart-line"
              color="text-red-600"
              text="Tu nivel de deuda es alto. Considera consolidar o refinanciar."
            />
          )}
          
          {nautaIndex.score >= 80 && (
            <RecommendationItem
              icon="fa-trophy"
              color="text-green-600"
              text="¡Excelente trabajo! Mantén estos buenos hábitos financieros."
            />
          )}

          {/* ✅ M32: Recomendación de seguros */}
          {nautaIndex.breakdown?.insurance?.score < 4 && (
            <RecommendationItem
              icon="fa-shield-alt"
              color="text-purple-600"
              text="Considera agregar más seguros (salud, vida, catastrófico). Configúralos en Ajustes > Seguros."
            />
          )}

          {/* ✅ M32: Recomendación de APV */}
          {nautaIndex.breakdown?.retirement?.score < 5 && (
            <RecommendationItem
              icon="fa-clock"
              color="text-indigo-600"
              text="No detectamos ahorro previsional (APV). Considera agregarlo para mejorar tu jubilación."
            />
          )}
        </div>
      </div>
    </div>
  )
}

// Componente KPI Card
function KPICard({ title, value, icon, status, description, benchmark }) {
  const statusConfig = {
    good: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: 'bg-green-100 text-green-600',
      text: 'text-green-800'
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      icon: 'bg-yellow-100 text-yellow-600',
      text: 'text-yellow-800'
    },
    danger: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: 'bg-red-100 text-red-600',
      text: 'text-red-800'
    }
  }

  const config = statusConfig[status]

  return (
    <div className={`${config.bg} border-2 ${config.border} rounded-xl p-6 hover:shadow-lg transition-shadow`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`${config.icon} p-4 rounded-lg`}>
          <i className={`fas ${icon} text-2xl`}></i>
        </div>
      </div>
      
      <h4 className="font-semibold text-gray-800 mb-2">{title}</h4>
      <p className="text-4xl font-bold text-gray-900 mb-2">{value}</p>
      
      <p className={`text-sm font-medium mb-2 ${config.text}`}>
        {description}
      </p>
      
      <p className="text-xs text-gray-600 border-t border-gray-300 pt-2 mt-2">
        <i className="fas fa-info-circle mr-1"></i>
        {benchmark}
      </p>
    </div>
  )
}

// Componente de recomendación
function RecommendationItem({ icon, color, text }) {
  return (
    <div className="flex items-start space-x-3 p-3 bg-white rounded-lg">
      <i className={`fas ${icon} ${color} text-xl mt-1`}></i>
      <p className="text-gray-700 flex-1">{text}</p>
    </div>
  )
}