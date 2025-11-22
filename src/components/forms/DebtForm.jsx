import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import Modal from '../common/Modal';

export default function DebtForm({ isOpen, onClose, debt = null }) {
  const { addDebt, updateDebt } = useApp();

  const DEBT_TYPES = [
    'Hipoteca',
    'Préstamo Personal',
    'Préstamo Automotriz',
    'Préstamo de Consumo',
    'Tarjeta de Crédito',
    'Préstamo Estudiantil',
    'Otro'
  ];

  const [formData, setFormData] = useState({
    name: debt?.name || '',
    type: debt?.type || 'Préstamo Personal',
    originalAmount: debt?.originalAmount || '',
    currentBalance: debt?.currentBalance || '',
    interestRate: debt?.interestRate || '',
    monthlyPayment: debt?.monthlyPayment || '',
    currency: debt?.currency || 'EUR',
    startDate: debt?.startDate || new Date().toISOString().slice(0, 10)
  });

  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};

    // Validar nombre
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es obligatorio';
    }

    // Validar monto original
    const originalAmount = parseFloat(formData.originalAmount);
    if (isNaN(originalAmount) || originalAmount <= 0) {
      newErrors.originalAmount = 'El monto original debe ser mayor a 0';
    }

    // Validar saldo actual
    const currentBalance = parseFloat(formData.currentBalance);
    if (isNaN(currentBalance) || currentBalance < 0) {
      newErrors.currentBalance = 'El saldo actual no puede ser negativo';
    }

    // Validar que saldo actual <= monto original
    if (currentBalance > originalAmount) {
      newErrors.currentBalance = 'El saldo actual no puede ser mayor al monto original';
    }

    // Validar tasa de interés
    const interestRate = parseFloat(formData.interestRate);
    if (isNaN(interestRate) || interestRate < 0) {
      newErrors.interestRate = 'La tasa de interés no puede ser negativa';
    }

    // Validar cuota mensual
    const monthlyPayment = parseFloat(formData.monthlyPayment);
    if (isNaN(monthlyPayment) || monthlyPayment <= 0) {
      newErrors.monthlyPayment = 'La cuota mensual debe ser mayor a 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validate()) return;

    const debtData = {
      name: formData.name.trim(),
      type: formData.type,
      originalAmount: parseFloat(formData.originalAmount),
      currentBalance: parseFloat(formData.currentBalance),
      interestRate: parseFloat(formData.interestRate),
      monthlyPayment: parseFloat(formData.monthlyPayment),
      currency: formData.currency,
      startDate: formData.startDate,
    };

    if (debt) {
      // Editar deuda existente
      updateDebt(debt.id, debtData);
    } else {
      // Crear nueva deuda
      addDebt({
        ...debtData,
        paymentsMade: 0,
        paymentHistory: []
      });
    }

    onClose();
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    // Limpiar error del campo
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  // Calcular progreso de pago
  const calculateProgress = () => {
    const original = parseFloat(formData.originalAmount) || 0;
    const current = parseFloat(formData.currentBalance) || 0;
    if (original === 0) return 0;
    return ((original - current) / original) * 100;
  };

  const progress = calculateProgress();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={debt ? "Editar Deuda" : "Agregar Nueva Deuda"}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Nombre de la deuda */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            <i className="fas fa-signature mr-2 text-red-600"></i>
            Nombre de la deuda *
          </label>
          <input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Ej: Hipoteca Casa Principal"
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
              errors.name
                ? 'border-red-300 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
            }`}
            maxLength={50}
            required
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">
              <i className="fas fa-exclamation-circle mr-1"></i>
              {errors.name}
            </p>
          )}
        </div>

        {/* Tipo de deuda */}
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
            <i className="fas fa-tags mr-2 text-red-600"></i>
            Tipo de deuda *
          </label>
          <select
            id="type"
            value={formData.type}
            onChange={(e) => handleChange('type', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {DEBT_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        {/* Monto original y Saldo actual */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="originalAmount" className="block text-sm font-medium text-gray-700 mb-2">
              <i className="fas fa-dollar-sign mr-2 text-red-600"></i>
              Monto original *
            </label>
            <input
              id="originalAmount"
              type="number"
              step="0.01"
              value={formData.originalAmount}
              onChange={(e) => handleChange('originalAmount', e.target.value)}
              placeholder="0.00"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                errors.originalAmount
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
              required
            />
            {errors.originalAmount && (
              <p className="mt-1 text-sm text-red-600">
                <i className="fas fa-exclamation-circle mr-1"></i>
                {errors.originalAmount}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="currentBalance" className="block text-sm font-medium text-gray-700 mb-2">
              <i className="fas fa-balance-scale mr-2 text-red-600"></i>
              Saldo actual *
            </label>
            <input
              id="currentBalance"
              type="number"
              step="0.01"
              value={formData.currentBalance}
              onChange={(e) => handleChange('currentBalance', e.target.value)}
              placeholder="0.00"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                errors.currentBalance
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
              required
            />
            {errors.currentBalance && (
              <p className="mt-1 text-sm text-red-600">
                <i className="fas fa-exclamation-circle mr-1"></i>
                {errors.currentBalance}
              </p>
            )}
          </div>
        </div>

        {/* Tasa de interés y Cuota mensual */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="interestRate" className="block text-sm font-medium text-gray-700 mb-2">
              <i className="fas fa-percentage mr-2 text-red-600"></i>
              Tasa de interés anual *
            </label>
            <input
              id="interestRate"
              type="number"
              step="0.01"
              value={formData.interestRate}
              onChange={(e) => handleChange('interestRate', e.target.value)}
              placeholder="0.00"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                errors.interestRate
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
              required
            />
            {errors.interestRate && (
              <p className="mt-1 text-sm text-red-600">
                <i className="fas fa-exclamation-circle mr-1"></i>
                {errors.interestRate}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Ejemplo: 3.5 para 3.5% anual
            </p>
          </div>

          <div>
            <label htmlFor="monthlyPayment" className="block text-sm font-medium text-gray-700 mb-2">
              <i className="fas fa-calendar-check mr-2 text-red-600"></i>
              Cuota mensual *
            </label>
            <input
              id="monthlyPayment"
              type="number"
              step="0.01"
              value={formData.monthlyPayment}
              onChange={(e) => handleChange('monthlyPayment', e.target.value)}
              placeholder="0.00"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                errors.monthlyPayment
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
              required
            />
            {errors.monthlyPayment && (
              <p className="mt-1 text-sm text-red-600">
                <i className="fas fa-exclamation-circle mr-1"></i>
                {errors.monthlyPayment}
              </p>
            )}
          </div>
        </div>

        {/* Moneda y Fecha de inicio */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">
              <i className="fas fa-coins mr-2 text-red-600"></i>
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

          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
              <i className="fas fa-calendar-alt mr-2 text-red-600"></i>
              Fecha de inicio
            </label>
            <input
              id="startDate"
              type="date"
              value={formData.startDate}
              onChange={(e) => handleChange('startDate', e.target.value)}
              max={new Date().toISOString().slice(0, 10)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Vista previa del progreso */}
        {formData.originalAmount && formData.currentBalance && (
          <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800 font-medium mb-2">Vista previa:</p>
            
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <p className="text-xs text-red-600">Pagado hasta ahora:</p>
                <p className="text-2xl font-bold text-red-700">
                  {(parseFloat(formData.originalAmount) - parseFloat(formData.currentBalance)).toFixed(2)} {formData.currency}
                </p>
              </div>
              <div>
                <p className="text-xs text-red-600">Progreso:</p>
                <p className="text-2xl font-bold text-red-700">
                  {progress.toFixed(1)}%
                </p>
              </div>
            </div>

            <div className="w-full bg-red-200 rounded-full h-3 overflow-hidden">
              <div
                className="h-3 bg-gradient-to-r from-red-500 to-red-600 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(progress, 100)}%` }}
              ></div>
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
            className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            <i className={`fas ${debt ? 'fa-save' : 'fa-plus'} mr-2`}></i>
            {debt ? 'Actualizar' : 'Agregar Deuda'}
          </button>
        </div>
      </form>
    </Modal>
  );
}