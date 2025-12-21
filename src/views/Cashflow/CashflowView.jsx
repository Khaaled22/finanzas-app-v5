// src/views/Cashflow/CashflowView.jsx
// ✅ M19.3: Actualizado con escenarios y eventos programados

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useProjection } from '../../hooks/useProjection';
import LineChart from '../../components/charts/LineChart';
import ScheduledEventModal from './components/ScheduledEventModal';

export default function CashflowView() {
  const { displayCurrency } = useApp();
  const { 
    cashflowProjection, 
    projectionStats,
    scenario,
    setScenario,
    scenarioComparison,
    scheduledEvents,
    addScheduledEvent,
    updateScheduledEvent,
    deleteScheduledEvent,
    toggleScheduledEvent
  } = useProjection();

  // ✅ M19.3: Estados para modales
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [showComparison, setShowComparison] = useState(false);

  // ✅ M19.3: Datos para gráfico principal
  const cashflowChartData = {
    labels: cashflowProjection.map(p => p.month),
    datasets: [
      {
        label: 'Ingresos',
        data: cashflowProjection.map(p => p.income),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderWidth: 3,
        tension: 0.1,
        fill: true
      },
      {
        label: 'Gastos + Deudas',
        data: cashflowProjection.map(p => p.expenses + p.debtPayments),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 3,
        tension: 0.1,
        fill: true
      },
      {
        label: 'Balance Acumulado',
        data: cashflowProjection.map(p => p.cumulativeBalance),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.05)',
        borderWidth: 2,
        borderDash: [5, 5],
        tension: 0.1
      }
    ]
  };

  // ✅ M19.3: Datos para gráfico de comparación
  const comparisonChartData = {
    labels: cashflowProjection.map(p => p.month),
    datasets: [
      {
        label: 'Optimista',
        data: scenarioComparison.optimistic.projection.map(p => p.cumulativeBalance),
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 2,
        tension: 0.1,
        fill: false
      },
      {
        label: 'Realista',
        data: scenarioComparison.realistic.projection.map(p => p.cumulativeBalance),
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 3,
        tension: 0.1,
        fill: false
      },
      {
        label: 'Pesimista',
        data: scenarioComparison.pessimistic.projection.map(p => p.cumulativeBalance),
        borderColor: 'rgb(239, 68, 68)',
        borderWidth: 2,
        tension: 0.1,
        fill: false
      }
    ]
  };

  // ✅ M19.3: Formato de números
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: displayCurrency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // ✅ M19.3: Manejar guardado de evento
  const handleSaveEvent = (eventData) => {
    try {
      if (editingEvent) {
        updateScheduledEvent(editingEvent.id, eventData);
      } else {
        addScheduledEvent(eventData);
      }
      setShowEventModal(false);
      setEditingEvent(null);
    } catch (error) {
      alert(error.message);
    }
  };

  // ✅ M19.3: Información del escenario actual
  const scenarioInfo = scenarioComparison[scenario];

  return (
    <div className="space-y-6 animate-in">
      {/* Banner Principal */}
      <div className="bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 rounded-2xl p-8 text-white shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-3xl font-bold mb-2">
              <i className="fas fa-chart-line mr-3"></i>
              Proyección de Cashflow
            </h2>
            <p className="text-blue-100">
              Proyección a 12 meses • Escenario: {scenarioInfo.factors.name}
            </p>
          </div>
          
          {/* ✅ M19.3: Botones de acción */}
          <div className="flex gap-3">
            <button
              onClick={() => setShowComparison(!showComparison)}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-lg transition-all border border-white/30"
            >
              <i className="fas fa-balance-scale mr-2"></i>
              {showComparison ? 'Ocultar' : 'Comparar'} Escenarios
            </button>
            <button
              onClick={() => setShowEventModal(true)}
              className="bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg font-medium transition-all shadow-lg"
            >
              <i className="fas fa-calendar-plus mr-2"></i>
              Nuevo Evento
            </button>
          </div>
        </div>

        {/* ✅ M19.3: KPIs Principales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <p className="text-sm text-blue-100 mb-1">Balance Final</p>
            <p className={`text-2xl font-bold ${projectionStats.finalBalance >= 0 ? 'text-white' : 'text-red-200'}`}>
              {formatCurrency(projectionStats.finalBalance)}
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <p className="text-sm text-blue-100 mb-1">Promedio Mensual</p>
            <p className={`text-2xl font-bold ${projectionStats.avgNetCashflow >= 0 ? 'text-white' : 'text-red-200'}`}>
              {formatCurrency(projectionStats.avgNetCashflow)}
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <p className="text-sm text-blue-100 mb-1">Meses en Déficit</p>
            <p className="text-2xl font-bold text-white">
              {projectionStats.deficitMonths} / 12
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <p className="text-sm text-blue-100 mb-1">Estado</p>
            <p className="text-2xl font-bold">
              {projectionStats.isHealthy ? '✅ Saludable' : '⚠️ Riesgo'}
            </p>
          </div>
        </div>
      </div>

      {/* ✅ M19.3: Selector de Escenarios */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">
          <i className="fas fa-sliders-h mr-2 text-blue-600"></i>
          Escenario de Proyección
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {['optimistic', 'realistic', 'pessimistic'].map((s) => {
            const info = scenarioComparison[s];
            const isActive = scenario === s;
            
            return (
              <button
                key={s}
                onClick={() => setScenario(s)}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  isActive
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-gray-800">{info.factors.name}</h4>
                  {isActive && <i className="fas fa-check-circle text-blue-600"></i>}
                </div>
                <p className="text-xs text-gray-600 mb-3">{info.factors.description}</p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ingresos:</span>
                    <span className="font-medium text-gray-800">
                      {(info.factors.income * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Gastos:</span>
                    <span className="font-medium text-gray-800">
                      {(info.factors.expenses * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-gray-600">Balance final:</span>
                    <span className={`font-bold ${info.stats.finalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(info.stats.finalBalance)}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ✅ M19.3: Gráfico Principal */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">
          <i className="fas fa-chart-area mr-2 text-blue-600"></i>
          Evolución Proyectada
        </h3>
        <LineChart data={cashflowChartData} height={300} />
      </div>

      {/* ✅ M19.3: Comparación de Escenarios (condicional) */}
      {showComparison && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800">
              <i className="fas fa-balance-scale mr-2 text-blue-600"></i>
              Comparación de Escenarios
            </h3>
            <button
              onClick={() => setShowComparison(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
          <LineChart data={comparisonChartData} height={300} />
          
          {/* Tabla comparativa */}
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Métrica</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-green-600">Optimista</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-blue-600">Realista</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-red-600">Pesimista</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="px-4 py-3 text-gray-700">Balance Final</td>
                  <td className="px-4 py-3 text-right font-medium text-green-600">
                    {formatCurrency(scenarioComparison.optimistic.stats.finalBalance)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-blue-600">
                    {formatCurrency(scenarioComparison.realistic.stats.finalBalance)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-red-600">
                    {formatCurrency(scenarioComparison.pessimistic.stats.finalBalance)}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-gray-700">Promedio Mensual</td>
                  <td className="px-4 py-3 text-right font-medium text-green-600">
                    {formatCurrency(scenarioComparison.optimistic.stats.avgNetCashflow)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-blue-600">
                    {formatCurrency(scenarioComparison.realistic.stats.avgNetCashflow)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-red-600">
                    {formatCurrency(scenarioComparison.pessimistic.stats.avgNetCashflow)}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-gray-700">Meses en Déficit</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-700">
                    {scenarioComparison.optimistic.stats.deficitMonths}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-700">
                    {scenarioComparison.realistic.stats.deficitMonths}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-700">
                    {scenarioComparison.pessimistic.stats.deficitMonths}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ✅ M19.3: Eventos Programados */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800">
            <i className="fas fa-calendar-alt mr-2 text-blue-600"></i>
            Eventos Programados ({scheduledEvents.filter(e => e.enabled).length})
          </h3>
        </div>

        {scheduledEvents.length === 0 ? (
          <div className="text-center py-12">
            <i className="fas fa-calendar-plus text-6xl text-gray-300 mb-4"></i>
            <p className="text-gray-500 mb-4">No hay eventos programados</p>
            <button
              onClick={() => setShowEventModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
            >
              Crear Primer Evento
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {scheduledEvents.map((event) => {
              const eventDate = new Date(event.date);
              const isIncome = event.type === 'income';
              
              return (
                <div
                  key={event.id}
                  className={`p-4 rounded-lg border-l-4 ${
                    event.enabled
                      ? isIncome 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-red-500 bg-red-50'
                      : 'border-gray-300 bg-gray-50 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900">{event.name}</h4>
                        {!event.enabled && (
                          <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                            Desactivado
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>
                          <i className="fas fa-calendar mr-1"></i>
                          {eventDate.toLocaleDateString('es-ES', { 
                            day: 'numeric', 
                            month: 'long', 
                            year: 'numeric' 
                          })}
                        </span>
                        <span className={`font-bold ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
                          {isIncome ? '+' : '-'}{formatCurrency(event.amount)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleScheduledEvent(event.id)}
                        className="p-2 text-gray-600 hover:bg-gray-200 rounded transition-colors"
                        title={event.enabled ? 'Desactivar' : 'Activar'}
                      >
                        <i className={`fas ${event.enabled ? 'fa-toggle-on' : 'fa-toggle-off'}`}></i>
                      </button>
                      <button
                        onClick={() => {
                          setEditingEvent(event);
                          setShowEventModal(true);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                        title="Editar"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`¿Eliminar evento "${event.name}"?`)) {
                            deleteScheduledEvent(event.id);
                          }
                        }}
                        className="p-2 text-red-600 hover:bg-red-100 rounded transition-colors"
                        title="Eliminar"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ✅ M19.3: Detalles Mensuales */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">
          <i className="fas fa-table mr-2 text-blue-600"></i>
          Detalle Mensual
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Mes</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Ingresos</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Gastos</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Deudas</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Neto</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Acumulado</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Eventos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {cashflowProjection.map((month) => (
                <tr key={month.monthIndex} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-700 font-medium">{month.month}</td>
                  <td className="px-4 py-3 text-right text-green-600">
                    {formatCurrency(month.income)}
                  </td>
                  <td className="px-4 py-3 text-right text-red-600">
                    {formatCurrency(month.expenses)}
                  </td>
                  <td className="px-4 py-3 text-right text-orange-600">
                    {formatCurrency(month.debtPayments)}
                  </td>
                  <td className={`px-4 py-3 text-right font-bold ${
                    month.netCashflow >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(month.netCashflow)}
                  </td>
                  <td className={`px-4 py-3 text-right font-bold ${
                    month.cumulativeBalance >= 0 ? 'text-blue-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(month.cumulativeBalance)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {month.hasEvents && (
                      <span className="inline-block bg-blue-100 text-blue-600 px-2 py-1 rounded text-xs">
                        {month.events.length}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ✅ M19.3: Modal de Eventos */}
      {showEventModal && (
        <ScheduledEventModal
          isOpen={showEventModal}
          onClose={() => {
            setShowEventModal(false);
            setEditingEvent(null);
          }}
          onSave={handleSaveEvent}
          event={editingEvent}
        />
      )}
    </div>
  );
}