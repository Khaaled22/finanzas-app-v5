// src/views/Settings/components/CategoryModal.jsx
// ✅ M36: Agregado selector de flowKind con auto-inferencia
import React, { useState, useEffect } from 'react';

// ✅ M36: Constantes de FlowKind
const FLOW_KINDS = [
  { value: 'INCOME', label: '💰 Ingreso', description: 'Salarios, bonos, ingresos extras', color: 'green' },
  { value: 'OPERATING_EXPENSE', label: '🛒 Gasto Operativo', description: 'Gastos del día a día', color: 'red' },
  { value: 'DEBT_PAYMENT', label: '💳 Pago de Deuda', description: 'Hipoteca, préstamos, CAE', color: 'orange' },
  { value: 'INVESTMENT_CONTRIBUTION', label: '📈 Aporte a Inversión', description: 'Aportes a plataformas de inversión', color: 'purple' }
];

export default function CategoryModal({ isOpen, onClose, category = null, existingCategories = [] }) {
  // Grupos disponibles
  const GRUPOS = [
    '💼 Income',
    '💳 Loans & Debts',
    '🏠 Housing & Utilities',
    '🩺 Insurance & Health',
    '🍽️ Food & Drinks',
    '🚗 Transport',
    '🎬 Entertainment',
    '📱 Subscriptions & Apps',
    '🛍️ Personal Shopping',
    '🎁 Gifts & Donations',
    '✈️ Travel',
    '❓ Other Expenses',
    '💰 Savings & Investments'
  ];

  const MONEDAS = ['EUR', 'CLP', 'USD', 'UF'];
  
  // ✅ M36: Tipos legacy (para compatibilidad)
  const TIPOS = [
    { value: 'income', label: 'Ingreso', flowKind: 'INCOME' },
    { value: 'expense', label: 'Gasto', flowKind: 'OPERATING_EXPENSE' },
    { value: 'investment', label: 'Inversión', flowKind: 'INVESTMENT_CONTRIBUTION' }
  ];

  // Estado del formulario
  const [formData, setFormData] = useState({
    name: '',
    group: GRUPOS[0],
    budget: 0,
    currency: 'EUR',
    icon: '📁',
    type: 'expense',
    flowKind: 'OPERATING_EXPENSE' // ✅ M36: Nuevo campo
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFlowKindHelp, setShowFlowKindHelp] = useState(false);

  // ✅ M36: Inferir flowKind desde type y group
  const inferFlowKind = (type, group, name) => {
    if (type === 'income') return 'INCOME';
    if (type === 'investment') return 'INVESTMENT_CONTRIBUTION';
    
    // Inferir de group/name para deudas
    const groupLower = (group || '').toLowerCase();
    const nameLower = (name || '').toLowerCase();
    
    if (groupLower.includes('debt') || groupLower.includes('loan') || 
        groupLower.includes('deuda') || groupLower.includes('préstamo') ||
        nameLower.includes('hipoteca') || nameLower.includes('mortgage') ||
        nameLower.includes('cae') || nameLower.includes('crédito')) {
      return 'DEBT_PAYMENT';
    }
    
    return 'OPERATING_EXPENSE';
  };

  // Cargar datos si es edición
  useEffect(() => {
    if (category) {
      // ✅ M36: Si no tiene flowKind, inferirlo
      const flowKind = category.flowKind || inferFlowKind(category.type, category.group, category.name);
      
      setFormData({
        name: category.name || '',
        group: category.group || GRUPOS[0],
        budget: category.budget || 0,
        currency: category.currency || 'EUR',
        icon: category.icon || '📁',
        type: category.type || 'expense',
        flowKind: flowKind
      });
    } else {
      // Reset si es nuevo
      setFormData({
        name: '',
        group: GRUPOS[0],
        budget: 0,
        currency: 'EUR',
        icon: '📁',
        type: 'expense',
        flowKind: 'OPERATING_EXPENSE'
      });
    }
    setErrors({});
  }, [category, isOpen]);

  // ✅ M36: Auto-actualizar flowKind cuando cambia type o group
  useEffect(() => {
    const inferred = inferFlowKind(formData.type, formData.group, formData.name);
    // Solo auto-actualizar si el usuario no ha cambiado manualmente
    if (!category || !category.flowKind) {
      setFormData(prev => ({ ...prev, flowKind: inferred }));
    }
  }, [formData.type, formData.group]);

  // Validar formulario
  const validate = () => {
    const newErrors = {};

    // Validar nombre
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    } else {
      // Verificar duplicados (excepto si es el mismo al editar)
      const duplicate = existingCategories.find(
        cat => cat.name.toLowerCase() === formData.name.trim().toLowerCase() &&
               (!category || cat.id !== category.id)
      );
      if (duplicate) {
        newErrors.name = 'Ya existe una categoría con este nombre';
      }
    }

    // Validar grupo
    if (!formData.group) {
      newErrors.group = 'Selecciona un grupo';
    }

    // Validar presupuesto
    if (formData.budget < 0) {
      newErrors.budget = 'El presupuesto no puede ser negativo';
    }

    // Validar icon
    if (!formData.icon.trim()) {
      newErrors.icon = 'El ícono es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar cambios en inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'budget' ? parseFloat(value) || 0 : value
    }));
    // Limpiar error del campo al escribir
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Manejar submit
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const categoryData = {
        ...formData,
        name: formData.name.trim(),
        budget: parseFloat(formData.budget) || 0,
        flowKind: formData.flowKind // ✅ M36: Incluir flowKind
      };

      // Si es edición, incluir ID y spent
      if (category) {
        categoryData.id = category.id;
        categoryData.spent = category.spent || 0;
      }

      // Llamar callback con los datos
      onClose(categoryData);
      
    } catch (error) {
      console.error('Error al guardar categoría:', error);
      setErrors({ submit: 'Error al guardar. Intenta nuevamente.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Manejar cierre
  const handleClose = () => {
    setFormData({
      name: '',
      group: GRUPOS[0],
      budget: 0,
      currency: 'EUR',
      icon: '📁',
      type: 'expense',
      flowKind: 'OPERATING_EXPENSE'
    });
    setErrors({});
    onClose(null);
  };

  // ✅ M36: Obtener info del flowKind actual
  const currentFlowKindInfo = FLOW_KINDS.find(fk => fk.value === formData.flowKind) || FLOW_KINDS[1];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 rounded-t-xl">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <i className={`fas ${category ? 'fa-edit' : 'fa-plus-circle'} mr-3`}></i>
              {category ? 'Editar Categoría' : 'Nueva Categoría'}
            </h2>
            <button
              onClick={handleClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <i className="fas fa-times text-2xl"></i>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error general */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <i className="fas fa-exclamation-circle mr-2"></i>
              {errors.submit}
            </div>
          )}

          {/* Nombre */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nombre de la categoría *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Ej: 💼 Khaled Salary"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.name 
                  ? 'border-red-300 focus:ring-red-500' 
                  : 'border-gray-300 focus:ring-purple-500'
              }`}
            />
            {errors.name && (
              <p className="text-red-600 text-sm mt-1">
                <i className="fas fa-exclamation-circle mr-1"></i>
                {errors.name}
              </p>
            )}
            <p className="text-gray-500 text-xs mt-1">
              Puedes incluir emojis directamente en el nombre
            </p>
          </div>

          {/* Grupo */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Grupo / Sección *
            </label>
            <select
              name="group"
              value={formData.group}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.group 
                  ? 'border-red-300 focus:ring-red-500' 
                  : 'border-gray-300 focus:ring-purple-500'
              }`}
            >
              {GRUPOS.map(grupo => (
                <option key={grupo} value={grupo}>{grupo}</option>
              ))}
            </select>
            {errors.group && (
              <p className="text-red-600 text-sm mt-1">
                <i className="fas fa-exclamation-circle mr-1"></i>
                {errors.group}
              </p>
            )}
          </div>

          {/* ✅ M36: Selector de FlowKind (NUEVO) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Tipo de Flujo (FlowKind) *
              <button
                type="button"
                onClick={() => setShowFlowKindHelp(!showFlowKindHelp)}
                className="ml-2 text-blue-500 hover:text-blue-700"
              >
                <i className="fas fa-question-circle"></i>
              </button>
            </label>
            
            <div className="grid grid-cols-2 gap-3">
              {FLOW_KINDS.map(fk => (
                <button
                  key={fk.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, flowKind: fk.value }))}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    formData.flowKind === fk.value
                      ? fk.value === 'INCOME' ? 'border-green-500 bg-green-50' :
                        fk.value === 'OPERATING_EXPENSE' ? 'border-red-500 bg-red-50' :
                        fk.value === 'DEBT_PAYMENT' ? 'border-orange-500 bg-orange-50' :
                        'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <p className="font-semibold text-sm">{fk.label}</p>
                  <p className="text-xs text-gray-500 mt-1">{fk.description}</p>
                </button>
              ))}
            </div>

            {/* Help expandible */}
            {showFlowKindHelp && (
              <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                <p className="font-semibold text-blue-800 mb-2">¿Qué es FlowKind?</p>
                <ul className="text-blue-700 space-y-1 text-xs">
                  <li><strong>💰 Ingreso:</strong> Dinero que entra (salarios, bonos, ventas)</li>
                  <li><strong>🛒 Gasto Operativo:</strong> Gastos del día a día que reducen tu disponible</li>
                  <li><strong>💳 Pago de Deuda:</strong> Pagos a préstamos/hipoteca (afecta tu disponible operativo)</li>
                  <li><strong>📈 Aporte a Inversión:</strong> Dinero que mueves a inversiones (no afecta disponible operativo)</li>
                </ul>
                <p className="text-blue-600 text-xs mt-2 italic">
                  El Dashboard usa FlowKind para calcular tu "Disponible Operativo" correctamente.
                </p>
              </div>
            )}
          </div>

          {/* Grid: Presupuesto y Moneda */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Presupuesto */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Presupuesto Base (Plantilla)
              </label>
              <input
                type="number"
                name="budget"
                value={formData.budget}
                onChange={handleChange}
                step="0.01"
                min="0"
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.budget 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-purple-500'
                }`}
              />
              {errors.budget && (
                <p className="text-red-600 text-sm mt-1">
                  <i className="fas fa-exclamation-circle mr-1"></i>
                  {errors.budget}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Se usará para inicializar nuevos meses sin historial
              </p>
            </div>

            {/* Moneda */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Moneda
              </label>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {MONEDAS.map(moneda => (
                  <option key={moneda} value={moneda}>{moneda}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Grid: Ícono y Tipo Legacy */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Ícono */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Ícono (emoji)
              </label>
              <input
                type="text"
                name="icon"
                value={formData.icon}
                onChange={handleChange}
                placeholder="📁"
                maxLength="5"
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.icon 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-purple-500'
                }`}
              />
              {errors.icon && (
                <p className="text-red-600 text-sm mt-1">
                  <i className="fas fa-exclamation-circle mr-1"></i>
                  {errors.icon}
                </p>
              )}
            </div>

            {/* Tipo (legacy - hidden pero mantenido para compatibilidad) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tipo (legacy)
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {TIPOS.map(tipo => (
                  <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">
                Mantenido para compatibilidad. FlowKind es el campo principal.
              </p>
            </div>
          </div>

          {/* Info sobre presupuesto base vs mensual */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg p-4">
            <p className="text-sm text-blue-900 font-semibold mb-2">
              <i className="fas fa-info-circle mr-2"></i>
              ℹ️ Sobre el Presupuesto Base:
            </p>
            <ul className="text-xs text-blue-800 space-y-1 ml-6">
              <li>
                <strong>Es una plantilla:</strong> Este valor se usa solo para inicializar 
                nuevos meses que no tienen historial previo.
              </li>
              <li>
                <strong>Herencia automática:</strong> Cuando cambias de mes, el presupuesto 
                se copia automáticamente del mes anterior.
              </li>
              <li>
                <strong>Presupuesto real por mes:</strong> El presupuesto que realmente usas 
                cada mes se gestiona en la vista de <strong>Presupuesto</strong>.
              </li>
            </ul>
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              <i className="fas fa-times mr-2"></i>
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-medium ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Guardando...
                </>
              ) : (
                <>
                  <i className={`fas ${category ? 'fa-save' : 'fa-plus'} mr-2`}></i>
                  {category ? 'Guardar Cambios' : 'Crear Categoría'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}