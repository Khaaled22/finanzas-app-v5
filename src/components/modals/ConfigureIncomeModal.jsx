import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import Modal from '../common/Modal';

export default function ConfigureIncomeModal({ isOpen, onClose }) {
  const { ynabConfig, setYnabConfig, displayCurrency } = useApp();
  const [income, setIncome] = useState(ynabConfig.monthlyIncome || '');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const amount = parseFloat(income);
    
    // Validación
    if (isNaN(amount)) {
      setError('Por favor ingresa un número válido');
      return;
    }
    
    if (amount < 0) {
      setError('El ingreso no puede ser negativo');
      return;
    }
    
    // Guardar
    setYnabConfig({
      ...ynabConfig,
      monthlyIncome: amount
    });
    
    // Cerrar modal
    onClose();
  };

  const handleChange = (e) => {
    setIncome(e.target.value);
    setError(''); // Limpiar error al escribir
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Configurar Ingreso Mensual" size="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Descripción */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <i className="fas fa-info-circle mr-2"></i>
            Tu ingreso mensual se usa para calcular cuánto dinero te queda por asignar a categorías (método YNAB).
          </p>
        </div>

        {/* Input de ingreso */}
        <div>
          <label htmlFor="monthlyIncome" className="block text-sm font-medium text-gray-700 mb-2">
            Ingreso Mensual
          </label>
          <div className="relative">
            <input
              id="monthlyIncome"
              type="number"
              step="0.01"
              value={income}
              onChange={handleChange}
              placeholder="Ej: 3500"
              className={`w-full px-4 py-3 border rounded-lg text-lg focus:outline-none focus:ring-2 transition-all ${
                error 
                  ? 'border-red-300 focus:ring-red-500' 
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
              required
              autoFocus
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
              {displayCurrency}
            </div>
          </div>
          {error && (
            <p className="mt-2 text-sm text-red-600">
              <i className="fas fa-exclamation-circle mr-1"></i>
              {error}
            </p>
          )}
        </div>

        {/* Ejemplo visual */}
        {income && !isNaN(parseFloat(income)) && parseFloat(income) > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800 font-medium mb-1">Vista previa:</p>
            <p className="text-2xl font-bold text-green-700">
              {parseFloat(income).toFixed(2)} {displayCurrency}
              <span className="text-sm font-normal text-green-600 ml-2">por mes</span>
            </p>
          </div>
        )}

        {/* Botones */}
        <div className="flex space-x-3">
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
            Guardar
          </button>
        </div>
      </form>
    </Modal>
  );
}