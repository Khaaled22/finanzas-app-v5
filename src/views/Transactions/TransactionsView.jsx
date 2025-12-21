// src/views/Transactions/TransactionsView.jsx
// ✅ M23: Fix filtro de mes (timezone)
import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import TransactionForm from '../../components/forms/TransactionForm';
import TransactionFilters from '../../components/forms/TransactionFilters';
import ImportTransactionsModal from '../../components/modals/ImportTransactionsModal';
import RateDiagnostic from '../../components/debug/RateDiagnostic';

export default function TransactionsView() {
  const { transactions, categories, deleteTransaction, clearAllTransactions, displayCurrency, convertCurrency, convertCurrencyAtDate } = useApp();
  
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [filters, setFilters] = useState({ search: '', month: '' });
  const [showImportModal, setShowImportModal] = useState(false);
  const [showDiagnostic, setShowDiagnostic] = useState(false);

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(trans => {
        const matchesSearch = !filters.search || 
          trans.description?.toLowerCase().includes(filters.search.toLowerCase()) ||
          trans.notes?.toLowerCase().includes(filters.search.toLowerCase());
        
        // ✅ M23: Fix timezone - usar slice directo en vez de Date parsing
        const matchesMonth = !filters.month || 
          trans.date?.slice(0, 7) === filters.month;
        
        return matchesSearch && matchesMonth;
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [transactions, filters]);

  const availableMonths = useMemo(() => {
    const months = new Set();
    transactions.forEach(t => {
      // ✅ M23: Usar slice directo
      if (t.date) {
        months.add(t.date.slice(0, 7));
      }
    });
    return Array.from(months).sort().reverse();
  }, [transactions]);

  const getCategoryInfo = (categoryId) => {
    const cat = categories.find(c => c.id === categoryId);
    return cat || { name: 'Sin categoría', icon: '❓', currency: displayCurrency };
  };

  const handleDelete = (id) => {
    if (window.confirm('¿Eliminar esta transacción?')) {
      deleteTransaction(id);
    }
  };

  const handleClearAll = () => {
    if (window.confirm('⚠️ ¿Estás seguro de eliminar TODAS las transacciones?\n\nEsta acción no se puede deshacer.')) {
      if (window.confirm('Esta es la última confirmación. ¿Continuar?')) {
        clearAllTransactions();
      }
    }
  };

  const formatAmount = (amount, currency) => {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return `0.00 ${currency}`;
    }
    return `${parseFloat(amount).toFixed(2)} ${currency}`;
  };

  const totals = useMemo(() => {
    let totalOriginal = 0;
    let totalConverted = 0;
    
    filteredTransactions.forEach(t => {
      const amount = parseFloat(t.amount) || 0;
      totalOriginal += amount;
      // ✅ M23: Usar tasa histórica si disponible
      const converted = convertCurrencyAtDate 
        ? convertCurrencyAtDate(amount, t.currency, displayCurrency, t.date)
        : convertCurrency(amount, t.currency, displayCurrency);
      totalConverted += converted;
    });
    
    return { original: totalOriginal, converted: totalConverted };
  }, [filteredTransactions, displayCurrency, convertCurrency, convertCurrencyAtDate]);

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h2 className="text-3xl font-bold text-gray-800">
          <i className="fas fa-receipt mr-3 text-blue-600"></i>
          Transacciones
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowDiagnostic(!showDiagnostic)}
            className="px-3 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
            title="Diagnóstico de tasas"
          >
            <i className="fas fa-bug"></i>
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-all"
          >
            <i className="fas fa-file-import mr-2"></i>
            Importar
          </button>
          <button
            onClick={() => setShowAddTransaction(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all"
          >
            <i className="fas fa-plus mr-2"></i>
            Nueva Transacción
          </button>
        </div>
      </div>

      {/* Diagnóstico de tasas */}
      {showDiagnostic && <RateDiagnostic onClose={() => setShowDiagnostic(false)} />}

      {/* Filtros */}
      <TransactionFilters
        filters={filters}
        setFilters={setFilters}
        availableMonths={availableMonths}
      />

      {/* Resumen */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-gray-600 text-sm">Transacciones mostradas</p>
            <p className="text-2xl font-bold text-blue-600">{filteredTransactions.length}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-600 text-sm">Total (monedas originales)</p>
            <p className="text-2xl font-bold text-gray-800">{totals.original.toFixed(2)}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-600 text-sm">Total en {displayCurrency}</p>
            <p className="text-2xl font-bold text-green-600">{totals.converted.toFixed(2)} {displayCurrency}</p>
          </div>
        </div>
      </div>

      {/* Lista de transacciones */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 flex justify-between items-center">
          <h3 className="text-xl font-bold text-white">
            <i className="fas fa-list mr-2"></i>
            Historial de Transacciones
          </h3>
          {transactions.length > 0 && (
            <button
              onClick={handleClearAll}
              className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm"
            >
              <i className="fas fa-trash mr-1"></i>
              Limpiar Todo
            </button>
          )}
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <i className="fas fa-inbox text-5xl mb-4 text-gray-300"></i>
            <p className="text-lg">No hay transacciones que mostrar</p>
            <p className="text-sm">Agrega una nueva transacción o ajusta los filtros</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredTransactions.map((trans) => {
              const category = getCategoryInfo(trans.categoryId);
              const convertedAmount = convertCurrencyAtDate
                ? convertCurrencyAtDate(trans.amount, trans.currency, displayCurrency, trans.date)
                : convertCurrency(trans.amount, trans.currency, displayCurrency);
              
              return (
                <div 
                  key={trans.id} 
                  className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center space-x-4">
                    {/* Icono de categoría */}
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-2xl">
                      {category.icon}
                    </div>
                    
                    {/* Info principal */}
                    <div>
                      <p className="font-medium text-gray-800">
                        {trans.description}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>{category.name}</span>
                        <span>•</span>
                        <span>{trans.date}</span>
                        {trans.imported && (
                          <>
                            <span>•</span>
                            <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                              Importada
                            </span>
                          </>
                        )}
                        {trans.paymentMethod && (
                          <>
                            <span>•</span>
                            <span className="text-xs">{trans.paymentMethod}</span>
                          </>
                        )}
                      </div>
                      {trans.notes && (
                        <p className="text-xs text-gray-400 mt-1 italic">{trans.notes}</p>
                      )}
                    </div>
                  </div>

                  {/* Monto y acciones */}
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="font-bold text-gray-800">
                        {formatAmount(trans.amount, trans.currency)}
                      </p>
                      {trans.currency !== displayCurrency && (
                        <p className="text-xs text-gray-500">
                          ≈ {formatAmount(convertedAmount, displayCurrency)}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex space-x-1">
                      <button
                        onClick={() => setEditingTransaction(trans)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        onClick={() => handleDelete(trans.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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

      {/* Modal de nueva transacción */}
      {showAddTransaction && (
        <TransactionForm
          onClose={() => setShowAddTransaction(false)}
        />
      )}

      {/* Modal de editar transacción */}
      {editingTransaction && (
        <TransactionForm
          transaction={editingTransaction}
          onClose={() => setEditingTransaction(null)}
        />
      )}

      {/* Modal de importar */}
      {showImportModal && (
        <ImportTransactionsModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
        />
      )}
    </div>
  );
}