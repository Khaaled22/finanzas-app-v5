import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import Modal from '../common/Modal';

export default function TransactionForm({ isOpen, onClose, transaction = null }) {
  const { addTransaction, updateTransaction, categories } = useApp();
  
  const [formData, setFormData] = useState({
    date: transaction?.date?.slice(0, 10) || new Date().toISOString().slice(0, 10), // M4.1
    description: transaction?.description || '',                                      // M4.2
    comment: transaction?.comment || '',                                              // M4.3
    amount: transaction?.amount || '',
    currency: transaction?.currency || 'EUR',
    categoryId: transaction?.categoryId || categories[0]?.id || '',
    paymentMethod: transaction?.paymentMethod || 'Tarjeta'
  });

  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};

    // Validar descripción
    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es obligatoria';
    }

    // Validar monto
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      newErrors.amount = 'El monto debe ser mayor a 0';
    }

    // Validar fecha
    const selectedDate = new Date(formData.date);
    const today = new Date();
    if (selectedDate > today) {
      newErrors.date = 'La fecha no puede ser futura';
    }

    // Validar categoría
    if (!formData.categoryId) {
      newErrors.categoryId = 'Debes seleccionar una categoría';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validate()) return;

    const transactionData = {
      ...formData,
      amount: parseFloat(formData.amount),
      date: new Date(formData.date).toISOString() // Convertir a ISO string
    };

    if (transaction) {
      updateTransaction(transaction.id, transactionData);
    } else {
      addTransaction(transactionData);
    }

    onClose();
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    // Limpiar error del campo cuando el usuario escribe
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={transaction ? "Editar Transacción" : "Nueva Transacción"}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* M4.1: Fecha editable */}
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
            <i className="fas fa-calendar mr-2 text-blue-600"></i>
            Fecha del gasto *
          </label>
          <input
            id="date"
            type="date"
            value={formData.date}
            onChange={(e) => handleChange('date', e.target.value)}
            max={new Date().toISOString().slice(0, 10)}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
              errors.date 
                ? 'border-red-300 focus:ring-red-500' 
                : 'border-gray-300 focus:ring-blue-500'
            }`}
            required
          />
          {errors.date && (
            <p className="mt-1 text-sm text-red-600">
              <i className="fas fa-exclamation-circle mr-1"></i>
              {errors.date}
            </p>
          )}
        </div>

        {/* M4.2: Descripción mejorada */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            <i className="fas fa-tag mr-2 text-blue-600"></i>
            Descripción *
          </label>
          <input
            id="description"
            type="text"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Ej: Compra supermercado Día"
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
              errors.description 
                ? 'border-red-300 focus:ring-red-500' 
                : 'border-gray-300 focus:ring-blue-500'
            }`}
            maxLength={100}
            required
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">
              <i className="fas fa-exclamation-circle mr-1"></i>
              {errors.description}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            {formData.description.length}/100 caracteres
          </p>
        </div>

        {/* M4.3: Comentario opcional */}
        <div>
          <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
            <i className="fas fa-comment mr-2 text-blue-600"></i>
            Comentario (opcional)
          </label>
          <textarea
            id="comment"
            value={formData.comment}
            onChange={(e) => handleChange('comment', e.target.value)}
            placeholder="Notas adicionales sobre este gasto..."
            rows={3}
            maxLength={200}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <p className="mt-1 text-xs text-gray-500">
            {formData.comment.length}/200 caracteres
          </p>
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
              required
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

        {/* Categoría */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
            <i className="fas fa-folder mr-2 text-blue-600"></i>
            Categoría *
          </label>
          <select
            id="category"
            value={formData.categoryId}
            onChange={(e) => handleChange('categoryId', e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
              errors.categoryId 
                ? 'border-red-300 focus:ring-red-500' 
                : 'border-gray-300 focus:ring-blue-500'
            }`}
            required
          >
            <option value="">Selecciona una categoría</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.group} - {cat.name}
              </option>
            ))}
          </select>
          {errors.categoryId && (
            <p className="mt-1 text-sm text-red-600">
              <i className="fas fa-exclamation-circle mr-1"></i>
              {errors.categoryId}
            </p>
          )}
        </div>

        {/* Método de Pago */}
        <div>
          <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-2">
            <i className="fas fa-credit-card mr-2 text-blue-600"></i>
            Método de Pago
          </label>
          <select
            id="paymentMethod"
            value={formData.paymentMethod}
            onChange={(e) => handleChange('paymentMethod', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Efectivo">💵 Efectivo</option>
            <option value="Tarjeta">💳 Tarjeta</option>
            <option value="Transferencia">🏦 Transferencia</option>
          </select>
        </div>

        {/* Vista previa */}
        {formData.description && formData.amount && !isNaN(parseFloat(formData.amount)) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800 font-medium mb-1">Vista previa:</p>
            <p className="text-lg font-bold text-blue-900">
              {formData.description}
            </p>
            <p className="text-2xl font-bold text-blue-700 mt-1">
              -{parseFloat(formData.amount).toFixed(2)} {formData.currency}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              {new Date(formData.date).toLocaleDateString('es-ES', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
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
            <i className={`fas ${transaction ? 'fa-save' : 'fa-plus'} mr-2`}></i>
            {transaction ? 'Actualizar' : 'Guardar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}