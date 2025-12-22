import { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext'

export default function SavingsGoalForm({ onClose, goal = null }) {
  const { 
    addSavingsGoal, 
    updateSavingsGoal,
    investments,
    convertCurrency
  } = useApp()
  
  const [formData, setFormData] = useState({
    name: goal?.name || '',
    description: goal?.description || '',
    targetAmount: goal?.targetAmount || '',
    currentAmount: goal?.currentAmount || '',
    currency: goal?.currency || 'EUR',
    deadline: goal?.deadline || '',
    priority: goal?.priority || 'Media',
    isEmergencyFund: goal?.isEmergencyFund || false, // ✅ M32: Flag fondo emergencia
    linkedPlatformId: goal?.linkedPlatformId || null, // Mantener para backward compatibility
    linkedPlatforms: goal?.linkedPlatforms || [] // ✅ M32: Múltiples plataformas
  })

  // ✅ M32: Reset form cuando cambia goal
  useEffect(() => {
    if (goal) {
      setFormData({
        name: goal.name || '',
        description: goal.description || '',
        targetAmount: goal.targetAmount || '',
        currentAmount: goal.currentAmount || '',
        currency: goal.currency || 'EUR',
        deadline: goal.deadline || '',
        priority: goal.priority || 'Media',
        isEmergencyFund: goal.isEmergencyFund || goal.name?.toLowerCase().includes('emergencia') || false,
        linkedPlatformId: goal.linkedPlatformId || null,
        linkedPlatforms: goal.linkedPlatforms || (goal.linkedPlatformId ? [goal.linkedPlatformId] : [])
      })
    }
  }, [goal])

  // Filtrar solo plataformas
  const availablePlatforms = investments.filter(inv => inv.currentBalance !== undefined)

  // ✅ M32: Calcular saldo total de plataformas vinculadas
  const calculateLinkedBalance = () => {
    if (!formData.linkedPlatforms || formData.linkedPlatforms.length === 0) {
      // Fallback a linkedPlatformId singular
      if (formData.linkedPlatformId) {
        const platform = investments.find(inv => inv.id === formData.linkedPlatformId)
        if (platform) {
          return convertCurrency(platform.currentBalance, platform.currency, formData.currency)
        }
      }
      return 0
    }
    
    return formData.linkedPlatforms.reduce((sum, platformId) => {
      const platform = investments.find(inv => inv.id === platformId)
      if (platform) {
        return sum + convertCurrency(platform.currentBalance, platform.currency, formData.currency)
      }
      return sum
    }, 0)
  }

  // ✅ M32: Toggle plataforma en array
  const togglePlatform = (platformId) => {
    setFormData(prev => {
      const current = prev.linkedPlatforms || []
      const isLinked = current.includes(platformId)
      
      const newLinkedPlatforms = isLinked
        ? current.filter(id => id !== platformId)
        : [...current, platformId]
      
      return {
        ...prev,
        linkedPlatforms: newLinkedPlatforms,
        // Mantener linkedPlatformId para backward compatibility
        linkedPlatformId: newLinkedPlatforms[0] || null
      }
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
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

    const linkedBalance = calculateLinkedBalance()
    const hasLinkedPlatforms = formData.linkedPlatforms.length > 0 || formData.linkedPlatformId
    
    const savingsGoalData = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      targetAmount: parseFloat(formData.targetAmount),
      currentAmount: hasLinkedPlatforms ? linkedBalance : (parseFloat(formData.currentAmount) || 0),
      currency: formData.currency,
      deadline: formData.deadline,
      priority: formData.priority,
      isEmergencyFund: formData.isEmergencyFund, // ✅ M32
      linkedPlatformId: formData.linkedPlatforms[0] || formData.linkedPlatformId || null, // Backward compat
      linkedPlatforms: formData.linkedPlatforms // ✅ M32: Array
    }
    
    if (goal) {
      updateSavingsGoal(goal.id, savingsGoalData)
    } else {
      addSavingsGoal(savingsGoalData)
    }
    
    onClose()
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const linkedBalance = calculateLinkedBalance()
  const hasLinkedPlatforms = formData.linkedPlatforms.length > 0 || formData.linkedPlatformId

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

          {/* ✅ M32: Checkbox Fondo de Emergencia */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isEmergencyFund}
                onChange={(e) => handleChange('isEmergencyFund', e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded mt-0.5"
              />
              <div>
                <span className="font-medium text-gray-800 flex items-center gap-2">
                  🛡️ Este es mi Fondo de Emergencia
                </span>
                <p className="text-xs text-gray-600 mt-1">
                  Se usará para calcular los "Meses cubiertos" en tu Índice de Tranquilidad Financiera.
                  Se recomienda tener 6 meses de gastos.
                </p>
              </div>
            </label>
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

          {/* ✅ M32: Vinculación a MÚLTIPLES Plataformas */}
          {availablePlatforms.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <i className="fas fa-link mr-2 text-purple-600"></i>
                Vincular a Plataformas de Inversión (Opcional)
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Selecciona una o más plataformas. El saldo se sumará automáticamente.
              </p>
              
              <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-2">
                {availablePlatforms.map(platform => {
                  const isLinked = formData.linkedPlatforms.includes(platform.id) || 
                                   formData.linkedPlatformId === platform.id
                  return (
                    <div
                      key={platform.id}
                      onClick={() => togglePlatform(platform.id)}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        isLinked
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isLinked}
                            onChange={() => {}}
                            className="w-4 h-4 text-purple-600 rounded"
                          />
                          <div>
                            <p className="font-medium text-gray-800 text-sm">{platform.name}</p>
                            <p className="text-xs text-gray-500">
                              {platform.currentBalance?.toLocaleString()} {platform.currency}
                            </p>
                          </div>
                        </div>
                        {isLinked && (
                          <i className="fas fa-check-circle text-purple-600"></i>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {hasLinkedPlatforms && (
                <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <p className="text-sm text-purple-800">
                    <i className="fas fa-calculator mr-2"></i>
                    Saldo vinculado: <strong>{linkedBalance.toLocaleString()} {formData.currency}</strong>
                  </p>
                </div>
              )}
            </div>
          )}

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
                {hasLinkedPlatforms ? 'Saldo Vinculado' : (goal ? 'Ahorrado Actual' : 'Monto Inicial')}
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={hasLinkedPlatforms ? linkedBalance.toFixed(2) : (goal ? goal.currentAmount : formData.currentAmount)}
                onChange={(e) => !goal && !hasLinkedPlatforms && handleChange('currentAmount', e.target.value)}
                placeholder="0"
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  (goal || hasLinkedPlatforms) ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
                disabled={!!goal || hasLinkedPlatforms}
              />
              {hasLinkedPlatforms && (
                <p className="text-xs text-purple-600 mt-1">
                  <i className="fas fa-link mr-1"></i>
                  Calculado desde plataformas
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

          {/* Info adicional en edición */}
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
                  <span className="font-medium">Progreso:</span>
                  <span className="ml-2">
                    {((goal.currentAmount / goal.targetAmount) * 100).toFixed(1)}%
                  </span>
                </div>
                {goal.isEmergencyFund && (
                  <div className="col-span-2">
                    <span className="text-blue-700 font-medium">
                      🛡️ Fondo de Emergencia
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Advertencia si vinculado */}
          {hasLinkedPlatforms && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-start">
                <i className="fas fa-info-circle text-purple-600 mt-1 mr-2"></i>
                <div className="text-sm text-gray-700">
                  <p className="font-medium mb-1">Objetivo Vinculado</p>
                  <p>
                    El saldo se actualiza automáticamente desde las plataformas seleccionadas.
                  </p>
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