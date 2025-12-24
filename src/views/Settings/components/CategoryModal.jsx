// src/views/Settings/components/CategoryModal.jsx
// ✅ M35: Selector de emojis en dropdown + grupos sin emojis
import React, { useState, useEffect } from 'react';

// ✅ M35: Lista de emojis comunes para categorías
const EMOJI_OPTIONS = [
  // Income
  { emoji: '💼', label: 'Trabajo' },
  { emoji: '💰', label: 'Dinero' },
  { emoji: '💵', label: 'Efectivo' },
  { emoji: '💶', label: 'Euro' },
  // Housing
  { emoji: '🏠', label: 'Casa' },
  { emoji: '💡', label: 'Electricidad' },
  { emoji: '🚰', label: 'Agua' },
  { emoji: '🔥', label: 'Gas' },
  { emoji: '🌐', label: 'Internet' },
  { emoji: '📱', label: 'Teléfono' },
  { emoji: '📺', label: 'TV' },
  { emoji: '🏦', label: 'Banco' },
  { emoji: '🗂️', label: 'Admin' },
  // Health
  { emoji: '🩺', label: 'Salud' },
  { emoji: '👩‍⚕️', label: 'Doctor' },
  { emoji: '💊', label: 'Medicinas' },
  { emoji: '🥼', label: 'Suplementos' },
  { emoji: '🏋️', label: 'Gym' },
  { emoji: '💇', label: 'Belleza' },
  // Food
  { emoji: '🛒', label: 'Supermercado' },
  { emoji: '🍽️', label: 'Restaurante' },
  { emoji: '☕', label: 'Café' },
  { emoji: '🍻', label: 'Bar' },
  { emoji: '🍔', label: 'Fast Food' },
  { emoji: '🚚', label: 'Delivery' },
  { emoji: '🍿', label: 'Snacks' },
  // Transport
  { emoji: '🚆', label: 'Tren' },
  { emoji: '🚲', label: 'Bici' },
  { emoji: '🚌', label: 'Bus' },
  { emoji: '🔧', label: 'Mantención' },
  { emoji: '🚗', label: 'Auto' },
  // Entertainment
  { emoji: '🎨', label: 'Ocio' },
  { emoji: '🎬', label: 'Cine' },
  { emoji: '🎟️', label: 'Eventos' },
  { emoji: '🎉', label: 'Fiesta' },
  { emoji: '🍸', label: 'Cocktails' },
  // Subscriptions
  { emoji: '📺', label: 'Streaming' },
  { emoji: '🎵', label: 'Música' },
  { emoji: '🎞️', label: 'Video' },
  { emoji: '☁️', label: 'Cloud' },
  { emoji: '🤖', label: 'AI' },
  { emoji: '📑', label: 'Servicios' },
  // Shopping
  { emoji: '👕', label: 'Ropa' },
  { emoji: '🛋️', label: 'Hogar' },
  { emoji: '🍳', label: 'Cocina' },
  { emoji: '🌿', label: 'Jardín' },
  { emoji: '🛍️', label: 'Compras' },
  // Gifts
  { emoji: '🎂', label: 'Cumpleaños' },
  { emoji: '🎄', label: 'Navidad' },
  { emoji: '💍', label: 'Boda' },
  { emoji: '🎁', label: 'Regalo' },
  // Travel
  { emoji: '✈️', label: 'Vuelos' },
  { emoji: '🏨', label: 'Hotel' },
  { emoji: '🚖', label: 'Taxi' },
  { emoji: '🍱', label: 'Comida viaje' },
  { emoji: '🏞️', label: 'Actividades' },
  { emoji: '🗺️', label: 'Souvenirs' },
  // Loans
  { emoji: '🎓', label: 'Educación' },
  { emoji: '🏢', label: 'Depto' },
  { emoji: '👩‍👦', label: 'Familia' },
  { emoji: '🤝', label: 'Apoyo' },
  { emoji: '👨‍👧', label: 'Papá' },
  // Other
  { emoji: '📌', label: 'General' },
  { emoji: '❓', label: 'Otro' },
];

export default function CategoryModal({ isOpen, onClose, category = null, existingCategories = [] }) {
  // ✅ M35: Grupos SIN emojis para que coincidan con CSV
  const GRUPOS = [
    'Income',
    'Loans & Debts',
    'Housing & Utilities',
    'Insurance & Health',
    'Food & Drinks',
    'Transport',
    'Entertainment',
    'Subscriptions & Apps',
    'Personal Shopping',
    'Gifts & Donations',
    'Travel',
    'Savings & Investments',
    'Other Expenses'
  ];

  const MONEDAS = ['EUR', 'CLP', 'USD', 'UF'];
  const TIPOS = [
    { value: 'income', label: 'Ingreso (Income)' },
    { value: 'expense', label: 'Gasto (Expense)' },
    { value: 'savings', label: 'Ahorro (Savings)' },
    { value: 'investment', label: 'Inversión (Investment)' }
  ];

  const [formData, setFormData] = useState({
    name: '',
    group: GRUPOS[0],
    budget: 0,
    currency: 'EUR',
    icon: '📌',
    type: 'expense'
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        group: category.group || GRUPOS[0],
        budget: category.budget || 0,
        currency: category.currency || 'EUR',
        icon: category.icon || '📌',
        type: category.type || 'expense'
      });
    } else {
      setFormData({
        name: '',
        group: GRUPOS[0],
        budget: 0,
        currency: 'EUR',
        icon: '📌',
        type: 'expense'
      });
    }
    setErrors({});
    setShowEmojiPicker(false);
  }, [category, isOpen]);

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    } else {
      const duplicate = existingCategories.find(
        cat => cat.name.toLowerCase() === formData.name.trim().toLowerCase() &&
               (!category || cat.id !== category.id)
      );
      if (duplicate) {
        newErrors.name = 'Ya existe una categoría con este nombre';
      }
    }

    if (!formData.group) {
      newErrors.group = 'Selecciona un grupo';
    }

    if (formData.budget < 0) {
      newErrors.budget = 'El presupuesto no puede ser negativo';
    }

    if (!formData.icon.trim()) {
      newErrors.icon = 'El ícono es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'budget' ? parseFloat(value) || 0 : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleEmojiSelect = (emoji) => {
    setFormData(prev => ({ ...prev, icon: emoji }));
    setShowEmojiPicker(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const categoryData = {
        ...formData,
        name: formData.name.trim(),
        budget: parseFloat(formData.budget) || 0
      };

      if (category) {
        categoryData.id = category.id;
        categoryData.spent = category.spent || 0;
      }

      onClose(categoryData);
      
    } catch (error) {
      console.error('Error al guardar categoría:', error);
      setErrors({ submit: 'Error al guardar. Intenta nuevamente.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      group: GRUPOS[0],
      budget: 0,
      currency: 'EUR',
      icon: '📌',
      type: 'expense'
    });
    setErrors({});
    setShowEmojiPicker(false);
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
            <button onClick={handleClose} className="text-white hover:text-gray-200 transition-colors">
              <i className="fas fa-times text-2xl"></i>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
              placeholder="Ej: Khaled Salary, Groceries, Rent"
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
          </div>

          {/* Grid: Presupuesto y Moneda */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <p className="text-xs text-gray-500 mt-1">
                Se usará para inicializar nuevos meses sin historial
              </p>
            </div>

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
            {/* ✅ M35: Selector de Emoji con dropdown */}
            <div className="relative">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Ícono (emoji)
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-left flex items-center justify-between"
                >
                  <span className="text-2xl">{formData.icon}</span>
                  <i className={`fas fa-chevron-${showEmojiPicker ? 'up' : 'down'} text-gray-400`}></i>
                </button>
                <input
                  type="text"
                  name="icon"
                  value={formData.icon}
                  onChange={handleChange}
                  maxLength="5"
                  className="w-20 px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-center text-xl"
                  placeholder="📌"
                />
              </div>
              
              {/* Emoji Picker Dropdown */}
              {showEmojiPicker && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  <div className="grid grid-cols-6 gap-1 p-2">
                    {EMOJI_OPTIONS.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleEmojiSelect(item.emoji)}
                        className="p-2 hover:bg-purple-100 rounded text-xl transition-colors"
                        title={item.label}
                      >
                        {item.emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {errors.icon && (
                <p className="text-red-600 text-sm mt-1">
                  <i className="fas fa-exclamation-circle mr-1"></i>
                  {errors.icon}
                </p>
              )}
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

          {/* Info box */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p className="text-sm text-purple-800">
              <i className="fas fa-info-circle mr-2"></i>
              <strong>Tip:</strong> El nombre de la categoría debe coincidir exactamente con tu Excel al importar transacciones.
            </p>
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