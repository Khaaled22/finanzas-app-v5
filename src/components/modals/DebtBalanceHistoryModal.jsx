// src/components/modals/DebtBalanceHistoryModal.jsx
// ✅ M36 Fase 4: Modal para gestionar historial de balance de deudas
import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatNumber } from '../../utils/formatters';
import Modal from '../common/Modal';

export default function DebtBalanceHistoryModal({ isOpen, onClose, debt }) {
  const { 
    addBalanceEntry, 
    updateBalanceEntry, 
    deleteBalanceEntry, 
    getBalanceHistory,
    displayCurrency,
    convertCurrency
  } = useApp();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [newEntry, setNewEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    balance: '',
    note: ''
  });

  // Obtener historial ordenado
  const history = useMemo(() => {
    if (!debt) return [];
    return getBalanceHistory(debt.id);
  }, [debt, getBalanceHistory]);

  // Calcular estadísticas
  const stats = useMemo(() => {
    if (history.length < 2) return null;
    
    const first = history[0];
    const last = history[history.length - 1];
    const totalReduction = first.balance - last.balance;
    const percentReduction = first.balance > 0 ? (totalReduction / first.balance) * 100 : 0;
    
    // Calcular reducción mensual promedio
    const firstDate = new Date(first.date);
    const lastDate = new Date(last.date);
    const monthsDiff = (lastDate.getFullYear() - firstDate.getFullYear()) * 12 + 
                       (lastDate.getMonth() - firstDate.getMonth()) || 1;
    const avgMonthlyReduction = totalReduction / monthsDiff;
    
    // Estimar meses para pagar
    const monthsToPayoff = last.balance > 0 && avgMonthlyReduction > 0 
      ? Math.ceil(last.balance / avgMonthlyReduction) 
      : 0;
    
    return {
      totalReduction,
      percentReduction,
      avgMonthlyReduction,
      monthsToPayoff,
      totalEntries: history.length
    };
  }, [history]);

  const handleAddEntry = () => {
    if (!newEntry.balance || isNaN(parseFloat(newEntry.balance))) {
      alert('Por favor ingresa un balance válido');
      return;
    }

    addBalanceEntry(debt.id, {
      date: newEntry.date,
      balance: parseFloat(newEntry.balance),
      note: newEntry.note,
      type: 'manual'
    });

    setNewEntry({
      date: new Date().toISOString().split('T')[0],
      balance: '',
      note: ''
    });
    setShowAddForm(false);
  };

  const handleUpdateEntry = () => {
    if (!editingEntry) return;

    updateBalanceEntry(debt.id, editingEntry.id, {
      date: editingEntry.date,
      balance: parseFloat(editingEntry.balance),
      note: editingEntry.note
    });

    setEditingEntry(null);
  };

  const handleDeleteEntry = (entryId) => {
    const entry = history.find(e => e.id === entryId);
    if (entry?.type === 'initial') {
      alert('No se puede eliminar la entrada inicial');
      return;
    }

    if (window.confirm('¿Eliminar esta entrada del historial?')) {
      deleteBalanceEntry(debt.id, entryId);
    }
  };

  const getEntryTypeLabel = (type) => {
    const types = {
      initial: { label: 'Inicial', color: 'bg-blue-100 text-blue-700', icon: '🏁' },
      payment: { label: 'Pago', color: 'bg-green-100 text-green-700', icon: '💰' },
      manual: { label: 'Manual', color: 'bg-purple-100 text-purple-700', icon: '✏️' },
      adjustment: { label: 'Ajuste', color: 'bg-orange-100 text-orange-700', icon: '🔧' }
    };
    return types[type] || types.manual;
  };

  if (!debt) return null;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={`Historial de Balance - ${debt.name}`}
      size="xl"
    >
      <div className="space-y-6">
        {/* Header con estadísticas */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
              <p className="text-xs text-green-600 font-medium">Reducción Total</p>
              <p className="text-xl font-bold text-green-700">
                {formatNumber(stats.totalReduction)} {debt.currency}
              </p>
              <p className="text-xs text-green-600">{stats.percentReduction.toFixed(1)}%</p>
            </div>
            
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <p className="text-xs text-blue-600 font-medium">Promedio Mensual</p>
              <p className="text-xl font-bold text-blue-700">
                {formatNumber(stats.avgMonthlyReduction)} {debt.currency}
              </p>
              <p className="text-xs text-blue-600">reducción/mes</p>
            </div>
            
            <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
              <p className="text-xs text-purple-600 font-medium">Est. Liquidación</p>
              <p className="text-xl font-bold text-purple-700">
                {stats.monthsToPayoff > 0 ? `~${stats.monthsToPayoff} meses` : 'N/A'}
              </p>
              <p className="text-xs text-purple-600">al ritmo actual</p>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <p className="text-xs text-gray-600 font-medium">Registros</p>
              <p className="text-xl font-bold text-gray-700">{stats.totalEntries}</p>
              <p className="text-xs text-gray-600">en historial</p>
            </div>
          </div>
        )}

        {/* Botón agregar */}
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-gray-700">
            <i className="fas fa-history mr-2 text-blue-500"></i>
            Historial de Balances
          </h3>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <i className={`fas fa-${showAddForm ? 'times' : 'plus'} mr-2`}></i>
            {showAddForm ? 'Cancelar' : 'Agregar Registro'}
          </button>
        </div>

        {/* Formulario agregar */}
        {showAddForm && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-4">
            <h4 className="font-medium text-blue-800">
              <i className="fas fa-plus-circle mr-2"></i>
              Nuevo Registro de Balance
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Fecha</label>
                <input
                  type="date"
                  value={newEntry.date}
                  onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Balance Actual ({debt.currency})
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newEntry.balance}
                  onChange={(e) => setNewEntry({ ...newEntry, balance: e.target.value })}
                  placeholder="Ej: 45000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Nota (opcional)</label>
                <input
                  type="text"
                  value={newEntry.note}
                  onChange={(e) => setNewEntry({ ...newEntry, note: e.target.value })}
                  placeholder="Ej: Consulta banco"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleAddEntry}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                <i className="fas fa-save mr-2"></i>
                Guardar Registro
              </button>
            </div>
          </div>
        )}

        {/* Lista de historial */}
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {history.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <i className="fas fa-inbox text-4xl mb-2"></i>
              <p>No hay registros en el historial</p>
            </div>
          ) : (
            [...history].reverse().map((entry, index) => {
              const typeInfo = getEntryTypeLabel(entry.type);
              const prevEntry = history[history.length - 1 - index - 1];
              const change = prevEntry ? entry.balance - prevEntry.balance : 0;
              const isEditing = editingEntry?.id === entry.id;
              
              return (
                <div 
                  key={entry.id} 
                  className={`bg-white border rounded-xl p-4 hover:shadow-md transition-shadow ${
                    isEditing ? 'border-blue-500 shadow-md' : 'border-gray-200'
                  }`}
                >
                  {isEditing ? (
                    // Modo edición
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Fecha</label>
                          <input
                            type="date"
                            value={editingEntry.date}
                            onChange={(e) => setEditingEntry({ ...editingEntry, date: e.target.value })}
                            className="w-full px-2 py-1 border rounded text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Balance</label>
                          <input
                            type="number"
                            step="0.01"
                            value={editingEntry.balance}
                            onChange={(e) => setEditingEntry({ ...editingEntry, balance: e.target.value })}
                            className="w-full px-2 py-1 border rounded text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Nota</label>
                          <input
                            type="text"
                            value={editingEntry.note || ''}
                            onChange={(e) => setEditingEntry({ ...editingEntry, note: e.target.value })}
                            className="w-full px-2 py-1 border rounded text-sm"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditingEntry(null)}
                          className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded text-sm"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={handleUpdateEntry}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                        >
                          Guardar
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Modo visualización
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-2xl">{typeInfo.icon}</div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-800">
                              {formatNumber(entry.balance)} {debt.currency}
                            </span>
                            {change !== 0 && (
                              <span className={`text-sm font-medium ${change < 0 ? 'text-green-600' : 'text-red-600'}`}>
                                ({change < 0 ? '' : '+'}{formatNumber(change)})
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>{new Date(entry.date).toLocaleDateString('es-ES', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            })}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs ${typeInfo.color}`}>
                              {typeInfo.label}
                            </span>
                          </div>
                          {entry.note && (
                            <p className="text-xs text-gray-400 mt-1">{entry.note}</p>
                          )}
                        </div>
                      </div>
                      
                      {entry.type !== 'initial' && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditingEntry({ ...entry })}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            onClick={() => handleDeleteEntry(entry.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Gráfico simple de evolución */}
        {history.length >= 2 && (
          <div className="bg-gray-50 rounded-xl p-4">
            <h4 className="text-sm font-medium text-gray-600 mb-3">
              <i className="fas fa-chart-line mr-2"></i>
              Evolución del Balance
            </h4>
            <div className="h-24 flex items-end gap-1">
              {history.map((entry, index) => {
                const maxBalance = Math.max(...history.map(h => h.balance));
                const height = maxBalance > 0 ? (entry.balance / maxBalance) * 100 : 0;
                
                return (
                  <div
                    key={entry.id}
                    className="flex-1 bg-gradient-to-t from-red-400 to-red-300 rounded-t transition-all hover:from-red-500 hover:to-red-400"
                    style={{ height: `${Math.max(height, 5)}%` }}
                    title={`${new Date(entry.date).toLocaleDateString()}: ${formatNumber(entry.balance)} ${debt.currency}`}
                  ></div>
                );
              })}
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-2">
              <span>{new Date(history[0].date).toLocaleDateString('es-ES', { month: 'short', year: '2-digit' })}</span>
              <span>{new Date(history[history.length - 1].date).toLocaleDateString('es-ES', { month: 'short', year: '2-digit' })}</span>
            </div>
          </div>
        )}

        {/* Botón cerrar */}
        <div className="flex justify-end pt-4 border-t">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  );
}