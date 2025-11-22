import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import DebtForm from '../../components/forms/DebtForm';

export default function DebtsView() {
  const { debts, deleteDebt, registerDebtPayment, displayCurrency, convertCurrency } = useApp();
  
  const [showAddDebt, setShowAddDebt] = useState(false);
  const [editingDebt, setEditingDebt] = useState(null);

  // M5.4: Cálculo del saldo total de deudas
  const totalDebt = useMemo(() => {
    return debts.reduce((sum, debt) => {
      return sum + convertCurrency(debt.currentBalance, debt.currency, displayCurrency);
    }, 0);
  }, [debts, displayCurrency]);

  // Cálculo del pago mensual total
  const totalMonthlyPayment = useMemo(() => {
    return debts.reduce((sum, debt) => {
      return sum + convertCurrency(debt.monthlyPayment, debt.currency, displayCurrency);
    }, 0);
  }, [debts, displayCurrency]);

  const handleDelete = (debtId) => {
    const debt = debts.find(d => d.id === debtId);
    if (window.confirm(`¿Estás seguro de eliminar la deuda "${debt.name}"? Esta acción no se puede deshacer.`)) {
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

  const getDebtTypeIcon = (type) => {
    const icons = {
      'Hipoteca': '🏠',
      'Préstamo Personal': '💰',
      'Préstamo Automotriz': '🚗',
      'Préstamo de Consumo': '🛍️',
      'Tarjeta de Crédito': '💳',
      'Préstamo Estudiantil': '🎓',
      'Otro': '📋'
    };
    return icons[type] || '💰';
  };

  const calculateProgress = (debt) => {
    if (debt.originalAmount === 0) return 0;
    return ((debt.originalAmount - debt.currentBalance) / debt.originalAmount) * 100;
  };

  const calculateMonthsRemaining = (debt) => {
    if (debt.monthlyPayment === 0 || debt.currentBalance === 0) return 0;
    return Math.ceil(debt.currentBalance / debt.monthlyPayment);
  };

  return (
    <div className="space-y-6 animate-in">
      {/* Header con métricas */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">
            <i className="fas fa-credit-card mr-3 text-red-600"></i>
            Gestión de Deudas
          </h2>
          <p className="text-gray-600 mt-1">
            {debts.length} {debts.length === 1 ? 'deuda registrada' : 'deudas registradas'}
          </p>
        </div>
        <button
          onClick={() => setShowAddDebt(true)}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-all transform hover:scale-105 shadow-md"
        >
          <i className="fas fa-plus mr-2"></i>
          Agregar Deuda
        </button>
      </div>

      {/* M5.4: Métricas totales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm mb-1">Deuda Total</p>
              <p className="text-4xl font-bold">{totalDebt.toFixed(2)}</p>
              <p className="text-red-100 text-sm mt-1">{displayCurrency}</p>
            </div>
            <div className="bg-white bg-opacity-20 p-4 rounded-full">
              <i className="fas fa-exclamation-triangle text-4xl"></i>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm mb-1">Pago Mensual Total</p>
              <p className="text-4xl font-bold">{totalMonthlyPayment.toFixed(2)}</p>
              <p className="text-orange-100 text-sm mt-1">{displayCurrency}</p>
            </div>
            <div className="bg-white bg-opacity-20 p-4 rounded-full">
              <i className="fas fa-calendar-check text-4xl"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de deudas */}
      {debts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <i className="fas fa-smile text-6xl text-green-500 mb-4"></i>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">¡Sin deudas!</h3>
          <p className="text-gray-600 mb-6">
            No tienes deudas registradas. ¡Mantén tu salud financiera en óptimas condiciones!
          </p>
          <button
            onClick={() => setShowAddDebt(true)}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            <i className="fas fa-plus mr-2"></i>
            Agregar tu primera deuda (si es necesario)
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {debts.map(debt => {
            const percentage = calculateProgress(debt);
            const monthsRemaining = calculateMonthsRemaining(debt);
            const paidAmount = debt.originalAmount - debt.currentBalance;

            return (
              <div key={debt.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                {/* Header de la deuda */}
                <div className="bg-gradient-to-r from-red-500 to-red-600 p-4 text-white">
                  <div className="flex justify-between items-start flex-wrap gap-3">
                    <div className="flex items-center space-x-3">
                      <span className="text-3xl">{getDebtTypeIcon(debt.type)}</span>
                      <div>
                        <h3 className="text-xl font-bold">{debt.name}</h3>
                        <p className="text-sm text-red-100">{debt.type}</p>
                      </div>
                    </div>
                    
                    {/* Botones de acción */}
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
                  {/* Métricas de la deuda */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Saldo Actual</p>
                      <p className="text-xl font-bold text-red-600">
                        {debt.currentBalance.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">{debt.currency}</p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 mb-1">Cuota Mensual</p>
                      <p className="text-xl font-bold text-gray-800">
                        {debt.monthlyPayment.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">{debt.currency}</p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 mb-1">Tasa Interés</p>
                      <p className="text-xl font-bold text-gray-800">
                        {debt.interestRate.toFixed(2)}%
                      </p>
                      <p className="text-xs text-gray-500">anual</p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 mb-1">Progreso</p>
                      <p className="text-xl font-bold text-green-600">
                        {percentage.toFixed(0)}%
                      </p>
                      <p className="text-xs text-gray-500">pagado</p>
                    </div>
                  </div>

                  {/* Información adicional */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6 text-sm">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-gray-600 mb-1">Monto Original</p>
                      <p className="font-semibold text-gray-800">
                        {debt.originalAmount.toFixed(2)} {debt.currency}
                      </p>
                    </div>

                    <div className="bg-green-50 p-3 rounded-lg">
                      <p className="text-gray-600 mb-1">Ya Pagado</p>
                      <p className="font-semibold text-green-700">
                        {paidAmount.toFixed(2)} {debt.currency}
                      </p>
                    </div>

                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-gray-600 mb-1">Meses Restantes</p>
                      <p className="font-semibold text-blue-700">
                        ~{monthsRemaining} meses
                      </p>
                    </div>
                  </div>

                  {/* Barra de progreso */}
                  <div className="mb-6">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Progreso de pago</span>
                      <span className="font-medium text-gray-800">{percentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                      <div
                        className="h-4 bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Pago extra */}
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
                    <p className="text-xs text-gray-500 mt-2">
                      <i className="fas fa-info-circle mr-1"></i>
                      Los pagos extra reducen el saldo actual de la deuda
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Agregar deuda */}
      <DebtForm
        isOpen={showAddDebt}
        onClose={() => setShowAddDebt(false)}
      />

      {/* Modal: Editar deuda */}
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