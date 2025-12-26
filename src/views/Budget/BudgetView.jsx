// src/views/Budget/BudgetView.jsx
// ✅ M36 Fase 3: Diseño mejorado manteniendo estilo original + nuevas funcionalidades
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
    clearMonthlyBudgets,
    isOperatingExpense,
    isDebtPayment,
    isInvestmentContribution,
    isIncome
  } = useApp();
  
  const [showConfigureIncome, setShowConfigureIncome] = useState(false);
  const [filterGroup, setFilterGroup] = useState('all');
  const [filterFlowKind, setFilterFlowKind] = useState('all');
  const [viewMode, setViewMode] = useState('cards');
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

  // ✅ M36: Detectar status del mes
  const monthStatus = useMemo(() => {
    const now = new Date();
    const [selectedYear, selectedMonth] = selectedBudgetMonth.split('-').map(Number);
    const selectedDate = new Date(selectedYear, selectedMonth - 1, 1);
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    if (selectedDate > currentMonthStart) {
      return { isPlan: true, label: 'PLAN', color: 'bg-amber-500', textColor: 'text-amber-600' };
    }
    if (selectedDate.getTime() === currentMonthStart.getTime()) {
      return { isPlan: false, label: 'ACTUAL', color: 'bg-blue-500', textColor: 'text-blue-600' };
    }
    return { isPlan: false, label: 'REAL', color: 'bg-green-500', textColor: 'text-green-600' };
  }, [selectedBudgetMonth]);

  // Obtener grupos únicos
  const uniqueGroups = useMemo(() => {
    const groups = new Set();
    categoriesWithMonthlyBudget
      .filter(cat => !isIncome(cat))
      .forEach(cat => groups.add(cat.group));
    return Array.from(groups).sort();
  }, [categoriesWithMonthlyBudget, isIncome]);

  // Filtrar categorías
  const filteredCategories = useMemo(() => {
    let cats = categoriesWithMonthlyBudget.filter(cat => !isIncome(cat));
    
    if (filterFlowKind !== 'all') {
      if (filterFlowKind === 'OPERATING_EXPENSE') cats = cats.filter(isOperatingExpense);
      else if (filterFlowKind === 'DEBT_PAYMENT') cats = cats.filter(isDebtPayment);
      else if (filterFlowKind === 'INVESTMENT_CONTRIBUTION') cats = cats.filter(isInvestmentContribution);
    }
    
    if (filterGroup !== 'all') {
      cats = cats.filter(cat => cat.group === filterGroup);
    }
    
    if (showOnlyWithBudget) {
      cats = cats.filter(cat => cat.budgetOriginal > 0);
    }
    
    return cats;
  }, [categoriesWithMonthlyBudget, filterGroup, filterFlowKind, showOnlyWithBudget, isOperatingExpense, isDebtPayment, isInvestmentContribution, isIncome]);

  // Agrupar categorías
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
    
    // Por flowKind (de todas las categorías, no filtradas)
    const allCats = categoriesWithMonthlyBudget;
    const operatingSpent = allCats.filter(isOperatingExpense).reduce((s, c) => s + (c.spentInDisplayCurrency || 0), 0);
    const debtSpent = allCats.filter(isDebtPayment).reduce((s, c) => s + (c.spentInDisplayCurrency || 0), 0);
    const investmentSpent = allCats.filter(isInvestmentContribution).reduce((s, c) => s + (c.spentInDisplayCurrency || 0), 0);
    
    return { budgeted, spent, available, percentUsed, operatingSpent, debtSpent, investmentSpent };
  }, [filteredCategories, categoriesWithMonthlyBudget, isOperatingExpense, isDebtPayment, isInvestmentContribution]);

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

  const getFlowKindBadge = (cat) => {
    if (isDebtPayment(cat)) return { label: '💳', color: 'bg-orange-100 text-orange-700', title: 'Pago Deuda' };
    if (isInvestmentContribution(cat)) return { label: '📈', color: 'bg-purple-100 text-purple-700', title: 'Inversión' };
    return null; // No mostrar badge para operativos (son el default)
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
    }
  };

  const handleClearMonth = () => {
    const monthName = availableMonths.find(m => m.value === selectedBudgetMonth)?.label || selectedBudgetMonth;
    if (window.confirm(`⚠️ ¿Limpiar presupuestos de ${monthName}?`)) {
      clearMonthlyBudgets(selectedBudgetMonth);
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
            Asigna cada euro a un trabajo específico
          </p>
        </div>
        <button
          onClick={() => setShowConfigureIncome(true)}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-lg hover:shadow-xl"
        >
          <i className="fas fa-cog mr-2"></i>
          Configurar Ingreso
        </button>
      </div>

      {/* ✅ Selector de mes con badge y acciones */}
      <div className="bg-white rounded-xl shadow-lg p-5">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <i className="fas fa-calendar-alt text-blue-600 text-lg"></i>
              <select
                value={selectedBudgetMonth}
                onChange={(e) => setSelectedBudgetMonth(e.target.value)}
                className="px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium text-gray-700"
              >
                {availableMonths.map(month => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Badge REAL/PLAN/ACTUAL */}
            <span className={`px-4 py-1.5 rounded-full text-xs font-bold text-white ${monthStatus.color} shadow-sm`}>
              {monthStatus.label}
            </span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCopyPreviousMonth}
              className="px-4 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl font-medium transition-all text-sm shadow-md hover:shadow-lg"
            >
              <i className="fas fa-copy mr-2"></i>
              Copiar Anterior
            </button>
            <button
              onClick={handleClearMonth}
              className="px-4 py-2.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl font-medium transition-all text-sm"
            >
              <i className="fas fa-trash mr-2"></i>
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {/* ✅ Métricas principales - Estilo original mejorado */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-lg border-l-4 border-blue-500 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium mb-1">Total Presupuestado</p>
              <p className="text-2xl font-bold text-gray-800">{formatNumber(totals.budgeted)}</p>
              <p className="text-xs text-gray-400 mt-1">{displayCurrency}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <i className="fas fa-wallet text-blue-600 text-xl"></i>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-xl shadow-lg border-l-4 border-red-500 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium mb-1">Total Gastado</p>
              <p className="text-2xl font-bold text-red-600">{formatNumber(totals.spent)}</p>
              <p className="text-xs text-gray-400 mt-1">{totals.percentUsed.toFixed(0)}% del presupuesto</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <i className="fas fa-credit-card text-red-600 text-xl"></i>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-xl shadow-lg border-l-4 border-green-500 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium mb-1">Disponible</p>
              <p className={`text-2xl font-bold ${totals.available >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatNumber(totals.available)}
              </p>
              <p className="text-xs text-gray-400 mt-1">{displayCurrency}</p>
            </div>
            <div className={`w-12 h-12 ${totals.available >= 0 ? 'bg-green-100' : 'bg-red-100'} rounded-xl flex items-center justify-center`}>
              <i className={`fas fa-piggy-bank ${totals.available >= 0 ? 'text-green-600' : 'text-red-600'} text-xl`}></i>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-xl shadow-lg border-l-4 border-purple-500 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium mb-1">Uso del Presupuesto</p>
              <p className={`text-2xl font-bold ${totals.percentUsed <= 100 ? 'text-purple-600' : 'text-red-600'}`}>
                {totals.percentUsed.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {filteredCategories.length} categorías • {filteredCategories.filter(c => c.budgetOriginal > 0).length} con presupuesto
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <i className="fas fa-chart-pie text-purple-600 text-xl"></i>
            </div>
          </div>
          {/* Mini barra de progreso */}
          <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all ${totals.percentUsed <= 80 ? 'bg-green-500' : totals.percentUsed <= 100 ? 'bg-yellow-500' : 'bg-red-500'}`}
              style={{ width: `${Math.min(totals.percentUsed, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* YNAB Banner */}
      <YNABBanner 
        onConfigureIncome={() => setShowConfigureIncome(true)} 
        isPlanMonth={monthStatus.isPlan}
      />

      {/* ✅ Filtros - Estilo pill buttons original */}
      <div className="bg-white p-5 rounded-xl shadow-lg">
        <div className="space-y-4">
          {/* Filtro por tipo de flujo */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm text-gray-500 font-medium mr-2">Tipo:</span>
            {[
              { value: 'all', label: 'Todos', icon: '📊' },
              { value: 'OPERATING_EXPENSE', label: 'Operativos', icon: '🛒' },
              { value: 'DEBT_PAYMENT', label: 'Deuda', icon: '💳' },
              { value: 'INVESTMENT_CONTRIBUTION', label: 'Inversión', icon: '📈' }
            ].map(item => (
              <button
                key={item.value}
                onClick={() => setFilterFlowKind(item.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  filterFlowKind === item.value
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span className="mr-1">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>

          {/* Filtro por grupo */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm text-gray-500 font-medium mr-2">Grupo:</span>
            <button
              onClick={() => setFilterGroup('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                filterGroup === 'all'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Todos los grupos
            </button>
            {uniqueGroups.slice(0, 8).map(group => (
              <button
                key={group}
                onClick={() => setFilterGroup(group)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  filterGroup === group
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {group}
              </button>
            ))}
            {uniqueGroups.length > 8 && (
              <select
                value={filterGroup}
                onChange={(e) => setFilterGroup(e.target.value)}
                className="px-3 py-2 rounded-full text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Más grupos...</option>
                {uniqueGroups.slice(8).map(group => (
                  <option key={group} value={group}>{group}</option>
                ))}
              </select>
            )}
          </div>

          {/* Opciones adicionales */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer hover:text-gray-800">
              <input
                type="checkbox"
                checked={showOnlyWithBudget}
                onChange={(e) => setShowOnlyWithBudget(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Solo categorías con presupuesto asignado
            </label>
            
            <div className="flex border-2 border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setViewMode('cards')}
                className={`px-4 py-2 transition-all ${viewMode === 'cards' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                title="Vista de tarjetas"
              >
                <i className="fas fa-th-large"></i>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-4 py-2 transition-all ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                title="Vista de tabla"
              >
                <i className="fas fa-list"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Vista de tabla */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Categoría</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Grupo</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Presupuesto</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Gastado</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Disponible</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Progreso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCategories.map(cat => {
                  const percentage = getPercentage(cat.spentInDisplayCurrency, cat.budgetInDisplayCurrency);
                  const available = cat.budgetOriginal - cat.spentOriginal;
                  const badge = getStatusBadge(cat.spentInDisplayCurrency, cat.budgetInDisplayCurrency);
                  const flowBadge = getFlowKindBadge(cat);
                  
                  return (
                    <tr key={cat.id} className="hover:bg-blue-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{cat.icon || '📁'}</span>
                          <div>
                            <span className="font-medium text-gray-800">{cat.name}</span>
                            {flowBadge && (
                              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${flowBadge.color}`} title={flowBadge.title}>
                                {flowBadge.label}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600">
                          {cat.group}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <input
                            type="number"
                            step="0.01"
                            value={cat.budgetOriginal || 0}
                            onChange={(e) => handleBudgetChange(cat.id, parseFloat(e.target.value) || 0)}
                            className="w-28 text-right font-medium px-3 py-1.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <span className="text-xs text-gray-400 w-8">{cat.currency}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-medium text-red-600">
                          {formatNumber(cat.spentOriginal)}
                        </span>
                        <span className="text-xs text-gray-400 ml-1">{cat.currency}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`font-bold ${available >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatNumber(available)}
                        </span>
                        <span className="text-xs text-gray-400 ml-1">{cat.currency}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 min-w-[80px]">
                            <div 
                              className={`h-2 rounded-full transition-all ${getStatusColor(cat.spentInDisplayCurrency, cat.budgetInDisplayCurrency)}`}
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            ></div>
                          </div>
                          <span className={`text-xs font-bold px-2 py-1 rounded-full min-w-[45px] text-center ${badge.bg} ${badge.text}`}>
                            {percentage.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        // Vista de cards agrupadas - Estilo original mejorado
        <div className="space-y-6">
          {Object.entries(groupedCategories).map(([group, cats]) => (
            <div key={group} className="bg-white rounded-xl shadow-lg overflow-hidden">
              {/* Header del grupo con gradiente */}
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white flex items-center">
                    <span className="mr-3 text-2xl">{cats[0]?.icon || '📁'}</span>
                    {group}
                  </h3>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-white/80">
                      {cats.length} categoría{cats.length !== 1 ? 's' : ''}
                    </span>
                    <span className="bg-white/20 px-3 py-1 rounded-full text-sm text-white font-medium">
                      {formatNumber(cats.reduce((s, c) => s + (c.spentInDisplayCurrency || 0), 0))} / {formatNumber(cats.reduce((s, c) => s + (c.budgetInDisplayCurrency || 0), 0))}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Grid de categorías */}
              <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cats.map(cat => {
                    const percentage = getPercentage(cat.spentInDisplayCurrency, cat.budgetInDisplayCurrency);
                    const available = cat.budgetOriginal - cat.spentOriginal;
                    const badge = getStatusBadge(cat.spentInDisplayCurrency, cat.budgetInDisplayCurrency);
                    const flowBadge = getFlowKindBadge(cat);
                    
                    return (
                      <div 
                        key={cat.id} 
                        className="bg-gradient-to-br from-gray-50 to-white p-4 rounded-xl border border-gray-200 hover:shadow-lg hover:border-blue-300 transition-all"
                      >
                        {/* Header de la tarjeta */}
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            <span className="text-3xl">{cat.icon || '📁'}</span>
                            <div>
                              <h4 className="font-semibold text-gray-800">{cat.name}</h4>
                              {flowBadge && (
                                <span className={`text-xs px-2 py-0.5 rounded-full ${flowBadge.color}`}>
                                  {flowBadge.title}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-bold ${badge.bg} ${badge.text}`}>
                            {percentage.toFixed(0)}%
                          </span>
                        </div>

                        {/* Datos */}
                        <div className="space-y-3 mb-4">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">Presupuesto:</span>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                step="0.01"
                                value={cat.budgetOriginal || 0}
                                onChange={(e) => handleBudgetChange(cat.id, parseFloat(e.target.value) || 0)}
                                className="w-24 text-right font-semibold px-2 py-1 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                              />
                              <span className="text-xs text-gray-400">{cat.currency}</span>
                            </div>
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">Gastado:</span>
                            <span className="font-semibold text-red-600">
                              {formatNumber(cat.spentOriginal)} <span className="text-xs text-gray-400">{cat.currency}</span>
                            </span>
                          </div>

                          <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                            <span className="text-sm font-medium text-gray-600">Disponible:</span>
                            <span className={`font-bold text-lg ${available >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatNumber(available)} <span className="text-xs font-normal text-gray-400">{cat.currency}</span>
                            </span>
                          </div>
                        </div>

                        {/* Barra de progreso */}
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className={`h-3 rounded-full transition-all duration-500 ${getStatusColor(cat.spentInDisplayCurrency, cat.budgetInDisplayCurrency)}`} 
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
        </div>
      )}

      {/* Mensaje si no hay categorías */}
      {filteredCategories.length === 0 && (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <i className="fas fa-folder-open text-6xl text-gray-300 mb-4"></i>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No hay categorías</h3>
          <p className="text-gray-500">
            {showOnlyWithBudget 
              ? 'No hay categorías con presupuesto asignado en este filtro.'
              : 'Ajusta los filtros o crea nuevas categorías en Ajustes.'}
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