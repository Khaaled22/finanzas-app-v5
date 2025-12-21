import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';

const PLATFORM_TYPES = [
  { value: 'Mutual Fund', label: 'Fondo Mutuo', icon: '📈' },
  { value: 'ETF', label: 'ETFs', icon: '📊' },
  { value: 'Brokerage', label: 'Broker', icon: '💹' },
  { value: 'Crypto', label: 'Crypto Exchange', icon: '₿' },
  { value: 'Digital Account', label: 'Cuenta Digital', icon: '💳' },
  { value: 'Lending', label: 'P2P Lending', icon: '🏦' },
  { value: 'Robo-Advisor', label: 'Robo-Advisor', icon: '🤖' },
  { value: 'Other', label: 'Otra', icon: '💼' }
];

const EMOJI_OPTIONS = [
  '📈', '📊', '💹', '₿', '💳', '🏦', '🤖', '💼',
  '💰', '💵', '💴', '💶', '💷', '🪙', '💎', '🏆',
  '🎯', '🚀', '⭐', '🌟', '✨', '🔥', '💪', '🎪'
];

export default function PlatformModal({ isOpen, onClose, platform, onSave, onDelete }) {
  const [formData, setFormData] = useState({
    platform: '',
    type: 'Mutual Fund',
    name: '',
    currency: 'EUR',
    icon: '📈',
    notes: '',
    currentBalance: 0
  });

  const [errors, setErrors] = useState({});
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  useEffect(() => {
    if (platform) {
      setFormData({
        platform: platform.platform || '',
        type: platform.type || 'Mutual Fund',
        name: platform.name || '',
        currency: platform.currency || 'EUR',
        icon: platform.icon || '📈',
        notes: platform.notes || '',
        currentBalance: platform.currentBalance || 0
      });
    } else {
      setFormData({
        platform: '',
        type: 'Mutual Fund',
        name: '',
        currency: 'EUR',
        icon: '📈',
        notes: '',
        currentBalance: 0
      });
    }
    setErrors({});
  }, [platform, isOpen]);

  const validate = () => {
    const newErrors = {};

    if (!formData.platform.trim()) {
      newErrors.platform = 'El nombre de la plataforma es obligatorio';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre del portafolio es obligatorio';
    }

    const balance = parseFloat(formData.currentBalance);
    if (isNaN(balance) || balance < 0) {
      newErrors.currentBalance = 'El balance inicial debe ser mayor o igual a 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validate()) return;

    const platformData = {
      platform: formData.platform.trim(),
      type: formData.type,
      name: formData.name.trim(),
      currency: formData.currency,
      icon: formData.icon,
      notes: formData.notes.trim(),
      currentBalance: parseFloat(formData.currentBalance),
      lastUpdated: new Date().toISOString()
    };

    // Si es edición, agregar el id
    if (platform) {
      platformData.id = platform.id;
    }
    // Si es nueva, savePlatform generará el ID

    onSave(platformData);
    onClose();
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  const handleDelete = () => {
    if (window.confirm(`¿Estás seguro de eliminar la plataforma ${platform.platform}?\n\nEsta acción no se puede deshacer.`)) {
      onDelete(platform.id);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={platform ? '✏️ Editar Plataforma' : '➕ Nueva Plataforma'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Selector de Emoji */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Icono
          </label>
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="w-16 h-16 text-4xl bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center justify-center"
            >
              {formData.icon}
            </button>
            <p className="text-sm text-gray-600">Click para cambiar el icono</p>
          </div>
          
          {showEmojiPicker && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="grid grid-cols-8 gap-2">
                {EMOJI_OPTIONS.map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      handleChange('icon', emoji);
                      setShowEmojiPicker(false);
                    }}
                    className={`w-10 h-10 text-2xl rounded-lg hover:bg-white transition-colors ${
                      formData.icon === emoji ? 'bg-blue-100 ring-2 ring-blue-500' : 'bg-white'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Nombre de la Plataforma */}
        <div>
          <label htmlFor="platform" className="block text-sm font-medium text-gray-700 mb-2">
            <i className="fas fa-building mr-2 text-blue-600"></i>
            Nombre de la Plataforma *
          </label>
          <input
            id="platform"
            type="text"
            value={formData.platform}
            onChange={(e) => handleChange('platform', e.target.value)}
            placeholder="Ej: Fintual, Interactive Brokers, Binance"
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
              errors.platform 
                ? 'border-red-300 focus:ring-red-500' 
                : 'border-gray-300 focus:ring-blue-500'
            }`}
            maxLength={50}
            required
          />
          {errors.platform && (
            <p className="mt-1 text-sm text-red-600">
              <i className="fas fa-exclamation-circle mr-1"></i>
              {errors.platform}
            </p>
          )}
        </div>

        {/* Tipo y Nombre del Portafolio */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
              <i className="fas fa-tag mr-2 text-blue-600"></i>
              Tipo de Plataforma
            </label>
            <select
              id="type"
              value={formData.type}
              onChange={(e) => handleChange('type', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {PLATFORM_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.icon} {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">
              <i className="fas fa-coins mr-2 text-blue-600"></i>
              Moneda
            </label>
            <select
              id="currency"
              value={formData.currency}
              onChange={(e) => handleChange('currency', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="EUR">EUR €</option>
              <option value="USD">USD $</option>
              <option value="CLP">CLP $</option>
              <option value="UF">UF</option>
            </select>
          </div>
        </div>

        {/* Nombre del Portafolio */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            <i className="fas fa-briefcase mr-2 text-blue-600"></i>
            Nombre del Portafolio *
          </label>
          <input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Ej: Portafolio Agresivo, Cuenta Principal, Crypto Portfolio"
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

        {/* Balance Inicial (solo para nuevas plataformas) */}
        {!platform && (
          <div>
            <label htmlFor="currentBalance" className="block text-sm font-medium text-gray-700 mb-2">
              <i className="fas fa-dollar-sign mr-2 text-blue-600"></i>
              Balance Inicial
            </label>
            <div className="flex space-x-2">
              <input
                id="currentBalance"
                type="number"
                step="0.01"
                value={formData.currentBalance}
                onChange={(e) => handleChange('currentBalance', e.target.value)}
                placeholder="0.00"
                className={`flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                  errors.currentBalance 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
              />
              <div className="flex items-center px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg font-medium text-gray-700">
                {formData.currency}
              </div>
            </div>
            {errors.currentBalance && (
              <p className="mt-1 text-sm text-red-600">
                <i className="fas fa-exclamation-circle mr-1"></i>
                {errors.currentBalance}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Puedes actualizar el balance después agregando holdings o manualmente
            </p>
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
            placeholder="Ej: Estrategia de inversión, objetivos, etc."
            rows={3}
            maxLength={200}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <p className="mt-1 text-xs text-gray-500">
            {formData.notes.length}/200 caracteres
          </p>
        </div>

        {/* Botones */}
        <div className="flex justify-between pt-4 border-t">
          {platform && (
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
              <i className={`fas ${platform ? 'fa-save' : 'fa-plus'} mr-2`}></i>
              {platform ? 'Guardar Cambios' : 'Crear Plataforma'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}