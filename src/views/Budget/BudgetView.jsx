import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import YNABBanner from './YNABBanner';
import ConfigureIncomeModal from '../../components/modals/ConfigureIncomeModal';

export default function BudgetView() {
  const { categories, setCategories, displayCurrency } = useApp();
  const [showConfigureIncome, setShowConfigureIncome] = useState(false);

  // Agrupar categorías por grupo
  const groupedCategories = useMemo(() => {
    const groups = {};
    categories.forEach(cat => {
      if (!groups[cat.group]) groups[cat.group] = [];
      groups[cat.group].push(cat);
    });
    return groups;
  }, [categories]);

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
    setCategories(categories.map(cat => 
      cat.id === categoryId ? { ...cat, budget: newBudget } : cat
    ));
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

      {/* YNAB Banner */}
      <YNABBanner onConfigureIncome={() => setShowConfigureIncome(true)} />

      {/* Categorías agrupadas */}
      {Object.entries(groupedCategories).map(([group, cats]) => (
        <div key={group} className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4">
            <h3 className="text-xl font-bold text-white">{group}</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cats.map(cat => {
                const percentage = getPercentage(cat.spent, cat.budget);
                const available = cat.budget - cat.spent;
                return (
                  <div 
                    key={cat.id} 
                    className="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-semibold text-gray-800">{cat.name}</h4>
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
                            value={cat.budget}
                            onChange={(e) => handleBudgetChange(cat.id, parseFloat(e.target.value) || 0)}
                            className="w-24 text-right font-medium px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-gray-500 text-xs">{cat.currency}</span>
                        </div>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Gastado:</span>
                        <span className="font-medium text-red-600">
                          {cat.spent.toFixed(2)} {cat.currency}
                        </span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Disponible:</span>
                        <span className={`font-medium ${available >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {available.toFixed(2)} {cat.currency}
                        </span>
                      </div>
                    </div>

                    {/* Barra de progreso */}
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className={`h-2.5 rounded-full transition-all duration-300 ${getStatusColor(cat.spent, cat.budget)}`} 
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

      {/* Modal de configuración de ingreso */}
      <ConfigureIncomeModal
        isOpen={showConfigureIncome}
        onClose={() => setShowConfigureIncome(false)}
      />
    </div>
  );
}