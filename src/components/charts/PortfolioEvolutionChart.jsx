// src/components/charts/PortfolioEvolutionChart.jsx
// ✅ M34: Gráfico de evolución del portafolio de inversiones
import { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
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
import { formatNumber } from '../../utils/formatters';

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

// Colores para las líneas de cada plataforma
const PLATFORM_COLORS = [
  { border: 'rgb(124, 58, 237)', bg: 'rgba(124, 58, 237, 0.1)' },   // Purple
  { border: 'rgb(34, 197, 94)', bg: 'rgba(34, 197, 94, 0.1)' },     // Green
  { border: 'rgb(59, 130, 246)', bg: 'rgba(59, 130, 246, 0.1)' },   // Blue
  { border: 'rgb(249, 115, 22)', bg: 'rgba(249, 115, 22, 0.1)' },   // Orange
  { border: 'rgb(236, 72, 153)', bg: 'rgba(236, 72, 153, 0.1)' },   // Pink
  { border: 'rgb(20, 184, 166)', bg: 'rgba(20, 184, 166, 0.1)' },   // Teal
  { border: 'rgb(234, 179, 8)', bg: 'rgba(234, 179, 8, 0.1)' },     // Yellow
  { border: 'rgb(99, 102, 241)', bg: 'rgba(99, 102, 241, 0.1)' },   // Indigo
];

export default function PortfolioEvolutionChart({ 
  platforms, 
  displayCurrency, 
  convertCurrency,
  showTotal = true 
}) {
  // Procesar datos para el gráfico
  const chartData = useMemo(() => {
    if (!platforms || platforms.length === 0) {
      return { labels: [], datasets: [] };
    }

    // Recolectar todas las fechas únicas
    const allDates = new Set();
    platforms.forEach(platform => {
      (platform.balanceHistory || []).forEach(entry => {
        allDates.add(entry.date.split('T')[0]);
      });
    });

    // Ordenar fechas
    const sortedDates = Array.from(allDates).sort();
    
    if (sortedDates.length === 0) {
      return { labels: [], datasets: [] };
    }

    // Formatear labels (fechas)
    const labels = sortedDates.map(date => {
      const d = new Date(date);
      return d.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
    });

    const datasets = [];

    // Crear dataset para cada plataforma
    platforms.forEach((platform, index) => {
      const history = platform.balanceHistory || [];
      const historyMap = {};
      
      history.forEach(entry => {
        const dateKey = entry.date.split('T')[0];
        historyMap[dateKey] = entry.balance;
      });

      // Interpolar valores para fechas faltantes
      let lastValue = 0;
      const data = sortedDates.map(date => {
        if (historyMap[date] !== undefined) {
          lastValue = convertCurrency(historyMap[date], platform.currency, displayCurrency);
        }
        return lastValue;
      });

      const colorIndex = index % PLATFORM_COLORS.length;

      datasets.push({
        label: platform.name,
        data: data,
        borderColor: PLATFORM_COLORS[colorIndex].border,
        backgroundColor: PLATFORM_COLORS[colorIndex].bg,
        borderWidth: 2,
        tension: 0.3,
        fill: false,
        pointRadius: 3,
        pointHoverRadius: 6
      });
    });

    // Agregar línea de total si hay múltiples plataformas
    if (showTotal && platforms.length > 1) {
      const totalData = sortedDates.map((_, dateIndex) => {
        return datasets.reduce((sum, dataset) => sum + (dataset.data[dateIndex] || 0), 0);
      });

      datasets.unshift({
        label: '📊 Total Portafolio',
        data: totalData,
        borderColor: 'rgb(17, 24, 39)',
        backgroundColor: 'rgba(17, 24, 39, 0.1)',
        borderWidth: 3,
        tension: 0.3,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 8
      });
    }

    return { labels, datasets };
  }, [platforms, displayCurrency, convertCurrency, showTotal]);

  // Calcular estadísticas
  const stats = useMemo(() => {
    if (!chartData.datasets.length) return null;

    const totalDataset = chartData.datasets.find(d => d.label.includes('Total')) || chartData.datasets[0];
    const data = totalDataset.data;
    
    if (!data.length) return null;

    const firstValue = data[0] || 0;
    const lastValue = data[data.length - 1] || 0;
    const change = lastValue - firstValue;
    const changePercent = firstValue > 0 ? (change / firstValue) * 100 : 0;
    const maxValue = Math.max(...data);
    const minValue = Math.min(...data);

    return {
      firstValue,
      lastValue,
      change,
      changePercent,
      maxValue,
      minValue
    };
  }, [chartData]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: { size: 14 },
        bodyFont: { size: 13 },
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${formatNumber(context.parsed.y)} ${displayCurrency}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        }
      },
      y: {
        beginAtZero: false,
        ticks: {
          callback: function(value) {
            if (value >= 1000000) {
              return `${(value / 1000000).toFixed(1)}M`;
            } else if (value >= 1000) {
              return `${(value / 1000).toFixed(0)}k`;
            }
            return value;
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      }
    }
  };

  if (!chartData.labels.length) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">📈</div>
        <p className="text-gray-600 mb-2">Sin datos históricos</p>
        <p className="text-sm text-gray-500">
          Agrega entradas de historial a tus plataformas para ver la evolución
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Estadísticas */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Valor Inicial</p>
            <p className="text-lg font-bold text-gray-800">
              {formatNumber(stats.firstValue)} {displayCurrency}
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Valor Actual</p>
            <p className="text-lg font-bold text-gray-800">
              {formatNumber(stats.lastValue)} {displayCurrency}
            </p>
          </div>
          <div className={`p-4 rounded-lg ${stats.change >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
            <p className="text-xs text-gray-500 mb-1">Cambio Total</p>
            <p className={`text-lg font-bold ${stats.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats.change >= 0 ? '+' : ''}{formatNumber(stats.change)} {displayCurrency}
            </p>
          </div>
          <div className={`p-4 rounded-lg ${stats.changePercent >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
            <p className="text-xs text-gray-500 mb-1">Rendimiento</p>
            <p className={`text-lg font-bold ${stats.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats.changePercent >= 0 ? '📈 +' : '📉 '}{stats.changePercent.toFixed(1)}%
            </p>
          </div>
        </div>
      )}

      {/* Gráfico */}
      <div style={{ height: '400px' }}>
        <Line data={chartData} options={options} />
      </div>

      {/* Leyenda de plataformas */}
      {platforms.length > 1 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-3">Distribución actual:</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {platforms.map((platform, index) => {
              const value = convertCurrency(platform.currentBalance || 0, platform.currency, displayCurrency);
              const total = platforms.reduce((sum, p) => 
                sum + convertCurrency(p.currentBalance || 0, p.currency, displayCurrency), 0
              );
              const percentage = total > 0 ? (value / total) * 100 : 0;
              const colorIndex = index % PLATFORM_COLORS.length;
              
              return (
                <div 
                  key={platform.id}
                  className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"
                >
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: PLATFORM_COLORS[colorIndex].border }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {platform.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatNumber(value)} {displayCurrency} ({percentage.toFixed(1)}%)
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}