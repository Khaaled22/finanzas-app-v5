import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import Modal from '../common/Modal';

export default function TransactionForm({ isOpen, onClose, transaction = null }) {
  // ✅ M19.2.1: Agregar convertCurrencyAtDate y displayCurrency del context
  const { addTransaction, updateTransaction, categories, convertCurrencyAtDate, displayCurrency } = useApp();
  
  const [formData, setFormData] = useState({
    date: transaction?.date?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    description: transaction?.description || '',
    amount: transaction?.amount || '',
    currency: transaction?.currency || 'EUR',
    categoryId: transaction?.categoryId || categories[0]?.id || '',
    paymentMethod: transaction?.paymentMethod || 'Tarjeta'
  });

  const [errors, setErrors] = useState({});

  // Actualizar formData cuando cambia transaction
  useEffect(() => {
    if (transaction) {
      setFormData({
        date: transaction.date.slice(0, 10),
        description: transaction.description,
        amount: transaction.amount,
        currency: transaction.currency,
        categoryId: transaction.categoryId,
        paymentMethod: transaction.paymentMethod || 'Tarjeta'
      });
    } else {
      setFormData({
        date: new Date().toISOString().slice(0, 10),
        description: '',
        amount: '',
        currency: 'EUR',
        categoryId: categories[0]?.id || '',
        paymentMethod: 'Tarjeta'
      });
    }
    setErrors({});
  }, [transaction, categories, isOpen]);

  // Agrupar categorías por grupo (memoized)
  const groupedCategories = useMemo(() => categories.reduce((acc, cat) => {
    if (!acc[cat.group]) acc[cat.group] = [];
    acc[cat.group].push(cat);
    return acc;
  }, {}), [categories]);

  // Detectar si la categoría seleccionada es income
  const selectedCategory = categories.find(cat => cat.id === formData.categoryId);
  const isIncome = selectedCategory?.type === 'income';

  // M19.2.1: Calcular conversión usando tasa histórica
  const previewConversion = () => {
    if (!formData.amount || isNaN(parseFloat(formData.amount))) return null;
    if (!formData.currency || !displayCurrency) return null;
    if (formData.currency === displayCurrency) return null;

    const amount = parseFloat(formData.amount);
    const converted = convertCurrencyAtDate(
      amount,
      formData.currency,
      displayCurrency,
      formData.date
    );

    return converted;
  };

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

    // ✅ M36: Fecha futura permitida (para gastos programados)

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
      date: formData.date
    };

    if (transaction) {
      updateTransaction(transaction.id, transactionData);
    } else {
      addTransaction(transactionData);
    }

    onClose();
  };

  // M18.6 - Auto-detectar moneda al cambiar categoría
  const handleChange = (field, value) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Si cambió la categoría, sugerir su moneda predeterminada
      if (field === 'categoryId') {
        const cat = categories.find(c => c.id === value);
        if (cat && cat.currency) {
          newData.currency = cat.currency;
        }
      }
      
      return newData;
    });
    
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  const converted = previewConversion();

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={transaction ? "Editar Transacción" : "Nueva Transacción"}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {/* Fecha */}
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
            <i className="fas fa-calendar mr-2 text-blue-600"></i>
            Fecha *
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
            required
          />
          {errors.date && (
            <p className="mt-1 text-sm text-red-600">
              <i className="fas fa-exclamation-circle mr-1"></i>
              {errors.date}
            </p>
          )}
        </div>

        {/* Descripción */}
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
            placeholder="Ej: Compra supermercado, Netflix, Salario, etc."
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

        {/* Categoría AGRUPADA con auto-detección de moneda */}
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
            {Object.entries(groupedCategories).map(([group, cats]) => (
              <optgroup key={group} label={group}>
                {cats.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          {errors.categoryId && (
            <p className="mt-1 text-sm text-red-600">
              <i className="fas fa-exclamation-circle mr-1"></i>
              {errors.categoryId}
            </p>
          )}
          {categories.length === 0 && (
            <p className="mt-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <i className="fas fa-info-circle mr-1"></i>
              No hay categorías. <a href="/settings" className="font-semibold underline">Créalas en Ajustes</a> para poder guardar transacciones.
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

        {/* M19.2.1: Vista previa con CONVERSIÓN HISTÓRICA */}
        {formData.description && formData.amount && !isNaN(parseFloat(formData.amount)) && selectedCategory && (
          <div className={`${isIncome ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'} border rounded-lg p-4`}>
            <p className={`text-sm ${isIncome ? 'text-green-800' : 'text-blue-800'} font-medium mb-1`}>
              Vista previa:
            </p>
            <div className="flex items-center space-x-3 mb-2">
              <span className="text-3xl">{selectedCategory.icon}</span>
              <div>
                <p className="text-sm text-gray-600">{selectedCategory.group}</p>
                <p className="text-lg font-bold text-gray-900">{formData.description}</p>
              </div>
            </div>
            <p className={`text-2xl font-bold ${isIncome ? 'text-green-700' : 'text-red-700'} mt-1`}>
              {isIncome ? '+' : '-'}{parseFloat(formData.amount).toFixed(2)} {formData.currency}
            </p>
            
            {/* M19.2.1: Mostrar conversión con tasa histórica */}
            {converted !== null && (
              <div className="mt-2 pt-2 border-t border-gray-300">
                <p className="text-xs text-gray-600 mb-1">
                  Conversión a {displayCurrency} (usando tasa del {new Date(formData.date).toLocaleDateString('es-ES')}):
                </p>
                <p className={`text-lg font-bold ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
                  ≈ {isIncome ? '+' : '-'}{converted.toFixed(2)} {displayCurrency}
                </p>
              </div>
            )}

            <p className="text-xs text-gray-600 mt-2">
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