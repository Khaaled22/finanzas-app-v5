import { useState, useMemo } from 'react'
import { useApp } from '../../context/AppContext'
import InvestmentForm from '../../components/forms/InvestmentForm'
import UpdateInvestmentModal from '../../components/modals/UpdateInvestmentModal'
import PlatformModal from '../../components/modals/PlatformModal'
import PlatformDetailModal from '../../components/modals/PlatformDetailModal'
import PlatformEvolutionModal from '../../components/modals/PlatformEvolutionModal'
import BalanceHistoryModal from '../../components/modals/BalanceHistoryModal'
import MonthlyComparisonTable from '../../components/investments/MonthlyComparisonTable'

export default function InvestmentsView() {
  const { 
    investments, 
    updateInvestment,
    updateInvestmentPrice,
    savePlatform,
    deleteInvestment,
    addHoldingToPlatform,
    updateHoldingInPlatform,
    deleteHoldingFromPlatform,
    addBalanceHistory,
    updateBalanceHistory,
    addBalanceEntry,
    deleteBalanceEntry,
    displayCurrency,
    convertCurrency 
  } = useApp()
  
  const [showAddInvestment, setShowAddInvestment] = useState(false)
  const [editingInvestment, setEditingInvestment] = useState(null)
  const [updatingPrices, setUpdatingPrices] = useState({})
  
  // Modales de plataformas
  const [showPlatformModal, setShowPlatformModal] = useState(false)
  const [editingPlatform, setEditingPlatform] = useState(null)
  const [showPlatformDetail, setShowPlatformDetail] = useState(false)
  const [selectedPlatform, setSelectedPlatform] = useState(null)
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [showEvolutionModal, setShowEvolutionModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)

  // Separar plataformas de activos individuales
  const { platforms, assets } = useMemo(() => {
    const platforms = investments.filter(inv => inv.platform && !inv.quantity)
    const assets = investments.filter(inv => inv.quantity)
    return { platforms, assets }
  }, [investments])

  // Calcular totales de activos individuales
  const assetsValue = assets.reduce((sum, inv) => {
    const value = inv.quantity * inv.currentPrice
    return sum + convertCurrency(value, inv.currency, displayCurrency)
  }, 0)
  
  const assetsCost = assets.reduce((sum, inv) => {
    const cost = inv.quantity * inv.purchasePrice
    return sum + convertCurrency(cost, inv.currency, displayCurrency)
  }, 0)

  // Calcular totales de plataformas
  const platformsValue = platforms.reduce((sum, inv) => {
    return sum + convertCurrency(inv.currentBalance, inv.currency, displayCurrency)
  }, 0)
  
  // Totales generales
  const portfolioValue = assetsValue + platformsValue
  const portfolioCost = assetsCost
  const totalGainLoss = assetsValue - assetsCost
  const totalROI = portfolioCost > 0 ? (totalGainLoss / portfolioCost) * 100 : 0

  const handleUpdatePrice = async (investmentId) => {
    setUpdatingPrices(prev => ({ ...prev, [investmentId]: true }))
    
    setTimeout(() => {
      updateInvestmentPrice(investmentId)
      setUpdatingPrices(prev => ({ ...prev, [investmentId]: false }))
    }, 500)
  }

  const handleAddPlatform = () => {
    setEditingPlatform(null)
    setShowPlatformModal(true)
  }

  const handleEditPlatform = (platform) => {
    setEditingPlatform(platform)
    setShowPlatformModal(true)
  }

  const handleSavePlatform = (platformData) => {
    savePlatform(platformData)
  }

  const handleDeletePlatform = (platformId) => {
    deleteInvestment(platformId)
  }

  const handleViewPlatformDetails = (platform) => {
    setSelectedPlatform(platform)
    setShowPlatformDetail(true)
  }

  const handleUpdatePlatform = (platform) => {
    setSelectedPlatform(platform)
    setShowUpdateModal(true)
  }

  const handleUpdatePlatformBalance = (platformId, updates) => {
    updateInvestment(platformId, updates)
    
    // Agregar al historial
    if (updates.currentBalance !== undefined) {
      addBalanceHistory(platformId, updates.currentBalance, updates.notes || 'Actualización manual')
    }
  }

  const handleAddHolding = (platformId, holding) => {
    addHoldingToPlatform(platformId, holding)
  }

  const handleUpdateHolding = (platformId, holdingId, updates) => {
    updateHoldingInPlatform(platformId, holdingId, updates)
  }

  const handleDeleteHolding = (platformId, holdingId) => {
    deleteHoldingFromPlatform(platformId, holdingId)
  }

  const handleUpdateBalance = (platformId, newBalance) => {
    updateInvestment(platformId, { currentBalance: newBalance })
    addBalanceHistory(platformId, newBalance, 'Actualización manual desde detalle')
  }

  const handleViewEvolution = (platform) => {
    setSelectedPlatform(platform)
    setShowEvolutionModal(true)
  }

  const handleViewHistory = (platform) => {
    setSelectedPlatform(platform)
    setShowHistoryModal(true)
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
            {platforms.length} plataforma{platforms.length !== 1 ? 's' : ''} • {assets.length} activo{assets.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleAddPlatform}
            className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-lg hover:shadow-xl font-medium"
          >
            <i className="fas fa-building mr-2"></i>
            Nueva Plataforma
          </button>
          <button
            onClick={() => setShowAddInvestment(true)}
            className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg hover:shadow-xl font-medium"
          >
            <i className="fas fa-plus mr-2"></i>
            Nuevo Activo
          </button>
        </div>
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

        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Plataformas</p>
              <p className="text-3xl font-bold text-gray-800">
                {platformsValue.toFixed(0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">{displayCurrency}</p>
            </div>
            <div className="bg-green-100 p-4 rounded-full">
              <i className="fas fa-building text-2xl text-green-600"></i>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Activos</p>
              <p className="text-3xl font-bold text-gray-800">
                {assetsValue.toFixed(0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">{displayCurrency}</p>
            </div>
            <div className="bg-blue-100 p-4 rounded-full">
              <i className="fas fa-chart-pie text-2xl text-blue-600"></i>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">ROI Activos</p>
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

      {/* Plataformas */}
      {platforms.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-800">
            <i className="fas fa-building mr-2 text-green-600"></i>
            Plataformas de Inversión
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {platforms.map(inv => {
              const balanceInDisplay = convertCurrency(inv.currentBalance, inv.currency, displayCurrency)
              const holdingsCount = inv.holdings?.length || 0;
              
              return (
                <div
                  key={inv.id}
                  className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow border-l-4 border-green-500"
                >
                  <div className="p-6">
                    {/* Header de la plataforma */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="text-4xl">
                          {inv.icon}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-lg">
                            {inv.platform}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {inv.type}
                          </p>
                        </div>
                      </div>
                      {/* Botón editar */}
                      <button
                        onClick={() => handleEditPlatform(inv)}
                        className="text-gray-400 hover:text-blue-600 transition-colors"
                        title="Editar plataforma"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                    </div>

                    {/* Nombre del portafolio */}
                    <p className="text-sm text-gray-600 mb-4">
                      {inv.name}
                    </p>

                    {/* Saldo actual */}
                    <div className="bg-green-50 rounded-lg p-4 mb-4">
                      <p className="text-xs text-gray-600 mb-1">Saldo Actual</p>
                      <p className="text-2xl font-bold text-green-700">
                        {inv.currentBalance.toLocaleString('es-ES', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })} {inv.currency}
                      </p>
                      {inv.currency !== displayCurrency && (
                        <p className="text-xs text-gray-500 mt-1">
                          ≈ {balanceInDisplay.toLocaleString('es-ES', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })} {displayCurrency}
                        </p>
                      )}
                    </div>

                    {/* Holdings badge */}
                    {holdingsCount > 0 && (
                      <div className="mb-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <i className="fas fa-layer-group mr-1"></i>
                          {holdingsCount} activo{holdingsCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                    )}

                    {/* Notas */}
                    {inv.notes && (
                      <div className="mb-4">
                        <p className="text-xs text-gray-500 mb-1">
                          <i className="fas fa-sticky-note mr-1"></i>
                          Notas
                        </p>
                        <p className="text-sm text-gray-700 italic">
                          {inv.notes}
                        </p>
                      </div>
                    )}

                    {/* Última actualización */}
                    <div className="border-t pt-3 mb-4">
                      <p className="text-xs text-gray-500">
                        <i className="fas fa-clock mr-1"></i>
                        Última actualización: {new Date(inv.lastUpdated).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>

                    {/* Botones */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleViewPlatformDetails(inv)}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        <i className="fas fa-eye mr-1"></i>
                        Detalle
                      </button>
                      <button
                        onClick={() => handleViewEvolution(inv)}
                        className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                      >
                        <i className="fas fa-chart-line mr-1"></i>
                        Evolución
                      </button>
                      <button
                        onClick={() => handleViewHistory(inv)}
                        className="px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
                      >
                        <i className="fas fa-history mr-1"></i>
                        Historial
                      </button>
                      <button
                        onClick={() => handleUpdatePlatform(inv)}
                        className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                      >
                        <i className="fas fa-sync-alt mr-1"></i>
                        Actualizar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Activos Individuales */}
      {assets.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-800">
            <i className="fas fa-chart-line mr-2 text-purple-600"></i>
            Activos Individuales
          </h3>
          <div className="space-y-6">
            {assets.map(inv => {
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
                          <i className={`fas ${config.icon} text-3xl`}></i>
                          <div>
                            <h3 className="text-2xl font-bold">{inv.name}</h3>
                            <p className="text-sm opacity-90">{inv.symbol} • {inv.type}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 text-sm opacity-90">
                          <span>
                            <i className="fas fa-boxes mr-1"></i>
                            {inv.quantity} unidades
                          </span>
                          <span className={`${gainLoss >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                            {gainLoss >= 0 ? '▲' : '▼'} {roi.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
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
                          {inv.currentPrice.toFixed(2)} {inv.currency}
                        </p>
                        {inv.currency !== displayCurrency && (
                          <p className="text-xs text-gray-500">
                            ≈ {convertCurrency(inv.currentPrice, inv.currency, displayCurrency).toFixed(2)} {displayCurrency}
                          </p>
                        )}
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">Valor Total</p>
                        <p className="text-xl font-bold text-gray-800">
                          {currentValue.toFixed(2)} {inv.currency}
                        </p>
                        {inv.currency !== displayCurrency && (
                          <p className="text-xs text-gray-500">
                            ≈ {convertCurrency(currentValue, inv.currency, displayCurrency).toFixed(2)} {displayCurrency}
                          </p>
                        )}
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
        </div>
      )}

      {/* Comparación Mensual */}
      {platforms.length > 0 && (
        <MonthlyComparisonTable
          platforms={platforms}
          currency={displayCurrency}
        />
      )}

      {/* Mensaje si no hay inversiones */}
      {investments.length === 0 && (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <div className="flex flex-col items-center">
            <div className="bg-purple-100 p-8 rounded-full mb-6">
              <i className="fas fa-chart-line text-6xl text-purple-600"></i>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              No tienes inversiones registradas
            </h3>
            <p className="text-gray-600 mb-6 max-w-md">
              Comienza agregando una plataforma o un activo individual
            </p>
            <div className="flex space-x-4">
              <button
                onClick={handleAddPlatform}
                className="bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-3 rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-lg font-medium"
              >
                <i className="fas fa-building mr-2"></i>
                Agregar Plataforma
              </button>
              <button
                onClick={() => setShowAddInvestment(true)}
                className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-8 py-3 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg font-medium"
              >
                <i className="fas fa-plus mr-2"></i>
                Agregar Activo
              </button>
            </div>
          </div>
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

      {/* Modal CRUD de plataformas */}
      <PlatformModal
        isOpen={showPlatformModal}
        onClose={() => {
          setShowPlatformModal(false)
          setEditingPlatform(null)
        }}
        platform={editingPlatform}
        onSave={handleSavePlatform}
        onDelete={handleDeletePlatform}
      />

      {/* Modal de detalle de plataforma con holdings */}
      <PlatformDetailModal
        isOpen={showPlatformDetail}
        onClose={() => {
          setShowPlatformDetail(false)
          setSelectedPlatform(null)
        }}
        platform={selectedPlatform}
        onAddHolding={handleAddHolding}
        onUpdateHolding={handleUpdateHolding}
        onDeleteHolding={handleDeleteHolding}
        onUpdateBalance={handleUpdateBalance}
        displayCurrency={displayCurrency}
        convertCurrency={convertCurrency}
      />

      {/* Modal de actualización rápida de balance */}
      <UpdateInvestmentModal
        isOpen={showUpdateModal}
        onClose={() => {
          setShowUpdateModal(false)
          setSelectedPlatform(null)
        }}
        investment={selectedPlatform}
        onUpdate={handleUpdatePlatformBalance}
      />

      {/* Modal de evolución con gráficos */}
      <PlatformEvolutionModal
        isOpen={showEvolutionModal}
        onClose={() => {
          setShowEvolutionModal(false)
          setSelectedPlatform(null)
        }}
        platform={selectedPlatform}
        displayCurrency={displayCurrency}
        convertCurrency={convertCurrency}
      />

      {/* Modal de historial completo */}
      <BalanceHistoryModal
        isOpen={showHistoryModal}
        onClose={() => {
          setShowHistoryModal(false)
          setSelectedPlatform(null)
        }}
        platform={selectedPlatform}
        onUpdateHistory={updateBalanceHistory}
        onAddEntry={addBalanceEntry}
        onDeleteEntry={deleteBalanceEntry}
      />
    </div>
  )
}