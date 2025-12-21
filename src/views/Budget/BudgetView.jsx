// src/views/Budget/BudgetView.jsx
// ✅ M23: Confirmación movida aquí desde AppContext
import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import YNABBanner from './YNABBanner';
import ConfigureIncomeModal from '../../components/modals/ConfigureIncomeModal';

export default function BudgetView() {
  const { 
    categoriesWithMonthlyBudget, 
    updateMonthlyBudget, 
    displayCurrency, 
    selectedBudgetMonth,
    setSelectedBudgetMonth,
    copyBudgetFromPreviousMonth,
    clearMonthlyBudgets
  } = useApp();
  
  const [showConfigureIncome, setShowConfigureIncome] = useState(false);

  const availableMonths = useMemo(() => {
    const months = [];
    const now = new Date();
    
    for (let i = -12; i <= 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' });
      months.push({ value: monthStr, label: monthName });
    }
    
    return months;
  }, []);

  const groupedCategories = useMemo(() => {
    const groups = {};
    categoriesWithMonthlyBudget
      .filter(cat => cat.type === 'expense')
      .forEach(cat => {
        if (!groups[cat.group]) groups[cat.group] = [];
        groups[cat.group].push(cat);
      });
    return groups;
  }, [categoriesWithMonthlyBudget]);

  const getPercentage = (spent, budget) => {
    if (budget === 0) return 0;
    return Math.min((spent / budget) * 100, 100);
  };

  const getStatusColor = (spent, budget) => {
    const percentage = getPercentage(spent, budget);
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const handleBudgetChange = (categoryId, newBudget) => {
    updateMonthlyBudget(categoryId, newBudget, selectedBudgetMonth);
  };

  const handleCopyPreviousMonth = () => {
    const result = copyBudgetFromPreviousMonth(selectedBudgetMonth);
    if (result.success) {
      const sourceText = result.source === 'previous' 
        ? `del mes ${result.sourceMonth || 'anterior'}` 
        : 'desde plantilla base';
      alert(`✅ Se copiaron ${result.count} presupuestos ${sourceText}.`);
    } else {
      alert('❌ No se pudieron copiar los presupuestos.');
    }
  };

  // ✅ M23: Confirmación movida aquí desde AppContext
  const handleClearMonth = () => {
    const monthName = availableMonths.find(m => m.value === selectedBudgetMonth)?.label || selectedBudgetMonth;
    
    if (window.confirm(`⚠️ ¿Estás seguro de limpiar todos los presupuestos de ${monthName}?\n\nEsta acción no se puede deshacer.`)) {
      clearMonthlyBudgets(selectedBudgetMonth);
      alert('✅ Presupuestos del mes limpiados.');
    }
  };

  const formatAmount = (amount, currency) => {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return `0.00 ${currency}`;
    }
    return `${amount.toFixed(2)} ${currency}`;
  };

  const formatWithEquivalent = (amountOriginal, amountConverted, currency) => {
    if (currency === displayCurrency || !amountConverted) {
      return (
        <span className="font-medium">
          {formatAmount(amountOriginal, currency)}
        </span>
      );
    }
    
    return (
      <div className="flex flex-col items-end">
        <span className="font-medium">{formatAmount(amountOriginal, currency)}</span>
        <span className="text-xs text-gray-500">
          ≈ {formatAmount(amountConverted, displayCurrency)}
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">
          <i className="fas fa-calculator mr-3 text-blue-600"></i>
          Gestión de Presupuesto
        </h2>
      </div>

      {/* Selector de mes y acciones */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-3">
            <label className="text-gray-700 font-medium">
              <i className="fas fa-calendar-alt mr-2"></i>
              Mes:
            </label>
            <select
              value={selectedBudgetMonth}
              onChange={(e) => setSelectedBudgetMonth(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {availableMonths.map(month => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCopyPreviousMonth}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all"
            >
              <i className="fas fa-copy mr-2"></i>
              Copiar Mes Anterior
            </button>
            <button
              onClick={handleClearMonth}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all"
            >
              <i className="fas fa-trash mr-2"></i>
              Limpiar Mes
            </button>
          </div>
        </div>
      </div>

      {/* YNAB Banner */}
      <YNABBanner onConfigureIncome={() => setShowConfigureIncome(true)} />

      {/* Categorías agrupadas */}
      {Object.entries(groupedCategories).map(([group, cats]) => (
        <div key={group} className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4">
            <h3 className="text-xl font-bold text-white flex items-center">
              <span className="mr-2">{cats[0]?.icon || '📁'}</span>
              {group}
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cats.map(cat => {
                const percentage = getPercentage(cat.spentInDisplayCurrency, cat.budgetInDisplayCurrency);
                const availableOriginal = cat.budgetOriginal - cat.spentOriginal;
                const availableConverted = cat.budgetInDisplayCurrency - cat.spentInDisplayCurrency;
                
                return (
                  <div 
                    key={cat.id} 
                    className="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">{cat.icon || '📁'}</span>
                        <h4 className="font-semibold text-gray-800">{cat.name}</h4>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        percentage >= 100 
                          ? 'bg-red-100 text-red-800' 
                          : percentage >= 80 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {percentage.toFixed(0)}%
                      </span>
                    </div>

                    <div className="space-y-2 mb-3">
                      {/* Presupuesto editable */}
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Presupuesto:</span>
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            step="0.01"
                            value={cat.budgetOriginal || 0}
                            onChange={(e) => handleBudgetChange(cat.id, parseFloat(e.target.value) || 0)}
                            className="w-24 text-right font-medium px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-gray-500 text-xs">{cat.currency}</span>
                        </div>
                      </div>

                      {/* Equivalente si es diferente moneda */}
                      {cat.currency !== displayCurrency && (
                        <div className="flex justify-between text-xs text-gray-500 pl-4">
                          <span>Equivalente:</span>
                          <span>≈ {formatAmount(cat.budgetInDisplayCurrency, displayCurrency)}</span>
                        </div>
                      )}

                      {/* Gastado */}
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Gastado:</span>
                        <div className="text-right text-red-600">
                          {formatWithEquivalent(cat.spentOriginal, cat.spentInDisplayCurrency, cat.currency)}
                        </div>
                      </div>

                      {/* Disponible */}
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Disponible:</span>
                        <div className={`text-right ${availableOriginal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatWithEquivalent(availableOriginal, availableConverted, cat.currency)}
                        </div>
                      </div>
                    </div>

                    {/* Barra de progreso */}
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className={`h-2.5 rounded-full transition-all duration-300 ${getStatusColor(cat.spentInDisplayCurrency, cat.budgetInDisplayCurrency)}`} 
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ))}

      {/* Info sobre conversión de monedas */}
      {categoriesWithMonthlyBudget.some(cat => cat.currency !== displayCurrency) && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-800">
            <i className="fas fa-info-circle mr-2"></i>
            <strong>Conversión de Monedas:</strong> Los presupuestos se muestran en su moneda original, 
            con equivalente en {displayCurrency}. Los cálculos de porcentaje usan valores convertidos para precisión.
          </p>
        </div>
      )}

      {/* Modal de configuración de ingreso */}
      <ConfigureIncomeModal
        isOpen={showConfigureIncome}
        onClose={() => setShowConfigureIncome(false)}
      />
    </div>
  );
}