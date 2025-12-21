// src/views/Settings/components/RateEditModal.jsx
// ✅ M19.7: Modal para editar/agregar registros de tasas históricas
import React, { useState, useEffect } from 'react';
import Modal from '../../../components/common/Modal';

export default function RateEditModal({ rate, onClose, onSave }) {
  const isNew = !rate || !rate.date;
  
  const [formData, setFormData] = useState({
    date: rate?.date || new Date().toISOString().slice(0, 10),
    EUR_CLP: rate?.EUR_CLP || '',
    EUR_USD: rate?.EUR_USD || '',
    USD_CLP: rate?.USD_CLP || '',
    UF_CLP: rate?.UF_CLP || rate?.CLP_UF || ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (rate) {
      setFormData({
        date: rate.date || new Date().toISOString().slice(0, 10),
        EUR_CLP: rate.EUR_CLP || '',
        EUR_USD: rate.EUR_USD || '',
        USD_CLP: rate.USD_CLP || '',
        UF_CLP: rate.UF_CLP || rate.CLP_UF || ''
      });
    }
  }, [rate]);

  const validate = () => {
    const newErrors = {};

    if (!formData.date) {
      newErrors.date = 'La fecha es requerida';
    }

    const hasAnyRate = formData.EUR_CLP || formData.EUR_USD || formData.USD_CLP || formData.UF_CLP;
    if (!hasAnyRate) {
      newErrors.general = 'Debes ingresar al menos una tasa';
    }

    // Validar rangos
    if (formData.EUR_CLP && (formData.EUR_CLP < 500 || formData.EUR_CLP > 2000)) {
      newErrors.EUR_CLP = 'Valor fuera de rango (500-2000)';
    }

    if (formData.EUR_USD && (formData.EUR_USD < 0.5 || formData.EUR_USD > 2.0)) {
      newErrors.EUR_USD = 'Valor fuera de rango (0.5-2.0)';
    }

    if (formData.USD_CLP && (formData.USD_CLP < 500 || formData.USD_CLP > 1500)) {
      newErrors.USD_CLP = 'Valor fuera de rango (500-1500)';
    }

    if (formData.UF_CLP && (formData.UF_CLP < 20000 || formData.UF_CLP > 70000)) {
      newErrors.UF_CLP = 'Valor fuera de rango (20000-70000)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    const rateData = {
      date: formData.date,
      EUR_CLP: parseFloat(formData.EUR_CLP) || undefined,
      EUR_USD: parseFloat(formData.EUR_USD) || undefined,
      USD_CLP: parseFloat(formData.USD_CLP) || undefined,
      UF_CLP: parseFloat(formData.UF_CLP) || undefined,
      CLP_UF: parseFloat(formData.UF_CLP) || undefined,
      source: 'manual',
      timestamp: new Date().toISOString()
    };

    // Calcular USD_CLP si tenemos EUR_CLP y EUR_USD pero no USD_CLP
    if (!rateData.USD_CLP && rateData.EUR_CLP && rateData.EUR_USD) {
      rateData.USD_CLP = rateData.EUR_CLP / rateData.EUR_USD;
    }

    onSave(rateData);
  };

  return (
    <Modal 
      isOpen={true} 
      onClose={onClose} 
      title={isNew ? 'Agregar Tasa Histórica' : 'Editar Tasa Histórica'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.general && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <i className="fas fa-exclamation-circle mr-2"></i>
            {errors.general}
          </div>
        )}

        {/* Fecha */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Fecha *
          </label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            disabled={!isNew}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
              errors.date 
                ? 'border-red-300 focus:ring-red-500' 
                : 'border-gray-300 focus:ring-purple-500'
            } ${!isNew ? 'bg-gray-100 cursor-not-allowed' : ''}`}
          />
          {errors.date && (
            <p className="text-red-600 text-sm mt-1">
              <i className="fas fa-exclamation-circle mr-1"></i>
              {errors.date}
            </p>
          )}
          {!isNew && (
            <p className="text-gray-500 text-xs mt-1">
              La fecha no se puede modificar
            </p>
          )}
        </div>

        {/* EUR → CLP */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            <span className="mr-2">🇪🇺🇨🇱</span>
            EUR → CLP
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.EUR_CLP}
            onChange={(e) => setFormData({ ...formData, EUR_CLP: e.target.value })}
            placeholder="1074.12"
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
              errors.EUR_CLP 
                ? 'border-red-300 focus:ring-red-500' 
                : 'border-gray-300 focus:ring-purple-500'
            }`}
          />
          {errors.EUR_CLP && (
            <p className="text-red-600 text-sm mt-1">
              <i className="fas fa-exclamation-circle mr-1"></i>
              {errors.EUR_CLP}
            </p>
          )}
        </div>

        {/* EUR → USD */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            <span className="mr-2">🇪🇺🇺🇸</span>
            EUR → USD
          </label>
          <input
            type="number"
            step="0.0001"
            value={formData.EUR_USD}
            onChange={(e) => setFormData({ ...formData, EUR_USD: e.target.value })}
            placeholder="1.17"
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
              errors.EUR_USD 
                ? 'border-red-300 focus:ring-red-500' 
                : 'border-gray-300 focus:ring-purple-500'
            }`}
          />
          {errors.EUR_USD && (
            <p className="text-red-600 text-sm mt-1">
              <i className="fas fa-exclamation-circle mr-1"></i>
              {errors.EUR_USD}
            </p>
          )}
        </div>

        {/* USD → CLP */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            <span className="mr-2">🇺🇸🇨🇱</span>
            USD → CLP
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.USD_CLP}
            onChange={(e) => setFormData({ ...formData, USD_CLP: e.target.value })}
            placeholder="918.05"
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
              errors.USD_CLP 
                ? 'border-red-300 focus:ring-red-500' 
                : 'border-gray-300 focus:ring-purple-500'
            }`}
          />
          {errors.USD_CLP && (
            <p className="text-red-600 text-sm mt-1">
              <i className="fas fa-exclamation-circle mr-1"></i>
              {errors.USD_CLP}
            </p>
          )}
          <p className="text-gray-500 text-xs mt-1">
            Se calcula automáticamente si ingresas EUR/CLP y EUR/USD
          </p>
        </div>

        {/* UF → CLP */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            <span className="mr-2">🇨🇱📊</span>
            UF → CLP
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.UF_CLP}
            onChange={(e) => setFormData({ ...formData, UF_CLP: e.target.value })}
            placeholder="39658.92"
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
              errors.UF_CLP 
                ? 'border-red-300 focus:ring-red-500' 
                : 'border-gray-300 focus:ring-purple-500'
            }`}
          />
          {errors.UF_CLP && (
            <p className="text-red-600 text-sm mt-1">
              <i className="fas fa-exclamation-circle mr-1"></i>
              {errors.UF_CLP}
            </p>
          )}
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <i className="fas fa-info-circle mr-2"></i>
            <strong>Nota:</strong> Puedes dejar campos vacíos si no tienes esos datos. USD/CLP se calculará automáticamente si ingresas EUR/CLP y EUR/USD.
          </p>
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            <i className="fas fa-times mr-2"></i>
            Cancelar
          </button>
          <button
            type="submit"
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-medium"
          >
            <i className="fas fa-save mr-2"></i>
            {isNew ? 'Agregar' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </Modal>
  );
}