// src/views/Settings/components/CategoryModal.jsx
// ✅ M20: CORREGIDO - Aclara que budget es plantilla base
import React, { useState, useEffect } from 'react';

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
    '💳 Loans',
    '❓ Other Expenses',
    '💰 Savings & Investments'
  ];

  const MONEDAS = ['EUR', 'CLP', 'USD', 'UF'];
  const TIPOS = [
    { value: 'income', label: 'Ingreso (Income)' },
    { value: 'expense', label: 'Gasto (Expense)' },
    { value: 'savings', label: 'Ahorro (Savings)' },
    { value: 'investment', label: 'Inversión (Investment)' }
  ];

  // Estado del formulario
  const [formData, setFormData] = useState({
    name: '',
    group: GRUPOS[0],
    budget: 0,
    currency: 'EUR',
    icon: '📁',
    type: 'expense'
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cargar datos si es edición
  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        group: category.group || GRUPOS[0],
        budget: category.budget || 0,
        currency: category.currency || 'EUR',
        icon: category.icon || '📁',
        type: category.type || 'expense'
      });
    } else {
      // Reset si es nuevo
      setFormData({
        name: '',
        group: GRUPOS[0],
        budget: 0,
        currency: 'EUR',
        icon: '📁',
        type: 'expense'
      });
    }
    setErrors({});
  }, [category, isOpen]);

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
        budget: parseFloat(formData.budget) || 0
      };

      // Si es edición, incluir ID y spent
      if (category) {
        categoryData.id = category.id;
        categoryData.spent = category.spent || 0; // Mantener spent existente
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
      type: 'expense'
    });
    setErrors({});
    onClose(null);
  };

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

          {/* Grid: Ícono y Tipo */}
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
              <p className="text-gray-500 text-xs mt-1">
                Un emoji que represente la categoría
              </p>
            </div>

            {/* Tipo */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tipo de categoría
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
            </div>
          </div>

          {/* ✅ M20: Info sobre presupuesto base vs mensual */}
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
              <li>
                <strong>No afecta meses existentes:</strong> Cambiar este valor NO modifica 
                los presupuestos que ya están asignados en otros meses.
              </li>
            </ul>
          </div>

          {/* Info sobre tipos */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p className="text-sm text-purple-800">
              <i className="fas fa-tag mr-2"></i>
              <strong>Tipos de categoría:</strong>
            </p>
            <ul className="text-xs text-purple-700 mt-2 space-y-1 ml-6">
              <li><strong>Income:</strong> Ingresos (salarios, bonos, etc.)</li>
              <li><strong>Expense:</strong> Gastos normales (comida, transporte, etc.)</li>
              <li><strong>Savings:</strong> Ahorros líquidos (fondo emergencia, etc.)</li>
              <li><strong>Investment:</strong> Inversiones (Fintual, Trade Republic, etc.)</li>
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