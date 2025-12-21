// src/views/Budget/YNABBanner.jsx
// ✅ M20: CORREGIDO - Con conversión de moneda en todos los cálculos
import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';

export default function YNABBanner({ onConfigureIncome }) {
  const { 
    categories,
    categoriesWithMonthlyBudget, 
    ynabConfig, 
    displayCurrency,
    selectedBudgetMonth,
    transactions,
    convertCurrency
  } = useApp();

  // ✅ M20: Total presupuestado YA viene convertido en categoriesWithMonthlyBudget
  const totalBudgeted = useMemo(() => {
    return categoriesWithMonthlyBudget
      .filter(cat => cat.type === 'expense') // Solo gastos
      .reduce((sum, cat) => sum + cat.budgetInDisplayCurrency, 0);
  }, [categoriesWithMonthlyBudget]);

  // ✅ M18.3: Calcular el ingreso REAL del mes desde transacciones
  const realIncome = useMemo(() => {
    const [year, month] = selectedBudgetMonth.split('-');
    const monthStart = new Date(parseInt(year), parseInt(month) - 1, 1);
    const monthEnd = new Date(parseInt(year), parseInt(month), 0);
    
    // Filtrar categorías de tipo income
    const incomeCategories = categories
      .filter(c => c.type === 'income')
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

  // ✅ M18.3: Cálculo del dinero sin asignar usa INGRESO REAL
  const unassignedMoney = useMemo(() => {
    return realIncome - totalBudgeted;
  }, [realIncome, totalBudgeted]);

  // Determinar color y estado
  const isPositive = unassignedMoney >= 0;
  const isZero = Math.abs(unassignedMoney) < 0.01; // Tolerancia para redondeo
  const isOverBudget = unassignedMoney < -0.01;

  // Formatear el nombre del mes seleccionado
  const selectedMonthName = useMemo(() => {
    const [year, month] = selectedBudgetMonth.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' });
  }, [selectedBudgetMonth]);

  // Si no hay ingreso configurado, mostrar mensaje especial
  if (!ynabConfig.monthlyIncome || ynabConfig.monthlyIncome === 0) {
    return (
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl p-6 shadow-lg mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center mb-2">
              <i className="fas fa-exclamation-triangle text-yellow-600 text-2xl mr-3"></i>
              <h3 className="text-xl font-bold text-gray-800">¡Configura tu Ingreso Mensual!</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Para usar el método YNAB y saber cuánto dinero te queda por asignar, primero debes configurar tu ingreso mensual.
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
              <h3 className="text-lg font-semibold text-gray-700">Dinero Sin Asignar (YNAB)</h3>
              <p className="text-xs text-gray-500">{selectedMonthName}</p>
            </div>
          </div>
          
          <div className="mb-3">
            <p className={`text-4xl font-bold ${
              isOverBudget ? 'text-red-600' : isZero ? 'text-blue-600' : 'text-green-600'
            }`}>
              {unassignedMoney >= 0 ? '+' : ''}{unassignedMoney.toFixed(2)} {displayCurrency}
            </p>
          </div>

          {/* ✅ M18.3: Desglose mejorado con ingreso esperado vs real */}
          <div className="grid grid-cols-3 gap-4 text-sm mb-3">
            <div>
              <p className="text-gray-600">Ingreso Esperado:</p>
              <p className="font-semibold text-gray-800">
                {ynabConfig.monthlyIncome.toFixed(2)} {displayCurrency}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Ingreso Real:</p>
              <p className={`font-semibold ${
                realIncome >= ynabConfig.monthlyIncome ? 'text-green-600' : 'text-orange-600'
              }`}>
                {realIncome.toFixed(2)} {displayCurrency}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Total Presupuestado:</p>
              <p className="font-semibold text-gray-800">
                {totalBudgeted.toFixed(2)} {displayCurrency}
              </p>
            </div>
          </div>

          {/* ✅ M18.3: Barra de progreso de ingresos */}
          {ynabConfig.monthlyIncome > 0 && (
            <div className="p-3 bg-white bg-opacity-50 rounded-lg mb-3">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Progreso Ingresos</span>
                <span>{((realIncome / ynabConfig.monthlyIncome) * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all ${
                    realIncome >= ynabConfig.monthlyIncome ? 'bg-green-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${Math.min((realIncome / ynabConfig.monthlyIncome) * 100, 100)}%` }}
                ></div>
              </div>
              {realIncome < ynabConfig.monthlyIncome && (
                <p className="text-xs text-gray-500 mt-1">
                  Faltan {(ynabConfig.monthlyIncome - realIncome).toFixed(2)} {displayCurrency} para el esperado
                </p>
              )}
              {realIncome > ynabConfig.monthlyIncome && (
                <p className="text-xs text-green-600 mt-1">
                  <i className="fas fa-arrow-up mr-1"></i>
                  ¡Has ganado {(realIncome - ynabConfig.monthlyIncome).toFixed(2)} {displayCurrency} más de lo esperado!
                </p>
              )}
            </div>
          )}

          {/* Mensaje de estado */}
          <div className="mt-3">
            {isOverBudget ? (
              <p className="text-sm text-red-700 font-medium">
                <i className="fas fa-exclamation-circle mr-1"></i>
                ¡Atención! Has presupuestado más de lo que has ganado este mes. Ajusta tus categorías.
              </p>
            ) : isZero ? (
              <p className="text-sm text-blue-700 font-medium">
                <i className="fas fa-check-circle mr-1"></i>
                ¡Perfecto! Has asignado todo tu ingreso real a categorías.
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
            Ajustar Ingreso
          </button>
          
          {/* Indicador visual de porcentaje */}
          <div className="text-center">
            <p className="text-xs text-gray-600 mb-1">Presupuestado vs Real</p>
            <p className={`text-lg font-bold ${
              isOverBudget ? 'text-red-600' : isZero ? 'text-blue-600' : 'text-green-600'
            }`}>
              {realIncome > 0 
                ? ((totalBudgeted / realIncome) * 100).toFixed(1) 
                : 0}%
            </p>
          </div>
        </div>
      </div>

      {/* Barra de progreso de presupuesto */}
      <div className="mt-4">
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div 
            className={`h-3 rounded-full transition-all duration-500 ${
              isOverBudget 
                ? 'bg-red-500' 
                : isZero 
                ? 'bg-blue-500' 
                : 'bg-green-500'
            }`}
            style={{ 
              width: `${realIncome > 0 ? Math.min((totalBudgeted / realIncome) * 100, 100) : 0}%` 
            }}
          ></div>
        </div>
      </div>

      {/* ✅ M20: Info de conversión multi-moneda */}
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