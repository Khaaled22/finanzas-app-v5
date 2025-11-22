import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import InvestmentForm from '../../components/forms/InvestmentForm'

export default function InvestmentsView() {
  const { 
    investments, 
    updateInvestmentPrice,
    displayCurrency,
    convertCurrency 
  } = useApp()
  
  const [showAddInvestment, setShowAddInvestment] = useState(false)
  const [editingInvestment, setEditingInvestment] = useState(null)
  const [updatingPrices, setUpdatingPrices] = useState({})

  // Calcular totales del portafolio
  const portfolioValue = investments.reduce((sum, inv) => {
    const value = inv.quantity * inv.currentPrice
    return sum + convertCurrency(value, inv.currency, displayCurrency)
  }, 0)
  
  const portfolioCost = investments.reduce((sum, inv) => {
    const cost = inv.quantity * inv.purchasePrice
    return sum + convertCurrency(cost, inv.currency, displayCurrency)
  }, 0)
  
  const totalGainLoss = portfolioValue - portfolioCost
  const totalROI = portfolioCost > 0 ? (totalGainLoss / portfolioCost) * 100 : 0

  const handleUpdatePrice = async (investmentId) => {
    setUpdatingPrices(prev => ({ ...prev, [investmentId]: true }))
    
    // Simular actualización de precio (en producción, llamarías a una API)
    setTimeout(() => {
      updateInvestmentPrice(investmentId)
      setUpdatingPrices(prev => ({ ...prev, [investmentId]: false }))
    }, 500)
  }

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 flex items-center">
            <i className="fas fa-chart-line mr-3 text-purple-600"></i>
            Portafolio de Inversiones
          </h2>
          <p className="text-gray-600 mt-1">
            {investments.length} inversión{investments.length !== 1 ? 'es' : ''} activa{investments.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowAddInvestment(true)}
          className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg hover:shadow-xl font-medium"
        >
          <i className="fas fa-plus mr-2"></i>
          Nueva Inversión
        </button>
      </div>

      {/* Métricas del Portafolio */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Valor Total</p>
              <p className="text-3xl font-bold text-gray-800">
                {portfolioValue.toFixed(0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">{displayCurrency}</p>
            </div>
            <div className="bg-purple-100 p-4 rounded-full">
              <i className="fas fa-wallet text-2xl text-purple-600"></i>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Inversión Total</p>
              <p className="text-3xl font-bold text-gray-800">
                {portfolioCost.toFixed(0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">{displayCurrency}</p>
            </div>
            <div className="bg-blue-100 p-4 rounded-full">
              <i className="fas fa-hand-holding-usd text-2xl text-blue-600"></i>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Ganancia/Pérdida</p>
              <p className={`text-3xl font-bold ${totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalGainLoss >= 0 ? '+' : ''}{totalGainLoss.toFixed(0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">{displayCurrency}</p>
            </div>
            <div className={`${totalGainLoss >= 0 ? 'bg-green-100' : 'bg-red-100'} p-4 rounded-full`}>
              <i className={`fas ${totalGainLoss >= 0 ? 'fa-arrow-up' : 'fa-arrow-down'} text-2xl ${totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}></i>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">ROI Total</p>
              <p className={`text-3xl font-bold ${totalROI >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalROI >= 0 ? '+' : ''}{totalROI.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500 mt-1">Retorno</p>
            </div>
            <div className="bg-orange-100 p-4 rounded-full">
              <i className="fas fa-percentage text-2xl text-orange-600"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Inversiones */}
      {investments.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <div className="flex flex-col items-center">
            <div className="bg-purple-100 p-8 rounded-full mb-6">
              <i className="fas fa-chart-line text-6xl text-purple-600"></i>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              No tienes inversiones registradas
            </h3>
            <p className="text-gray-600 mb-6 max-w-md">
              Comienza a registrar tus inversiones en acciones, ETFs, criptomonedas y más
            </p>
            <button
              onClick={() => setShowAddInvestment(true)}
              className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-8 py-3 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg font-medium"
            >
              <i className="fas fa-plus mr-2"></i>
              Agregar Primera Inversión
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {investments.map(inv => {
            const currentValue = inv.quantity * inv.currentPrice
            const purchaseValue = inv.quantity * inv.purchasePrice
            const gainLoss = currentValue - purchaseValue
            const roi = purchaseValue > 0 ? (gainLoss / purchaseValue) * 100 : 0

            const typeConfig = {
              'Stock': { icon: 'fa-chart-line', color: 'blue', bgColor: 'bg-blue-500' },
              'ETF': { icon: 'fa-layer-group', color: 'indigo', bgColor: 'bg-indigo-500' },
              'Crypto': { icon: 'fa-bitcoin', color: 'orange', bgColor: 'bg-orange-500' },
              'Fondo Mutuo': { icon: 'fa-briefcase', color: 'green', bgColor: 'bg-green-500' }
            }
            const config = typeConfig[inv.type] || typeConfig['Stock']

            return (
              <div key={inv.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                {/* Header */}
                <div className={`bg-gradient-to-r from-${config.color}-500 to-${config.color}-600 ${config.bgColor} p-6 text-white`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <i className={`fas ${config.icon} text-2xl`}></i>
                        <div>
                          <h3 className="text-2xl font-bold">{inv.symbol}</h3>
                          <p className="text-sm opacity-90">{inv.name}</p>
                        </div>
                      </div>
                      
                      {/* M7: Badge de Plataforma/Broker */}
                      {inv.platform && (
                        <div className="mt-3 inline-flex items-center bg-white bg-opacity-20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                          <i className="fas fa-building mr-2 text-sm"></i>
                          <span className="text-sm font-medium">{inv.platform}</span>
                        </div>
                      )}
                      
                      {/* Badge de tipo */}
                      <div className="mt-2 inline-block bg-white bg-opacity-20 px-3 py-1 rounded-full text-xs font-medium">
                        {inv.type}
                      </div>
                    </div>
                    
                    {/* Botones de acción */}
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => handleUpdatePrice(inv.id)}
                        disabled={updatingPrices[inv.id]}
                        className="bg-white bg-opacity-20 hover:bg-opacity-30 p-2 rounded-lg transition-colors disabled:opacity-50"
                        title="Actualizar precio"
                      >
                        <i className={`fas fa-sync-alt ${updatingPrices[inv.id] ? 'animate-spin' : ''}`}></i>
                      </button>
                      <button
                        onClick={() => setEditingInvestment(inv)}
                        className="bg-white bg-opacity-20 hover:bg-opacity-30 p-2 rounded-lg transition-colors"
                        title="Editar inversión"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Contenido */}
                <div className="p-6">
                  {/* Estadísticas principales */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Cantidad</p>
                      <p className="text-xl font-bold text-gray-800">
                        {inv.quantity}
                      </p>
                      <p className="text-xs text-gray-500">unidades</p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Precio Actual</p>
                      <p className="text-xl font-bold text-purple-600">
                        {inv.currentPrice.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">{inv.currency}</p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Valor Total</p>
                      <p className="text-xl font-bold text-gray-800">
                        {currentValue.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">{inv.currency}</p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">ROI</p>
                      <p className={`text-xl font-bold ${roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {roi >= 0 ? '+' : ''}{roi.toFixed(2)}%
                      </p>
                      <p className={`text-xs ${roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {roi >= 0 ? '+' : ''}{gainLoss.toFixed(2)} {inv.currency}
                      </p>
                    </div>
                  </div>

                  {/* Detalles adicionales */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <span className="text-sm text-gray-700">Precio Compra</span>
                      <span className="font-semibold text-gray-800">
                        {inv.purchasePrice.toFixed(2)} {inv.currency}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                      <span className="text-sm text-gray-700">Inversión Total</span>
                      <span className="font-semibold text-gray-800">
                        {purchaseValue.toFixed(2)} {inv.currency}
                      </span>
                    </div>
                  </div>

                  {/* Barra de rendimiento */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Rendimiento
                      </span>
                      <span className={`text-sm font-bold ${roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {roi >= 0 ? '📈' : '📉'} {roi >= 0 ? '+' : ''}{roi.toFixed(2)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-3 transition-all duration-500 ${
                          roi >= 20 ? 'bg-gradient-to-r from-green-400 to-green-600' :
                          roi >= 10 ? 'bg-gradient-to-r from-green-300 to-green-500' :
                          roi >= 0 ? 'bg-gradient-to-r from-blue-400 to-blue-600' :
                          roi >= -10 ? 'bg-gradient-to-r from-orange-400 to-orange-600' :
                          'bg-gradient-to-r from-red-400 to-red-600'
                        }`}
                        style={{ 
                          width: `${Math.abs(roi) > 100 ? 100 : Math.abs(roi)}%`,
                          marginLeft: roi < 0 ? `${100 - Math.abs(roi)}%` : '0'
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Información adicional */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center text-gray-600">
                        <i className="fas fa-calendar-alt mr-2 text-gray-400"></i>
                        <span>Última actualización:</span>
                      </div>
                      <div className="text-right font-medium text-gray-800">
                        {new Date(inv.lastUpdated).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>

                      {inv.purchaseHistory && inv.purchaseHistory.length > 0 && (
                        <>
                          <div className="flex items-center text-gray-600">
                            <i className="fas fa-history mr-2 text-gray-400"></i>
                            <span>Primera compra:</span>
                          </div>
                          <div className="text-right font-medium text-gray-800">
                            {new Date(inv.purchaseHistory[0].date).toLocaleDateString('es-ES', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modales */}
      {showAddInvestment && (
        <InvestmentForm onClose={() => setShowAddInvestment(false)} />
      )}

      {editingInvestment && (
        <InvestmentForm 
          investment={editingInvestment}
          onClose={() => setEditingInvestment(null)} 
        />
      )}
    </div>
  )
}