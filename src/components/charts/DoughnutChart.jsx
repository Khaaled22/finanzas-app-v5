// src/components/charts/DoughnutChart.jsx
// ✅ M19.1: Mejorado para agrupar por grupos de categorías y mostrar porcentajes
// ✅ M36: UX/UI mejorada - leyenda compacta, colores distintivos, agrupación
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

// ✅ M36: Paleta de colores distintivos (evita colores similares)
const DISTINCT_COLORS = [
  'rgba(59, 130, 246, 0.8)',   // Blue
  'rgba(239, 68, 68, 0.8)',    // Red
  'rgba(34, 197, 94, 0.8)',    // Green
  'rgba(168, 85, 247, 0.8)',   // Purple
  'rgba(249, 115, 22, 0.8)',   // Orange
  'rgba(236, 72, 153, 0.8)',   // Pink
  'rgba(20, 184, 166, 0.8)',   // Teal
  'rgba(234, 179, 8, 0.8)',    // Yellow
  'rgba(99, 102, 241, 0.8)',   // Indigo
  'rgba(6, 182, 212, 0.8)',    // Cyan
  'rgba(244, 63, 94, 0.8)',    // Rose
  'rgba(132, 204, 22, 0.8)',   // Lime
];

const DISTINCT_BORDERS = [
  'rgba(59, 130, 246, 1)',
  'rgba(239, 68, 68, 1)',
  'rgba(34, 197, 94, 1)',
  'rgba(168, 85, 247, 1)',
  'rgba(249, 115, 22, 1)',
  'rgba(236, 72, 153, 1)',
  'rgba(20, 184, 166, 1)',
  'rgba(234, 179, 8, 1)',
  'rgba(99, 102, 241, 1)',
  'rgba(6, 182, 212, 1)',
  'rgba(244, 63, 94, 1)',
  'rgba(132, 204, 22, 1)',
];

/**
 * DoughnutChart mejorado con agrupación y porcentajes
 */
export default function DoughnutChart({ 
  data, 
  options = {}, 
  height = 300, 
  groupByCategory = false,
  topN = 8,  // ✅ M36: Reducido a 8 para mejor visualización
  showLegend = true,
  legendPosition = 'bottom' // ✅ M36: Default a bottom para mejor UX
}) {
  
  // ✅ M36: Validar datos antes de procesar
  if (!data || !data.datasets || data.datasets.length === 0) {
    return (
      <div 
        style={{ height: `${height}px` }} 
        className="flex items-center justify-center text-gray-400"
      >
        <span>Sin datos para mostrar</span>
      </div>
    );
  }

  const dataset = data.datasets[0] || {};
  const labels = data.labels || [];
  const values = dataset.data || [];
  
  const hasValidData = values.length > 0 && values.some(v => v > 0);
  
  if (!hasValidData) {
    return (
      <div 
        style={{ height: `${height}px` }} 
        className="flex items-center justify-center text-gray-400"
      >
        <span>Sin datos para mostrar</span>
      </div>
    );
  }

  let processedData = data;
  
  // ✅ M36: Siempre procesar para limitar a topN y usar colores distintivos
  // Crear array de items con label, value
  let items = labels.map((label, i) => ({
    label: label || 'Sin categoría',
    value: values[i] || 0
  })).filter(item => item.value > 0);
  
  // Ordenar por valor descendente
  items.sort((a, b) => b.value - a.value);
  
  // Si groupByCategory, agrupar primero
  if (groupByCategory) {
    const groupMap = new Map();
    
    items.forEach(item => {
      let group = item.label;
      
      // Extraer grupo si tiene " - "
      if (typeof item.label === 'string' && item.label.includes(' - ')) {
        group = item.label.split(' - ')[0].trim();
      }
      
      if (groupMap.has(group)) {
        groupMap.set(group, groupMap.get(group) + item.value);
      } else {
        groupMap.set(group, item.value);
      }
    });
    
    items = Array.from(groupMap.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }
  
  // ✅ M36: Limitar a topN y agrupar resto como "Otros"
  let finalLabels = [];
  let finalValues = [];
  
  if (items.length > topN) {
    const topItems = items.slice(0, topN);
    const otherItems = items.slice(topN);
    const othersTotal = otherItems.reduce((sum, item) => sum + item.value, 0);
    
    finalLabels = [...topItems.map(i => i.label), '📦 Otros'];
    finalValues = [...topItems.map(i => i.value), othersTotal];
  } else {
    finalLabels = items.map(i => i.label);
    finalValues = items.map(i => i.value);
  }
  
  // ✅ M36: Usar paleta de colores distintivos
  const numItems = finalLabels.length;
  const colors = finalLabels.map((label, i) => {
    if (label === '📦 Otros') {
      return 'rgba(156, 163, 175, 0.7)'; // Gris para "Otros"
    }
    return DISTINCT_COLORS[i % DISTINCT_COLORS.length];
  });
  
  const borderColors = finalLabels.map((label, i) => {
    if (label === '📦 Otros') {
      return 'rgba(156, 163, 175, 1)';
    }
    return DISTINCT_BORDERS[i % DISTINCT_BORDERS.length];
  });
  
  processedData = {
    labels: finalLabels,
    datasets: [{
      ...dataset,
      data: finalValues,
      backgroundColor: colors,
      borderColor: borderColors,
      borderWidth: 2
    }]
  };
  
  // ✅ M36: Calcular total para porcentajes
  const total = finalValues.reduce((a, b) => a + b, 0);
  
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '55%', // ✅ M36: Donut más delgado para mejor estética
    plugins: {
      legend: {
        display: showLegend,
        position: legendPosition,
        labels: {
          boxWidth: 12,
          padding: 8,
          font: {
            size: 11
          },
          usePointStyle: true,
          pointStyle: 'circle',
          // ✅ M36: Leyenda compacta con porcentaje
          generateLabels: (chart) => {
            const chartData = chart.data;
            if (!chartData || !chartData.labels || !chartData.datasets?.length) {
              return [];
            }
            
            const ds = chartData.datasets[0];
            if (!ds?.data) return [];
            
            const chartTotal = ds.data.reduce((a, b) => (a || 0) + (b || 0), 0);
            const bgColors = ds.backgroundColor || [];
            
            return chartData.labels.map((label, i) => {
              const value = ds.data[i] || 0;
              const percentage = chartTotal > 0 ? ((value / chartTotal) * 100).toFixed(0) : 0;
              
              // ✅ M36: Nombre más corto + porcentaje
              let shortLabel = label || 'N/A';
              if (shortLabel.length > 18) {
                shortLabel = shortLabel.substring(0, 16) + '...';
              }
              
              const fillColor = Array.isArray(bgColors) 
                ? (bgColors[i] || 'rgba(156, 163, 175, 0.7)') 
                : bgColors;
              
              return {
                text: `${shortLabel} (${percentage}%)`,
                fillStyle: fillColor,
                strokeStyle: fillColor,
                lineWidth: 0,
                hidden: false,
                index: i
              };
            });
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        padding: 12,
        cornerRadius: 8,
        titleFont: {
          size: 13,
          weight: 'bold'
        },
        bodyFont: {
          size: 12
        },
        callbacks: {
          title: (items) => {
            return items[0]?.label || '';
          },
          label: (context) => {
            const value = context.parsed || 0;
            const dataArray = context.dataset?.data || [];
            const tooltipTotal = dataArray.reduce((a, b) => (a || 0) + (b || 0), 0);
            const percentage = tooltipTotal > 0 ? ((value / tooltipTotal) * 100).toFixed(1) : 0;
            
            const formattedValue = value.toLocaleString('es-ES', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            });
            
            return ` ${formattedValue} (${percentage}%)`;
          }
        }
      }
    }
  };

  // ✅ M36: Merge options preservando nuestro generateLabels
  const mergedOptions = {
    ...defaultOptions,
    ...options,
    plugins: {
      ...defaultOptions.plugins,
      ...(options.plugins || {}),
      legend: {
        ...defaultOptions.plugins.legend,
        ...(options.plugins?.legend || {}),
        labels: {
          ...defaultOptions.plugins.legend.labels,
          ...(options.plugins?.legend?.labels || {}),
          generateLabels: defaultOptions.plugins.legend.labels.generateLabels
        }
      },
      tooltip: {
        ...defaultOptions.plugins.tooltip,
        ...(options.plugins?.tooltip || {})
      }
    }
  };

  return (
    <div style={{ height: `${height}px`, position: 'relative' }}>
      <Doughnut data={processedData} options={mergedOptions} />
    </div>
  );
}