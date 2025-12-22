import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import Modal from '../common/Modal';

export default function DebtForm({ isOpen, onClose, debt = null }) {
  const { addDebt, updateDebt } = useApp();

  // ✅ M32: Tipos con sugerencia de clasificación
  const DEBT_TYPES = [
    { value: 'Hipoteca', suggestedToxic: false },
    { value: 'Préstamo Personal', suggestedToxic: true },
    { value: 'Préstamo Automotriz', suggestedToxic: true },
    { value: 'Préstamo de Consumo', suggestedToxic: true },
    { value: 'Tarjeta de Crédito', suggestedToxic: true },
    { value: 'Préstamo Estudiantil', suggestedToxic: false },
    { value: 'Otro', suggestedToxic: false }
  ];

  const [formData, setFormData] = useState({
    name: debt?.name || '',
    type: debt?.type || 'Préstamo Personal',
    isToxic: debt?.isToxic !== undefined ? debt.isToxic : true, // ✅ M32: Nuevo campo
    originalAmount: debt?.originalAmount || '',
    currentBalance: debt?.currentBalance || '',
    interestRate: debt?.interestRate || '',
    monthlyPayment: debt?.monthlyPayment || '',
    currency: debt?.currency || 'EUR',
    startDate: debt?.startDate || new Date().toISOString().slice(0, 10)
  });

  const [errors, setErrors] = useState({});

  // ✅ M32: Reset form cuando cambia debt o isOpen
  useEffect(() => {
    if (debt) {
      setFormData({
        name: debt.name || '',
        type: debt.type || 'Préstamo Personal',
        isToxic: debt.isToxic !== undefined ? debt.isToxic : true,
        originalAmount: debt.originalAmount || '',
        currentBalance: debt.currentBalance || '',
        interestRate: debt.interestRate || '',
        monthlyPayment: debt.monthlyPayment || '',
        currency: debt.currency || 'EUR',
        startDate: debt.startDate || new Date().toISOString().slice(0, 10)
      });
    } else {
      setFormData({
        name: '',
        type: 'Préstamo Personal',
        isToxic: true,
        originalAmount: '',
        currentBalance: '',
        interestRate: '',
        monthlyPayment: '',
        currency: 'EUR',
        startDate: new Date().toISOString().slice(0, 10)
      });
    }
    setErrors({});
  }, [debt, isOpen]);

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es obligatorio';
    }

    const originalAmount = parseFloat(formData.originalAmount);
    if (isNaN(originalAmount) || originalAmount <= 0) {
      newErrors.originalAmount = 'El monto original debe ser mayor a 0';
    }

    const currentBalance = parseFloat(formData.currentBalance);
    if (isNaN(currentBalance) || currentBalance < 0) {
      newErrors.currentBalance = 'El saldo actual no puede ser negativo';
    }

    if (currentBalance > originalAmount) {
      newErrors.currentBalance = 'El saldo actual no puede ser mayor al monto original';
    }

    const interestRate = parseFloat(formData.interestRate);
    if (isNaN(interestRate) || interestRate < 0) {
      newErrors.interestRate = 'La tasa de interés no puede ser negativa';
    }

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
      isToxic: formData.isToxic, // ✅ M32: Incluir clasificación
      originalAmount: parseFloat(formData.originalAmount),
      currentBalance: parseFloat(formData.currentBalance),
      interestRate: parseFloat(formData.interestRate),
      monthlyPayment: parseFloat(formData.monthlyPayment),
      currency: formData.currency,
      startDate: formData.startDate,
    };

    if (debt) {
      updateDebt(debt.id, debtData);
    } else {
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
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  // ✅ M32: Auto-sugerir clasificación al cambiar tipo
  const handleTypeChange = (newType) => {
    const typeConfig = DEBT_TYPES.find(t => t.value === newType);
    setFormData(prev => ({
      ...prev,
      type: newType,
      isToxic: typeConfig?.suggestedToxic ?? true
    }));
  };

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
            onChange={(e) => handleTypeChange(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {DEBT_TYPES.map(type => (
              <option key={type.value} value={type.value}>{type.value}</option>
            ))}
          </select>
        </div>

        {/* ✅ M32: Clasificación Tóxica/Buena */}
        <div className="bg-gray-50 rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            <i className="fas fa-exclamation-triangle mr-2 text-orange-500"></i>
            Clasificación de la deuda
          </label>
          
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleChange('isToxic', false)}
              className={`p-3 rounded-lg border-2 transition-all text-left ${
                !formData.isToxic
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-green-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">✅</span>
                <span className={`font-semibold text-sm ${!formData.isToxic ? 'text-green-700' : 'text-gray-700'}`}>
                  Deuda Buena
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Hipoteca, educación
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleChange('isToxic', true)}
              className={`p-3 rounded-lg border-2 transition-all text-left ${
                formData.isToxic
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-200 hover:border-red-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">⚠️</span>
                <span className={`font-semibold text-sm ${formData.isToxic ? 'text-red-700' : 'text-gray-700'}`}>
                  Deuda Tóxica
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Tarjetas, consumo
              </p>
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-2">
            <i className="fas fa-info-circle mr-1"></i>
            Afecta tu Índice de Tranquilidad Financiera
          </p>
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
          <div className={`border rounded-lg p-4 ${
            formData.isToxic 
              ? 'bg-gradient-to-r from-red-50 to-pink-50 border-red-200' 
              : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
          }`}>
            <div className="flex justify-between items-center mb-2">
              <p className={`text-sm font-medium ${formData.isToxic ? 'text-red-800' : 'text-green-800'}`}>
                {formData.isToxic ? '⚠️ Deuda Tóxica' : '✅ Deuda Buena'}
              </p>
              <p className={`text-sm font-bold ${formData.isToxic ? 'text-red-700' : 'text-green-700'}`}>
                {progress.toFixed(1)}% pagado
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <p className={`text-xs ${formData.isToxic ? 'text-red-600' : 'text-green-600'}`}>Pagado:</p>
                <p className={`text-xl font-bold ${formData.isToxic ? 'text-red-700' : 'text-green-700'}`}>
                  {(parseFloat(formData.originalAmount) - parseFloat(formData.currentBalance)).toFixed(2)} {formData.currency}
                </p>
              </div>
              <div>
                <p className={`text-xs ${formData.isToxic ? 'text-red-600' : 'text-green-600'}`}>Pendiente:</p>
                <p className={`text-xl font-bold ${formData.isToxic ? 'text-red-700' : 'text-green-700'}`}>
                  {parseFloat(formData.currentBalance).toFixed(2)} {formData.currency}
                </p>
              </div>
            </div>

            <div className={`w-full rounded-full h-3 overflow-hidden ${formData.isToxic ? 'bg-red-200' : 'bg-green-200'}`}>
              <div
                className={`h-3 rounded-full transition-all duration-500 ${
                  formData.isToxic 
                    ? 'bg-gradient-to-r from-red-500 to-red-600' 
                    : 'bg-gradient-to-r from-green-500 to-green-600'
                }`}
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