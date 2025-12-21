import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import SavingsGoalForm from '../../components/forms/SavingsGoalForm'

export default function SavingsView() {
  const { 
    savingsGoals, 
    registerSavingsContribution, 
    deleteSavingsGoal,
    displayCurrency,
    convertCurrency 
  } = useApp()
  
  const [showAddGoal, setShowAddGoal] = useState(false)
  const [editingGoal, setEditingGoal] = useState(null)

  // Calcular totales
  const totalTarget = savingsGoals.reduce((sum, goal) => 
    sum + convertCurrency(goal.targetAmount, goal.currency, displayCurrency), 0
  )
  
  const totalSaved = savingsGoals.reduce((sum, goal) => 
    sum + convertCurrency(goal.currentAmount, goal.currency, displayCurrency), 0
  )

  const handleContribution = (goalId) => {
    const input = document.getElementById(`contribution-${goalId}`)
    const amount = parseFloat(input.value)
    
    if (isNaN(amount) || amount <= 0) {
      alert('Ingresa un monto válido mayor a 0')
      return
    }
    
    registerSavingsContribution(goalId, amount)
    input.value = ''
  }

  const handleDeleteGoal = (goal) => {
    const confirmDelete = window.confirm(
      `¿Estás seguro de eliminar "${goal.name}"?\n\n` +
      `Meta: ${goal.targetAmount} ${goal.currency}\n` +
      `Ahorrado: ${goal.currentAmount} ${goal.currency}\n\n` +
      `Esta acción no se puede deshacer.`
    )
    
    if (confirmDelete) {
      deleteSavingsGoal(goal.id)
    }
  }

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
            {savingsGoals.length} objetivo{savingsGoals.length !== 1 ? 's' : ''} activo{savingsGoals.length !== 1 ? 's' : ''}
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Meta Total</p>
              <p className="text-3xl font-bold text-gray-800">
                {totalTarget.toFixed(0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">{displayCurrency}</p>
            </div>
            <div className="bg-green-100 p-4 rounded-full">
              <i className="fas fa-bullseye text-2xl text-green-600"></i>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Ahorrado Total</p>
              <p className="text-3xl font-bold text-gray-800">
                {totalSaved.toFixed(0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">{displayCurrency}</p>
            </div>
            <div className="bg-blue-100 p-4 rounded-full">
              <i className="fas fa-coins text-2xl text-blue-600"></i>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Progreso General</p>
              <p className="text-3xl font-bold text-gray-800">
                {totalTarget > 0 ? ((totalSaved / totalTarget) * 100).toFixed(1) : 0}%
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Faltan {Math.max(0, totalTarget - totalSaved).toFixed(0)} {displayCurrency}
              </p>
            </div>
            <div className="bg-purple-100 p-4 rounded-full">
              <i className="fas fa-chart-line text-2xl text-purple-600"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Objetivos */}
      {savingsGoals.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <div className="flex flex-col items-center">
            <div className="bg-green-100 p-8 rounded-full mb-6">
              <i className="fas fa-piggy-bank text-6xl text-green-600"></i>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              No tienes objetivos de ahorro
            </h3>
            <p className="text-gray-600 mb-6 max-w-md">
              Crea tu primer objetivo de ahorro para empezar a construir tu futuro financiero
            </p>
            <button
              onClick={() => setShowAddGoal(true)}
              className="bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-3 rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-lg font-medium"
            >
              <i className="fas fa-plus mr-2"></i>
              Crear Primer Objetivo
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {savingsGoals.map(goal => {
            const percentage = (goal.currentAmount / goal.targetAmount) * 100
            const remaining = goal.targetAmount - goal.currentAmount
            const daysUntilDeadline = Math.ceil(
              (new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24)
            )
            
            const priorityConfig = {
              'Alta': { color: 'red', icon: '🔴', bgColor: 'bg-red-50', borderColor: 'border-red-200' },
              'Media': { color: 'yellow', icon: '🟡', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' },
              'Baja': { color: 'green', icon: '🟢', bgColor: 'bg-green-50', borderColor: 'border-green-200' }
            }
            const config = priorityConfig[goal.priority] || priorityConfig['Media']

            return (
              <div key={goal.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                {/* Header con color según prioridad */}
                <div className={`bg-gradient-to-r from-green-500 to-green-600 p-6 text-white relative`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold mb-2 flex items-center">
                        <span className="mr-2">{config.icon}</span>
                        {goal.name}
                      </h3>
                      <p className="text-green-100 text-sm">
                        {goal.description || 'Sin descripción'}
                      </p>
                    </div>
                    
                    {/* Botones de acción */}
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => setEditingGoal(goal)}
                        className="bg-white bg-opacity-20 hover:bg-opacity-30 p-2 rounded-lg transition-colors"
                        title="Editar objetivo"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        onClick={() => handleDeleteGoal(goal)}
                        className="bg-white bg-opacity-20 hover:bg-opacity-30 hover:bg-red-500 p-2 rounded-lg transition-colors"
                        title="Eliminar objetivo"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>

                  {/* Badge de prioridad */}
                  <div className="absolute top-4 right-16 bg-white bg-opacity-20 px-3 py-1 rounded-full text-xs font-medium">
                    Prioridad: {goal.priority}
                  </div>
                </div>

                {/* Contenido */}
                <div className="p-6">
                  {/* Estadísticas */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Meta</p>
                      <p className="text-xl font-bold text-gray-800">
                        {goal.targetAmount.toFixed(0)} {goal.currency}
                      </p>
                      {goal.currency !== displayCurrency && (
                        <p className="text-xs text-gray-500">
                          ≈ {convertCurrency(goal.targetAmount, goal.currency, displayCurrency).toFixed(0)} {displayCurrency}
                        </p>
                      )}
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Ahorrado</p>
                      <p className="text-xl font-bold text-green-600">
                        {goal.currentAmount.toFixed(0)} {goal.currency}
                      </p>
                      {goal.currency !== displayCurrency && (
                        <p className="text-xs text-gray-500">
                          ≈ {convertCurrency(goal.currentAmount, goal.currency, displayCurrency).toFixed(0)} {displayCurrency}
                        </p>
                      )}
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Falta</p>
                      <p className="text-xl font-bold text-orange-600">
                        {remaining.toFixed(0)} {goal.currency}
                      </p>
                      {goal.currency !== displayCurrency && (
                        <p className="text-xs text-gray-500">
                          ≈ {convertCurrency(remaining, goal.currency, displayCurrency).toFixed(0)} {displayCurrency}
                        </p>
                      )}
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Días restantes</p>
                      <p className={`text-xl font-bold ${daysUntilDeadline < 30 ? 'text-red-600' : 'text-gray-800'}`}>
                        {daysUntilDeadline > 0 ? daysUntilDeadline : 0}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(goal.deadline).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                  </div>

                  {/* Barra de progreso */}
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Progreso
                      </span>
                      <span className={`text-sm font-bold ${
                        percentage >= 100 ? 'text-green-600' :
                        percentage >= 75 ? 'text-blue-600' :
                        percentage >= 50 ? 'text-yellow-600' :
                        'text-orange-600'
                      }`}>
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
                      <div
                        className={`h-6 rounded-full transition-all duration-500 ${
                          percentage >= 100 ? 'bg-gradient-to-r from-green-400 to-green-600' :
                          percentage >= 75 ? 'bg-gradient-to-r from-blue-400 to-blue-600' :
                          percentage >= 50 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                          'bg-gradient-to-r from-orange-400 to-orange-600'
                        }`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      >
                        <div className="h-full flex items-center justify-center text-white text-xs font-bold">
                          {percentage >= 10 && `${percentage.toFixed(0)}%`}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Historial de aportes */}
                  {goal.contributionHistory && goal.contributionHistory.length > 0 && (
                    <div className="mb-6">
                      <details className="group">
                        <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-green-600 transition-colors flex items-center justify-between">
                          <span>
                            <i className="fas fa-history mr-2"></i>
                            Historial de Aportes ({goal.contributionHistory.length})
                          </span>
                          <i className="fas fa-chevron-down group-open:rotate-180 transition-transform"></i>
                        </summary>
                        <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
                          {goal.contributionHistory.slice().reverse().slice(0, 5).map((contrib, idx) => (
                            <div key={contrib.id} className="bg-gray-50 p-3 rounded-lg flex justify-between items-center text-sm">
                              <div>
                                <p className="font-medium text-gray-800">
                                  +{contrib.amount.toFixed(2)} {goal.currency}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {new Date(contrib.date).toLocaleDateString('es-ES', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric'
                                  })} • {contrib.user}
                                </p>
                              </div>
                              <div className="text-xs text-gray-600">
                                Balance: {contrib.balanceAfter.toFixed(0)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </details>
                    </div>
                  )}

                  {/* Formulario de aporte */}
                  {percentage < 100 && (
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Monto a aportar"
                        id={`contribution-${goal.id}`}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                      <button
                        onClick={() => handleContribution(goal.id)}
                        className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-md font-medium"
                      >
                        <i className="fas fa-plus mr-2"></i>
                        Aportar
                      </button>
                    </div>
                  )}

                  {/* Mensaje objetivo cumplido */}
                  {percentage >= 100 && (
                    <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 text-center">
                      <i className="fas fa-check-circle text-3xl text-green-600 mb-2"></i>
                      <p className="font-bold text-green-800">
                        ¡Objetivo Cumplido! 🎉
                      </p>
                      <p className="text-sm text-green-700 mt-1">
                        Has alcanzado tu meta de ahorro
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modales */}
      {showAddGoal && (
        <SavingsGoalForm
          onClose={() => setShowAddGoal(false)}
        />
      )}

      {editingGoal && (
        <SavingsGoalForm
          goal={editingGoal}
          onClose={() => setEditingGoal(null)}
        />
      )}
    </div>
  )
}