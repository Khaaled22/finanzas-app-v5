// src/components/forms/PlatformForm.jsx
// ✅ M33: Formulario simplificado para plataformas de inversión
// ✅ M36 Fase 6: Subtipos de Cash/Banco prominentes
import { useState, useEffect, useMemo } from 'react';
import { useApp, PLATFORM_GOALS, PLATFORM_SUBTYPES } from '../../context/AppContext';
import { formatNumber } from '../../utils/formatters';

export default function PlatformForm({ isOpen, onClose, platform = null }) {
  const { savePlatform, deletePlatform, archivePlatform } = useApp();
  
  const [formData, setFormData] = useState({
    name: '',
    goal: 'fi_step1',
    subtype: 'fondos_mutuos',
    currency: 'CLP',
    isLiquid: true,
    currentBalance: '',
    institution: '', // ✅ M36 Fase 6: Para cuentas bancarias
    notes: ''
  });
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // ✅ M36 Fase 6: Filtrar subtipos según el goal seleccionado
  const filteredSubtypes = useMemo(() => {
    const isCashGoal = formData.goal === 'cash';
    
    if (isCashGoal) {
      // Mostrar primero los subtipos de cash
      return PLATFORM_SUBTYPES.filter(s => s.forCash);
    } else {
      // Mostrar subtipos de inversión
      return PLATFORM_SUBTYPES.filter(s => !s.forCash);
    }
  }, [formData.goal]);

  // Cargar datos si es edición
  useEffect(() => {
    if (platform) {
      setFormData({
        name: platform.name || '',
        goal: platform.goal || 'other',
        subtype: platform.subtype || 'otro',
        currency: platform.currency || 'CLP',
        isLiquid: platform.isLiquid !== false,
        currentBalance: platform.currentBalance?.toString() || '',
        institution: platform.institution || '',
        notes: platform.notes || ''
      });
    } else {
      setFormData({
        name: '',
        goal: 'fi_step1',
        subtype: 'fondos_mutuos',
        currency: 'CLP',
        isLiquid: true,
        currentBalance: '',
        institution: '',
        notes: ''
      });
    }
  }, [platform, isOpen]);

  // ✅ M36 Fase 6: Ajustar subtype cuando cambia goal
  useEffect(() => {
    if (formData.goal === 'cash') {
      // Si cambiamos a Cash, poner un subtipo de cash
      const currentIsForCash = PLATFORM_SUBTYPES.find(s => s.id === formData.subtype)?.forCash;
      if (!currentIsForCash) {
        setFormData(prev => ({ ...prev, subtype: 'cuenta_corriente' }));
      }
    } else {
      // Si cambiamos a inversión, poner un subtipo de inversión
      const currentIsForCash = PLATFORM_SUBTYPES.find(s => s.id === formData.subtype)?.forCash;
      if (currentIsForCash) {
        setFormData(prev => ({ ...prev, subtype: 'fondos_mutuos' }));
      }
    }
  }, [formData.goal]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('El nombre es obligatorio');
      return;
    }
    
    const platformData = {
      ...formData,
      id: platform?.id,
      currentBalance: parseFloat(formData.currentBalance) || 0,
      balanceHistory: platform?.balanceHistory || [],
      createdAt: platform?.createdAt,
      // ✅ M36 Fase 6: Marcar como cash si corresponde
      isCash: formData.goal === 'cash' || 
              ['cuenta_corriente', 'cuenta_ahorro', 'cuenta_vista', 'efectivo'].includes(formData.subtype)
    };
    
    savePlatform(platformData);
    onClose();
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArchive = () => {
    if (platform?.id) {
      archivePlatform(platform.id);
      onClose();
    }
  };

  const handleDelete = () => {
    if (platform?.id) {
      deletePlatform(platform.id);
      onClose();
    }
  };

  if (!isOpen) return null;

  const selectedGoal = PLATFORM_GOALS.find(g => g.id === formData.goal);
  const selectedSubtype = PLATFORM_SUBTYPES.find(s => s.id === formData.subtype);
  const isCashMode = formData.goal === 'cash';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className={`${isCashMode ? 'bg-gradient-to-r from-emerald-600 to-teal-600' : 'bg-gradient-to-r from-blue-600 to-indigo-600'} p-6 rounded-t-2xl sticky top-0 z-10`}>
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-2xl font-bold text-white">
                {platform ? 'Editar' : 'Nueva'} {isCashMode ? 'Cuenta Bancaria' : 'Plataforma'}
              </h3>
              <p className="text-white/80 text-sm mt-1">
                {isCashMode 
                  ? 'Registra una cuenta bancaria o efectivo' 
                  : 'Registra una plataforma de inversión'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
            >
              <i className="fas fa-times text-2xl"></i>
            </button>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Objetivo (Goal) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Cuenta *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PLATFORM_GOALS.map(goal => (
                <button
                  key={goal.id}
                  type="button"
                  onClick={() => handleChange('goal', goal.id)}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    formData.goal === goal.id
                      ? goal.isCash 
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="text-xl mr-2">{goal.icon}</span>
                  <span className="text-sm font-medium">{goal.name}</span>
                </button>
              ))}
            </div>
            {selectedGoal && (
              <p className="text-xs text-gray-500 mt-2">
                <i className="fas fa-info-circle mr-1"></i>
                {selectedGoal.description}
              </p>
            )}
          </div>

          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {isCashMode ? 'Nombre de la Cuenta *' : 'Nombre de la Plataforma *'}
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder={isCashMode 
                ? 'Ej: Cuenta Corriente Santander, Efectivo Casa...' 
                : 'Ej: Fintual, Trade Republic, Binance...'}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* ✅ M36 Fase 6: Institución (solo para Cash) */}
          {isCashMode && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Institución / Banco (opcional)
              </label>
              <input
                type="text"
                value={formData.institution}
                onChange={(e) => handleChange('institution', e.target.value)}
                placeholder="Ej: Banco Santander, Banco Estado, N26..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          {/* Subtipo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {isCashMode ? 'Tipo de Cuenta' : 'Tipo de Inversión'}
            </label>
            <select
              value={formData.subtype}
              onChange={(e) => handleChange('subtype', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {filteredSubtypes.map(subtype => (
                <option key={subtype.id} value={subtype.id}>
                  {subtype.icon} {subtype.name}
                </option>
              ))}
            </select>
          </div>

          {/* Balance y Moneda */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Balance Actual *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.currentBalance}
                onChange={(e) => handleChange('currentBalance', e.target.value)}
                placeholder="0"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Moneda *
              </label>
              <select
                value={formData.currency}
                onChange={(e) => handleChange('currency', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="CLP">CLP $ (Peso Chileno)</option>
                <option value="EUR">EUR € (Euro)</option>
                <option value="USD">USD $ (Dólar)</option>
                <option value="UF">UF (Unidad de Fomento)</option>
              </select>
            </div>
          </div>

          {/* Liquidez (solo para inversiones) */}
          {!isCashMode && (
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-800">¿Es líquida?</p>
                <p className="text-xs text-gray-500">¿Puedes retirar el dinero fácilmente?</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isLiquid}
                  onChange={(e) => handleChange('isLiquid', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          )}

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notas (opcional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder={isCashMode 
                ? 'Ej: Cuenta principal para gastos...' 
                : 'Ej: Fondo Risky Norris, ETF S&P 500, etc.'}
              rows={2}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Preview */}
          {formData.name && formData.currentBalance && (
            <div className={`${isCashMode ? 'bg-emerald-50 border-emerald-200' : 'bg-blue-50 border-blue-200'} border rounded-lg p-4`}>
              <h4 className={`font-semibold ${isCashMode ? 'text-emerald-800' : 'text-blue-800'} mb-2 flex items-center`}>
                <span className="text-xl mr-2">{selectedGoal?.icon}</span>
                Vista Previa
              </h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">{isCashMode ? 'Cuenta:' : 'Plataforma:'}</span>
                  <span className="font-bold text-gray-800">{formData.name}</span>
                </div>
                {isCashMode && formData.institution && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Institución:</span>
                    <span className="font-medium">{formData.institution}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Tipo:</span>
                  <span className="font-medium">{selectedSubtype?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Balance:</span>
                  <span className={`font-bold ${isCashMode ? 'text-emerald-600' : 'text-blue-600'}`}>
                    {formatNumber(parseFloat(formData.currentBalance) || 0)} {formData.currency}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Botones */}
          <div className="flex flex-col space-y-3 pt-4 border-t">
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className={`flex-1 px-6 py-3 ${isCashMode 
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700' 
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'} text-white rounded-lg transition-all font-medium shadow-lg hover:shadow-xl`}
              >
                <i className={`fas ${platform ? 'fa-save' : 'fa-plus'} mr-2`}></i>
                {platform ? 'Guardar Cambios' : isCashMode ? 'Crear Cuenta' : 'Crear Plataforma'}
              </button>
            </div>

            {/* Opciones de eliminación */}
            {platform && (
              <div className="pt-3 border-t border-gray-200">
                {!showDeleteConfirm ? (
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={handleArchive}
                      className="flex-1 px-4 py-2 text-orange-600 border border-orange-300 rounded-lg hover:bg-orange-50 transition-colors text-sm"
                    >
                      <i className="fas fa-archive mr-2"></i>
                      Archivar
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="flex-1 px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors text-sm"
                    >
                      <i className="fas fa-trash mr-2"></i>
                      Eliminar
                    </button>
                  </div>
                ) : (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-800 mb-3">
                      ¿Estás seguro? Esta acción eliminará la {isCashMode ? 'cuenta' : 'plataforma'} y todo su historial.
                    </p>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(false)}
                        className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleDelete}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                      >
                        Sí, Eliminar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}