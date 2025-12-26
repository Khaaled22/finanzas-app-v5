// src/views/Transactions/TransactionsView.jsx
// ✅ M32: Fix modal (isOpen) + Header con resumen del mes + Formato números
// ✅ M36 Fase 7: Filtros con investment
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
  // ✅ M36 Fase 7: Filtros simplificados
  const [filters, setFilters] = useState({ 
    search: '', 
    month: new Date().toISOString().slice(0, 7),
    categoryId: '',
    type: 'all'
  });
  const [showImportModal, setShowImportModal] = useState(false);
  const [showDiagnostic, setShowDiagnostic] = useState(false);

  // ✅ M36 Fase 7: Filtrado con soporte para investment
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(trans => {
        // Búsqueda de texto
        const matchesSearch = !filters.search || 
          trans.description?.toLowerCase().includes(filters.search.toLowerCase()) ||
          trans.notes?.toLowerCase().includes(filters.search.toLowerCase()) ||
          categories.find(c => c.id === trans.categoryId)?.name?.toLowerCase().includes(filters.search.toLowerCase());
        
        // Mes
        const matchesMonth = !filters.month || 
          trans.date?.slice(0, 7) === filters.month;
        
        // Categoría específica
        const matchesCategory = !filters.categoryId || 
          trans.categoryId === filters.categoryId;
        
        // ✅ M36: Tipo (income/expense/investment)
        const cat = categories.find(c => c.id === trans.categoryId);
        const isInvestment = cat?.group?.toLowerCase().includes('invers') || 
          cat?.name?.toLowerCase().includes('invers') ||
          cat?.name?.toLowerCase().includes('apv') ||
          cat?.name?.toLowerCase().includes('ahorro');
        const matchesType = !filters.type || filters.type === 'all' ||
          (filters.type === 'income' && cat?.type === 'income') ||
          (filters.type === 'investment' && isInvestment) ||
          (filters.type === 'expense' && cat?.type !== 'income' && !isInvestment);
        
        return matchesSearch && matchesMonth && matchesCategory && matchesType;
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [transactions, filters, categories]);

  const availableMonths = useMemo(() => {
    const months = new Set();
    transactions.forEach(t => {
      if (t.date) {
        months.add(t.date.slice(0, 7));
      }
    });
    return Array.from(months).sort().reverse();
  }, [transactions]);

  // ✅ M32: Calcular resumen del mes (Ingresos/Gastos/Inversión/Balance)
  const monthSummary = useMemo(() => {
    let ingresos = 0;
    let gastos = 0;
    let inversiones = 0;

    filteredTransactions.forEach(tx => {
      const cat = categories.find(c => c.id === tx.categoryId);
      const amount = convertCurrencyAtDate
        ? convertCurrencyAtDate(tx.amount, tx.currency, displayCurrency, tx.date)
        : convertCurrency(tx.amount, tx.currency, displayCurrency);

      if (cat?.type === 'income') {
        ingresos += amount;
      } else if (
        cat?.group?.toLowerCase().includes('invers') || 
        cat?.name?.toLowerCase().includes('invers') ||
        cat?.name?.toLowerCase().includes('apv') ||
        cat?.name?.toLowerCase().includes('ahorro')
      ) {
        inversiones += amount;
      } else {
        gastos += amount;
      }
    });

    const balance = ingresos - gastos - inversiones;
    return { ingresos, gastos, inversiones, balance, count: filteredTransactions.length };
  }, [filteredTransactions, categories, displayCurrency, convertCurrency, convertCurrencyAtDate]);

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

  // ✅ M32: Formatear número con separador de miles
  const formatNumber = (num, decimals = 0) => {
    if (num === undefined || num === null || isNaN(num)) return '0';
    return new Intl.NumberFormat('de-DE', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(num);
  };

  const formatAmount = (amount, currency) => {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return `0 ${currency}`;
    }
    return `${formatNumber(amount, 2)} ${currency}`;
  };

  // Nombre del mes
  const getMonthName = (monthStr) => {
    if (!monthStr) return 'Todos';
    const [year, month] = monthStr.split('-');
    const date = new Date(year, parseInt(month) - 1);
    return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
            <i className="fas fa-receipt mr-3 text-blue-600"></i>
            Transacciones
          </h2>
          <p className="text-gray-500 text-sm mt-1 capitalize">
            {getMonthName(filters.month)}
          </p>
        </div>
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
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-all text-sm"
          >
            <i className="fas fa-file-import mr-1"></i>
            <span className="hidden sm:inline">Importar</span>
          </button>
          <button
            onClick={() => setShowAddTransaction(true)}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all"
          >
            <i className="fas fa-plus mr-2"></i>
            <span className="hidden sm:inline">Nueva</span>
          </button>
        </div>
      </div>

      {/* Diagnóstico de Tasas */}
      {showDiagnostic && <RateDiagnostic />}

      {/* ✅ M32: Resumen del mes - 4 columnas */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="grid grid-cols-4 divide-x">
          {/* Ingresos */}
          <div className="p-4 text-center hover:bg-green-50 transition-colors">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <i className="fas fa-arrow-down text-green-600 text-sm"></i>
              </div>
            </div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Ingresos</p>
            <p className="text-lg md:text-xl font-bold text-green-600">
              +{formatNumber(monthSummary.ingresos)}
            </p>
            <p className="text-xs text-gray-400">{displayCurrency}</p>
          </div>

          {/* Gastos */}
          <div className="p-4 text-center hover:bg-red-50 transition-colors">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <i className="fas fa-arrow-up text-red-600 text-sm"></i>
              </div>
            </div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Gastos</p>
            <p className="text-lg md:text-xl font-bold text-red-600">
              -{formatNumber(monthSummary.gastos)}
            </p>
            <p className="text-xs text-gray-400">{displayCurrency}</p>
          </div>

          {/* Inversión */}
          <div className="p-4 text-center hover:bg-purple-50 transition-colors">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <i className="fas fa-chart-line text-purple-600 text-sm"></i>
              </div>
            </div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Inversión</p>
            <p className="text-lg md:text-xl font-bold text-purple-600">
              {formatNumber(monthSummary.inversiones)}
            </p>
            <p className="text-xs text-gray-400">{displayCurrency}</p>
          </div>

          {/* Balance */}
          <div className={`p-4 text-center ${monthSummary.balance >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                monthSummary.balance >= 0 ? 'bg-blue-100' : 'bg-orange-100'
              }`}>
                <i className={`fas fa-wallet text-sm ${
                  monthSummary.balance >= 0 ? 'text-blue-600' : 'text-orange-600'
                }`}></i>
              </div>
            </div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Balance</p>
            <p className={`text-lg md:text-xl font-bold ${
              monthSummary.balance >= 0 ? 'text-blue-600' : 'text-orange-600'
            }`}>
              {monthSummary.balance >= 0 ? '+' : ''}{formatNumber(monthSummary.balance)}
            </p>
            <p className="text-xs text-gray-400">{displayCurrency}</p>
          </div>
        </div>

        {/* Contador */}
        <div className="bg-gray-50 px-4 py-2 text-center border-t">
          <span className="text-sm text-gray-600">
            <i className="fas fa-list mr-2"></i>
            {monthSummary.count} transacciones
          </span>
        </div>
      </div>

      {/* ✅ M36 Fase 7: Filtros mejorados */}
      <TransactionFilters
        filters={filters}
        setFilters={setFilters}
        availableMonths={availableMonths}
        categories={categories}
        resultCount={filteredTransactions.length}
      />

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
              const isIncome = category.type === 'income';
              
              return (
                <div 
                  key={trans.id} 
                  className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between cursor-pointer"
                  onClick={() => setEditingTransaction(trans)}
                >
                  <div className="flex items-center space-x-4">
                    {/* Icono de categoría */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                      isIncome ? 'bg-green-100' : 'bg-blue-100'
                    }`}>
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
                        <span>{trans.date?.slice(0, 10)}</span>
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
                      <p className={`font-bold ${isIncome ? 'text-green-600' : 'text-gray-800'}`}>
                        {isIncome ? '+' : '-'}{formatNumber(trans.amount, 2)} {trans.currency}
                      </p>
                      {trans.currency !== displayCurrency && (
                        <p className="text-xs text-gray-500">
                          ≈ {formatNumber(convertedAmount, 0)} {displayCurrency}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingTransaction(trans);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(trans.id);
                        }}
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

      {/* ✅ M32 FIX: Modal de nueva transacción - PASAR isOpen */}
      {showAddTransaction && (
        <TransactionForm
          isOpen={showAddTransaction}
          onClose={() => setShowAddTransaction(false)}
        />
      )}

      {/* ✅ M32 FIX: Modal de editar transacción - PASAR isOpen */}
      {editingTransaction && (
        <TransactionForm
          isOpen={!!editingTransaction}
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