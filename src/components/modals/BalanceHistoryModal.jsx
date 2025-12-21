import React, { useState } from 'react';
import Modal from '../common/Modal';

export default function BalanceHistoryModal({ isOpen, onClose, platform, onUpdateHistory, onAddEntry, onDeleteEntry }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    balance: '',
    note: ''
  });

  if (!platform) return null;

  const balanceHistory = [...(platform.balanceHistory || [])].sort((a, b) => 
    new Date(b.date) - new Date(a.date)
  );

  const handleAddEntry = () => {
    setEditingEntry(null);
    setFormData({
      date: new Date().toISOString().slice(0, 10),
      balance: platform.currentBalance || '',
      note: ''
    });
    setShowAddForm(true);
  };

  const handleEditEntry = (entry, index) => {
    setEditingEntry(index);
    setFormData({
      date: new Date(entry.date).toISOString().slice(0, 10),
      balance: entry.balance,
      note: entry.note || ''
    });
    setShowAddForm(true);
  };

  const handleSave = () => {
    const balance = parseFloat(formData.balance);
    if (isNaN(balance) || balance < 0) {
      alert('Balance inválido');
      return;
    }

    const entry = {
      date: new Date(formData.date).toISOString(),
      balance: balance,
      note: formData.note.trim()
    };

    if (editingEntry !== null) {
      // Editar entrada existente
      const newHistory = [...platform.balanceHistory];
      newHistory[editingEntry] = entry;
      onUpdateHistory(platform.id, newHistory);
    } else {
      // Agregar nueva entrada
      onAddEntry(platform.id, entry);
    }

    setShowAddForm(false);
    setFormData({ date: '', balance: '', note: '' });
    setEditingEntry(null);
  };

  const handleDelete = (index) => {
    if (balanceHistory.length <= 1) {
      alert('No puedes eliminar la única entrada del historial');
      return;
    }

    if (window.confirm('¿Eliminar esta entrada del historial?')) {
      onDeleteEntry(platform.id, index);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`📅 Historial de Balances - ${platform.platform}`}
      size="xl"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 text-sm">{platform.name}</p>
            <p className="text-2xl font-bold text-gray-900">
              {balanceHistory.length} {balanceHistory.length === 1 ? 'entrada' : 'entradas'}
            </p>
          </div>
          <button
            onClick={handleAddEntry}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            <i className="fas fa-plus mr-2"></i>
            Agregar Entrada
          </button>
        </div>

        {/* Formulario de agregar/editar */}
        {showAddForm && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-4">
              {editingEntry !== null ? '✏️ Editar Entrada' : '➕ Nueva Entrada'}
            </h4>
            
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Balance *
                </label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    step="0.01"
                    value={formData.balance}
                    onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                    placeholder="0.00"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <div className="flex items-center px-3 bg-gray-100 border border-gray-300 rounded-lg text-sm font-medium text-gray-700">
                    {platform.currency}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nota (opcional)
                </label>
                <input
                  type="text"
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  placeholder="Ej: Aporte mensual"
                  maxLength={100}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingEntry(null);
                  setFormData({ date: '', balance: '', note: '' });
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <i className="fas fa-save mr-2"></i>
                {editingEntry !== null ? 'Guardar Cambios' : 'Agregar'}
              </button>
            </div>
          </div>
        )}

        {/* Lista de entradas */}
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {balanceHistory.map((entry, index) => {
            const prevEntry = balanceHistory[index + 1];
            let change = 0;
            let changePercent = 0;

            if (prevEntry) {
              change = entry.balance - prevEntry.balance;
              changePercent = prevEntry.balance > 0 ? (change / prevEntry.balance * 100) : 0;
            }

            return (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  {/* Fecha y Badge */}
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {new Date(entry.date).getDate()}
                      </div>
                      <div className="text-xs text-gray-500 uppercase">
                        {new Date(entry.date).toLocaleDateString('es-ES', { 
                          month: 'short',
                          year: '2-digit'
                        })}
                      </div>
                    </div>

                    {index === 0 && (
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                        Actual
                      </span>
                    )}
                    {index === balanceHistory.length - 1 && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                        Inicial
                      </span>
                    )}
                  </div>

                  {/* Balance y cambio */}
                  <div className="flex-1 mx-6">
                    <p className="text-2xl font-bold text-gray-900">
                      {entry.balance.toLocaleString('es-ES', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })} {platform.currency}
                    </p>
                    
                    {prevEntry && Math.abs(changePercent) > 0.01 && (
                      <p className={`text-sm font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {change >= 0 ? '▲' : '▼'} {change >= 0 ? '+' : ''}{change.toLocaleString('es-ES', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })} ({change >= 0 ? '+' : ''}{changePercent.toFixed(2)}%)
                      </p>
                    )}

                    {entry.note && (
                      <p className="text-sm text-gray-600 italic mt-1">
                        <i className="fas fa-sticky-note mr-1"></i>
                        {entry.note}
                      </p>
                    )}
                  </div>

                  {/* Botones de acción */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditEntry(entry, index)}
                      className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                      title="Editar"
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    {balanceHistory.length > 1 && (
                      <button
                        onClick={() => handleDelete(index)}
                        className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
                        title="Eliminar"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Info sobre balance actual */}
        {balanceHistory.length > 0 && balanceHistory[0].balance !== platform.currentBalance && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <i className="fas fa-exclamation-triangle mr-2"></i>
              El balance más reciente del historial ({balanceHistory[0].balance.toLocaleString('es-ES')} {platform.currency}) 
              difiere del balance actual de la plataforma ({platform.currentBalance.toLocaleString('es-ES')} {platform.currency}).
            </p>
          </div>
        )}

        {/* Botón cerrar */}
        <div className="flex justify-end pt-4 border-t">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  );
}