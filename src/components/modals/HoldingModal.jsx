import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';

const HOLDING_TYPES = [
  { value: 'stock', label: 'Acción', icon: '📈' },
  { value: 'etf', label: 'ETF', icon: '📊' },
  { value: 'crypto', label: 'Criptomoneda', icon: '₿' },
  { value: 'bond', label: 'Bono', icon: '📜' },
  { value: 'fund', label: 'Fondo', icon: '💼' },
  { value: 'balance', label: 'Balance General', icon: '💰' }
];

export default function HoldingModal({ isOpen, onClose, holding, platformCurrency, onSave, onDelete }) {
  const [formData, setFormData] = useState({
    type: 'balance',
    name: '',
    symbol: '',
    
    // Para activos con cantidad
    quantity: '',
    purchasePrice: '',
    currentPrice: '',
    
    // Para balance simple
    balance: '',
    
    notes: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (holding) {
      setFormData({
        type: holding.type || 'balance',
        name: holding.name || '',
        symbol: holding.symbol || '',
        quantity: holding.quantity || '',
        purchasePrice: holding.purchasePrice || '',
        currentPrice: holding.currentPrice || '',
        balance: holding.balance || '',
        notes: holding.notes || ''
      });
    } else {
      setFormData({
        type: 'balance',
        name: '',
        symbol: '',
        quantity: '',
        purchasePrice: '',
        currentPrice: '',
        balance: '',
        notes: ''
      });
    }
    setErrors({});
  }, [holding, isOpen]);

  const needsQuantityAndPrice = ['stock', 'etf', 'crypto', 'bond'].includes(formData.type);

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es obligatorio';
    }

    if (needsQuantityAndPrice) {
      // Validar símbolo para activos con ticker
      if (!formData.symbol.trim()) {
        newErrors.symbol = 'El símbolo es obligatorio para este tipo de activo';
      }

      const quantity = parseFloat(formData.quantity);
      if (isNaN(quantity) || quantity <= 0) {
        newErrors.quantity = 'La cantidad debe ser mayor a 0';
      }

      const purchasePrice = parseFloat(formData.purchasePrice);
      if (isNaN(purchasePrice) || purchasePrice <= 0) {
        newErrors.purchasePrice = 'El precio de compra debe ser mayor a 0';
      }

      const currentPrice = parseFloat(formData.currentPrice);
      if (isNaN(currentPrice) || currentPrice <= 0) {
        newErrors.currentPrice = 'El precio actual debe ser mayor a 0';
      }
    } else {
      // Validar balance simple
      const balance = parseFloat(formData.balance);
      if (isNaN(balance) || balance < 0) {
        newErrors.balance = 'El balance debe ser mayor o igual a 0';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validate()) return;

    const holdingData = {
      type: formData.type,
      name: formData.name.trim(),
      symbol: formData.symbol.trim().toUpperCase(),
      notes: formData.notes.trim()
    };

    if (needsQuantityAndPrice) {
      holdingData.quantity = parseFloat(formData.quantity);
      holdingData.purchasePrice = parseFloat(formData.purchasePrice);
      holdingData.currentPrice = parseFloat(formData.currentPrice);
    } else {
      holdingData.balance = parseFloat(formData.balance);
    }

    onSave(holdingData);
    onClose();
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  const handleDelete = () => {
    if (window.confirm(`¿Estás seguro de eliminar ${holding.name}?\n\nEsta acción no se puede deshacer.`)) {
      onDelete(holding.id);
      onClose();
    }
  };

  // Calcular valor y ROI si tiene datos
  let calculatedValue = 0;
  let calculatedROI = 0;
  if (needsQuantityAndPrice && formData.quantity && formData.currentPrice && formData.purchasePrice) {
    const quantity = parseFloat(formData.quantity);
    const currentPrice = parseFloat(formData.currentPrice);
    const purchasePrice = parseFloat(formData.purchasePrice);
    
    calculatedValue = quantity * currentPrice;
    const purchaseValue = quantity * purchasePrice;
    calculatedROI = purchaseValue > 0 ? ((calculatedValue - purchaseValue) / purchaseValue * 100) : 0;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={holding ? '✏️ Editar Holding' : '➕ Agregar Holding'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Tipo de Holding */}
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
            <i className="fas fa-layer-group mr-2 text-blue-600"></i>
            Tipo de Activo
          </label>
          <select
            id="type"
            value={formData.type}
            onChange={(e) => handleChange('type', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={holding} // No cambiar tipo al editar
          >
            {HOLDING_TYPES.map(type => (
              <option key={type.value} value={type.value}>
                {type.icon} {type.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            {needsQuantityAndPrice 
              ? 'Este tipo requiere cantidad y precios' 
              : 'Este tipo solo requiere un balance total'}
          </p>
        </div>

        {/* Nombre */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            <i className="fas fa-tag mr-2 text-blue-600"></i>
            Nombre del Activo *
          </label>
          <input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder={needsQuantityAndPrice ? "Ej: Apple Inc., Bitcoin" : "Ej: Fondo Conservador, Cuenta Principal"}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
              errors.name 
                ? 'border-red-300 focus:ring-red-500' 
                : 'border-gray-300 focus:ring-blue-500'
            }`}
            maxLength={100}
            required
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">
              <i className="fas fa-exclamation-circle mr-1"></i>
              {errors.name}
            </p>
          )}
        </div>

        {/* Símbolo (solo para activos con ticker) */}
        {needsQuantityAndPrice && (
          <div>
            <label htmlFor="symbol" className="block text-sm font-medium text-gray-700 mb-2">
              <i className="fas fa-code mr-2 text-blue-600"></i>
              Símbolo / Ticker *
            </label>
            <input
              id="symbol"
              type="text"
              value={formData.symbol}
              onChange={(e) => handleChange('symbol', e.target.value.toUpperCase())}
              placeholder="Ej: AAPL, BTC, VOO"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                errors.symbol 
                  ? 'border-red-300 focus:ring-red-500' 
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
              maxLength={20}
              required
            />
            {errors.symbol && (
              <p className="mt-1 text-sm text-red-600">
                <i className="fas fa-exclamation-circle mr-1"></i>
                {errors.symbol}
              </p>
            )}
          </div>
        )}

        {/* OPCIÓN A: Cantidad y Precios */}
        {needsQuantityAndPrice ? (
          <>
            {/* Cantidad */}
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
                <i className="fas fa-cubes mr-2 text-blue-600"></i>
                Cantidad *
              </label>
              <input
                id="quantity"
                type="number"
                step="0.00000001"
                value={formData.quantity}
                onChange={(e) => handleChange('quantity', e.target.value)}
                placeholder="0.00"
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                  errors.quantity 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                required
              />
              {errors.quantity && (
                <p className="mt-1 text-sm text-red-600">
                  <i className="fas fa-exclamation-circle mr-1"></i>
                  {errors.quantity}
                </p>
              )}
            </div>

            {/* Precios */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="purchasePrice" className="block text-sm font-medium text-gray-700 mb-2">
                  Precio Compra *
                </label>
                <div className="flex space-x-2">
                  <input
                    id="purchasePrice"
                    type="number"
                    step="0.01"
                    value={formData.purchasePrice}
                    onChange={(e) => handleChange('purchasePrice', e.target.value)}
                    placeholder="0.00"
                    className={`flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                      errors.purchasePrice 
                        ? 'border-red-300 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    required
                  />
                  <div className="flex items-center px-3 bg-gray-100 border border-gray-300 rounded-lg text-sm font-medium text-gray-700">
                    {platformCurrency}
                  </div>
                </div>
                {errors.purchasePrice && (
                  <p className="mt-1 text-sm text-red-600">
                    <i className="fas fa-exclamation-circle mr-1"></i>
                    {errors.purchasePrice}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="currentPrice" className="block text-sm font-medium text-gray-700 mb-2">
                  Precio Actual *
                </label>
                <div className="flex space-x-2">
                  <input
                    id="currentPrice"
                    type="number"
                    step="0.01"
                    value={formData.currentPrice}
                    onChange={(e) => handleChange('currentPrice', e.target.value)}
                    placeholder="0.00"
                    className={`flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                      errors.currentPrice 
                        ? 'border-red-300 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    required
                  />
                  <div className="flex items-center px-3 bg-gray-100 border border-gray-300 rounded-lg text-sm font-medium text-gray-700">
                    {platformCurrency}
                  </div>
                </div>
                {errors.currentPrice && (
                  <p className="mt-1 text-sm text-red-600">
                    <i className="fas fa-exclamation-circle mr-1"></i>
                    {errors.currentPrice}
                  </p>
                )}
              </div>
            </div>

            {/* Vista previa de valor y ROI */}
            {calculatedValue > 0 && (
              <div className={`${calculatedROI >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border rounded-lg p-4`}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Valor Total</p>
                    <p className="text-xl font-bold text-gray-900">
                      {calculatedValue.toLocaleString('es-ES', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })} {platformCurrency}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">ROI</p>
                    <p className={`text-xl font-bold ${calculatedROI >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      {calculatedROI >= 0 ? '+' : ''}{calculatedROI.toFixed(2)}%
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          /* OPCIÓN B: Balance Simple */
          <div>
            <label htmlFor="balance" className="block text-sm font-medium text-gray-700 mb-2">
              <i className="fas fa-dollar-sign mr-2 text-blue-600"></i>
              Balance *
            </label>
            <div className="flex space-x-2">
              <input
                id="balance"
                type="number"
                step="0.01"
                value={formData.balance}
                onChange={(e) => handleChange('balance', e.target.value)}
                placeholder="0.00"
                className={`flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                  errors.balance 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                required
              />
              <div className="flex items-center px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg font-medium text-gray-700">
                {platformCurrency}
              </div>
            </div>
            {errors.balance && (
              <p className="mt-1 text-sm text-red-600">
                <i className="fas fa-exclamation-circle mr-1"></i>
                {errors.balance}
              </p>
            )}
          </div>
        )}

        {/* Notas */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
            <i className="fas fa-sticky-note mr-2 text-blue-600"></i>
            Notas (opcional)
          </label>
          <textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="Ej: Compra mensual, aporte adicional, etc."
            rows={2}
            maxLength={200}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <p className="mt-1 text-xs text-gray-500">
            {formData.notes.length}/200 caracteres
          </p>
        </div>

        {/* Botones */}
        <div className="flex justify-between pt-4 border-t">
          {holding && (
            <button
              type="button"
              onClick={handleDelete}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              <i className="fas fa-trash mr-2"></i>
              Eliminar
            </button>
          )}
          
          <div className="flex space-x-3 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <i className={`fas ${holding ? 'fa-save' : 'fa-plus'} mr-2`}></i>
              {holding ? 'Guardar' : 'Agregar'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}