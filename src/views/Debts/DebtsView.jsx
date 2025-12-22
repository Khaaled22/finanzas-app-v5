// src/views/Debts/DebtsView.jsx
// ✅ M33: Mejorado con filtros por tipo y vista tabla/cards
import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatNumber, formatPercent } from '../../utils/formatters';
import DebtForm from '../../components/forms/DebtForm';

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
  const { debts, deleteDebt, registerDebtPayment, displayCurrency, convertCurrency } = useApp();
  
  const [showAddDebt, setShowAddDebt] = useState(false);
  const [editingDebt, setEditingDebt] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'
  const [showPaidOff, setShowPaidOff] = useState(false);

  // Filtrar deudas
  const { activeDebts, paidOffDebts, filteredDebts } = useMemo(() => {
    const active = debts.filter(d => (d.currentBalance || 0) > 0);
    const paidOff = debts.filter(d => (d.currentBalance || 0) <= 0);
    
    let filtered = showPaidOff ? paidOff : active;
    
    if (filterType !== 'all') {
      filtered = filtered.filter(d => d.type === filterType);
    }
    
    // Ordenar por saldo (mayor primero)
    filtered.sort((a, b) => {
      const balanceA = convertCurrency(a.currentBalance || 0, a.currency, displayCurrency);
      const balanceB = convertCurrency(b.currentBalance || 0, b.currency, displayCurrency);
      return balanceB - balanceA;
    });
    
    return { activeDebts: active, paidOffDebts: paidOff, filteredDebts: filtered };
  }, [debts, filterType, showPaidOff, displayCurrency, convertCurrency]);

  // Obtener tipos únicos presentes
  const presentTypes = useMemo(() => {
    const types = new Set(debts.map(d => d.type));
    return DEBT_TYPES.filter(t => types.has(t.id));
  }, [debts]);

  // Calcular totales
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

  const handleDelete = (debtId) => {
    const debt = debts.find(d => d.id === debtId);
    if (window.confirm(`¿Estás seguro de eliminar la deuda "${debt.name}"?\n\nEsta acción no se puede deshacer.`)) {
      deleteDebt(debtId);
    }
  };

  const handleExtraPayment = (debtId) => {
    const input = document.getElementById(`payment-${debtId}`);
    const amount = parseFloat(input.value);
    
    if (isNaN(amount) || amount <= 0) {
      alert('Por favor ingresa un monto válido mayor a 0');
      return;
    }

    const debt = debts.find(d => d.id === debtId);
    if (amount > debt.currentBalance) {
      alert('El pago no puede ser mayor al saldo actual de la deuda');
      return;
    }

    registerDebtPayment(debtId, 0, amount);
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
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-all shadow-lg"
        >
          <i className="fas fa-plus mr-2"></i>
          Agregar Deuda
        </button>
      </div>

      {/* Métricas totales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-5 text-white shadow-lg">
          <p className="text-red-100 text-sm mb-1">Deuda Total</p>
          <p className="text-3xl font-bold">{formatNumber(totals.totalDebt)}</p>
          <p className="text-red-100 text-xs mt-1">{displayCurrency}</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-5 text-white shadow-lg">
          <p className="text-orange-100 text-sm mb-1">Pago Mensual</p>
          <p className="text-3xl font-bold">{formatNumber(totals.totalMonthly)}</p>
          <p className="text-orange-100 text-xs mt-1">{displayCurrency}</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white shadow-lg">
          <p className="text-green-100 text-sm mb-1">Ya Pagado</p>
          <p className="text-3xl font-bold">{formatNumber(totals.totalPaid)}</p>
          <p className="text-green-100 text-xs mt-1">{displayCurrency}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white shadow-lg">
          <p className="text-purple-100 text-sm mb-1">Progreso Total</p>
          <p className="text-3xl font-bold">{formatPercent(totals.percentPaid)}</p>
          <p className="text-purple-100 text-xs mt-1">de deuda pagada</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-xl shadow-md">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterType === 'all'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Todas
            </button>
            {presentTypes.map(type => (
              <button
                key={type.id}
                onClick={() => setFilterType(type.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterType === type.id
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {type.icon} {type.id}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={showPaidOff}
                onChange={(e) => setShowPaidOff(e.target.checked)}
                className="rounded border-gray-300 text-red-600 focus:ring-red-500"
              />
              Ver pagadas
            </label>
            
            <div className="flex border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-2 ${viewMode === 'cards' ? 'bg-red-100 text-red-600' : 'text-gray-500'}`}
              >
                <i className="fas fa-th-large"></i>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-2 ${viewMode === 'table' ? 'bg-red-100 text-red-600' : 'text-gray-500'}`}
              >
                <i className="fas fa-list"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de deudas */}
      {filteredDebts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <i className={`fas ${showPaidOff ? 'fa-check-circle' : 'fa-smile'} text-6xl ${showPaidOff ? 'text-gray-400' : 'text-green-500'} mb-4`}></i>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">
            {showPaidOff ? 'No hay deudas pagadas' : '¡Sin deudas activas!'}
          </h3>
          <p className="text-gray-600 mb-6">
            {showPaidOff 
              ? 'Las deudas pagadas aparecerán aquí'
              : '¡Mantén tu salud financiera en óptimas condiciones!'
            }
          </p>
        </div>
      ) : viewMode === 'table' ? (
        // Vista de tabla
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Deuda</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Tipo</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Saldo Actual</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Cuota Mensual</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Tasa</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Progreso</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredDebts.map(debt => {
                  const typeInfo = getDebtTypeInfo(debt.type);
                  const progress = calculateProgress(debt);
                  const months = calculateMonthsRemaining(debt);
                  
                  return (
                    <tr key={debt.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{typeInfo.icon}</span>
                          <div>
                            <p className="font-medium text-gray-800">{debt.name}</p>
                            {months > 0 && (
                              <p className="text-xs text-gray-500">~{months} meses restantes</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-gray-100 rounded text-sm text-gray-600">
                          {debt.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="font-bold text-red-600">
                          {formatNumber(debt.currentBalance || 0)} {debt.currency}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="font-medium text-gray-800">
                          {formatNumber(debt.monthlyPayment || 0)} {debt.currency}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-gray-600">{(debt.interestRate || 0).toFixed(1)}%</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          progress >= 75 ? 'bg-green-100 text-green-800' :
                          progress >= 50 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {progress.toFixed(0)}%
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setEditingDebt(debt)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Editar"
                          >
                            <i className="fas fa-edit"></i>
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
      ) : (
        // Vista de cards
        <div className="space-y-4">
          {filteredDebts.map(debt => {
            const typeInfo = getDebtTypeInfo(debt.type);
            const percentage = calculateProgress(debt);
            const monthsRemaining = calculateMonthsRemaining(debt);
            const paidAmount = (debt.originalAmount || 0) - (debt.currentBalance || 0);

            return (
              <div key={debt.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                {/* Header */}
                <div className="bg-gradient-to-r from-red-500 to-red-600 p-4 text-white">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-3">
                      <span className="text-3xl">{typeInfo.icon}</span>
                      <div>
                        <h3 className="text-xl font-bold">{debt.name}</h3>
                        <p className="text-sm text-red-100">{debt.type}</p>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
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
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Saldo Actual</p>
                      <p className="text-xl font-bold text-red-600">
                        {formatNumber(debt.currentBalance || 0)} {debt.currency}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Cuota Mensual</p>
                      <p className="text-xl font-bold text-gray-800">
                        {formatNumber(debt.monthlyPayment || 0)} {debt.currency}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Tasa Interés</p>
                      <p className="text-xl font-bold text-gray-800">
                        {(debt.interestRate || 0).toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Progreso</p>
                      <p className="text-xl font-bold text-green-600">
                        {percentage.toFixed(0)}%
                      </p>
                    </div>
                  </div>

                  {/* Info adicional */}
                  <div className="grid grid-cols-3 gap-4 mb-6 text-sm">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-gray-600 mb-1">Monto Original</p>
                      <p className="font-semibold">{formatNumber(debt.originalAmount || 0)} {debt.currency}</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <p className="text-gray-600 mb-1">Ya Pagado</p>
                      <p className="font-semibold text-green-700">{formatNumber(paidAmount)} {debt.currency}</p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-gray-600 mb-1">Meses Restantes</p>
                      <p className="font-semibold text-blue-700">
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
                        className="h-4 bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Pago extra */}
                  {(debt.currentBalance || 0) > 0 && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <i className="fas fa-hand-holding-usd mr-2 text-green-600"></i>
                        Registrar pago extra
                      </label>
                      <div className="flex space-x-2">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Monto del pago"
                          id={`payment-${debt.id}`}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                        <button
                          onClick={() => handleExtraPayment(debt.id)}
                          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                        >
                          <i className="fas fa-plus mr-2"></i>
                          Registrar
                        </button>
                      </div>
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
    </div>
  );
}