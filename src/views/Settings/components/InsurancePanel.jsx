// src/views/Settings/components/InsurancePanel.jsx
// ✅ M32: Panel de configuración de seguros para el Índice Nauta
import React, { useState, useEffect } from 'react';
import StorageManager from '../../../modules/storage/StorageManager';

const INITIAL_INSURANCE_CONFIG = {
  hasHealthInsurance: false,
  healthInsuranceAmount: 0,
  healthInsuranceProvider: '',
  
  hasLifeInsurance: false,
  lifeInsuranceAmount: 0,
  lifeInsuranceProvider: '',
  
  hasCatastrophicInsurance: false,
  catastrophicInsuranceAmount: 0,
  catastrophicInsuranceProvider: '',
  
  currency: 'EUR'
};

export default function InsurancePanel() {
  const [config, setConfig] = useState(() => 
    StorageManager.load('insuranceConfig_v5', INITIAL_INSURANCE_CONFIG)
  );
  const [saved, setSaved] = useState(false);

  // Auto-save
  useEffect(() => {
    StorageManager.save('insuranceConfig_v5', config);
  }, [config]);

  const handleChange = (field, value) => {
    setConfig(prev => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    StorageManager.save('insuranceConfig_v5', config);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // Calcular puntuación de seguros
  const calculateInsuranceScore = () => {
    let score = 0;
    if (config.hasHealthInsurance) score += 4;
    if (config.hasCatastrophicInsurance) score += 3;
    if (config.hasLifeInsurance) score += 3;
    return Math.min(score, 10);
  };

  const insuranceScore = calculateInsuranceScore();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-bold text-gray-800 flex items-center">
            <i className="fas fa-shield-alt mr-3 text-indigo-600"></i>
            Configuración de Seguros
          </h3>
          <p className="text-gray-600 text-sm mt-1">
            Configura tus seguros para mejorar tu Índice de Tranquilidad Financiera
          </p>
        </div>
        
        {/* Score Preview */}
        <div className={`px-4 py-2 rounded-lg ${
          insuranceScore >= 7 ? 'bg-green-100 text-green-700' :
          insuranceScore >= 4 ? 'bg-yellow-100 text-yellow-700' :
          'bg-red-100 text-red-700'
        }`}>
          <p className="text-sm font-medium">Puntuación</p>
          <p className="text-2xl font-bold">{insuranceScore}/10</p>
        </div>
      </div>

      {/* Explicación */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <i className="fas fa-info-circle text-blue-600 mt-1 mr-3"></i>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">¿Cómo afecta tu índice?</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li><strong>Seguro de Salud:</strong> +4 puntos</li>
              <li><strong>Seguro Catastrófico:</strong> +3 puntos</li>
              <li><strong>Seguro de Vida:</strong> +3 puntos</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Moneda */}
      <div className="bg-gray-50 rounded-lg p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <i className="fas fa-coins mr-2"></i>
          Moneda para montos
        </label>
        <select
          value={config.currency}
          onChange={(e) => handleChange('currency', e.target.value)}
          className="w-full md:w-48 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
        >
          <option value="EUR">EUR €</option>
          <option value="CLP">CLP $</option>
          <option value="USD">USD $</option>
          <option value="UF">UF</option>
        </select>
      </div>

      {/* Seguros Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Seguro de Salud */}
        <InsuranceCard
          title="Seguro de Salud"
          subtitle="Isapre, Fonasa, Complementario"
          icon="fa-heartbeat"
          iconColor="text-red-500"
          points={4}
          isEnabled={config.hasHealthInsurance}
          onToggle={(val) => handleChange('hasHealthInsurance', val)}
          amount={config.healthInsuranceAmount}
          onAmountChange={(val) => handleChange('healthInsuranceAmount', val)}
          provider={config.healthInsuranceProvider}
          onProviderChange={(val) => handleChange('healthInsuranceProvider', val)}
          currency={config.currency}
        />

        {/* Seguro Catastrófico */}
        <InsuranceCard
          title="Seguro Catastrófico"
          subtitle="GES, Cobertura Mayor"
          icon="fa-hospital"
          iconColor="text-orange-500"
          points={3}
          isEnabled={config.hasCatastrophicInsurance}
          onToggle={(val) => handleChange('hasCatastrophicInsurance', val)}
          amount={config.catastrophicInsuranceAmount}
          onAmountChange={(val) => handleChange('catastrophicInsuranceAmount', val)}
          provider={config.catastrophicInsuranceProvider}
          onProviderChange={(val) => handleChange('catastrophicInsuranceProvider', val)}
          currency={config.currency}
        />

        {/* Seguro de Vida */}
        <InsuranceCard
          title="Seguro de Vida"
          subtitle="Protección familiar"
          icon="fa-user-shield"
          iconColor="text-purple-500"
          points={3}
          isEnabled={config.hasLifeInsurance}
          onToggle={(val) => handleChange('hasLifeInsurance', val)}
          amount={config.lifeInsuranceAmount}
          onAmountChange={(val) => handleChange('lifeInsuranceAmount', val)}
          provider={config.lifeInsuranceProvider}
          onProviderChange={(val) => handleChange('lifeInsuranceProvider', val)}
          currency={config.currency}
        />
      </div>

      {/* Botón Guardar */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            saved 
              ? 'bg-green-600 text-white'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
          }`}
        >
          {saved ? (
            <>
              <i className="fas fa-check mr-2"></i>
              Guardado
            </>
          ) : (
            <>
              <i className="fas fa-save mr-2"></i>
              Guardar Configuración
            </>
          )}
        </button>
      </div>

      {/* Nota sobre detección automática */}
      <div className="bg-gray-100 rounded-lg p-4 text-sm text-gray-600">
        <p>
          <i className="fas fa-magic mr-2"></i>
          <strong>Nota:</strong> El sistema también detecta seguros automáticamente desde tus categorías de gastos 
          (si tienen nombres como "Seguro Salud", "Isapre", etc.). Esta configuración te permite ser más explícito.
        </p>
      </div>
    </div>
  );
}

// Componente tarjeta de seguro individual
function InsuranceCard({ 
  title, 
  subtitle, 
  icon, 
  iconColor, 
  points,
  isEnabled, 
  onToggle,
  amount,
  onAmountChange,
  provider,
  onProviderChange,
  currency
}) {
  return (
    <div className={`border-2 rounded-xl p-4 transition-all ${
      isEnabled 
        ? 'border-indigo-500 bg-indigo-50' 
        : 'border-gray-200 bg-white'
    }`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
            isEnabled ? 'bg-indigo-100' : 'bg-gray-100'
          }`}>
            <i className={`fas ${icon} text-2xl ${isEnabled ? iconColor : 'text-gray-400'}`}></i>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800">{title}</h4>
            <p className="text-xs text-gray-500">{subtitle}</p>
          </div>
        </div>
        <span className={`text-xs font-bold px-2 py-1 rounded ${
          isEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
        }`}>
          +{points} pts
        </span>
      </div>

      {/* Toggle */}
      <label className="flex items-center gap-3 cursor-pointer mb-4">
        <div className="relative">
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={(e) => onToggle(e.target.checked)}
            className="sr-only"
          />
          <div className={`w-12 h-6 rounded-full transition-colors ${
            isEnabled ? 'bg-indigo-600' : 'bg-gray-300'
          }`}>
            <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
              isEnabled ? 'translate-x-6' : 'translate-x-0'
            }`}></div>
          </div>
        </div>
        <span className={`text-sm font-medium ${isEnabled ? 'text-indigo-700' : 'text-gray-500'}`}>
          {isEnabled ? 'Activo' : 'No tengo'}
        </span>
      </label>

      {/* Campos adicionales si está habilitado */}
      {isEnabled && (
        <div className="space-y-3 pt-3 border-t border-indigo-200">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Proveedor (opcional)</label>
            <input
              type="text"
              value={provider}
              onChange={(e) => onProviderChange(e.target.value)}
              placeholder="Ej: Consalud, MetLife..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Prima mensual ({currency})</label>
            <input
              type="number"
              value={amount || ''}
              onChange={(e) => onAmountChange(parseFloat(e.target.value) || 0)}
              placeholder="0"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      )}
    </div>
  );
}