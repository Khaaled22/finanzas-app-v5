// src/components/modals/ConfigureIncomeModal.jsx
// ✅ M36 Fase 3: Modal para configurar ingreso con overrides por mes
import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import Modal from '../common/Modal';
import { formatNumber } from '../../utils/formatters';

export default function ConfigureIncomeModal({ isOpen, onClose }) {
  const { 
    ynabConfig, 
    setYnabConfig, 
    displayCurrency,
    selectedBudgetMonth 
  } = useApp();
  
  // ✅ M36: Estado para ingreso base y overrides
  const [income, setIncome] = useState(ynabConfig.monthlyIncome || '');
  const [showOverrides, setShowOverrides] = useState(false);
  const [overrides, setOverrides] = useState(ynabConfig.monthlyIncomeOverrides || {});
  const [newOverrideMonth, setNewOverrideMonth] = useState('');
  const [newOverrideAmount, setNewOverrideAmount] = useState('');
  const [error, setError] = useState('');

  // ✅ M36: Detectar si el mes actual es futuro
  const monthStatus = useMemo(() => {
    const now = new Date();
    const [year, month] = selectedBudgetMonth.split('-').map(Number);
    const selectedDate = new Date(year, month - 1, 1);
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return selectedDate > currentMonthStart ? 'PLAN' : 'REAL';
  }, [selectedBudgetMonth]);

  // Meses disponibles para override (próximos 12 meses)
  const availableMonthsForOverride = useMemo(() => {
    const months = [];
    const now = new Date();
    
    for (let i = 0; i <= 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' });
      months.push({ value: monthStr, label: monthName });
    }
    
    return months;
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const amount = parseFloat(income);
    
    if (isNaN(amount)) {
      setError('Por favor ingresa un número válido');
      return;
    }
    
    if (amount < 0) {
      setError('El ingreso no puede ser negativo');
      return;
    }
    
    // Guardar configuración base + overrides
    setYnabConfig({
      ...ynabConfig,
      monthlyIncome: amount,
      monthlyIncomeOverrides: overrides
    });
    
    onClose();
  };

  const handleAddOverride = () => {
    if (!newOverrideMonth || !newOverrideAmount) {
      return;
    }
    
    const amount = parseFloat(newOverrideAmount);
    if (isNaN(amount) || amount < 0) {
      return;
    }
    
    setOverrides(prev => ({
      ...prev,
      [newOverrideMonth]: amount
    }));
    
    setNewOverrideMonth('');
    setNewOverrideAmount('');
  };

  const handleRemoveOverride = (month) => {
    setOverrides(prev => {
      const newOverrides = { ...prev };
      delete newOverrides[month];
      return newOverrides;
    });
  };

  const handleChange = (e) => {
    setIncome(e.target.value);
    setError('');
  };

  // Obtener el ingreso efectivo para el mes seleccionado
  const effectiveIncome = useMemo(() => {
    if (overrides[selectedBudgetMonth]) {
      return overrides[selectedBudgetMonth];
    }
    return parseFloat(income) || 0;
  }, [selectedBudgetMonth, overrides, income]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Configurar Ingreso Mensual" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Descripción */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <i className="fas fa-info-circle mr-2"></i>
            El ingreso mensual se usa para calcular el dinero sin asignar (método YNAB).
          </p>
          <p className="text-xs text-blue-600 mt-2">
            {monthStatus === 'PLAN' 
              ? '📋 El mes seleccionado es futuro - se usará el ingreso planificado.'
              : '📊 El mes seleccionado es actual/pasado - se usará el ingreso real de transacciones.'}
          </p>
        </div>

        {/* Input de ingreso base */}
        <div>
          <label htmlFor="monthlyIncome" className="block text-sm font-medium text-gray-700 mb-2">
            Ingreso Mensual Base (Esperado)
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
          <p className="text-xs text-gray-500 mt-1">
            Este es el ingreso por defecto. Se usa cuando no hay un override específico para el mes.
          </p>
        </div>

        {/* ✅ M36: Sección de Overrides por mes */}
        <div className="border-t pt-4">
          <button
            type="button"
            onClick={() => setShowOverrides(!showOverrides)}
            className="flex items-center gap-2 text-sm font-medium text-purple-600 hover:text-purple-800"
          >
            <i className={`fas fa-chevron-${showOverrides ? 'down' : 'right'}`}></i>
            <i className="fas fa-calendar-alt"></i>
            Ingresos diferentes por mes (Overrides)
          </button>
          
          {showOverrides && (
            <div className="mt-4 space-y-4">
              <p className="text-xs text-gray-500">
                Define ingresos diferentes para meses específicos (ej: mes con bono, mes con menos horas, etc.)
              </p>
              
              {/* Lista de overrides existentes */}
              {Object.keys(overrides).length > 0 && (
                <div className="space-y-2">
                  {Object.entries(overrides)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([month, amount]) => {
                      const monthName = availableMonthsForOverride.find(m => m.value === month)?.label || month;
                      return (
                        <div 
                          key={month} 
                          className="flex items-center justify-between bg-purple-50 border border-purple-200 rounded-lg px-4 py-2"
                        >
                          <div>
                            <span className="font-medium text-purple-800">{monthName}</span>
                            <span className="ml-2 text-purple-600">
                              {formatNumber(amount)} {displayCurrency}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveOverride(month)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      );
                    })}
                </div>
              )}
              
              {/* Agregar nuevo override */}
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="block text-xs text-gray-600 mb-1">Mes</label>
                  <select
                    value={newOverrideMonth}
                    onChange={(e) => setNewOverrideMonth(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Seleccionar mes...</option>
                    {availableMonthsForOverride
                      .filter(m => !overrides[m.value])
                      .map(month => (
                        <option key={month.value} value={month.value}>
                          {month.label}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="w-32">
                  <label className="block text-xs text-gray-600 mb-1">Monto</label>
                  <input
                    type="number"
                    value={newOverrideAmount}
                    onChange={(e) => setNewOverrideAmount(e.target.value)}
                    placeholder="Monto"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddOverride}
                  disabled={!newOverrideMonth || !newOverrideAmount}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <i className="fas fa-plus"></i>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Vista previa */}
        {income && !isNaN(parseFloat(income)) && parseFloat(income) > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800 font-medium mb-2">Vista previa:</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-green-600">Ingreso Base</p>
                <p className="text-xl font-bold text-green-700">
                  {formatNumber(parseFloat(income))} {displayCurrency}
                </p>
              </div>
              <div>
                <p className="text-xs text-green-600">
                  Ingreso para {selectedBudgetMonth}
                  {overrides[selectedBudgetMonth] && ' (override)'}
                </p>
                <p className={`text-xl font-bold ${overrides[selectedBudgetMonth] ? 'text-purple-700' : 'text-green-700'}`}>
                  {formatNumber(effectiveIncome)} {displayCurrency}
                </p>
              </div>
            </div>
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