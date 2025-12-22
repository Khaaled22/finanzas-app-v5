// src/views/Investments/InvestmentsView.jsx
// ✅ M33: Vista simplificada - Solo plataformas con historial de balances
// ✅ M34: Gráfico de evolución total del portafolio
import { useState, useMemo } from 'react';
import { useApp, PLATFORM_GOALS, PLATFORM_SUBTYPES } from '../../context/AppContext';
import { formatNumber, formatPercent, getValueColors } from '../../utils/formatters';
import PlatformForm from '../../components/forms/PlatformForm';
import BalanceHistoryModal from '../../components/modals/BalanceHistoryModal';
import PortfolioEvolutionChart from '../../components/charts/PortfolioEvolutionChart';

// ✅ Colores fijos para goals (Tailwind no soporta clases dinámicas)
const GOAL_COLORS = {
  fi_step1: { bg: 'bg-blue-500', light: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-300' },
  emergency: { bg: 'bg-green-500', light: 'bg-green-50', text: 'text-green-600', border: 'border-green-300' },
  down_payment: { bg: 'bg-purple-500', light: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-300' },
  real_state: { bg: 'bg-orange-500', light: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-300' },
  retirement: { bg: 'bg-indigo-500', light: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-300' },
  growth: { bg: 'bg-cyan-500', light: 'bg-cyan-50', text: 'text-cyan-600', border: 'border-cyan-300' },
  cash: { bg: 'bg-gray-500', light: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-300' },
  other: { bg: 'bg-slate-500', light: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-300' }
};

export default function InvestmentsView() {
  const { 
    investments, 
    updatePlatformBalance,
    calculatePlatformROI,
    displayCurrency,
    convertCurrency 
  } = useApp();
  
  // Modales
  const [showPlatformForm, setShowPlatformForm] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [showEvolutionChart, setShowEvolutionChart] = useState(false);
  
  // Filtros
  const [filterGoal, setFilterGoal] = useState('all');
  const [showArchived, setShowArchived] = useState(false);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'

  // Filtrar plataformas
  const { activePlatforms, archivedPlatforms, filteredPlatforms } = useMemo(() => {
    const active = investments.filter(inv => !inv.isArchived);
    const archived = investments.filter(inv => inv.isArchived);
    
    let filtered = showArchived ? archived : active;
    
    if (filterGoal !== 'all') {
      filtered = filtered.filter(inv => inv.goal === filterGoal);
    }
    
    // Ordenar por balance (mayor primero)
    filtered.sort((a, b) => {
      const balanceA = convertCurrency(a.currentBalance || 0, a.currency, displayCurrency);
      const balanceB = convertCurrency(b.currentBalance || 0, b.currency, displayCurrency);
      return balanceB - balanceA;
    });
    
    return { activePlatforms: active, archivedPlatforms: archived, filteredPlatforms: filtered };
  }, [investments, filterGoal, showArchived, displayCurrency, convertCurrency]);

  // Calcular totales
  const totals = useMemo(() => {
    const platforms = showArchived ? archivedPlatforms : activePlatforms;
    
    const totalValue = platforms.reduce((sum, inv) => 
      sum + convertCurrency(inv.currentBalance || 0, inv.currency, displayCurrency), 0
    );
    
    const liquidValue = platforms
      .filter(inv => inv.isLiquid !== false)
      .reduce((sum, inv) => sum + convertCurrency(inv.currentBalance || 0, inv.currency, displayCurrency), 0);
    
    const byGoal = {};
    PLATFORM_GOALS.forEach(goal => {
      byGoal[goal.id] = platforms
        .filter(inv => inv.goal === goal.id)
        .reduce((sum, inv) => sum + convertCurrency(inv.currentBalance || 0, inv.currency, displayCurrency), 0);
    });
    
    return { totalValue, liquidValue, byGoal, count: platforms.length };
  }, [activePlatforms, archivedPlatforms, showArchived, displayCurrency, convertCurrency]);

  // Handlers
  const handleAddPlatform = () => {
    setEditingPlatform(null);
    setShowPlatformForm(true);
  };

  const handleEditPlatform = (platform) => {
    setEditingPlatform(platform);
    setShowPlatformForm(true);
  };

  const handleViewHistory = (platform) => {
    setSelectedPlatform(platform);
    setShowHistoryModal(true);
  };

  const handleQuickUpdate = (platform) => {
    const newBalance = prompt(
      `Nuevo balance para ${platform.name}:`,
      (platform.currentBalance || 0).toString()
    );
    
    if (newBalance !== null && !isNaN(parseFloat(newBalance))) {
      updatePlatformBalance(platform.id, parseFloat(newBalance), 'Actualización rápida');
    }
  };

  // Obtener info del goal
  const getGoalInfo = (goalId) => PLATFORM_GOALS.find(g => g.id === goalId) || PLATFORM_GOALS[PLATFORM_GOALS.length - 1];
  const getSubtypeInfo = (subtypeId) => PLATFORM_SUBTYPES.find(s => s.id === subtypeId) || PLATFORM_SUBTYPES[PLATFORM_SUBTYPES.length - 1];
  const getGoalColors = (goalId) => GOAL_COLORS[goalId] || GOAL_COLORS.other;

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
            {totals.count} plataforma{totals.count !== 1 ? 's' : ''} activa{totals.count !== 1 ? 's' : ''}
            {archivedPlatforms.length > 0 && (
              <span className="text-gray-400 ml-2">
                • {archivedPlatforms.length} archivada{archivedPlatforms.length !== 1 ? 's' : ''}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowEvolutionChart(true)}
            className="bg-purple-100 text-purple-700 px-4 py-3 rounded-lg hover:bg-purple-200 transition-all font-medium"
          >
            <i className="fas fa-chart-area mr-2"></i>
            Ver Evolución
          </button>
          <button
            onClick={handleAddPlatform}
            className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-lg hover:shadow-xl font-medium"
          >
            <i className="fas fa-plus mr-2"></i>
            Nueva Plataforma
          </button>
        </div>
      </div>

      {/* Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-purple-500">
          <p className="text-sm text-gray-600 mb-1">Valor Total</p>
          <p className="text-3xl font-bold text-gray-800">
            {formatNumber(totals.totalValue)}
          </p>
          <p className="text-xs text-gray-500 mt-1">{displayCurrency}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-500">
          <p className="text-sm text-gray-600 mb-1">Liquidez Disponible</p>
          <p className="text-3xl font-bold text-blue-600">
            {formatNumber(totals.liquidValue)}
          </p>
          <p className="text-xs text-gray-500 mt-1">{displayCurrency}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-green-500">
          <p className="text-sm text-gray-600 mb-1">Fondo Emergencia</p>
          <p className="text-3xl font-bold text-green-600">
            {formatNumber(totals.byGoal.emergency || 0)}
          </p>
          <p className="text-xs text-gray-500 mt-1">{displayCurrency}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-orange-500">
          <p className="text-sm text-gray-600 mb-1">Real State</p>
          <p className="text-3xl font-bold text-orange-600">
            {formatNumber(totals.byGoal.real_state || 0)}
          </p>
          <p className="text-xs text-gray-500 mt-1">{displayCurrency}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-xl shadow-md">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterGoal('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterGoal === 'all'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Todas
            </button>
            {PLATFORM_GOALS.slice(0, 6).map(goal => (
              <button
                key={goal.id}
                onClick={() => setFilterGoal(goal.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterGoal === goal.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {goal.icon} {goal.name}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              Ver archivadas
            </label>
            
            <div className="flex border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-2 ${viewMode === 'cards' ? 'bg-purple-100 text-purple-600' : 'text-gray-500'}`}
              >
                <i className="fas fa-th-large"></i>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-2 ${viewMode === 'table' ? 'bg-purple-100 text-purple-600' : 'text-gray-500'}`}
              >
                <i className="fas fa-list"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Plataformas */}
      {filteredPlatforms.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            {showArchived ? 'No hay plataformas archivadas' : 'No hay plataformas registradas'}
          </h3>
          <p className="text-gray-600 mb-6">
            {showArchived 
              ? 'Las plataformas archivadas aparecerán aquí'
              : 'Comienza agregando tu primera plataforma de inversión'
            }
          </p>
          {!showArchived && (
            <button
              onClick={handleAddPlatform}
              className="bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-3 rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-lg font-medium"
            >
              <i className="fas fa-plus mr-2"></i>
              Agregar Plataforma
            </button>
          )}
        </div>
      ) : viewMode === 'cards' ? (
        // Vista de tarjetas
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlatforms.map(platform => {
            const goalInfo = getGoalInfo(platform.goal);
            const subtypeInfo = getSubtypeInfo(platform.subtype);
            const colors = getGoalColors(platform.goal);
            const roiData = calculatePlatformROI ? calculatePlatformROI(platform) : { roi: 0, change: 0, hasPreviousMonth: false };
            const roiColors = getValueColors(roiData.roi);
            const valueInDisplay = convertCurrency(platform.currentBalance || 0, platform.currency, displayCurrency);
            
            return (
              <div 
                key={platform.id}
                className={`bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow ${
                  platform.isArchived ? 'opacity-60' : ''
                }`}
              >
                {/* Header de la tarjeta */}
                <div className={`p-4 ${colors.bg} text-white`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{goalInfo.icon}</span>
                      <div>
                        <h3 className="font-bold text-lg">{platform.name}</h3>
                        <p className="text-sm opacity-90">{goalInfo.name}</p>
                      </div>
                    </div>
                    {platform.isLiquid === false && (
                      <span className="px-2 py-1 bg-white bg-opacity-20 rounded text-xs">
                        No líquida
                      </span>
                    )}
                  </div>
                </div>

                {/* Contenido */}
                <div className="p-4">
                  {/* Balance */}
                  <div className="mb-4">
                    <p className="text-sm text-gray-500 mb-1">Balance Actual</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-gray-800">
                        {formatNumber(platform.currentBalance || 0)}
                      </span>
                      <span className="text-gray-500">{platform.currency}</span>
                    </div>
                    {platform.currency !== displayCurrency && (
                      <p className="text-sm text-gray-400">
                        ≈ {formatNumber(valueInDisplay)} {displayCurrency}
                      </p>
                    )}
                  </div>

                  {/* ROI */}
                  <div className={`p-3 rounded-lg ${roiColors.bg} mb-4`}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        {roiData.hasPreviousMonth ? 'ROI vs mes anterior' : 'ROI total'}
                      </span>
                      <span className={`font-bold ${roiColors.text}`}>
                        {roiColors.icon} {formatPercent(roiData.roi, 1, true)}
                      </span>
                    </div>
                    {roiData.change !== 0 && (
                      <p className={`text-xs ${roiColors.text} mt-1`}>
                        {roiData.change >= 0 ? '+' : ''}{formatNumber(roiData.change)} {platform.currency}
                      </p>
                    )}
                  </div>

                  {/* Info adicional */}
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span>{subtypeInfo.icon} {subtypeInfo.name}</span>
                    <span>{platform.balanceHistory?.length || 0} registros</span>
                  </div>

                  {/* Acciones */}
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      onClick={() => handleQuickUpdate(platform)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors text-center"
                      title="Actualizar balance"
                    >
                      <i className="fas fa-sync-alt"></i>
                    </button>
                    <button
                      onClick={() => handleViewHistory(platform)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-center"
                      title="Ver historial"
                    >
                      <i className="fas fa-history"></i>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedPlatform(platform);
                        setShowEvolutionChart(true);
                      }}
                      className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors text-center"
                      title="Ver gráfico"
                    >
                      <i className="fas fa-chart-line"></i>
                    </button>
                    <button
                      onClick={() => handleEditPlatform(platform)}
                      className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors text-center"
                      title="Editar"
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // Vista de tabla
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Plataforma</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Objetivo</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Balance</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">ROI</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Liquidez</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPlatforms.map(platform => {
                  const goalInfo = getGoalInfo(platform.goal);
                  const roiData = calculatePlatformROI ? calculatePlatformROI(platform) : { roi: 0 };
                  const roiColors = getValueColors(roiData.roi);
                  
                  return (
                    <tr key={platform.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{goalInfo.icon}</span>
                          <div>
                            <p className="font-medium text-gray-800">{platform.name}</p>
                            {platform.notes && (
                              <p className="text-sm text-gray-500">{platform.notes}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600">
                          {goalInfo.name}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="font-bold text-gray-800">
                          {formatNumber(platform.currentBalance || 0)} {platform.currency}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`font-bold ${roiColors.text}`}>
                          {formatPercent(roiData.roi, 1, true)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {platform.isLiquid !== false ? (
                          <span className="text-green-600">✓</span>
                        ) : (
                          <span className="text-gray-400">✗</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleQuickUpdate(platform)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                            title="Actualizar"
                          >
                            <i className="fas fa-sync-alt"></i>
                          </button>
                          <button
                            onClick={() => handleViewHistory(platform)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Historial"
                          >
                            <i className="fas fa-history"></i>
                          </button>
                          <button
                            onClick={() => handleEditPlatform(platform)}
                            className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                            title="Editar"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modales */}
      <PlatformForm
        isOpen={showPlatformForm}
        onClose={() => {
          setShowPlatformForm(false);
          setEditingPlatform(null);
        }}
        platform={editingPlatform}
      />

      <BalanceHistoryModal
        isOpen={showHistoryModal}
        onClose={() => {
          setShowHistoryModal(false);
          setSelectedPlatform(null);
        }}
        platform={selectedPlatform}
      />

      {/* ✅ M34: Modal de gráfico de evolución */}
      {showEvolutionChart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-bold text-white">
                    {selectedPlatform ? `Evolución de ${selectedPlatform.name}` : 'Evolución del Portafolio'}
                  </h3>
                  <p className="text-purple-100 text-sm mt-1">
                    {selectedPlatform 
                      ? `${selectedPlatform.balanceHistory?.length || 0} registros`
                      : `${activePlatforms.length} plataformas activas`
                    }
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowEvolutionChart(false);
                    setSelectedPlatform(null);
                  }}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
                >
                  <i className="fas fa-times text-2xl"></i>
                </button>
              </div>
            </div>
            <div className="p-6">
              <PortfolioEvolutionChart
                platforms={selectedPlatform ? [selectedPlatform] : activePlatforms}
                displayCurrency={displayCurrency}
                convertCurrency={convertCurrency}
                showTotal={!selectedPlatform}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}