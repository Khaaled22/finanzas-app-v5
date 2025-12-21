import React, { useMemo } from 'react';

export default function MonthlyComparisonTable({ platforms, currency }) {
  const monthlyData = useMemo(() => {
    if (!platforms || platforms.length === 0) return [];

    // Recopilar todos los balances por mes de todas las plataformas
    const monthlyMap = new Map();

    platforms.forEach(platform => {
      const history = platform.balanceHistory || [];
      
      history.forEach(entry => {
        const date = new Date(entry.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyMap.has(monthKey)) {
          monthlyMap.set(monthKey, {
            monthKey,
            date: new Date(date.getFullYear(), date.getMonth(), 1),
            platforms: {}
          });
        }

        const monthData = monthlyMap.get(monthKey);
        monthData.platforms[platform.id] = entry.balance;
      });
    });

    // Convertir a array y ordenar por fecha
    const monthlyArray = Array.from(monthlyMap.values())
      .sort((a, b) => b.date - a.date)
      .slice(0, 12); // Últimos 12 meses

    // Calcular totales y cambios
    monthlyArray.forEach((month, index) => {
      let total = 0;
      platforms.forEach(platform => {
        total += month.platforms[platform.id] || 0;
      });
      month.total = total;

      // Calcular cambio vs mes anterior
      if (index < monthlyArray.length - 1) {
        const prevMonth = monthlyArray[index + 1];
        month.change = month.total - prevMonth.total;
        month.changePercent = prevMonth.total > 0 
          ? (month.change / prevMonth.total * 100) 
          : 0;
      }
    });

    return monthlyArray;
  }, [platforms]);

  if (monthlyData.length === 0) {
    return null;
  }

  // Encontrar mejor y peor mes
  const monthsWithChange = monthlyData.filter(m => m.change !== undefined);
  const bestMonth = monthsWithChange.length > 0 
    ? monthsWithChange.reduce((max, m) => m.changePercent > max.changePercent ? m : max)
    : null;
  const worstMonth = monthsWithChange.length > 0
    ? monthsWithChange.reduce((min, m) => m.changePercent < min.changePercent ? m : min)
    : null;

  // Calcular promedio mensual
  const avgMonthlyChange = monthsWithChange.length > 0
    ? monthsWithChange.reduce((sum, m) => sum + m.changePercent, 0) / monthsWithChange.length
    : 0;

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-800 flex items-center">
            <i className="fas fa-calendar-alt mr-2 text-blue-600"></i>
            Comparación Mensual
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Evolución de tus inversiones mes a mes
          </p>
        </div>
      </div>

      {/* Métricas destacadas */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {bestMonth && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-xs text-gray-600 mb-1">🏆 Mejor Mes</p>
            <p className="text-lg font-bold text-green-700">
              +{bestMonth.changePercent.toFixed(2)}%
            </p>
            <p className="text-xs text-gray-600">
              {bestMonth.date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        )}

        {worstMonth && worstMonth.changePercent < 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-xs text-gray-600 mb-1">📉 Mes Más Bajo</p>
            <p className="text-lg font-bold text-red-700">
              {worstMonth.changePercent.toFixed(2)}%
            </p>
            <p className="text-xs text-gray-600">
              {worstMonth.date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-xs text-gray-600 mb-1">📊 Promedio Mensual</p>
          <p className={`text-lg font-bold ${avgMonthlyChange >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
            {avgMonthlyChange >= 0 ? '+' : ''}{avgMonthlyChange.toFixed(2)}%
          </p>
          <p className="text-xs text-gray-600">
            {monthsWithChange.length} meses
          </p>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Mes</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700">Balance Total</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700">Cambio</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700">% Cambio</th>
              <th className="text-center py-3 px-4 font-semibold text-gray-700">Tendencia</th>
            </tr>
          </thead>
          <tbody>
            {monthlyData.map((month, index) => (
              <tr 
                key={month.monthKey}
                className={`border-b border-gray-100 hover:bg-gray-50 ${
                  index === 0 ? 'bg-blue-50' : ''
                }`}
              >
                <td className="py-3 px-4">
                  <div className="flex items-center">
                    {index === 0 && (
                      <span className="mr-2 px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
                        Actual
                      </span>
                    )}
                    <span className="font-medium text-gray-900">
                      {month.date.toLocaleDateString('es-ES', { 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4 text-right font-semibold text-gray-900">
                  {month.total.toLocaleString('es-ES', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  })} {currency}
                </td>
                <td className={`py-3 px-4 text-right font-medium ${
                  month.change === undefined ? 'text-gray-400' :
                  month.change >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {month.change === undefined ? '—' : (
                    <>
                      {month.change >= 0 ? '+' : ''}{month.change.toLocaleString('es-ES', {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                      })}
                    </>
                  )}
                </td>
                <td className={`py-3 px-4 text-right font-bold ${
                  month.changePercent === undefined ? 'text-gray-400' :
                  month.changePercent >= 0 ? 'text-green-700' : 'text-red-700'
                }`}>
                  {month.changePercent === undefined ? '—' : (
                    <>
                      {month.changePercent >= 0 ? '+' : ''}{month.changePercent.toFixed(2)}%
                    </>
                  )}
                </td>
                <td className="py-3 px-4 text-center">
                  {month.changePercent === undefined ? '—' : (
                    <span className="text-2xl">
                      {month.changePercent >= 5 ? '🚀' :
                       month.changePercent >= 2 ? '📈' :
                       month.changePercent >= 0 ? '➡️' :
                       month.changePercent >= -2 ? '📉' : '⚠️'}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Leyenda de tendencias */}
      <div className="mt-4 flex items-center justify-center space-x-6 text-xs text-gray-600">
        <div className="flex items-center">
          <span className="mr-1">🚀</span> ≥5%
        </div>
        <div className="flex items-center">
          <span className="mr-1">📈</span> 2-5%
        </div>
        <div className="flex items-center">
          <span className="mr-1">➡️</span> 0-2%
        </div>
        <div className="flex items-center">
          <span className="mr-1">📉</span> -2-0%
        </div>
        <div className="flex items-center">
          <span className="mr-1">⚠️</span> {'<'}-2%
        </div>
      </div>
    </div>
  );
}