import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';

export default function NetWorthCard() {
  const { 
    transactions, 
    investments, 
    savingsGoals, 
    debts,
    displayCurrency,
    convertCurrency,
    categories 
  } = useApp();

  const netWorth = useMemo(() => {
    // 1. EFECTIVO: Ingresos - Gastos
    const incomeCategories = categories
      .filter(cat => cat.type === 'Ingreso')
      .map(cat => cat.id);
    
    const expenseCategories = categories
      .filter(cat => cat.type === 'Gasto')
      .map(cat => cat.id);

    const totalIncome = transactions
      .filter(t => incomeCategories.includes(t.categoryId))
      .reduce((sum, t) => sum + convertCurrency(t.amount, t.currency, displayCurrency), 0);

    const totalExpenses = transactions
      .filter(t => expenseCategories.includes(t.categoryId))
      .reduce((sum, t) => sum + convertCurrency(t.amount, t.currency, displayCurrency), 0);

    const cash = totalIncome - totalExpenses;

    // 2. INVERSIONES: Valor actual de todas las inversiones
    const investmentValue = investments.reduce((sum, inv) => {
      if (inv.platform && !inv.quantity) {
        // Plataforma
        return sum + convertCurrency(inv.currentBalance, inv.currency, displayCurrency);
      } else if (inv.quantity) {
        // Activo individual
        const value = inv.quantity * inv.currentPrice;
        return sum + convertCurrency(value, inv.currency, displayCurrency);
      }
      return sum;
    }, 0);

    // 3. AHORROS: Monto actual de metas de ahorro
    const savingsValue = savingsGoals.reduce((sum, goal) => {
      return sum + convertCurrency(goal.currentAmount, goal.currency, displayCurrency);
    }, 0);

    // 4. DEUDAS: Monto restante (negativo)
    const debtsValue = debts.reduce((sum, debt) => {
      return sum + convertCurrency(debt.remainingAmount, debt.currency, displayCurrency);
    }, 0);

    const total = cash + investmentValue + savingsValue - debtsValue;

    return {
      total,
      cash,
      investments: investmentValue,
      savings: savingsValue,
      debts: debtsValue,
      components: [
        { label: 'Efectivo', value: cash, icon: 'fa-wallet', color: 'text-blue-600', bgColor: 'bg-blue-50' },
        { label: 'Inversiones', value: investmentValue, icon: 'fa-chart-line', color: 'text-purple-600', bgColor: 'bg-purple-50' },
        { label: 'Ahorros', value: savingsValue, icon: 'fa-piggy-bank', color: 'text-green-600', bgColor: 'bg-green-50' },
        { label: 'Deudas', value: -debtsValue, icon: 'fa-credit-card', color: 'text-red-600', bgColor: 'bg-red-50' }
      ].filter(c => Math.abs(c.value) > 0)
    };
  }, [transactions, investments, savingsGoals, debts, categories, displayCurrency, convertCurrency]);

  return (
    <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-800 flex items-center">
          <i className="fas fa-landmark mr-2 text-blue-600"></i>
          Patrimonio Total
        </h3>
        <div className="text-right">
          <p className="text-xs text-gray-500">Net Worth</p>
        </div>
      </div>

      {/* Valor Total */}
      <div className="mb-6 text-center">
        <p className="text-sm text-gray-600 mb-2">Patrimonio Neto</p>
        <p className={`text-5xl font-bold ${netWorth.total >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {netWorth.total >= 0 ? '' : '-'}{Math.abs(netWorth.total).toLocaleString('es-ES', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          })}
        </p>
        <p className="text-sm text-gray-500 mt-1">{displayCurrency}</p>
      </div>

      {/* Desglose */}
      <div className="space-y-3">
        {netWorth.components.map((component, index) => {
          const percentage = netWorth.total !== 0 
            ? (Math.abs(component.value) / Math.abs(netWorth.total) * 100) 
            : 0;

          return (
            <div key={index} className={`${component.bgColor} rounded-lg p-3`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <i className={`fas ${component.icon} ${component.color} mr-2`}></i>
                  <span className="text-sm font-medium text-gray-700">{component.label}</span>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${component.color}`}>
                    {component.value >= 0 ? '' : '-'}{Math.abs(component.value).toLocaleString('es-ES', {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0
                    })}
                  </p>
                  <p className="text-xs text-gray-500">{percentage.toFixed(1)}%</p>
                </div>
              </div>
              
              {/* Barra de progreso */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    component.label === 'Efectivo' ? 'bg-blue-500' :
                    component.label === 'Inversiones' ? 'bg-purple-500' :
                    component.label === 'Ahorros' ? 'bg-green-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Consejo */}
      {netWorth.total > 0 && (
        <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-xs text-green-800 flex items-center">
            <i className="fas fa-check-circle mr-2"></i>
            {netWorth.total > 10000 
              ? '¡Excelente! Tu patrimonio está creciendo sólidamente.' 
              : '¡Buen comienzo! Sigue construyendo tu patrimonio.'}
          </p>
        </div>
      )}

      {netWorth.debts > 0 && (
        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-xs text-yellow-800 flex items-center">
            <i className="fas fa-exclamation-triangle mr-2"></i>
            Tienes {netWorth.debts.toLocaleString('es-ES', { maximumFractionDigits: 0 })} {displayCurrency} en deudas activas.
          </p>
        </div>
      )}
    </div>
  );
}