// src/views/Analysis/NetWorthHistoryChart.jsx
// ✅ M32: Gráfico de evolución mensual del patrimonio neto
import React, { useMemo } from 'react';

export default function NetWorthHistoryChart({ history, currentNetWorth, displayCurrency }) {
  // Procesar historial para el gráfico
  const chartData = useMemo(() => {
    const entries = Object.entries(history || {})
      .map(([date, data]) => ({
        date,
        value: data.value,
        currency: data.currency
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-12); // Últimos 12 registros
    
    // Si no hay suficientes datos, agregar el actual
    if (entries.length === 0) {
      const today = new Date().toISOString().slice(0, 10);
      entries.push({
        date: today,
        value: currentNetWorth,
        currency: displayCurrency
      });
    }
    
    return entries;
  }, [history, currentNetWorth, displayCurrency]);

  // Calcular min/max para escala
  const { minValue, maxValue, range } = useMemo(() => {
    if (chartData.length === 0) return { minValue: 0, maxValue: 100, range: 100 };
    
    const values = chartData.map(d => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = (max - min) * 0.1 || max * 0.1 || 1000;
    
    return {
      minValue: min - padding,
      maxValue: max + padding,
      range: (max + padding) - (min - padding)
    };
  }, [chartData]);

  // Calcular cambio
  const change = useMemo(() => {
    if (chartData.length < 2) return { value: 0, percent: 0, trend: 'neutral' };
    
    const first = chartData[0].value;
    const last = chartData[chartData.length - 1].value;
    const diff = last - first;
    const percent = first !== 0 ? (diff / Math.abs(first)) * 100 : 0;
    
    return {
      value: diff,
      percent: percent,
      trend: diff > 0 ? 'up' : diff < 0 ? 'down' : 'neutral'
    };
  }, [chartData]);

  // Formatear número
  const formatNumber = (num) => {
    return new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 }).format(num);
  };

  // Formatear fecha
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
  };

  // Si no hay historial suficiente
  if (chartData.length < 2) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
          <i className="fas fa-chart-area mr-3 text-blue-600"></i>
          Evolución del Patrimonio Neto
        </h3>
        
        <div className="text-center py-8 text-gray-500">
          <i className="fas fa-clock text-4xl mb-3 text-gray-300"></i>
          <p className="font-medium">Historial en construcción</p>
          <p className="text-sm mt-1">
            El gráfico se irá llenando con el tiempo.
            <br />
            Patrimonio actual: <strong>{formatNumber(currentNetWorth)} {displayCurrency}</strong>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-bold text-gray-800 flex items-center">
          <i className="fas fa-chart-area mr-3 text-blue-600"></i>
          Evolución del Patrimonio Neto
        </h3>
        
        {/* Indicador de cambio */}
        <div className={`px-3 py-1 rounded-lg text-sm font-medium ${
          change.trend === 'up' ? 'bg-green-100 text-green-700' :
          change.trend === 'down' ? 'bg-red-100 text-red-700' :
          'bg-gray-100 text-gray-700'
        }`}>
          <i className={`fas ${
            change.trend === 'up' ? 'fa-arrow-up' :
            change.trend === 'down' ? 'fa-arrow-down' :
            'fa-minus'
          } mr-1`}></i>
          {change.percent >= 0 ? '+' : ''}{change.percent.toFixed(1)}%
        </div>
      </div>

      {/* Valor actual */}
      <div className="mb-6">
        <p className="text-3xl font-bold text-gray-900">
          {formatNumber(currentNetWorth)} {displayCurrency}
        </p>
        <p className={`text-sm ${
          change.trend === 'up' ? 'text-green-600' :
          change.trend === 'down' ? 'text-red-600' :
          'text-gray-500'
        }`}>
          {change.value >= 0 ? '+' : ''}{formatNumber(change.value)} {displayCurrency} desde el inicio
        </p>
      </div>

      {/* Gráfico simple con SVG */}
      <div className="relative h-48 bg-gray-50 rounded-lg p-4">
        <svg viewBox="0 0 400 150" className="w-full h-full" preserveAspectRatio="none">
          {/* Línea del gráfico */}
          <polyline
            fill="none"
            stroke={change.trend === 'up' ? '#10B981' : change.trend === 'down' ? '#EF4444' : '#6B7280'}
            strokeWidth="2"
            points={chartData.map((d, i) => {
              const x = (i / (chartData.length - 1)) * 380 + 10;
              const y = 140 - ((d.value - minValue) / range) * 130;
              return `${x},${y}`;
            }).join(' ')}
          />
          
          {/* Área bajo la línea */}
          <polygon
            fill={change.trend === 'up' ? 'rgba(16, 185, 129, 0.1)' : change.trend === 'down' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(107, 114, 128, 0.1)'}
            points={`10,140 ${chartData.map((d, i) => {
              const x = (i / (chartData.length - 1)) * 380 + 10;
              const y = 140 - ((d.value - minValue) / range) * 130;
              return `${x},${y}`;
            }).join(' ')} 390,140`}
          />
          
          {/* Puntos */}
          {chartData.map((d, i) => {
            const x = (i / (chartData.length - 1)) * 380 + 10;
            const y = 140 - ((d.value - minValue) / range) * 130;
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r="4"
                fill={change.trend === 'up' ? '#10B981' : change.trend === 'down' ? '#EF4444' : '#6B7280'}
              />
            );
          })}
        </svg>

        {/* Labels de fecha */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2 text-xs text-gray-500">
          <span>{formatDate(chartData[0]?.date)}</span>
          {chartData.length > 2 && (
            <span>{formatDate(chartData[Math.floor(chartData.length / 2)]?.date)}</span>
          )}
          <span>{formatDate(chartData[chartData.length - 1]?.date)}</span>
        </div>
      </div>

      {/* Info */}
      <p className="text-xs text-gray-500 mt-4 text-center">
        <i className="fas fa-info-circle mr-1"></i>
        Se registra automáticamente un snapshot diario de tu patrimonio
      </p>
    </div>
  );
}