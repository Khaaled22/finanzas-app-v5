import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';

export default function YNABBanner({ onConfigureIncome }) {
  const { categories, ynabConfig, displayCurrency } = useApp();

  // Cálculo del total presupuestado
  const totalBudgeted = useMemo(() => {
    return categories.reduce((sum, cat) => sum + cat.budget, 0);
  }, [categories]);

  // Cálculo del dinero sin asignar
  const unassignedMoney = useMemo(() => {
    return ynabConfig.monthlyIncome - totalBudgeted;
  }, [ynabConfig.monthlyIncome, totalBudgeted]);

  // Determinar color y estado
  const isPositive = unassignedMoney >= 0;
  const isZero = unassignedMoney === 0;
  const isOverBudget = unassignedMoney < 0;

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
            <h3 className="text-lg font-semibold text-gray-700">Dinero Sin Asignar (YNAB)</h3>
          </div>
          
          <div className="mb-3">
            <p className={`text-4xl font-bold ${
              isOverBudget ? 'text-red-600' : isZero ? 'text-blue-600' : 'text-green-600'
            }`}>
              {unassignedMoney >= 0 ? '+' : ''}{unassignedMoney.toFixed(2)} {displayCurrency}
            </p>
          </div>

          {/* Desglose */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Ingreso Mensual:</p>
              <p className="font-semibold text-gray-800">
                {ynabConfig.monthlyIncome.toFixed(2)} {displayCurrency}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Total Presupuestado:</p>
              <p className="font-semibold text-gray-800">
                {totalBudgeted.toFixed(2)} {displayCurrency}
              </p>
            </div>
          </div>

          {/* Mensaje de estado */}
          <div className="mt-3">
            {isOverBudget ? (
              <p className="text-sm text-red-700 font-medium">
                <i className="fas fa-exclamation-circle mr-1"></i>
                ¡Atención! Has presupuestado más de lo que ganas. Ajusta tus categorías.
              </p>
            ) : isZero ? (
              <p className="text-sm text-blue-700 font-medium">
                <i className="fas fa-check-circle mr-1"></i>
                ¡Perfecto! Has asignado todo tu ingreso a categorías.
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
            <p className="text-xs text-gray-600 mb-1">Presupuestado</p>
            <p className={`text-lg font-bold ${
              isOverBudget ? 'text-red-600' : isZero ? 'text-blue-600' : 'text-green-600'
            }`}>
              {ynabConfig.monthlyIncome > 0 
                ? ((totalBudgeted / ynabConfig.monthlyIncome) * 100).toFixed(1) 
                : 0}%
            </p>
          </div>
        </div>
      </div>

      {/* Barra de progreso */}
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
              width: `${Math.min((totalBudgeted / ynabConfig.monthlyIncome) * 100, 100)}%` 
            }}
          ></div>
        </div>
      </div>
    </div>
  );
}