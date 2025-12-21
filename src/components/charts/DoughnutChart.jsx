// src/components/charts/DoughnutChart.jsx
// ✅ M19.1: Mejorado para agrupar por grupos de categorías y mostrar porcentajes
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

/**
 * DoughnutChart mejorado con agrupación y porcentajes
 * @param {object} data - Datos del gráfico en formato Chart.js
 * @param {object} options - Opciones adicionales de Chart.js
 * @param {number} height - Altura del gráfico en píxeles
 * @param {boolean} groupByCategory - Si es true, agrupa por grupos en lugar de categorías individuales
 * @param {number} topN - Número de items principales a mostrar (resto va a "Otros")
 */
export default function DoughnutChart({ 
  data, 
  options = {}, 
  height = 300, 
  groupByCategory = false,
  topN = 10 
}) {
  
  // ✅ M19.1: Si groupByCategory está activo, reorganizar los datos
  let processedData = data;
  
  if (groupByCategory && data.labels && data.datasets && data.datasets[0]) {
    const labels = data.labels;
    const values = data.datasets[0].data;
    const originalColors = data.datasets[0].backgroundColor || [];
    const originalBorderColors = data.datasets[0].borderColor || [];
    
    // Crear mapa de grupo -> valor total
    const groupMap = new Map();
    
    labels.forEach((label, index) => {
      const value = values[index] || 0;
      
      // Extraer el grupo (asumiendo formato "emoji Grupo - Subcategoría" o "emoji Grupo")
      // Ejemplos: "🏠 Vivienda - Alquiler" → "🏠 Vivienda"
      //           "🍔 Alimentación" → "🍔 Alimentación"
      let group = label;
      
      // Si tiene " - ", tomar solo la parte antes del guión
      if (label.includes(' - ')) {
        group = label.split(' - ')[0].trim();
      }
      // Si tiene múltiples palabras después del emoji, tomar las primeras palabras como grupo
      // Esto maneja casos como "🎓 CAE" donde el emoji + palabra es el grupo
      
      if (groupMap.has(group)) {
        groupMap.set(group, groupMap.get(group) + value);
      } else {
        groupMap.set(group, value);
      }
    });
    
    // Convertir a array y ordenar por valor descendente
    let groupArray = Array.from(groupMap.entries())
      .map(([group, value]) => ({ group, value }))
      .filter(item => item.value > 0) // Solo grupos con gastos
      .sort((a, b) => b.value - a.value);
    
    // ✅ M19.1: Tomar top N y agrupar el resto como "Otros"
    let finalGroups = [];
    let finalValues = [];
    
    if (groupArray.length > topN) {
      // Tomar los top N
      const topGroups = groupArray.slice(0, topN);
      const othersGroups = groupArray.slice(topN);
      
      // Sumar los valores de "Otros"
      const othersTotal = othersGroups.reduce((sum, item) => sum + item.value, 0);
      
      finalGroups = [...topGroups.map(g => g.group), '📦 Otros'];
      finalValues = [...topGroups.map(g => g.value), othersTotal];
    } else {
      finalGroups = groupArray.map(g => g.group);
      finalValues = groupArray.map(g => g.value);
    }
    
    // Generar colores para los grupos
    const colors = finalGroups.map((_, i) => 
      i === finalGroups.length - 1 && finalGroups[i] === '📦 Otros'
        ? 'rgba(156, 163, 175, 0.7)' // Color gris para "Otros"
        : `hsla(${i * 360 / (finalGroups.length - (finalGroups[finalGroups.length - 1] === '📦 Otros' ? 1 : 0))}, 70%, 60%, 0.8)`
    );
    
    const borderColors = finalGroups.map((_, i) => 
      i === finalGroups.length - 1 && finalGroups[i] === '📦 Otros'
        ? 'rgba(156, 163, 175, 1)'
        : `hsla(${i * 360 / (finalGroups.length - (finalGroups[finalGroups.length - 1] === '📦 Otros' ? 1 : 0))}, 70%, 50%, 1)`
    );
    
    processedData = {
      labels: finalGroups,
      datasets: [{
        ...data.datasets[0],
        data: finalValues,
        backgroundColor: colors,
        borderColor: borderColors,
        borderWidth: 2
      }]
    };
  }
  
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'right',
        labels: {
          boxWidth: 15,
          padding: 10,
          font: {
            size: 11
          },
          // ✅ M19.1: Agregar porcentaje a las etiquetas de la leyenda
          generateLabels: (chart) => {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              const dataset = data.datasets[0];
              const total = dataset.data.reduce((a, b) => a + b, 0);
              
              return data.labels.map((label, i) => {
                const value = dataset.data[i];
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                
                return {
                  text: `${label} (${percentage}%)`,
                  fillStyle: dataset.backgroundColor[i],
                  strokeStyle: dataset.borderColor[i],
                  lineWidth: dataset.borderWidth,
                  hidden: false,
                  index: i
                };
              });
            }
            return [];
          }
        }
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
          label: (context) => {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            
            // Formatear el valor con separadores de miles
            const formattedValue = value.toLocaleString('es-ES', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            });
            
            return `${label}: ${formattedValue} (${percentage}%)`;
          }
        }
      }
    }
  };

  return (
    <div style={{ height: `${height}px`, position: 'relative' }}>
      <Doughnut data={processedData} options={{ ...defaultOptions, ...options }} />
    </div>
  );
}