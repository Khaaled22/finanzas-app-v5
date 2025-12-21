import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';

export default function UpdateInvestmentModal({ isOpen, onClose, investment, onUpdate }) {
  const [formData, setFormData] = useState({
    currentBalance: investment?.currentBalance || '',
    notes: investment?.notes || ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (investment) {
      setFormData({
        currentBalance: investment.currentBalance,
        notes: investment.notes || ''
      });
    }
    setErrors({});
  }, [investment, isOpen]);

  const validate = () => {
    const newErrors = {};

    const balance = parseFloat(formData.currentBalance);
    if (isNaN(balance) || balance < 0) {
      newErrors.currentBalance = 'El saldo debe ser mayor o igual a 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validate()) return;

    const updates = {
      currentBalance: parseFloat(formData.currentBalance),
      notes: formData.notes,
      lastUpdated: new Date().toISOString()
    };

    onUpdate(investment.id, updates);
    onClose();
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  if (!investment) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Actualizar ${investment.platform}`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Info de la plataforma */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <span className="text-4xl">{investment.icon}</span>
            <div>
              <p className="font-bold text-gray-900">{investment.platform}</p>
              <p className="text-sm text-gray-600">{investment.type} • {investment.name}</p>
            </div>
          </div>
        </div>

        {/* Saldo actual anterior */}
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Saldo anterior:</p>
          <p className="text-2xl font-bold text-gray-900">
            {investment.currentBalance.toLocaleString('es-ES', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })} {investment.currency}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Última actualización: {new Date(investment.lastUpdated).toLocaleDateString('es-ES', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>

        {/* Nuevo saldo */}
        <div>
          <label htmlFor="currentBalance" className="block text-sm font-medium text-gray-700 mb-2">
            <i className="fas fa-dollar-sign mr-2 text-blue-600"></i>
            Nuevo Saldo *
          </label>
          <div className="flex space-x-2">
            <input
              id="currentBalance"
              type="number"
              step="0.01"
              value={formData.currentBalance}
              onChange={(e) => handleChange('currentBalance', e.target.value)}
              placeholder="0.00"
              className={`flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                errors.currentBalance 
                  ? 'border-red-300 focus:ring-red-500' 
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
              required
            />
            <div className="flex items-center px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg font-medium text-gray-700">
              {investment.currency}
            </div>
          </div>
          {errors.currentBalance && (
            <p className="mt-1 text-sm text-red-600">
              <i className="fas fa-exclamation-circle mr-1"></i>
              {errors.currentBalance}
            </p>
          )}
        </div>

        {/* Notas */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
            <i className="fas fa-sticky-note mr-2 text-blue-600"></i>
            Notas (opcional)
          </label>
          <textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="Ej: Actualización manual, venta de activos, etc."
            rows={3}
            maxLength={200}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <p className="mt-1 text-xs text-gray-500">
            {formData.notes.length}/200 caracteres
          </p>
        </div>

        {/* Cambio proyectado */}
        {formData.currentBalance && !isNaN(parseFloat(formData.currentBalance)) && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800 font-medium mb-1">Cambio:</p>
            {(() => {
              const newBalance = parseFloat(formData.currentBalance);
              const oldBalance = investment.currentBalance;
              const change = newBalance - oldBalance;
              const percentChange = oldBalance > 0 ? (change / oldBalance * 100) : 0;
              const isPositive = change >= 0;

              return (
                <>
                  <p className={`text-xl font-bold ${isPositive ? 'text-green-700' : 'text-red-700'}`}>
                    {isPositive ? '+' : ''}{change.toLocaleString('es-ES', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })} {investment.currency}
                  </p>
                  <p className={`text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {isPositive ? '+' : ''}{percentChange.toFixed(2)}%
                  </p>
                </>
              );
            })()}
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
            <i className="fas fa-save mr-2"></i>
            Actualizar
          </button>
        </div>
      </form>
    </Modal>
  );
}