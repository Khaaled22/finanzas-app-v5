import { useState } from 'react'
import { useApp } from '../../context/AppContext'

export default function SavingsGoalForm({ onClose, goal = null }) {
  const { addSavingsGoal, updateSavingsGoal } = useApp()
  
  const [formData, setFormData] = useState({
    name: goal?.name || '',
    description: goal?.description || '',
    targetAmount: goal?.targetAmount || '',
    currentAmount: goal?.currentAmount || '',
    currency: goal?.currency || 'EUR',
    deadline: goal?.deadline || '',
    priority: goal?.priority || 'Media'
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Validaciones
    if (!formData.name.trim()) {
      alert('El nombre del objetivo es obligatorio')
      return
    }
    
    if (!formData.targetAmount || parseFloat(formData.targetAmount) <= 0) {
      alert('La meta debe ser mayor a 0')
      return
    }

    if (formData.currentAmount && parseFloat(formData.currentAmount) < 0) {
      alert('El monto actual no puede ser negativo')
      return
    }

    if (!formData.deadline) {
      alert('La fecha límite es obligatoria')
      return
    }
    
    const savingsGoalData = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      targetAmount: parseFloat(formData.targetAmount),
      currentAmount: parseFloat(formData.currentAmount) || 0,
      currency: formData.currency,
      deadline: formData.deadline,
      priority: formData.priority
    }
    
    if (goal) {
      // Modo edición - NO permitir cambiar currentAmount aquí
      // (se cambia con aportes)
      updateSavingsGoal(goal.id, {
        ...savingsGoalData,
        currentAmount: goal.currentAmount // Mantener el actual
      })
    } else {
      // Modo creación
      addSavingsGoal(savingsGoalData)
    }
    
    onClose()
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 rounded-t-2xl sticky top-0 z-10">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-2xl font-bold text-white">
                {goal ? 'Editar Objetivo de Ahorro' : 'Nuevo Objetivo de Ahorro'}
              </h3>
              <p className="text-green-100 text-sm mt-1">
                {goal ? 'Modifica los datos del objetivo' : 'Crea un nuevo objetivo de ahorro'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
              title="Cerrar"
            >
              <i className="fas fa-times text-2xl"></i>
            </button>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del Objetivo *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Ej: Vacaciones 2025, Fondo de Emergencia"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Ej: Viaje a Japón, 6 meses de gastos"
              rows="2"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Meta y Monto Actual */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meta (Objetivo) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.targetAmount}
                onChange={(e) => handleChange('targetAmount', e.target.value)}
                placeholder="15000"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {goal ? 'Ahorrado Actual (no editable)' : 'Monto Inicial (opcional)'}
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={goal ? goal.currentAmount : formData.currentAmount}
                onChange={(e) => !goal && handleChange('currentAmount', e.target.value)}
                placeholder="0"
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${goal ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                disabled={!!goal}
              />
              {goal && (
                <p className="text-xs text-gray-500 mt-1">
                  <i className="fas fa-info-circle mr-1"></i>
                  Cambia con aportes, no aquí
                </p>
              )}
            </div>
          </div>

          {/* Moneda y Prioridad */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Moneda *
              </label>
              <select
                value={formData.currency}
                onChange={(e) => handleChange('currency', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="EUR">EUR €</option>
                <option value="CLP">CLP $</option>
                <option value="USD">USD $</option>
                <option value="UF">UF</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prioridad *
              </label>
              <select
                value={formData.priority}
                onChange={(e) => handleChange('priority', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="Alta">🔴 Alta</option>
                <option value="Media">🟡 Media</option>
                <option value="Baja">🟢 Baja</option>
              </select>
            </div>
          </div>

          {/* Fecha Límite */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha Límite *
            </label>
            <input
              type="date"
              value={formData.deadline}
              onChange={(e) => handleChange('deadline', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>

          {/* Información Adicional */}
          {goal && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-800 mb-2 flex items-center">
                <i className="fas fa-info-circle mr-2"></i>
                Información del Objetivo
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
                <div>
                  <span className="font-medium">Creado:</span>
                  <span className="ml-2">{new Date(goal.id).toLocaleDateString('es-ES')}</span>
                </div>
                <div>
                  <span className="font-medium">Aportes:</span>
                  <span className="ml-2">{goal.contributionHistory?.length || 0}</span>
                </div>
                <div className="col-span-2">
                  <span className="font-medium">Progreso:</span>
                  <span className="ml-2">
                    {((goal.currentAmount / goal.targetAmount) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Botones */}
          <div className="flex space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all font-medium shadow-lg hover:shadow-xl"
            >
              <i className={`fas ${goal ? 'fa-save' : 'fa-plus'} mr-2`}></i>
              {goal ? 'Guardar Cambios' : 'Crear Objetivo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}