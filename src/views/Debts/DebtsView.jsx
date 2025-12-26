// src/views/Debts/DebtsView.jsx
// ✅ M36 Fase 4: Vista de deudas con historial de balance
import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatNumber, formatPercent } from '../../utils/formatters';
import DebtForm from '../../components/forms/DebtForm';
import DebtBalanceHistoryModal from '../../components/modals/DebtBalanceHistoryModal';

// Tipos de deuda con iconos
const DEBT_TYPES = [
  { id: 'Hipoteca', icon: '🏠', color: 'purple' },
  { id: 'Préstamo Personal', icon: '💰', color: 'blue' },
  { id: 'Préstamo Automotriz', icon: '🚗', color: 'cyan' },
  { id: 'Préstamo de Consumo', icon: '🛒', color: 'orange' },
  { id: 'Tarjeta de Crédito', icon: '💳', color: 'red' },
  { id: 'Préstamo Estudiantil', icon: '🎓', color: 'indigo' },
  { id: 'Otro', icon: '📋', color: 'gray' }
];

export default function DebtsView() {
  const { 
    debts, 
    deleteDebt, 
    registerDebtPayment, 
    displayCurrency, 
    convertCurrency,
    getBalanceHistory 
  } = useApp();
  
  const [showAddDebt, setShowAddDebt] = useState(false);
  const [editingDebt, setEditingDebt] = useState(null);
  const [historyDebt, setHistoryDebt] = useState(null); // ✅ M36: Para modal de historial
  const [filterType, setFilterType] = useState('all');
  const [viewMode, setViewMode] = useState('cards');
  const [showPaidOff, setShowPaidOff] = useState(false);

  // Filtrar deudas
  const { activeDebts, paidOffDebts, filteredDebts } = useMemo(() => {
    const active = debts.filter(d => (d.currentBalance || 0) > 0);
    const paidOff = debts.filter(d => (d.currentBalance || 0) <= 0);
    
    let filtered = showPaidOff ? paidOff : active;
    
    if (filterType !== 'all') {
      filtered = filtered.filter(d => d.type === filterType);
    }
    
    filtered.sort((a, b) => {
      const balanceA = convertCurrency(a.currentBalance || 0, a.currency, displayCurrency);
      const balanceB = convertCurrency(b.currentBalance || 0, b.currency, displayCurrency);
      return balanceB - balanceA;
    });
    
    return { activeDebts: active, paidOffDebts: paidOff, filteredDebts: filtered };
  }, [debts, filterType, showPaidOff, displayCurrency, convertCurrency]);

  const presentTypes = useMemo(() => {
    const types = new Set(debts.map(d => d.type));
    return DEBT_TYPES.filter(t => types.has(t.id));
  }, [debts]);

  const totals = useMemo(() => {
    const totalDebt = activeDebts.reduce((sum, debt) => 
      sum + convertCurrency(debt.currentBalance || 0, debt.currency, displayCurrency), 0
    );
    
    const totalMonthly = activeDebts.reduce((sum, debt) => 
      sum + convertCurrency(debt.monthlyPayment || 0, debt.currency, displayCurrency), 0
    );
    
    const totalOriginal = activeDebts.reduce((sum, debt) => 
      sum + convertCurrency(debt.originalAmount || 0, debt.currency, displayCurrency), 0
    );
    
    const totalPaid = totalOriginal - totalDebt;
    const percentPaid = totalOriginal > 0 ? (totalPaid / totalOriginal) * 100 : 0;
    
    return { totalDebt, totalMonthly, totalOriginal, totalPaid, percentPaid };
  }, [activeDebts, displayCurrency, convertCurrency]);

  const getDebtTypeInfo = (type) => DEBT_TYPES.find(t => t.id === type) || DEBT_TYPES[DEBT_TYPES.length - 1];

  const calculateProgress = (debt) => {
    const original = debt.originalAmount || 0;
    const current = debt.currentBalance || 0;
    if (original === 0) return 0;
    return ((original - current) / original) * 100;
  };

  const calculateMonthsRemaining = (debt) => {
    const monthly = debt.monthlyPayment || 0;
    const current = debt.currentBalance || 0;
    if (monthly === 0 || current === 0) return 0;
    return Math.ceil(current / monthly);
  };

  // ✅ M36: Obtener cantidad de registros en historial
  const getHistoryCount = (debt) => {
    const history = getBalanceHistory(debt.id);
    return history?.length || 0;
  };

  const handleDelete = (debtId) => {
    const debt = debts.find(d => d.id === debtId);
    if (window.confirm(`¿Eliminar la deuda "${debt.name}"?\n\nEsta acción no se puede deshacer.`)) {
      deleteDebt(debtId);
    }
  };

  const handleQuickPayment = (debtId, inputId) => {
    const input = document.getElementById(inputId);
    const amount = parseFloat(input.value);
    
    if (isNaN(amount) || amount <= 0) {
      alert('Por favor ingresa un monto válido mayor a 0');
      return;
    }

    const debt = debts.find(d => d.id === debtId);
    if (amount > debt.currentBalance) {
      alert('El pago no puede ser mayor al saldo actual');
      return;
    }

    registerDebtPayment(debtId, amount);
    input.value = '';
  };

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">
            <i className="fas fa-credit-card mr-3 text-red-600"></i>
            Gestión de Deudas
          </h2>
          <p className="text-gray-600 mt-1">
            {activeDebts.length} deuda{activeDebts.length !== 1 ? 's' : ''} activa{activeDebts.length !== 1 ? 's' : ''}
            {paidOffDebts.length > 0 && (
              <span className="text-green-600 ml-2">
                • {paidOffDebts.length} pagada{paidOffDebts.length !== 1 ? 's' : ''}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => setShowAddDebt(true)}
          className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-lg hover:shadow-xl"
        >
          <i className="fas fa-plus mr-2"></i>
          Agregar Deuda
        </button>
      </div>

      {/* Métricas totales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm mb-1">Deuda Total</p>
              <p className="text-3xl font-bold">{formatNumber(totals.totalDebt)}</p>
              <p className="text-red-100 text-xs mt-1">{displayCurrency}</p>
            </div>
            <i className="fas fa-money-bill-wave text-4xl text-red-300 opacity-50"></i>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm mb-1">Pago Mensual</p>
              <p className="text-3xl font-bold">{formatNumber(totals.totalMonthly)}</p>
              <p className="text-orange-100 text-xs mt-1">{displayCurrency}/mes</p>
            </div>
            <i className="fas fa-calendar-alt text-4xl text-orange-300 opacity-50"></i>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm mb-1">Ya Pagado</p>
              <p className="text-3xl font-bold">{formatNumber(totals.totalPaid)}</p>
              <p className="text-green-100 text-xs mt-1">{displayCurrency}</p>
            </div>
            <i className="fas fa-check-circle text-4xl text-green-300 opacity-50"></i>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm mb-1">Progreso Total</p>
              <p className="text-3xl font-bold">{formatPercent(totals.percentPaid)}</p>
              <p className="text-purple-100 text-xs mt-1">de deuda pagada</p>
            </div>
            <i className="fas fa-chart-pie text-4xl text-purple-300 opacity-50"></i>
          </div>
          {/* Mini barra de progreso */}
          <div className="mt-3 w-full bg-purple-400 bg-opacity-30 rounded-full h-2">
            <div 
              className="h-2 bg-white rounded-full transition-all"
              style={{ width: `${Math.min(totals.percentPaid, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-5 rounded-xl shadow-lg">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => { setFilterType('all'); setShowPaidOff(false); }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                filterType === 'all' && !showPaidOff
                  ? 'bg-red-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <i className="fas fa-list mr-2"></i>
              Todas Activas
            </button>
            
            {presentTypes.map(type => (
              <button
                key={type.id}
                onClick={() => { setFilterType(type.id); setShowPaidOff(false); }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  filterType === type.id && !showPaidOff
                    ? 'bg-red-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span className="mr-1">{type.icon}</span>
                {type.id}
              </button>
            ))}
            
            {paidOffDebts.length > 0 && (
              <button
                onClick={() => { setShowPaidOff(true); setFilterType('all'); }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  showPaidOff
                    ? 'bg-green-600 text-white shadow-md'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                <i className="fas fa-check-circle mr-2"></i>
                Pagadas ({paidOffDebts.length})
              </button>
            )}
          </div>
          
          <div className="flex border-2 border-gray-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-4 py-2 transition-all ${viewMode === 'cards' ? 'bg-red-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              <i className="fas fa-th-large"></i>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-4 py-2 transition-all ${viewMode === 'table' ? 'bg-red-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              <i className="fas fa-list"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Sin deudas */}
      {filteredDebts.length === 0 && (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <i className={`fas fa-${showPaidOff ? 'trophy' : 'hand-holding-usd'} text-6xl ${showPaidOff ? 'text-green-400' : 'text-gray-300'} mb-4`}></i>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            {showPaidOff ? '¡Sin deudas pagadas aún!' : '¡Sin deudas activas!'}
          </h3>
          <p className="text-gray-500">
            {showPaidOff 
              ? 'Las deudas que pagues aparecerán aquí.'
              : '¡Felicidades! No tienes deudas registradas.'}
          </p>
        </div>
      )}

      {/* Vista de tabla */}
      {viewMode === 'table' && filteredDebts.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Deuda</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Saldo</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Cuota</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Tasa</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Progreso</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Historial</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredDebts.map(debt => {
                  const typeInfo = getDebtTypeInfo(debt.type);
                  const progress = calculateProgress(debt);
                  const historyCount = getHistoryCount(debt);
                  
                  return (
                    <tr key={debt.id} className="hover:bg-red-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{typeInfo.icon}</span>
                          <div>
                            <p className="font-semibold text-gray-800">{debt.name}</p>
                            <p className="text-xs text-gray-500">{debt.type}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-bold text-red-600">
                          {formatNumber(debt.currentBalance || 0)}
                        </span>
                        <span className="text-xs text-gray-400 ml-1">{debt.currency}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-medium text-gray-700">
                          {formatNumber(debt.monthlyPayment || 0)}
                        </span>
                        <span className="text-xs text-gray-400 ml-1">{debt.currency}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-medium text-gray-700">
                          {(debt.interestRate || 0).toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 justify-center">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all ${
                                progress >= 75 ? 'bg-green-500' :
                                progress >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-medium text-gray-600 min-w-[40px]">
                            {progress.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => setHistoryDebt(debt)}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium hover:bg-blue-200 transition-colors"
                        >
                          <i className="fas fa-history mr-1"></i>
                          {historyCount}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setEditingDebt(debt)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Editar"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            onClick={() => setHistoryDebt(debt)}
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg"
                            title="Ver historial"
                          >
                            <i className="fas fa-chart-line"></i>
                          </button>
                          <button
                            onClick={() => handleDelete(debt.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Eliminar"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Vista de cards */}
      {viewMode === 'cards' && filteredDebts.length > 0 && (
        <div className="space-y-4">
          {filteredDebts.map(debt => {
            const typeInfo = getDebtTypeInfo(debt.type);
            const percentage = calculateProgress(debt);
            const monthsRemaining = calculateMonthsRemaining(debt);
            const paidAmount = (debt.originalAmount || 0) - (debt.currentBalance || 0);
            const historyCount = getHistoryCount(debt);
            const inputId = `payment-${debt.id}`;

            return (
              <div key={debt.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                {/* Header */}
                <div className="bg-gradient-to-r from-red-500 to-red-600 p-4 text-white">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-3">
                      <span className="text-4xl">{typeInfo.icon}</span>
                      <div>
                        <h3 className="text-xl font-bold">{debt.name}</h3>
                        <p className="text-sm text-red-100">{debt.type}</p>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      {/* ✅ M36: Botón de historial */}
                      <button
                        onClick={() => setHistoryDebt(debt)}
                        className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-all"
                        title="Ver historial de balance"
                      >
                        <i className="fas fa-history"></i>
                        {historyCount > 1 && (
                          <span className="ml-1 text-xs">{historyCount}</span>
                        )}
                      </button>
                      <button
                        onClick={() => setEditingDebt(debt)}
                        className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-all"
                        title="Editar"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        onClick={() => handleDelete(debt.id)}
                        className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-all"
                        title="Eliminar"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {/* Métricas */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-red-50 p-3 rounded-xl">
                      <p className="text-xs text-red-600 font-medium mb-1">Saldo Actual</p>
                      <p className="text-xl font-bold text-red-700">
                        {formatNumber(debt.currentBalance || 0)}
                      </p>
                      <p className="text-xs text-red-500">{debt.currency}</p>
                    </div>
                    <div className="bg-orange-50 p-3 rounded-xl">
                      <p className="text-xs text-orange-600 font-medium mb-1">Cuota Mensual</p>
                      <p className="text-xl font-bold text-orange-700">
                        {formatNumber(debt.monthlyPayment || 0)}
                      </p>
                      <p className="text-xs text-orange-500">{debt.currency}</p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-xl">
                      <p className="text-xs text-blue-600 font-medium mb-1">Tasa Interés</p>
                      <p className="text-xl font-bold text-blue-700">
                        {(debt.interestRate || 0).toFixed(1)}%
                      </p>
                      <p className="text-xs text-blue-500">anual</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-xl">
                      <p className="text-xs text-green-600 font-medium mb-1">Progreso</p>
                      <p className="text-xl font-bold text-green-700">
                        {percentage.toFixed(0)}%
                      </p>
                      <p className="text-xs text-green-500">pagado</p>
                    </div>
                  </div>

                  {/* Info adicional */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-gray-50 p-3 rounded-xl text-center">
                      <p className="text-xs text-gray-500 mb-1">Monto Original</p>
                      <p className="font-bold text-gray-700">{formatNumber(debt.originalAmount || 0)}</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-xl text-center">
                      <p className="text-xs text-green-600 mb-1">Ya Pagado</p>
                      <p className="font-bold text-green-700">{formatNumber(paidAmount)}</p>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-xl text-center">
                      <p className="text-xs text-purple-600 mb-1">Meses Restantes</p>
                      <p className="font-bold text-purple-700">
                        {monthsRemaining > 0 ? `~${monthsRemaining}` : 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Barra de progreso */}
                  <div className="mb-6">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Progreso de pago</span>
                      <span className="font-medium">{percentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                      <div
                        className={`h-4 rounded-full transition-all duration-500 ${
                          percentage >= 75 ? 'bg-gradient-to-r from-green-400 to-green-600' :
                          percentage >= 50 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                          'bg-gradient-to-r from-red-400 to-red-600'
                        }`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Pago rápido */}
                  {(debt.currentBalance || 0) > 0 && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
                      <label className="block text-sm font-medium text-green-800 mb-2">
                        <i className="fas fa-hand-holding-usd mr-2"></i>
                        Registrar pago
                      </label>
                      <div className="flex space-x-2">
                        <input
                          type="number"
                          step="0.01"
                          placeholder={`Monto en ${debt.currency}`}
                          id={inputId}
                          className="flex-1 px-4 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                        />
                        <button
                          onClick={() => handleQuickPayment(debt.id, inputId)}
                          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-md"
                        >
                          <i className="fas fa-plus mr-2"></i>
                          Registrar
                        </button>
                      </div>
                      <p className="text-xs text-green-600 mt-2">
                        <i className="fas fa-info-circle mr-1"></i>
                        El pago se agregará automáticamente al historial de balance
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modales */}
      <DebtForm
        isOpen={showAddDebt}
        onClose={() => setShowAddDebt(false)}
      />

      {editingDebt && (
        <DebtForm
          isOpen={!!editingDebt}
          onClose={() => setEditingDebt(null)}
          debt={editingDebt}
        />
      )}

      {/* ✅ M36 Fase 4: Modal de historial de balance */}
      <DebtBalanceHistoryModal
        isOpen={!!historyDebt}
        onClose={() => setHistoryDebt(null)}
        debt={historyDebt}
      />
    </div>
  );
}