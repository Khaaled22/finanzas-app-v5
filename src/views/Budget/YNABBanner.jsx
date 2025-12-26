// src/views/Budget/YNABBanner.jsx
// ✅ M36 Fase 3: Lógica REAL vs PLAN para Sin Asignar
// - Mes pasado/actual: usa ingreso REAL (transacciones)
// - Mes futuro: usa ingreso PLANIFICADO (ynabConfig o override)

import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatNumber } from '../../utils/formatters';

export default function YNABBanner({ onConfigureIncome, isPlanMonth = false }) {
  const { 
    categories,
    categoriesWithMonthlyBudget, 
    ynabConfig, 
    displayCurrency,
    selectedBudgetMonth,
    transactions,
    convertCurrency,
    totals,
    isOperatingExpense,
    isDebtPayment,
    isInvestmentContribution
  } = useApp();

  // ✅ M36: Total presupuestado separado por tipo
  const budgetTotals = useMemo(() => {
    const operating = categoriesWithMonthlyBudget
      .filter(isOperatingExpense)
      .reduce((sum, cat) => sum + cat.budgetInDisplayCurrency, 0);
    
    const debt = categoriesWithMonthlyBudget
      .filter(isDebtPayment)
      .reduce((sum, cat) => sum + cat.budgetInDisplayCurrency, 0);
    
    const investment = categoriesWithMonthlyBudget
      .filter(isInvestmentContribution)
      .reduce((sum, cat) => sum + cat.budgetInDisplayCurrency, 0);
    
    const total = operating + debt + investment;
    
    return { operating, debt, investment, total };
  }, [categoriesWithMonthlyBudget, isOperatingExpense, isDebtPayment, isInvestmentContribution]);

  // ✅ M36 Fase 3: Calcular ingreso REAL del mes desde transacciones
  const realIncome = useMemo(() => {
    const [year, month] = selectedBudgetMonth.split('-');
    const monthStart = new Date(parseInt(year), parseInt(month) - 1, 1);
    const monthEnd = new Date(parseInt(year), parseInt(month), 0);
    
    // Filtrar categorías de tipo income
    const incomeCategories = categories
      .filter(c => c.type === 'income' || c.flowKind === 'INCOME')
      .map(c => c.id);
    
    // Sumar transacciones de income del mes seleccionado
    return transactions
      .filter(t => {
        const tDate = new Date(t.date);
        return incomeCategories.includes(t.categoryId) &&
               tDate >= monthStart &&
               tDate <= monthEnd;
      })
      .reduce((sum, t) => 
        sum + convertCurrency(t.amount, t.currency, displayCurrency), 0
      );
  }, [transactions, categories, selectedBudgetMonth, displayCurrency, convertCurrency]);

  // ✅ M36 Fase 3: Ingreso planificado (para meses futuros)
  const plannedIncome = useMemo(() => {
    // TODO: Implementar monthlyIncomeOverrides para permitir diferentes ingresos por mes
    // Por ahora usa ynabConfig.monthlyIncome global
    return convertCurrency(
      ynabConfig.monthlyIncome || 0, 
      ynabConfig.currency || displayCurrency, 
      displayCurrency
    );
  }, [ynabConfig, displayCurrency, convertCurrency]);

  // ✅ M36 Fase 3: Ingreso a usar según si es mes PLAN o REAL
  const incomeToUse = isPlanMonth ? plannedIncome : realIncome;
  const incomeLabel = isPlanMonth ? 'Ingreso Planificado' : 'Ingreso Real';

  // ✅ M36 Fase 3: Cálculo del dinero sin asignar
  const unassignedMoney = useMemo(() => {
    return incomeToUse - budgetTotals.total;
  }, [incomeToUse, budgetTotals.total]);

  // Determinar color y estado
  const isPositive = unassignedMoney >= 0;
  const isZero = Math.abs(unassignedMoney) < 0.01;
  const isOverBudget = unassignedMoney < -0.01;

  // Formatear el nombre del mes seleccionado
  const selectedMonthName = useMemo(() => {
    const [year, month] = selectedBudgetMonth.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' });
  }, [selectedBudgetMonth]);

  // Si no hay ingreso configurado Y es mes PLAN, mostrar mensaje especial
  if (isPlanMonth && (!ynabConfig.monthlyIncome || ynabConfig.monthlyIncome === 0)) {
    return (
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl p-6 shadow-lg mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center mb-2">
              <i className="fas fa-exclamation-triangle text-yellow-600 text-2xl mr-3"></i>
              <h3 className="text-xl font-bold text-gray-800">Configura tu Ingreso Planificado</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Para planificar meses futuros, primero configura tu ingreso mensual esperado.
            </p>
          </div>
          <button
            onClick={onConfigureIncome}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-lg font-medium transition-all transform hover:scale-105 shadow-md"
          >
            <i className="fas fa-cog mr-2"></i>
            Configurar Ingreso
          </button>
        </div>
      </div>
    );
  }

  // Si es mes REAL y no hay transacciones de ingreso, mostrar mensaje diferente
  if (!isPlanMonth && realIncome === 0) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-6 shadow-lg mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center mb-2">
              <i className="fas fa-info-circle text-blue-600 text-2xl mr-3"></i>
              <h3 className="text-xl font-bold text-gray-800">Sin Ingresos Registrados</h3>
            </div>
            <p className="text-gray-600 text-sm">
              No hay transacciones de ingreso en {selectedMonthName}. 
              Registra tus ingresos para calcular el dinero sin asignar.
            </p>
            <p className="text-xs text-gray-500 mt-2">
              <i className="fas fa-lightbulb mr-1"></i>
              Tip: Crea una transacción con una categoría de tipo "Income"
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">Ingreso Esperado</p>
            <p className="text-2xl font-bold text-gray-400">
              {formatNumber(plannedIncome)} {displayCurrency}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`rounded-xl p-6 shadow-lg mb-6 border-2 transition-all ${
        isOverBudget 
          ? 'bg-gradient-to-r from-red-50 to-pink-50 border-red-300' 
          : isZero
          ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-300'
          : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300'
      }`}
    >
      <div className="flex items-center justify-between flex-wrap gap-4">
        {/* Información principal */}
        <div className="flex-1 min-w-[250px]">
          <div className="flex items-center mb-2">
            <i className={`fas fa-wallet text-2xl mr-3 ${
              isOverBudget ? 'text-red-600' : isZero ? 'text-blue-600' : 'text-green-600'
            }`}></i>
            <div>
              <h3 className="text-lg font-semibold text-gray-700">
                Dinero Sin Asignar
                {isPlanMonth && <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">PLAN</span>}
              </h3>
              <p className="text-xs text-gray-500">{selectedMonthName}</p>
            </div>
          </div>
          
          <div className="mb-3">
            <p className={`text-4xl font-bold ${
              isOverBudget ? 'text-red-600' : isZero ? 'text-blue-600' : 'text-green-600'
            }`}>
              {unassignedMoney >= 0 ? '+' : ''}{formatNumber(unassignedMoney)} {displayCurrency}
            </p>
          </div>

          {/* ✅ M36 Fase 3: Desglose mejorado */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
            <div className="bg-white bg-opacity-50 rounded-lg p-2">
              <p className="text-gray-600 text-xs">{incomeLabel}:</p>
              <p className={`font-semibold ${isPlanMonth ? 'text-amber-600' : 'text-green-600'}`}>
                {formatNumber(incomeToUse)} {displayCurrency}
              </p>
            </div>
            <div className="bg-white bg-opacity-50 rounded-lg p-2">
              <p className="text-gray-600 text-xs">🛒 Operativo:</p>
              <p className="font-semibold text-gray-800">
                {formatNumber(budgetTotals.operating)}
              </p>
            </div>
            <div className="bg-white bg-opacity-50 rounded-lg p-2">
              <p className="text-gray-600 text-xs">💳 Deuda:</p>
              <p className="font-semibold text-orange-600">
                {formatNumber(budgetTotals.debt)}
              </p>
            </div>
            <div className="bg-white bg-opacity-50 rounded-lg p-2">
              <p className="text-gray-600 text-xs">📈 Inversión:</p>
              <p className="font-semibold text-purple-600">
                {formatNumber(budgetTotals.investment)}
              </p>
            </div>
          </div>

          {/* ✅ M36: Comparación Real vs Esperado (solo para meses no PLAN) */}
          {!isPlanMonth && plannedIncome > 0 && (
            <div className="p-3 bg-white bg-opacity-50 rounded-lg mb-3">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Real vs Esperado</span>
                <span>{((realIncome / plannedIncome) * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all ${
                    realIncome >= plannedIncome ? 'bg-green-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${Math.min((realIncome / plannedIncome) * 100, 100)}%` }}
                ></div>
              </div>
              {realIncome < plannedIncome && (
                <p className="text-xs text-gray-500 mt-1">
                  Faltan {formatNumber(plannedIncome - realIncome)} {displayCurrency} para el esperado
                </p>
              )}
              {realIncome > plannedIncome && (
                <p className="text-xs text-green-600 mt-1">
                  <i className="fas fa-arrow-up mr-1"></i>
                  +{formatNumber(realIncome - plannedIncome)} {displayCurrency} extra
                </p>
              )}
            </div>
          )}

          {/* Mensaje de estado */}
          <div className="mt-3">
            {isOverBudget ? (
              <p className="text-sm text-red-700 font-medium">
                <i className="fas fa-exclamation-circle mr-1"></i>
                {isPlanMonth 
                  ? '¡Estás planificando más de tu ingreso esperado!'
                  : '¡Has presupuestado más de lo que has ganado este mes!'}
              </p>
            ) : isZero ? (
              <p className="text-sm text-blue-700 font-medium">
                <i className="fas fa-check-circle mr-1"></i>
                ¡Perfecto! Has asignado todo tu {isPlanMonth ? 'ingreso planificado' : 'ingreso real'}.
              </p>
            ) : (
              <p className="text-sm text-green-700 font-medium">
                <i className="fas fa-info-circle mr-1"></i>
                Tienes dinero disponible para asignar a más categorías.
              </p>
            )}
          </div>
        </div>

        {/* Botón de configuración */}
        <div className="flex flex-col gap-2">
          <button
            onClick={onConfigureIncome}
            className={`px-6 py-3 rounded-lg font-medium transition-all transform hover:scale-105 shadow-md ${
              isOverBudget 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <i className="fas fa-cog mr-2"></i>
            {isPlanMonth ? 'Ajustar Plan' : 'Ajustar Ingreso'}
          </button>
          
          {/* Indicador visual */}
          <div className="text-center">
            <p className="text-xs text-gray-600 mb-1">Asignado</p>
            <p className={`text-lg font-bold ${
              isOverBudget ? 'text-red-600' : isZero ? 'text-blue-600' : 'text-green-600'
            }`}>
              {incomeToUse > 0 
                ? ((budgetTotals.total / incomeToUse) * 100).toFixed(1) 
                : 0}%
            </p>
          </div>
        </div>
      </div>

      {/* Barra de progreso de presupuesto */}
      <div className="mt-4">
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden flex">
          {/* Operativo */}
          <div 
            className="h-3 bg-red-400 transition-all"
            style={{ 
              width: `${incomeToUse > 0 ? (budgetTotals.operating / incomeToUse) * 100 : 0}%` 
            }}
            title={`Operativo: ${formatNumber(budgetTotals.operating)}`}
          ></div>
          {/* Deuda */}
          <div 
            className="h-3 bg-orange-400 transition-all"
            style={{ 
              width: `${incomeToUse > 0 ? (budgetTotals.debt / incomeToUse) * 100 : 0}%` 
            }}
            title={`Deuda: ${formatNumber(budgetTotals.debt)}`}
          ></div>
          {/* Inversión */}
          <div 
            className="h-3 bg-purple-400 transition-all"
            style={{ 
              width: `${incomeToUse > 0 ? (budgetTotals.investment / incomeToUse) * 100 : 0}%` 
            }}
            title={`Inversión: ${formatNumber(budgetTotals.investment)}`}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>🛒 Operativo</span>
          <span>💳 Deuda</span>
          <span>📈 Inversión</span>
        </div>
      </div>

      {/* Info de conversión multi-moneda */}
      {categoriesWithMonthlyBudget.some(cat => cat.currency !== displayCurrency) && (
        <div className="mt-4 pt-4 border-t border-gray-300">
          <p className="text-xs text-gray-600">
            <i className="fas fa-info-circle mr-1"></i>
            Los totales incluyen conversión de múltiples monedas a {displayCurrency}
          </p>
        </div>
      )}
    </div>
  );
}