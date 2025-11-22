import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import TransactionForm from '../../components/forms/TransactionForm';
import TransactionFilters from '../../components/forms/TransactionFilters';

export default function TransactionsView() {
  const { transactions, categories, deleteTransaction } = useApp();
  
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [filters, setFilters] = useState({ search: '', month: '' });

  // M4.4 & M4.5: Filtrado de transacciones
  const filteredTransactions = useMemo(() => {
    return transactions.filter(trans => {
      // Filtro de búsqueda (por descripción o comentario)
      const matchesSearch = !filters.search || 
        trans.description?.toLowerCase().includes(filters.search.toLowerCase()) ||
        trans.comment?.toLowerCase().includes(filters.search.toLowerCase());
      
      // Filtro por mes
      const matchesMonth = !filters.month || 
        new Date(trans.date).toISOString().slice(0, 7) === filters.month;
      
      return matchesSearch && matchesMonth;
    });
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
        <button
          onClick={() => setShowAddTransaction(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all transform hover:scale-105 shadow-md"
        >
          <i className="fas fa-plus mr-2"></i>
          Nueva Transacción
        </button>
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
              
              return (
                <div 
                  key={trans.id} 
                  className="p-6 hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-start justify-between">
                    {/* Información principal */}
                    <div className="flex items-start space-x-4 flex-1">
                      {/* Icono de categoría */}
                      <div className="bg-blue-100 p-4 rounded-full flex-shrink-0">
                        <i className="fas fa-shopping-bag text-blue-600 text-xl"></i>
                      </div>
                      
                      {/* Detalles */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-800 text-lg mb-1">
                          {trans.description}
                        </h4>
                        
                        {/* Comentario (si existe) */}
                        {trans.comment && (
                          <p className="text-sm text-gray-600 mb-2 italic">
                            <i className="fas fa-comment text-gray-400 mr-1"></i>
                            {trans.comment}
                          </p>
                        )}
                        
                        {/* Metadata */}
                        <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                          <span>
                            <i className="fas fa-folder text-gray-400 mr-1"></i>
                            {category?.name || 'Sin categoría'}
                          </span>
                          <span>
                            {getPaymentMethodIcon(trans.paymentMethod)} {trans.paymentMethod}
                          </span>
                          <span>
                            <i className="fas fa-user text-gray-400 mr-1"></i>
                            {trans.user}
                          </span>
                          <span>
                            <i className="fas fa-calendar text-gray-400 mr-1"></i>
                            {transDate.toLocaleDateString('es-ES', { 
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Monto y acciones */}
                    <div className="flex items-start space-x-4 ml-4">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-red-600">
                          -{trans.amount.toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-500">{trans.currency}</p>
                      </div>

                      {/* Botones de acción (aparecen en hover) */}
                      <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setEditingTransaction(trans)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          onClick={() => handleDelete(trans.id)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <i className="fas fa-trash"></i>
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
    </div>
  );
}