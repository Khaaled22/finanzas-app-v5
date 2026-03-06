// src/views/Analysis/RollingBudgetChart.jsx
// Shows actual spending vs budget per category over the last 3 months
import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatNumber } from '../../utils/formatters';

export default function RollingBudgetChart() {
  const {
    categories,
    getTransactionsByMonth,
    convertCurrency,
    displayCurrency
  } = useApp();

  const { months, rows } = useMemo(() => {
    const now = new Date();
    const last3 = [];
    for (let i = 2; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
      last3.push({ ym, label });
    }

    // Only expense categories
    const expenseCats = categories.filter(
      cat => cat.flowKind === 'OPERATING_EXPENSE' || cat.type === 'expense'
    );

    // For each category, compute actual spend per month
    const catRows = expenseCats.map(cat => {
      const budget = convertCurrency(cat.budget || 0, cat.currency || 'EUR', displayCurrency);

      const monthlyActual = last3.map(({ ym }) => {
        const txs = getTransactionsByMonth(ym);
        const spent = txs
          .filter(tx => tx.categoryId === cat.id)
          .reduce((sum, tx) => sum + convertCurrency(tx.amount || 0, tx.currency || 'EUR', displayCurrency), 0);
        return spent;
      });

      const avgActual = monthlyActual.reduce((s, v) => s + v, 0) / last3.length;
      const trend = monthlyActual.length >= 2
        ? monthlyActual[monthlyActual.length - 1] - monthlyActual[0]
        : 0;

      return { cat, budget, monthlyActual, avgActual, trend };
    });

    // Sort by avg actual spending descending, show top 8
    const sorted = catRows
      .filter(r => r.avgActual > 0 || r.budget > 0)
      .sort((a, b) => b.avgActual - a.avgActual)
      .slice(0, 8);

    return { months: last3, rows: sorted };
  }, [categories, getTransactionsByMonth, convertCurrency, displayCurrency]);

  if (rows.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-1 flex items-center">
        <i className="fas fa-calendar-alt mr-3 text-indigo-600"></i>
        Presupuesto Rodante — Últimos 3 Meses
      </h3>
      <p className="text-sm text-gray-500 mb-6">
        Gasto real vs presupuesto mensual por categoría
      </p>

      {/* Column headers */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 pr-4 text-gray-600 font-medium w-36">Categoría</th>
              <th className="text-right py-2 px-3 text-gray-600 font-medium">Presupuesto</th>
              {months.map(m => (
                <th key={m.ym} className="text-right py-2 px-3 text-gray-600 font-medium capitalize">
                  {m.label.split(' ')[0]}
                </th>
              ))}
              <th className="text-right py-2 pl-3 text-gray-600 font-medium">Promedio</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map(({ cat, budget, monthlyActual, avgActual, trend }) => {
              const avgOver = budget > 0 && avgActual > budget;
              return (
                <tr key={cat.id} className="hover:bg-gray-50">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{cat.icon}</span>
                      <span className="font-medium text-gray-800 truncate max-w-[90px]" title={cat.name}>
                        {cat.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right text-gray-500 font-mono text-xs">
                    {budget > 0 ? formatNumber(budget) : '—'}
                  </td>
                  {monthlyActual.map((actual, idx) => {
                    const over = budget > 0 && actual > budget;
                    const pct = budget > 0 ? (actual / budget) * 100 : null;
                    return (
                      <td key={idx} className="py-3 px-3 text-right">
                        <div>
                          <span className={`font-mono text-xs font-semibold ${over ? 'text-red-600' : actual > 0 ? 'text-gray-800' : 'text-gray-300'}`}>
                            {actual > 0 ? formatNumber(actual) : '—'}
                          </span>
                          {pct !== null && actual > 0 && (
                            <div className="mt-1 w-full bg-gray-100 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full transition-all ${over ? 'bg-red-500' : pct > 80 ? 'bg-amber-400' : 'bg-green-500'}`}
                                style={{ width: `${Math.min(pct, 100)}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                  <td className="py-3 pl-3 text-right">
                    <span className={`font-mono text-xs font-bold ${avgOver ? 'text-red-600' : 'text-gray-700'}`}>
                      {formatNumber(avgActual)}
                    </span>
                    {trend !== 0 && (
                      <span className={`ml-1 text-xs ${trend > 0 ? 'text-red-500' : 'text-green-500'}`}>
                        {trend > 0 ? '↑' : '↓'}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400 mt-4">
        <i className="fas fa-info-circle mr-1"></i>
        Rojo = excede presupuesto · Flecha indica tendencia vs primer mes
      </p>
    </div>
  );
}
