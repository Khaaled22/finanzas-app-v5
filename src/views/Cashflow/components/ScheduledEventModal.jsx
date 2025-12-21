// src/views/Cashflow/components/ScheduledEventModal.jsx
// ✅ M19.3: Modal para crear/editar eventos programados

import React, { useState, useEffect } from 'react';
import Modal from '../../../components/common/Modal';

export default function ScheduledEventModal({ isOpen, onClose, onSave, event = null }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    date: new Date().toISOString().slice(0, 10),
    amount: '',
    currency: 'EUR',
    type: 'expense'
  });

  const [errors, setErrors] = useState({});

  // Cargar datos si estamos editando
  useEffect(() => {
    if (event) {
      setFormData({
        name: event.name || '',
        description: event.description || '',
        date: event.date?.slice(0, 10) || new Date().toISOString().slice(0, 10),
        amount: event.amount || '',
        currency: event.currency || 'EUR',
        type: event.type || 'expense'
      });
    } else {
      setFormData({
        name: '',
        description: '',
        date: new Date().toISOString().slice(0, 10),
        amount: '',
        currency: 'EUR',
        type: 'expense'
      });
    }
    setErrors({});
  }, [event, isOpen]);

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es obligatorio';
    }

    if (!formData.date) {
      newErrors.date = 'La fecha es obligatoria';
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      newErrors.amount = 'El monto debe ser mayor a 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validate()) return;

    onSave({
      ...formData,
      amount: parseFloat(formData.amount)
    });
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  const isIncome = formData.type === 'income';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={event ? 'Editar Evento Programado' : 'Nuevo Evento Programado'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Tipo de Evento */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <i className="fas fa-exchange-alt mr-2 text-blue-600"></i>
            Tipo de Evento *
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleChange('type', 'income')}
              className={`p-4 rounded-lg border-2 transition-all ${
                isIncome
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <i className="fas fa-arrow-up text-2xl mb-2"></i>
              <p className="font-semibold">Ingreso</p>
              <p className="text-xs text-gray-600">Bono, venta, etc.</p>
            </button>
            <button
              type="button"
              onClick={() => handleChange('type', 'expense')}
              className={`p-4 rounded-lg border-2 transition-all ${
                !isIncome
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <i className="fas fa-arrow-down text-2xl mb-2"></i>
              <p className="font-semibold">Gasto</p>
              <p className="text-xs text-gray-600">Compra, viaje, etc.</p>
            </button>
          </div>
        </div>

        {/* Nombre */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            <i className="fas fa-tag mr-2 text-blue-600"></i>
            Nombre del Evento *
          </label>
          <input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Ej: Aguinaldo, Vacaciones, Bono anual"
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
              errors.name 
                ? 'border-red-300 focus:ring-red-500' 
                : 'border-gray-300 focus:ring-blue-500'
            }`}
            maxLength={100}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">
              <i className="fas fa-exclamation-circle mr-1"></i>
              {errors.name}
            </p>
          )}
        </div>

        {/* Descripción */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            <i className="fas fa-align-left mr-2 text-blue-600"></i>
            Descripción (opcional)
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Detalles adicionales..."
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            maxLength={200}
          />
          <p className="mt-1 text-xs text-gray-500">
            {formData.description.length}/200 caracteres
          </p>
        </div>

        {/* Fecha */}
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
            <i className="fas fa-calendar mr-2 text-blue-600"></i>
            Fecha del Evento *
          </label>
          <input
            id="date"
            type="date"
            value={formData.date}
            onChange={(e) => handleChange('date', e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
              errors.date 
                ? 'border-red-300 focus:ring-red-500' 
                : 'border-gray-300 focus:ring-blue-500'
            }`}
          />
          {errors.date && (
            <p className="mt-1 text-sm text-red-600">
              <i className="fas fa-exclamation-circle mr-1"></i>
              {errors.date}
            </p>
          )}
        </div>

        {/* Monto y Moneda */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
              <i className="fas fa-dollar-sign mr-2 text-blue-600"></i>
              Monto *
            </label>
            <input
              id="amount"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => handleChange('amount', e.target.value)}
              placeholder="0.00"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                errors.amount 
                  ? 'border-red-300 focus:ring-red-500' 
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
            />
            {errors.amount && (
              <p className="mt-1 text-sm text-red-600">
                <i className="fas fa-exclamation-circle mr-1"></i>
                {errors.amount}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">
              <i className="fas fa-coins mr-2 text-blue-600"></i>
              Moneda
            </label>
            <select
              id="currency"
              value={formData.currency}
              onChange={(e) => handleChange('currency', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="EUR">EUR €</option>
              <option value="CLP">CLP $</option>
              <option value="USD">USD $</option>
              <option value="UF">UF</option>
            </select>
          </div>
        </div>

        {/* Vista previa */}
        {formData.name && formData.amount && !isNaN(parseFloat(formData.amount)) && (
          <div className={`${isIncome ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border rounded-lg p-4`}>
            <p className={`text-sm ${isIncome ? 'text-green-800' : 'text-red-800'} font-medium mb-2`}>
              Vista previa:
            </p>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-bold text-gray-900 mb-1">{formData.name}</p>
                <p className="text-sm text-gray-600">
                  {new Date(formData.date).toLocaleDateString('es-ES', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              <p className={`text-2xl font-bold ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
                {isIncome ? '+' : '-'}{parseFloat(formData.amount).toFixed(2)} {formData.currency}
              </p>
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
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <i className={`fas ${event ? 'fa-save' : 'fa-plus'} mr-2`}></i>
            {event ? 'Actualizar' : 'Crear Evento'}
          </button>
        </div>
      </form>
    </Modal>
  );
}