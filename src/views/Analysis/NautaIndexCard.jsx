// src/views/Analysis/NautaIndexCard.jsx

export default function NautaIndexCard({ nautaIndex }) {
  const { score, breakdown, interpretation } = nautaIndex

  const colorClasses = {
    green: {
      bg: 'from-green-500 to-green-600',
      light: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800'
    },
    blue: {
      bg: 'from-blue-500 to-blue-600',
      light: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800'
    },
    yellow: {
      bg: 'from-yellow-500 to-yellow-600',
      light: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800'
    },
    red: {
      bg: 'from-red-500 to-red-600',
      light: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800'
    }
  }

  const colors = colorClasses[interpretation.color]

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      {/* Header con score principal */}
      <div className={`bg-gradient-to-r ${colors.bg} p-8 text-white`}>
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <span className="text-6xl mr-4">{interpretation.icon}</span>
            <div className="text-left">
              <h2 className="text-3xl font-bold">Índice de Tranquilidad Financiera</h2>
              <p className="text-sm opacity-90 mt-1">Método Nauta</p>
            </div>
          </div>
          
          <div className="mt-6">
            <div className="text-8xl font-bold mb-2">{score}</div>
            <div className="text-2xl opacity-90">de 100 puntos</div>
            <div className="mt-4 text-xl font-semibold">{interpretation.level}</div>
          </div>
          
          {/* Barra de progreso */}
          <div className="mt-6">
            <div className="w-full bg-white bg-opacity-20 rounded-full h-4">
              <div 
                className="h-4 rounded-full bg-white transition-all duration-1000"
                style={{ width: `${score}%` }}
              ></div>
            </div>
          </div>
          
          <p className="mt-4 text-lg opacity-95">{interpretation.message}</p>
        </div>
      </div>

      {/* Desglose de componentes */}
      <div className="p-8">
        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
          <i className="fas fa-chart-pie mr-3 text-purple-600"></i>
          Desglose por Componentes
        </h3>

        <div className="space-y-4">
          {/* 1. Fondo de Emergencia */}
          <ComponentBreakdown
            icon="fa-life-ring"
            iconColor="text-blue-600"
            title="Fondo de Emergencia"
            score={breakdown.emergencyFund.score}
            max={breakdown.emergencyFund.max}
            details={breakdown.emergencyFund.details}
          />

          {/* 2. Tasa de Ahorro */}
          <ComponentBreakdown
            icon="fa-piggy-bank"
            iconColor="text-green-600"
            title="Tasa de Ahorro"
            score={breakdown.savingsRate.score}
            max={breakdown.savingsRate.max}
            details={breakdown.savingsRate.details}
          />

          {/* 3. Deudas Tóxicas */}
          <ComponentBreakdown
            icon="fa-exclamation-triangle"
            iconColor="text-red-600"
            title="Deudas Tóxicas"
            score={breakdown.toxicDebts.score}
            max={breakdown.toxicDebts.max}
            details={breakdown.toxicDebts.details}
          />

          {/* 4. Seguros */}
          <ComponentBreakdown
            icon="fa-shield-alt"
            iconColor="text-indigo-600"
            title="Seguros y Protección"
            score={breakdown.insurance.score}
            max={breakdown.insurance.max}
            details={breakdown.insurance.details}
          />

          {/* 5. APV/Pensión */}
          <ComponentBreakdown
            icon="fa-clock"
            iconColor="text-purple-600"
            title="APV / Ahorro Previsional"
            score={breakdown.retirement.score}
            max={breakdown.retirement.max}
            details={breakdown.retirement.details}
          />
        </div>

        {/* Resumen total */}
        <div className={`mt-8 ${colors.light} border-2 ${colors.border} rounded-xl p-6`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Puntuación Total</p>
              <p className="text-3xl font-bold text-gray-800">
                {nautaIndex.totalAchieved.toFixed(1)} / {nautaIndex.totalPossible}
              </p>
            </div>
            <div className={`text-6xl ${colors.text}`}>
              {interpretation.icon}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Componente auxiliar para cada breakdown
function ComponentBreakdown({ icon, iconColor, title, score, max, details }) {
  const percentage = (score / max) * 100

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center flex-1">
          <div className="bg-gray-100 p-3 rounded-lg mr-4">
            <i className={`fas ${icon} ${iconColor} text-xl`}></i>
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-800">{title}</h4>
            <p className="text-sm text-gray-600">{details.status}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-800">
            {score.toFixed(1)}
          </p>
          <p className="text-xs text-gray-500">de {max}</p>
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className={`h-2.5 rounded-full transition-all duration-500 ${
            percentage >= 80 ? 'bg-green-500' :
            percentage >= 60 ? 'bg-blue-500' :
            percentage >= 40 ? 'bg-yellow-500' :
            'bg-red-500'
          }`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>

      {/* Detalles específicos - CORRECCIÓN AQUÍ */}
      <details className="mt-3">
        <summary className="cursor-pointer text-sm text-gray-600 hover:text-purple-600 transition-colors">
          Ver detalles <i className="fas fa-chevron-down ml-1"></i>
        </summary>
        <div className="mt-3 pl-4 border-l-2 border-gray-200 text-sm text-gray-700 space-y-1">
          {Object.entries(details).map(([key, value]) => {
            if (key === 'status') return null
            
            // 🔧 CORRECCIÓN: Manejar arrays de objetos correctamente
            if (Array.isArray(value)) {
              if (value.length === 0) {
                return (
                  <div key={key} className="flex justify-between">
                    <span className="text-gray-600 capitalize">
                      {formatKey(key)}:
                    </span>
                    <span className="font-medium">Ninguna</span>
                  </div>
                )
              }
              
              return (
                <div key={key} className="mb-2">
                  <span className="text-gray-600 capitalize block mb-1">
                    {formatKey(key)}:
                  </span>
                  <div className="pl-2 space-y-1">
                    {value.map((item, idx) => (
                      <div key={idx} className="text-xs bg-gray-50 p-2 rounded">
                        {typeof item === 'object' ? (
                          <>
                            <div><strong>{item.name}</strong></div>
                            <div>Tipo: {item.type}</div>
                            <div>Saldo: {item.balance?.toFixed(2)}</div>
                          </>
                        ) : (
                          <span>{String(item)}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            }
            
            return (
              <div key={key} className="flex justify-between">
                <span className="text-gray-600 capitalize">
                  {formatKey(key)}:
                </span>
                <span className="font-medium">
                  {formatValue(value)}
                </span>
              </div>
            )
          })}
        </div>
      </details>
    </div>
  )
}

// Función auxiliar para formatear claves
function formatKey(key) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim()
}

// Función auxiliar para formatear valores
function formatValue(value) {
  if (typeof value === 'number') {
    return value.toFixed(2)
  }
  if (typeof value === 'boolean') {
    return value ? '✓ Sí' : '✗ No'
  }
  if (value === null || value === undefined) {
    return 'N/A'
  }
  return String(value)
}