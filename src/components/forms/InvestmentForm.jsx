// src/components/forms/InvestmentForm.jsx
// ✅ M32: Agregado tipo APV a la lista de tipos de inversión
import { useState } from 'react'
import { useApp } from '../../context/AppContext'

export default function InvestmentForm({ onClose, investment = null }) {
  const { addInvestment, updateInvestment } = useApp()
  
  const [formData, setFormData] = useState({
    type: investment?.type || 'Stock',
    symbol: investment?.symbol || '',
    name: investment?.name || '',
    platform: investment?.platform || '',
    quantity: investment?.quantity || '',
    purchasePrice: investment?.purchasePrice || '',
    currentPrice: investment?.currentPrice || '',
    currency: investment?.currency || 'USD'
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!formData.symbol.trim()) {
      alert('El símbolo es obligatorio')
      return
    }
    
    if (!formData.name.trim()) {
      alert('El nombre es obligatorio')
      return
    }

    if (!formData.platform.trim()) {
      alert('La plataforma/broker es obligatoria')
      return
    }
    
    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      alert('La cantidad debe ser mayor a 0')
      return
    }
    
    if (!formData.purchasePrice || parseFloat(formData.purchasePrice) <= 0) {
      alert('El precio de compra debe ser mayor a 0')
      return
    }
    
    const investmentData = {
      type: formData.type,
      symbol: formData.symbol.trim().toUpperCase(),
      name: formData.name.trim(),
      platform: formData.platform.trim(),
      quantity: parseFloat(formData.quantity),
      purchasePrice: parseFloat(formData.purchasePrice),
      currentPrice: parseFloat(formData.currentPrice || formData.purchasePrice),
      currency: formData.currency
    }
    
    if (investment) {
      updateInvestment(investment.id, investmentData)
    } else {
      addInvestment(investmentData)
    }
    
    onClose()
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6 rounded-t-2xl sticky top-0 z-10">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-2xl font-bold text-white">
                {investment ? 'Editar Inversión' : 'Nueva Inversión'}
              </h3>
              <p className="text-purple-100 text-sm mt-1">
                {investment ? 'Modifica los datos de tu inversión' : 'Registra una nueva inversión en tu portafolio'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
              title="Cerrar"
            >
              <i className="fas fa-times text-2xl"></i>
            </button>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Tipo de Inversión */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Inversión *
            </label>
            <select
              value={formData.type}
              onChange={(e) => handleChange('type', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="Stock">📈 Stock (Acción)</option>
              <option value="ETF">📊 ETF</option>
              <option value="Crypto">₿ Criptomoneda</option>
              <option value="Fondo Mutuo">💼 Fondo Mutuo</option>
              {/* ✅ M32: Nuevo tipo APV */}
              <option value="APV">🏦 APV (Ahorro Previsional)</option>
              <option value="Depósito a Plazo">💰 Depósito a Plazo</option>
              <option value="Bono">📜 Bono</option>
            </select>
            
            {/* ✅ M32: Info sobre APV */}
            {formData.type === 'APV' && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                <i className="fas fa-info-circle mr-2"></i>
                Las inversiones tipo APV suman puntos en tu Índice de Tranquilidad Financiera.
              </div>
            )}
          </div>

          {/* Símbolo y Cantidad */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Símbolo/Ticker *
              </label>
              <input
                type="text"
                value={formData.symbol}
                onChange={(e) => handleChange('symbol', e.target.value)}
                placeholder={formData.type === 'APV' ? 'APV-001' : 'AAPL, BTC, MSFT...'}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent uppercase"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cantidad *
              </label>
              <input
                type="number"
                step="0.00001"
                min="0"
                value={formData.quantity}
                onChange={(e) => handleChange('quantity', e.target.value)}
                placeholder={formData.type === 'APV' ? '1' : '10'}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Nombre completo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre Completo *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder={formData.type === 'APV' ? 'APV Régimen A - Habitat' : 'Apple Inc., Bitcoin, Microsoft...'}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>

          {/* Plataforma/Broker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Plataforma/Broker *
            </label>
            <input
              type="text"
              value={formData.platform}
              onChange={(e) => handleChange('platform', e.target.value)}
              placeholder={formData.type === 'APV' ? 'AFP Habitat, AFP Cuprum...' : 'Interactive Brokers, Binance, Fintual...'}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              <i className="fas fa-info-circle mr-1"></i>
              {formData.type === 'APV' 
                ? 'Ej: AFP Habitat, AFP Cuprum, Principal, Fintual APV'
                : 'Ej: Interactive Brokers, Binance, eToro, Robinhood, Fintual, Renta4'
              }
            </p>
          </div>

          {/* Precios */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {formData.type === 'APV' ? 'Valor Cuota Inicial *' : 'Precio de Compra *'}
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.purchasePrice}
                onChange={(e) => handleChange('purchasePrice', e.target.value)}
                placeholder={formData.type === 'APV' ? '50000' : '150.50'}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {formData.type === 'APV' ? 'Valor Cuota Actual' : 'Precio Actual'} {investment ? '*' : '(opcional)'}
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.currentPrice}
                onChange={(e) => handleChange('currentPrice', e.target.value)}
                placeholder={formData.purchasePrice || (formData.type === 'APV' ? '52000' : '175.30')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required={!!investment}
              />
              <p className="text-xs text-gray-500 mt-1">
                {investment 
                  ? 'Actualiza el precio actual de la inversión'
                  : 'Si no lo ingresas, se usará el precio de compra'
                }
              </p>
            </div>
          </div>

          {/* Moneda */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Moneda *
            </label>
            <select
              value={formData.currency}
              onChange={(e) => handleChange('currency', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="USD">USD $ (Dólar)</option>
              <option value="EUR">EUR € (Euro)</option>
              <option value="CLP">CLP $ (Peso Chileno)</option>
              {/* ✅ M32: UF para APV chileno */}
              <option value="UF">UF (Unidad de Fomento)</option>
            </select>
          </div>

          {/* Resumen de inversión */}
          {formData.quantity && formData.purchasePrice && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="font-semibold text-purple-800 mb-2">
                📊 Resumen de la Inversión
              </h4>
              <div className="space-y-1 text-sm text-gray-700">
                <div className="flex justify-between">
                  <span>Inversión total:</span>
                  <span className="font-bold">
                    {(parseFloat(formData.quantity) * parseFloat(formData.purchasePrice)).toFixed(2)} {formData.currency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Valor actual:</span>
                  <span className="font-bold">
                    {(parseFloat(formData.quantity) * parseFloat(formData.currentPrice || formData.purchasePrice)).toFixed(2)} {formData.currency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Ganancia/Pérdida:</span>
                  <span className={`font-bold ${
                    (parseFloat(formData.currentPrice || formData.purchasePrice) - parseFloat(formData.purchasePrice)) >= 0 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {((parseFloat(formData.quantity) * (parseFloat(formData.currentPrice || formData.purchasePrice) - parseFloat(formData.purchasePrice)))).toFixed(2)} {formData.currency}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Info adicional si es edición */}
          {investment && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
                <i className="fas fa-info-circle mr-2"></i>
                Información de la Inversión
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
                <div>
                  <span className="font-medium">Agregada:</span>
                  <span className="ml-2">{new Date(investment.id).toLocaleDateString('es-ES')}</span>
                </div>
                <div>
                  <span className="font-medium">Operaciones:</span>
                  <span className="ml-2">{investment.purchaseHistory?.length || 1}</span>
                </div>
              </div>
            </div>
          )}

          {/* Botones */}
          <div className="flex space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all font-medium shadow-lg hover:shadow-xl"
            >
              <i className={`fas ${investment ? 'fa-save' : 'fa-plus'} mr-2`}></i>
              {investment ? 'Guardar Cambios' : 'Agregar Inversión'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}