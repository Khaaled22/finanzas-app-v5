import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import TransactionForm from '../../components/forms/TransactionForm';
import TransactionFilters from '../../components/forms/TransactionFilters';
import ImportTransactionsModal from '../../components/modals/ImportTransactionsModal'; // ✅ M16

export default function TransactionsView() {
  const { transactions, categories, deleteTransaction, clearAllTransactions, displayCurrency, convertCurrency } = useApp();
  
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [filters, setFilters] = useState({ search: '', month: '' });
  const [showImportModal, setShowImportModal] = useState(false); // ✅ M16

  // M4.4 & M4.5: Filtrado de transacciones
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(trans => {
        // Filtro de búsqueda (por descripción o comentario)
        const matchesSearch = !filters.search || 
          trans.description?.toLowerCase().includes(filters.search.toLowerCase()) ||
          trans.comment?.toLowerCase().includes(filters.search.toLowerCase());
        
        // Filtro por mes
        const matchesMonth = !filters.month || 
          new Date(trans.date).toISOString().slice(0, 7) === filters.month;
        
        return matchesSearch && matchesMonth;
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date)); // ✅ Ordenar por fecha DESC (más reciente primero)
  }, [transactions, filters]);

  // Meses disponibles para el filtro
  const availableMonths = useMemo(() => {
    const months = new Set();
    transactions.forEach(t => {
      months.add(new Date(t.date).toISOString().slice(0, 7));
    });
    return Array.from(months).sort().reverse();
  }, [transactions]);

  const handleDelete = (transactionId) => {
    if (window.confirm('¿Estás seguro de eliminar esta transacción?')) {
      deleteTransaction(transactionId);
    }
  };

  const handleClearAll = () => {
    if (transactions.length === 0) {
      alert('No hay transacciones para eliminar');
      return;
    }

    const confirmClear = window.confirm(
      `⚠️ ADVERTENCIA: Esto eliminará TODAS las transacciones (${transactions.length})\n\n` +
      `Esta acción NO se puede deshacer.\n\n` +
      `¿Estás seguro de continuar?`
    );

    if (confirmClear) {
      const doubleConfirm = window.confirm(
        `🚨 ÚLTIMA CONFIRMACIÓN\n\n` +
        `Se eliminarán ${transactions.length} transacciones permanentemente.\n\n` +
        `¿Proceder?`
      );

      if (doubleConfirm) {
        clearAllTransactions();
        alert('✅ Todas las transacciones han sido eliminadas');
      }
    }
  };

  const getCategoryInfo = (categoryId) => {
    return categories.find(c => c.id === categoryId);
  };

  const getPaymentMethodIcon = (method) => {
    const icons = {
      'Efectivo': '💵',
      'Tarjeta': '💳',
      'Transferencia': '🏦'
    };
    return icons[method] || '💰';
  };

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">
            <i className="fas fa-receipt mr-3 text-blue-600"></i>
            Transacciones
          </h2>
          <p className="text-gray-600 mt-1">
            Mostrando {filteredTransactions.length} de {transactions.length} transacciones
          </p>
        </div>
        <div className="flex space-x-3">
          {transactions.length > 0 && (
            <button
              onClick={handleClearAll}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-all transform hover:scale-105 shadow-md"
            >
              <i className="fas fa-trash-alt mr-2"></i>
              Limpiar Todo
            </button>
          )}
          <button
            onClick={() => setShowImportModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-all transform hover:scale-105 shadow-md"
          >
            <i className="fas fa-file-import mr-2"></i>
            Importar
          </button>
          <button
            onClick={() => setShowAddTransaction(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all transform hover:scale-105 shadow-md"
          >
            <i className="fas fa-plus mr-2"></i>
            Nueva Transacción
          </button>
        </div>
      </div>

      {/* Filtros */}
      <TransactionFilters
        filters={filters}
        setFilters={setFilters}
        availableMonths={availableMonths}
        resultCount={filteredTransactions.length}
      />

      {/* Lista de transacciones */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center">
            <i className="fas fa-inbox text-6xl text-gray-300 mb-4"></i>
            <p className="text-xl text-gray-500 mb-2">
              {filters.search || filters.month 
                ? 'No se encontraron transacciones con estos filtros' 
                : 'No hay transacciones registradas'}
            </p>
            {(filters.search || filters.month) && (
              <button
                onClick={() => setFilters({ search: '', month: '' })}
                className="text-blue-600 hover:text-blue-700 font-medium mt-2"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredTransactions.slice(0, 50).map(trans => {
              const category = getCategoryInfo(trans.categoryId);
              const transDate = new Date(trans.date);
              const isIncome = category?.type === 'income';
              
              return (
                <div 
                  key={trans.id} 
                  className="p-5 hover:bg-gray-50 transition-colors group border-l-4"
                  style={{ borderLeftColor: isIncome ? '#10b981' : '#3b82f6' }}
                >
                  <div className="flex items-start justify-between">
                    {/* Información principal */}
                    <div className="flex items-start space-x-4 flex-1">
                      {/* Icono de categoría */}
                      <div className={`${isIncome ? 'bg-green-100' : 'bg-blue-100'} w-12 h-12 rounded-full flex-shrink-0 text-2xl flex items-center justify-center`}>
                        {category?.icon || '📁'}
                      </div>
                      
                      {/* Detalles */}
                      <div className="flex-1 min-w-0">
                        {/* Descripción principal */}
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-semibold text-gray-900 text-base">
                            {trans.description}
                          </h4>
                        </div>
                        
                        {/* Categoría y metadata */}
                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                          <span className="font-medium text-gray-700">
                            {category?.group}
                          </span>
                          <span>•</span>
                          <span className="flex items-center">
                            {getPaymentMethodIcon(trans.paymentMethod)} {trans.paymentMethod}
                          </span>
                          <span>•</span>
                          <span>
                            {transDate.toLocaleDateString('es-ES', { 
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Monto y acciones */}
                    <div className="flex items-center space-x-3 ml-4">
                      <div className="text-right">
                        <p className={`text-xl font-bold ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
                          {isIncome ? '+' : '-'}{trans.amount.toFixed(2)} {trans.currency}
                        </p>
                        {trans.currency !== displayCurrency && (
                          <p className="text-xs text-gray-500 mt-1">
                            ≈ {isIncome ? '+' : '-'}{convertCurrency(trans.amount, trans.currency, displayCurrency).toFixed(2)} {displayCurrency}
                          </p>
                        )}
                      </div>

                      {/* Botones de acción */}
                      <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setEditingTransaction(trans)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <i className="fas fa-edit text-sm"></i>
                        </button>
                        <button
                          onClick={() => handleDelete(trans.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <i className="fas fa-trash text-sm"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Paginación simple */}
        {filteredTransactions.length > 50 && (
          <div className="p-4 bg-gray-50 border-t text-center">
            <p className="text-sm text-gray-600">
              Mostrando las primeras 50 transacciones de {filteredTransactions.length}
            </p>
          </div>
        )}
      </div>

      {/* Modal: Agregar transacción */}
      <TransactionForm
        isOpen={showAddTransaction}
        onClose={() => setShowAddTransaction(false)}
      />

      {/* Modal: Editar transacción */}
      {editingTransaction && (
        <TransactionForm
          isOpen={!!editingTransaction}
          onClose={() => setEditingTransaction(null)}
          transaction={editingTransaction}
        />
      )}

      {/* Modal: Importar transacciones */}
      <ImportTransactionsModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
      />
    </div>
  );
}