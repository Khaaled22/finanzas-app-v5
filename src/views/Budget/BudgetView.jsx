// src/views/Budget/BudgetView.jsx
// ✅ M33: Mejorado con filtros por grupo y vista tabla/cards
import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatNumber } from '../../utils/formatters';
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
  const [filterGroup, setFilterGroup] = useState('all');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'
  const [showOnlyWithBudget, setShowOnlyWithBudget] = useState(false);

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

  // Obtener grupos únicos
  const uniqueGroups = useMemo(() => {
    const groups = new Set();
    categoriesWithMonthlyBudget
      .filter(cat => cat.type === 'expense')
      .forEach(cat => groups.add(cat.group));
    return Array.from(groups).sort();
  }, [categoriesWithMonthlyBudget]);

  // Filtrar categorías
  const filteredCategories = useMemo(() => {
    let cats = categoriesWithMonthlyBudget.filter(cat => cat.type === 'expense');
    
    if (filterGroup !== 'all') {
      cats = cats.filter(cat => cat.group === filterGroup);
    }
    
    if (showOnlyWithBudget) {
      cats = cats.filter(cat => cat.budgetOriginal > 0);
    }
    
    return cats;
  }, [categoriesWithMonthlyBudget, filterGroup, showOnlyWithBudget]);

  // Agrupar categorías filtradas
  const groupedCategories = useMemo(() => {
    const groups = {};
    filteredCategories.forEach(cat => {
      if (!groups[cat.group]) groups[cat.group] = [];
      groups[cat.group].push(cat);
    });
    return groups;
  }, [filteredCategories]);

  // Calcular totales
  const totals = useMemo(() => {
    const budgeted = filteredCategories.reduce((sum, cat) => sum + (cat.budgetInDisplayCurrency || 0), 0);
    const spent = filteredCategories.reduce((sum, cat) => sum + (cat.spentInDisplayCurrency || 0), 0);
    const available = budgeted - spent;
    const percentUsed = budgeted > 0 ? (spent / budgeted) * 100 : 0;
    
    return { budgeted, spent, available, percentUsed };
  }, [filteredCategories]);

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

  const getStatusBadge = (spent, budget) => {
    const percentage = getPercentage(spent, budget);
    if (percentage >= 100) return { bg: 'bg-red-100', text: 'text-red-800' };
    if (percentage >= 80) return { bg: 'bg-yellow-100', text: 'text-yellow-800' };
    return { bg: 'bg-green-100', text: 'text-green-800' };
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

  const handleClearMonth = () => {
    const monthName = availableMonths.find(m => m.value === selectedBudgetMonth)?.label || selectedBudgetMonth;
    
    if (window.confirm(`⚠️ ¿Estás seguro de limpiar todos los presupuestos de ${monthName}?\n\nEsta acción no se puede deshacer.`)) {
      clearMonthlyBudgets(selectedBudgetMonth);
      alert('✅ Presupuestos del mes limpiados.');
    }
  };

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">
            <i className="fas fa-calculator mr-3 text-blue-600"></i>
            Gestión de Presupuesto
          </h2>
          <p className="text-gray-600 mt-1">
            {filteredCategories.length} categoría{filteredCategories.length !== 1 ? 's' : ''} 
            {filterGroup !== 'all' && ` en ${filterGroup}`}
          </p>
        </div>
        <button
          onClick={() => setShowConfigureIncome(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all shadow-lg"
        >
          <i className="fas fa-cog mr-2"></i>
          Configurar Ingreso
        </button>
      </div>

      {/* Selector de mes y acciones */}
      <div className="bg-white rounded-xl shadow-md p-4">
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
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all text-sm"
            >
              <i className="fas fa-copy mr-2"></i>
              Copiar Anterior
            </button>
            <button
              onClick={handleClearMonth}
              className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium transition-all text-sm"
            >
              <i className="fas fa-trash mr-2"></i>
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-md border-l-4 border-blue-500">
          <p className="text-sm text-gray-600 mb-1">Presupuestado</p>
          <p className="text-2xl font-bold text-gray-800">{formatNumber(totals.budgeted)}</p>
          <p className="text-xs text-gray-500">{displayCurrency}</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-md border-l-4 border-red-500">
          <p className="text-sm text-gray-600 mb-1">Gastado</p>
          <p className="text-2xl font-bold text-red-600">{formatNumber(totals.spent)}</p>
          <p className="text-xs text-gray-500">{totals.percentUsed.toFixed(0)}% usado</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-md border-l-4 border-green-500">
          <p className="text-sm text-gray-600 mb-1">Disponible</p>
          <p className={`text-2xl font-bold ${totals.available >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatNumber(totals.available)}
          </p>
          <p className="text-xs text-gray-500">{displayCurrency}</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-md border-l-4 border-purple-500">
          <p className="text-sm text-gray-600 mb-1">Categorías</p>
          <p className="text-2xl font-bold text-gray-800">{filteredCategories.length}</p>
          <p className="text-xs text-gray-500">con presupuesto: {filteredCategories.filter(c => c.budgetOriginal > 0).length}</p>
        </div>
      </div>

      {/* YNAB Banner */}
      <YNABBanner onConfigureIncome={() => setShowConfigureIncome(true)} />

      {/* Filtros */}
      <div className="bg-white p-4 rounded-xl shadow-md">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterGroup('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterGroup === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Todos los grupos
            </button>
            {uniqueGroups.map(group => (
              <button
                key={group}
                onClick={() => setFilterGroup(group)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterGroup === group
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {group}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={showOnlyWithBudget}
                onChange={(e) => setShowOnlyWithBudget(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Solo con presupuesto
            </label>
            
            <div className="flex border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-2 ${viewMode === 'cards' ? 'bg-blue-100 text-blue-600' : 'text-gray-500'}`}
              >
                <i className="fas fa-th-large"></i>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-2 ${viewMode === 'table' ? 'bg-blue-100 text-blue-600' : 'text-gray-500'}`}
              >
                <i className="fas fa-list"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Vista de tabla */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Categoría</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Grupo</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Presupuesto</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Gastado</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Disponible</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCategories.map(cat => {
                  const percentage = getPercentage(cat.spentInDisplayCurrency, cat.budgetInDisplayCurrency);
                  const available = cat.budgetOriginal - cat.spentOriginal;
                  const badge = getStatusBadge(cat.spentInDisplayCurrency, cat.budgetInDisplayCurrency);
                  
                  return (
                    <tr key={cat.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{cat.icon || '📁'}</span>
                          <span className="font-medium text-gray-800">{cat.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-gray-100 rounded text-sm text-gray-600">
                          {cat.group}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <input
                          type="number"
                          step="0.01"
                          value={cat.budgetOriginal || 0}
                          onChange={(e) => handleBudgetChange(cat.id, parseFloat(e.target.value) || 0)}
                          className="w-24 text-right font-medium px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-xs text-gray-500 ml-1">{cat.currency}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-medium text-red-600">
                          {formatNumber(cat.spentOriginal)} {cat.currency}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`font-medium ${available >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatNumber(available)} {cat.currency}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${badge.bg} ${badge.text}`}>
                          {percentage.toFixed(0)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        // Vista de cards agrupadas
        Object.entries(groupedCategories).map(([group, cats]) => (
          <div key={group} className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4">
              <h3 className="text-xl font-bold text-white flex items-center">
                <span className="mr-2">{cats[0]?.icon || '📁'}</span>
                {group}
                <span className="ml-auto text-sm font-normal opacity-80">
                  {cats.length} categoría{cats.length !== 1 ? 's' : ''}
                </span>
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cats.map(cat => {
                  const percentage = getPercentage(cat.spentInDisplayCurrency, cat.budgetInDisplayCurrency);
                  const available = cat.budgetOriginal - cat.spentOriginal;
                  const badge = getStatusBadge(cat.spentInDisplayCurrency, cat.budgetInDisplayCurrency);
                  
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
                        <span className={`px-2 py-1 rounded text-xs font-medium ${badge.bg} ${badge.text}`}>
                          {percentage.toFixed(0)}%
                        </span>
                      </div>

                      <div className="space-y-2 mb-3">
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

                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Gastado:</span>
                          <span className="font-medium text-red-600">
                            {formatNumber(cat.spentOriginal)} {cat.currency}
                          </span>
                        </div>

                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Disponible:</span>
                          <span className={`font-medium ${available >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatNumber(available)} {cat.currency}
                          </span>
                        </div>
                      </div>

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
        ))
      )}

      {/* Modal de configuración de ingreso */}
      <ConfigureIncomeModal
        isOpen={showConfigureIncome}
        onClose={() => setShowConfigureIncome(false)}
      />
    </div>
  );
}