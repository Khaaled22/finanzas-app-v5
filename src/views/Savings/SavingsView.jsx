// src/views/Savings/SavingsView.jsx
// ✅ M33: Mejorado con filtros por prioridad y vista tabla/cards
import { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatNumber, formatPercent } from '../../utils/formatters';
import SavingsGoalForm from '../../components/forms/SavingsGoalForm';

// Prioridades con config
const PRIORITIES = [
  { id: 'Alta', icon: '🔴', color: 'red', bgLight: 'bg-red-50', borderColor: 'border-red-200' },
  { id: 'Media', icon: '🟡', color: 'yellow', bgLight: 'bg-yellow-50', borderColor: 'border-yellow-200' },
  { id: 'Baja', icon: '🟢', color: 'green', bgLight: 'bg-green-50', borderColor: 'border-green-200' }
];

export default function SavingsView() {
  const { 
    savingsGoals, 
    registerSavingsContribution, 
    deleteSavingsGoal,
    displayCurrency,
    convertCurrency,
    investments
  } = useApp();
  
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [filterPriority, setFilterPriority] = useState('all');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'
  const [showCompleted, setShowCompleted] = useState(false);

  // Filtrar objetivos
  const { activeGoals, completedGoals, filteredGoals } = useMemo(() => {
    const active = savingsGoals.filter(g => (g.currentAmount / g.targetAmount) < 1);
    const completed = savingsGoals.filter(g => (g.currentAmount / g.targetAmount) >= 1);
    
    let filtered = showCompleted ? completed : active;
    
    if (filterPriority !== 'all') {
      filtered = filtered.filter(g => g.priority === filterPriority);
    }
    
    // Ordenar por prioridad y luego por progreso
    const priorityOrder = { 'Alta': 0, 'Media': 1, 'Baja': 2 };
    filtered.sort((a, b) => {
      const priorityDiff = (priorityOrder[a.priority] || 1) - (priorityOrder[b.priority] || 1);
      if (priorityDiff !== 0) return priorityDiff;
      return (b.currentAmount / b.targetAmount) - (a.currentAmount / a.targetAmount);
    });
    
    return { activeGoals: active, completedGoals: completed, filteredGoals: filtered };
  }, [savingsGoals, filterPriority, showCompleted]);

  // Calcular totales
  const totals = useMemo(() => {
    const totalTarget = activeGoals.reduce((sum, goal) => 
      sum + convertCurrency(goal.targetAmount, goal.currency, displayCurrency), 0
    );
    
    const totalSaved = activeGoals.reduce((sum, goal) => 
      sum + convertCurrency(goal.currentAmount, goal.currency, displayCurrency), 0
    );
    
    const totalRemaining = totalTarget - totalSaved;
    const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;
    
    return { totalTarget, totalSaved, totalRemaining, overallProgress };
  }, [activeGoals, displayCurrency, convertCurrency]);

  // Obtener info de plataforma vinculada
  const getLinkedPlatformInfo = (linkedPlatformId) => {
    if (!linkedPlatformId) return null;
    return investments.find(inv => inv.id === linkedPlatformId);
  };

  const getPriorityInfo = (priority) => PRIORITIES.find(p => p.id === priority) || PRIORITIES[1];

  const handleContribution = (goalId) => {
    const input = document.getElementById(`contribution-${goalId}`);
    const amount = parseFloat(input.value);
    
    if (isNaN(amount) || amount <= 0) {
      alert('Ingresa un monto válido mayor a 0');
      return;
    }
    
    registerSavingsContribution(goalId, amount);
    input.value = '';
  };

  const handleDeleteGoal = (goal) => {
    if (window.confirm(
      `¿Estás seguro de eliminar "${goal.name}"?\n\n` +
      `Meta: ${formatNumber(goal.targetAmount)} ${goal.currency}\n` +
      `Ahorrado: ${formatNumber(goal.currentAmount)} ${goal.currency}\n\n` +
      `Esta acción no se puede deshacer.`
    )) {
      deleteSavingsGoal(goal.id);
    }
  };

  const calculateDaysRemaining = (deadline) => {
    return Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 flex items-center">
            <i className="fas fa-piggy-bank mr-3 text-green-600"></i>
            Objetivos de Ahorro
          </h2>
          <p className="text-gray-600 mt-1">
            {activeGoals.length} objetivo{activeGoals.length !== 1 ? 's' : ''} activo{activeGoals.length !== 1 ? 's' : ''}
            {completedGoals.length > 0 && (
              <span className="text-green-600 ml-2">
                • {completedGoals.length} completado{completedGoals.length !== 1 ? 's' : ''} 🎉
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => setShowAddGoal(true)}
          className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-lg hover:shadow-xl font-medium"
        >
          <i className="fas fa-plus mr-2"></i>
          Nuevo Objetivo
        </button>
      </div>

      {/* Métricas Totales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-md border-l-4 border-green-500">
          <p className="text-sm text-gray-600 mb-1">Meta Total</p>
          <p className="text-2xl font-bold text-gray-800">{formatNumber(totals.totalTarget)}</p>
          <p className="text-xs text-gray-500">{displayCurrency}</p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-md border-l-4 border-blue-500">
          <p className="text-sm text-gray-600 mb-1">Ahorrado</p>
          <p className="text-2xl font-bold text-blue-600">{formatNumber(totals.totalSaved)}</p>
          <p className="text-xs text-gray-500">{displayCurrency}</p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-md border-l-4 border-orange-500">
          <p className="text-sm text-gray-600 mb-1">Faltante</p>
          <p className="text-2xl font-bold text-orange-600">{formatNumber(totals.totalRemaining)}</p>
          <p className="text-xs text-gray-500">{displayCurrency}</p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-md border-l-4 border-purple-500">
          <p className="text-sm text-gray-600 mb-1">Progreso General</p>
          <p className="text-2xl font-bold text-purple-600">{formatPercent(totals.overallProgress)}</p>
          <p className="text-xs text-gray-500">{activeGoals.length} objetivos activos</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-xl shadow-md">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterPriority('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterPriority === 'all'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Todas
            </button>
            {PRIORITIES.map(priority => (
              <button
                key={priority.id}
                onClick={() => setFilterPriority(priority.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterPriority === priority.id
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {priority.icon} {priority.id}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={showCompleted}
                onChange={(e) => setShowCompleted(e.target.checked)}
                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              Ver completados
            </label>
            
            <div className="flex border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-2 ${viewMode === 'cards' ? 'bg-green-100 text-green-600' : 'text-gray-500'}`}
              >
                <i className="fas fa-th-large"></i>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-2 ${viewMode === 'table' ? 'bg-green-100 text-green-600' : 'text-gray-500'}`}
              >
                <i className="fas fa-list"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Objetivos */}
      {filteredGoals.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <div className="flex flex-col items-center">
            <div className="bg-green-100 p-8 rounded-full mb-6">
              <i className={`fas ${showCompleted ? 'fa-check-circle' : 'fa-piggy-bank'} text-6xl text-green-600`}></i>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              {showCompleted ? 'No hay objetivos completados' : 'No tienes objetivos de ahorro'}
            </h3>
            <p className="text-gray-600 mb-6 max-w-md">
              {showCompleted 
                ? 'Los objetivos completados aparecerán aquí'
                : 'Crea tu primer objetivo de ahorro para empezar a construir tu futuro financiero'
              }
            </p>
            {!showCompleted && (
              <button
                onClick={() => setShowAddGoal(true)}
                className="bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-3 rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-lg font-medium"
              >
                <i className="fas fa-plus mr-2"></i>
                Crear Primer Objetivo
              </button>
            )}
          </div>
        </div>
      ) : viewMode === 'table' ? (
        // Vista de tabla
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Objetivo</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Prioridad</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Meta</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Ahorrado</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Falta</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Progreso</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Días</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredGoals.map(goal => {
                  const percentage = (goal.currentAmount / goal.targetAmount) * 100;
                  const remaining = goal.targetAmount - goal.currentAmount;
                  const daysRemaining = calculateDaysRemaining(goal.deadline);
                  const priorityInfo = getPriorityInfo(goal.priority);
                  const isLinked = !!goal.linkedPlatformId;
                  
                  return (
                    <tr key={goal.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{goal.icon || '🎯'}</span>
                          <div>
                            <p className="font-medium text-gray-800">{goal.name}</p>
                            {isLinked && (
                              <p className="text-xs text-purple-600">
                                <i className="fas fa-link mr-1"></i>
                                Vinculado
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${priorityInfo.bgLight}`}>
                          {priorityInfo.icon} {goal.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="font-medium">{formatNumber(goal.targetAmount)} {goal.currency}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="font-medium text-green-600">{formatNumber(goal.currentAmount)} {goal.currency}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="font-medium text-orange-600">{formatNumber(remaining)} {goal.currency}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          percentage >= 100 ? 'bg-green-100 text-green-800' :
                          percentage >= 75 ? 'bg-blue-100 text-blue-800' :
                          percentage >= 50 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                          {percentage.toFixed(0)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-sm ${daysRemaining < 30 ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                          {daysRemaining > 0 ? daysRemaining : 0}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setEditingGoal(goal)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Editar"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            onClick={() => handleDeleteGoal(goal)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Eliminar"
                          >
                            <i className="fas fa-trash"></i>
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
      ) : (
        // Vista de cards
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredGoals.map(goal => {
            const percentage = (goal.currentAmount / goal.targetAmount) * 100;
            const remaining = goal.targetAmount - goal.currentAmount;
            const daysRemaining = calculateDaysRemaining(goal.deadline);
            const priorityInfo = getPriorityInfo(goal.priority);
            const linkedPlatform = getLinkedPlatformInfo(goal.linkedPlatformId);
            const isLinked = !!linkedPlatform;

            return (
              <div key={goal.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                {/* Header con color según prioridad */}
                <div className={`p-4 ${
                  goal.priority === 'Alta' ? 'bg-gradient-to-r from-red-500 to-red-600' :
                  goal.priority === 'Baja' ? 'bg-gradient-to-r from-green-500 to-green-600' :
                  'bg-gradient-to-r from-yellow-500 to-yellow-600'
                } text-white`}>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-3">
                      <span className="text-3xl">{goal.icon || '🎯'}</span>
                      <div>
                        <h3 className="text-xl font-bold">{goal.name}</h3>
                        <p className="text-sm opacity-90">
                          {priorityInfo.icon} Prioridad {goal.priority}
                          {isLinked && <span className="ml-2">• 🔗 Vinculado</span>}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditingGoal(goal)}
                        className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-all"
                        title="Editar"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        onClick={() => handleDeleteGoal(goal)}
                        className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-all"
                        title="Eliminar"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {/* Métricas */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-gray-50 p-3 rounded-lg text-center">
                      <p className="text-xs text-gray-600 mb-1">Meta</p>
                      <p className="text-lg font-bold text-gray-800">
                        {formatNumber(goal.targetAmount)}
                      </p>
                      <p className="text-xs text-gray-500">{goal.currency}</p>
                    </div>

                    <div className="bg-green-50 p-3 rounded-lg text-center">
                      <p className="text-xs text-gray-600 mb-1">Ahorrado</p>
                      <p className="text-lg font-bold text-green-600">
                        {formatNumber(goal.currentAmount)}
                      </p>
                      <p className="text-xs text-gray-500">{goal.currency}</p>
                    </div>

                    <div className="bg-orange-50 p-3 rounded-lg text-center">
                      <p className="text-xs text-gray-600 mb-1">Falta</p>
                      <p className="text-lg font-bold text-orange-600">
                        {formatNumber(remaining)}
                      </p>
                      <p className="text-xs text-gray-500">{goal.currency}</p>
                    </div>
                  </div>

                  {/* Días restantes */}
                  <div className="flex justify-between items-center mb-4 text-sm">
                    <span className="text-gray-600">
                      <i className="fas fa-calendar mr-1"></i>
                      {new Date(goal.deadline).toLocaleDateString('es-ES')}
                    </span>
                    <span className={`font-medium ${daysRemaining < 30 ? 'text-red-600' : 'text-gray-800'}`}>
                      {daysRemaining > 0 ? `${daysRemaining} días restantes` : 'Vencido'}
                    </span>
                  </div>

                  {/* Barra de progreso */}
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Progreso</span>
                      <span className={`text-sm font-bold ${
                        percentage >= 100 ? 'text-green-600' :
                        percentage >= 75 ? 'text-blue-600' :
                        percentage >= 50 ? 'text-yellow-600' :
                        'text-orange-600'
                      }`}>
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                      <div
                        className={`h-4 rounded-full transition-all duration-500 ${
                          percentage >= 100 ? 'bg-gradient-to-r from-green-400 to-green-600' :
                          percentage >= 75 ? 'bg-gradient-to-r from-blue-400 to-blue-600' :
                          percentage >= 50 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                          'bg-gradient-to-r from-orange-400 to-orange-600'
                        }`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      >
                        {percentage >= 15 && (
                          <span className="text-white text-xs font-bold flex items-center justify-center h-full">
                            {percentage.toFixed(0)}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Info vinculación */}
                  {isLinked && linkedPlatform && (
                    <div className="mb-4 bg-purple-50 border border-purple-200 rounded-lg p-3">
                      <p className="text-sm text-purple-800">
                        <i className="fas fa-link mr-2"></i>
                        Vinculado a <strong>{linkedPlatform.name}</strong>
                      </p>
                      <p className="text-xs text-purple-600 mt-1">
                        El saldo se actualiza automáticamente
                      </p>
                    </div>
                  )}

                  {/* Formulario de aporte (solo si NO está vinculado y NO cumplido) */}
                  {!isLinked && percentage < 100 && (
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Monto a aportar"
                        id={`contribution-${goal.id}`}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                      <button
                        onClick={() => handleContribution(goal.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-medium"
                      >
                        <i className="fas fa-plus mr-1"></i>
                        Aportar
                      </button>
                    </div>
                  )}

                  {/* Mensaje objetivo cumplido */}
                  {percentage >= 100 && (
                    <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 text-center">
                      <i className="fas fa-check-circle text-3xl text-green-600 mb-2"></i>
                      <p className="font-bold text-green-800">¡Objetivo Cumplido! 🎉</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modales */}
      {showAddGoal && (
        <SavingsGoalForm onClose={() => setShowAddGoal(false)} />
      )}

      {editingGoal && (
        <SavingsGoalForm
          goal={editingGoal}
          onClose={() => setEditingGoal(null)}
        />
      )}
    </div>
  );
}