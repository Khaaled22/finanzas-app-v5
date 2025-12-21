import React, { useState, useMemo } from 'react';
import Modal from '../common/Modal';
import HoldingModal from './HoldingModal';

export default function PlatformDetailModal({ 
  isOpen, 
  onClose, 
  platform, 
  onAddHolding,
  onUpdateHolding,
  onDeleteHolding,
  onUpdateBalance,
  displayCurrency,
  convertCurrency
}) {
  const [showHoldingModal, setShowHoldingModal] = useState(false);
  const [editingHolding, setEditingHolding] = useState(null);

  const holdings = platform?.holdings || [];

  // ✅ MOVER useMemo ANTES del early return
  // Calcular totales
  const totals = useMemo(() => {
    if (!platform) return { totalValue: 0, totalCost: 0, roi: 0, profit: 0 };
    
    let totalValue = 0;
    let totalCost = 0;

    holdings.forEach(holding => {
      if (holding.quantity && holding.currentPrice) {
        // Activo con cantidad y precio
        totalValue += holding.quantity * holding.currentPrice;
        if (holding.purchasePrice) {
          totalCost += holding.quantity * holding.purchasePrice;
        }
      } else if (holding.balance !== undefined) {
        // Balance simple
        totalValue += holding.balance;
      }
    });

    const roi = totalCost > 0 ? ((totalValue - totalCost) / totalCost * 100) : 0;

    return {
      totalValue,
      totalCost,
      roi,
      profit: totalValue - totalCost
    };
  }, [holdings, platform]);

  // ✅ AHORA SÍ el early return
  if (!platform) return null;

  const handleAddHolding = () => {
    setEditingHolding(null);
    setShowHoldingModal(true);
  };

  const handleEditHolding = (holding) => {
    setEditingHolding(holding);
    setShowHoldingModal(true);
  };

  const handleSaveHolding = (holdingData) => {
    if (editingHolding) {
      onUpdateHolding(platform.id, editingHolding.id, holdingData);
    } else {
      onAddHolding(platform.id, holdingData);
    }
  };

  const handleDeleteHolding = (holdingId) => {
    onDeleteHolding(platform.id, holdingId);
  };

  const handleUpdateTotalBalance = () => {
    const newBalance = prompt(
      `Balance total actual de ${platform.platform}:\n\n` +
      `Balance calculado: ${totals.totalValue.toLocaleString('es-ES')} ${platform.currency}\n\n` +
      `Ingresa el nuevo balance manualmente:`,
      totals.totalValue
    );

    if (newBalance !== null) {
      const balance = parseFloat(newBalance);
      if (!isNaN(balance) && balance >= 0) {
        onUpdateBalance(platform.id, balance);
      } else {
        alert('Balance inválido');
      }
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`${platform.icon} ${platform.platform}`}
        size="xl"
      >
        <div className="space-y-6">
          {/* Header con info de la plataforma */}
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold">{platform.name}</h3>
                <p className="text-green-100">{platform.type}</p>
              </div>
              <div className="text-6xl opacity-20">
                {platform.icon}
              </div>
            </div>

            {/* Balance Total */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-green-100 text-sm mb-1">Balance Total</p>
                <p className="text-3xl font-bold">
                  {platform.currentBalance.toLocaleString('es-ES', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })} {platform.currency}
                </p>
                {platform.currency !== displayCurrency && (
                  <p className="text-green-100 text-sm mt-1">
                    ≈ {convertCurrency(platform.currentBalance, platform.currency, displayCurrency).toLocaleString('es-ES', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })} {displayCurrency}
                  </p>
                )}
              </div>

              {totals.totalCost > 0 && (
                <div>
                  <p className="text-green-100 text-sm mb-1">ROI Calculado</p>
                  <p className={`text-3xl font-bold ${totals.roi >= 0 ? 'text-white' : 'text-red-200'}`}>
                    {totals.roi >= 0 ? '+' : ''}{totals.roi.toFixed(2)}%
                  </p>
                  <p className={`text-sm mt-1 ${totals.roi >= 0 ? 'text-green-100' : 'text-red-200'}`}>
                    {totals.roi >= 0 ? '+' : ''}{totals.profit.toLocaleString('es-ES', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })} {platform.currency}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Holdings */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-bold text-gray-800">
                <i className="fas fa-layer-group mr-2 text-blue-600"></i>
                Holdings ({holdings.length})
              </h4>
              <button
                onClick={handleAddHolding}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <i className="fas fa-plus mr-2"></i>
                Agregar Activo
              </button>
            </div>

            {holdings.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <div className="text-4xl text-gray-300 mb-3">
                  <i className="fas fa-folder-open"></i>
                </div>
                <p className="text-gray-600 mb-4">
                  No hay activos registrados en esta plataforma
                </p>
                <button
                  onClick={handleAddHolding}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <i className="fas fa-plus mr-2"></i>
                  Agregar Primer Activo
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {holdings.map(holding => {
                  const isQuantityBased = holding.quantity && holding.currentPrice;
                  const holdingValue = isQuantityBased 
                    ? holding.quantity * holding.currentPrice 
                    : holding.balance;
                  
                  let holdingROI = 0;
                  if (isQuantityBased && holding.purchasePrice) {
                    const cost = holding.quantity * holding.purchasePrice;
                    holdingROI = cost > 0 ? ((holdingValue - cost) / cost * 100) : 0;
                  }

                  const typeIcons = {
                    stock: '📈',
                    etf: '📊',
                    crypto: '₿',
                    bond: '📜',
                    fund: '💼',
                    balance: '💰'
                  };

                  return (
                    <div
                      key={holding.id}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        {/* Info del holding */}
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className="text-2xl">{typeIcons[holding.type] || '📊'}</span>
                            <div>
                              <h5 className="font-bold text-gray-900">
                                {holding.name}
                                {holding.symbol && (
                                  <span className="ml-2 text-sm text-gray-500">({holding.symbol})</span>
                                )}
                              </h5>
                              {isQuantityBased ? (
                                <p className="text-sm text-gray-600">
                                  {holding.quantity} unidades × {holding.currentPrice.toFixed(2)} {platform.currency}
                                </p>
                              ) : (
                                <p className="text-sm text-gray-600">Balance simple</p>
                              )}
                            </div>
                          </div>

                          {holding.notes && (
                            <p className="text-xs text-gray-500 italic ml-11">
                              <i className="fas fa-sticky-note mr-1"></i>
                              {holding.notes}
                            </p>
                          )}
                        </div>

                        {/* Valor y acciones */}
                        <div className="text-right ml-4">
                          <p className="text-lg font-bold text-gray-900">
                            {holdingValue.toLocaleString('es-ES', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })} {platform.currency}
                          </p>
                          {isQuantityBased && holding.purchasePrice && (
                            <p className={`text-sm font-medium ${holdingROI >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {holdingROI >= 0 ? '+' : ''}{holdingROI.toFixed(2)}%
                            </p>
                          )}
                          
                          <div className="flex space-x-2 mt-2">
                            <button
                              onClick={() => handleEditHolding(holding)}
                              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`¿Eliminar ${holding.name}?`)) {
                                  handleDeleteHolding(holding.id);
                                }
                              }}
                              className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
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
          </div>

          {/* Resumen calculado */}
          {holdings.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h5 className="font-semibold text-gray-800 mb-3">
                <i className="fas fa-calculator mr-2 text-blue-600"></i>
                Resumen Calculado
              </h5>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 mb-1">Valor Total Holdings</p>
                  <p className="font-bold text-gray-900">
                    {totals.totalValue.toLocaleString('es-ES', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })} {platform.currency}
                  </p>
                </div>
                {totals.totalCost > 0 && (
                  <>
                    <div>
                      <p className="text-gray-600 mb-1">Costo Total</p>
                      <p className="font-bold text-gray-900">
                        {totals.totalCost.toLocaleString('es-ES', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })} {platform.currency}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 mb-1">Ganancia/Pérdida</p>
                      <p className={`font-bold ${totals.profit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {totals.profit >= 0 ? '+' : ''}{totals.profit.toLocaleString('es-ES', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })} {platform.currency}
                      </p>
                    </div>
                  </>
                )}
              </div>
              {Math.abs(totals.totalValue - platform.currentBalance) > 0.01 && (
                <p className="text-xs text-orange-600 mt-3">
                  <i className="fas fa-exclamation-triangle mr-1"></i>
                  El balance de la plataforma ({platform.currentBalance.toLocaleString('es-ES')} {platform.currency}) 
                  difiere del total calculado. Actualiza manualmente si es necesario.
                </p>
              )}
            </div>
          )}

          {/* Botones finales */}
          <div className="flex justify-between pt-4 border-t">
            <button
              onClick={handleUpdateTotalBalance}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              <i className="fas fa-sync-alt mr-2"></i>
              Actualizar Balance Manual
            </button>
            
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Cerrar
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal de Holding */}
      <HoldingModal
        isOpen={showHoldingModal}
        onClose={() => {
          setShowHoldingModal(false);
          setEditingHolding(null);
        }}
        holding={editingHolding}
        platformCurrency={platform.currency}
        onSave={handleSaveHolding}
        onDelete={handleDeleteHolding}
      />
    </>
  );
}