// src/views/Analysis/NetWorthHistoryChart.jsx
import React, { useMemo } from 'react';
import LineChart from '../../components/charts/LineChart';
import { formatNumber } from '../../utils/formatters';

export default function NetWorthHistoryChart({ timeline, currentNetWorth, displayCurrency }) {
  const { labels, values, change } = useMemo(() => {
    const entries = Object.entries(timeline || {})
      .sort(([a], [b]) => a.localeCompare(b));

    if (entries.length === 0) {
      return { labels: [], values: [], change: { value: 0, percent: 0, trend: 'neutral' } };
    }

    const lbls = entries.map(([ym]) => {
      const [year, month] = ym.split('-');
      return new Date(parseInt(year), parseInt(month) - 1, 1)
        .toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
    });
    const vals = entries.map(([, v]) => parseFloat(v.toFixed(2)));

    const first = vals[0];
    const last = vals[vals.length - 1];
    const diff = last - first;
    const percent = first !== 0 ? (diff / Math.abs(first)) * 100 : 0;

    return {
      labels: lbls,
      values: vals,
      change: { value: diff, percent, trend: diff > 0 ? 'up' : diff < 0 ? 'down' : 'neutral' }
    };
  }, [timeline]);

  const isPositive = change.trend === 'up';
  const isNegative = change.trend === 'down';
  const lineColor = isPositive ? 'rgb(16, 185, 129)' : isNegative ? 'rgb(239, 68, 68)' : 'rgb(107, 114, 128)';
  const fillColor = isPositive ? 'rgba(16, 185, 129, 0.1)' : isNegative ? 'rgba(239, 68, 68, 0.1)' : 'rgba(107, 114, 128, 0.1)';

  const chartData = useMemo(() => ({
    labels,
    datasets: [{
      label: `Patrimonio Neto (${displayCurrency})`,
      data: values,
      borderColor: lineColor,
      backgroundColor: fillColor,
      borderWidth: 2.5,
      fill: true,
      tension: 0.3,
      pointRadius: 4,
      pointBackgroundColor: lineColor
    }]
  }), [labels, values, lineColor, fillColor, displayCurrency]);

  const chartOptions = useMemo(() => ({
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${formatNumber(ctx.parsed.y)} ${displayCurrency}`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        ticks: {
          callback: (v) => formatNumber(v)
        }
      }
    }
  }), [displayCurrency]);

  const hasData = labels.length >= 2;

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-bold text-gray-800 flex items-center">
          <i className="fas fa-chart-area mr-3 text-blue-600"></i>
          Evolución del Patrimonio Neto
        </h3>
        {hasData && (
          <div className={`px-3 py-1 rounded-lg text-sm font-medium ${
            isPositive ? 'bg-green-100 text-green-700' :
            isNegative ? 'bg-red-100 text-red-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            <i className={`fas ${isPositive ? 'fa-arrow-up' : isNegative ? 'fa-arrow-down' : 'fa-minus'} mr-1`}></i>
            {change.percent >= 0 ? '+' : ''}{change.percent.toFixed(1)}%
          </div>
        )}
      </div>

      <div className="mb-4">
        <p className="text-3xl font-bold text-gray-900">
          {formatNumber(currentNetWorth)} {displayCurrency}
        </p>
        {hasData && (
          <p className={`text-sm mt-1 ${isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-500'}`}>
            {change.value >= 0 ? '+' : ''}{formatNumber(change.value)} {displayCurrency} en los últimos 12 meses
          </p>
        )}
      </div>

      {hasData ? (
        <>
          <LineChart data={chartData} options={chartOptions} height={220} />
          <p className="text-xs text-gray-400 mt-3 text-center">
            <i className="fas fa-info-circle mr-1"></i>
            Estimación mensual basada en historial de inversiones. Se actualiza con snapshots diarios.
          </p>
        </>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <i className="fas fa-clock text-4xl mb-3 text-gray-300"></i>
          <p className="font-medium">Historial en construcción</p>
          <p className="text-sm mt-1">
            Agrega historial de balances a tus inversiones para ver la evolución.
            <br />
            Patrimonio actual: <strong>{formatNumber(currentNetWorth)} {displayCurrency}</strong>
          </p>
        </div>
      )}
    </div>
  );
}
