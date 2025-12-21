import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function InvestmentChart({ balanceHistory, currency, platformName }) {
  const chartData = useMemo(() => {
    if (!balanceHistory || balanceHistory.length === 0) {
      return null;
    }

    // Ordenar por fecha
    const sortedHistory = [...balanceHistory].sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );

    const labels = sortedHistory.map(entry => 
      new Date(entry.date).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: '2-digit'
      })
    );

    const balances = sortedHistory.map(entry => entry.balance);
    
    // Calcular línea de balance inicial para comparación
    const initialBalance = sortedHistory[0].balance;
    const initialLine = sortedHistory.map(() => initialBalance);

    // Determinar color según crecimiento
    const currentBalance = sortedHistory[sortedHistory.length - 1].balance;
    const isPositive = currentBalance >= initialBalance;
    const lineColor = isPositive ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)';
    const gradientColor = isPositive 
      ? 'rgba(34, 197, 94, 0.1)' 
      : 'rgba(239, 68, 68, 0.1)';

    return {
      labels,
      datasets: [
        {
          label: 'Balance',
          data: balances,
          borderColor: lineColor,
          backgroundColor: gradientColor,
          borderWidth: 3,
          pointRadius: 6,
          pointHoverRadius: 8,
          pointBackgroundColor: lineColor,
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          tension: 0.4,
          fill: true
        },
        {
          label: 'Balance Inicial',
          data: initialLine,
          borderColor: 'rgb(156, 163, 175)',
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderDash: [5, 5],
          pointRadius: 0,
          pointHoverRadius: 0,
          tension: 0
        }
      ]
    };
  }, [balanceHistory]);

  const options = useMemo(() => {
    if (!balanceHistory || balanceHistory.length === 0) {
      return {};
    }

    const balances = balanceHistory.map(entry => entry.balance);
    const minBalance = Math.min(...balances);
    const maxBalance = Math.max(...balances);
    const range = maxBalance - minBalance;
    const padding = range * 0.1;

    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: 15,
            font: {
              size: 12,
              weight: '500'
            }
          }
        },
        title: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          titleFont: {
            size: 14,
            weight: 'bold'
          },
          bodyFont: {
            size: 13
          },
          callbacks: {
            label: function(context) {
              const value = context.parsed.y;
              const formatted = value.toLocaleString('es-ES', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              });
              
              // Mostrar nota si existe
              const entry = balanceHistory[context.dataIndex];
              let label = `${context.dataset.label}: ${formatted} ${currency}`;
              
              if (entry && entry.note && context.datasetIndex === 0) {
                label += `\n📝 ${entry.note}`;
              }
              
              return label;
            },
            afterLabel: function(context) {
              if (context.datasetIndex === 0 && context.dataIndex > 0) {
                const current = context.parsed.y;
                const previous = balanceHistory[context.dataIndex - 1].balance;
                const change = current - previous;
                const percentChange = previous > 0 ? (change / previous * 100) : 0;
                
                if (Math.abs(percentChange) > 0.01) {
                  return `Cambio: ${change >= 0 ? '+' : ''}${change.toLocaleString('es-ES', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })} ${currency} (${percentChange >= 0 ? '+' : ''}${percentChange.toFixed(2)}%)`;
                }
              }
              return '';
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: false,
          min: minBalance - padding,
          max: maxBalance + padding,
          ticks: {
            callback: function(value) {
              return value.toLocaleString('es-ES', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              });
            },
            font: {
              size: 11
            }
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          }
        },
        x: {
          ticks: {
            font: {
              size: 11
            },
            maxRotation: 45,
            minRotation: 45
          },
          grid: {
            display: false
          }
        }
      },
      interaction: {
        intersect: false,
        mode: 'index'
      }
    };
  }, [balanceHistory, currency]);

  if (!chartData) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <div className="text-center">
          <i className="fas fa-chart-line text-4xl text-gray-300 mb-3"></i>
          <p className="text-gray-600">No hay suficientes datos para mostrar el gráfico</p>
          <p className="text-sm text-gray-500 mt-1">
            Actualiza el balance al menos 2 veces para ver la evolución
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[400px]">
      <Line data={chartData} options={options} />
    </div>
  );
}