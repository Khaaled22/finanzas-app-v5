// src/components/common/QuickTransactionModal.jsx
// ✅ M36 Fase 7: Modal completo para agregar transacciones con buscador de categorías
import { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../../context/AppContext';

export default function QuickTransactionModal({ isOpen, onClose }) {
  const { 
    addTransaction, 
    categories, 
    transactions,
    convertCurrencyAtDate, 
    displayCurrency 
  } = useApp();

  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    description: '',
    amount: '',
    currency: 'EUR',
    categoryId: '',
    paymentMethod: 'Tarjeta'
  });

  const [categorySearch, setCategorySearch] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const categoryInputRef = useRef(null);
  const dropdownRef = useRef(null);

  // ✅ M36 Fase 7: Calcular categorías frecuentes basadas en uso
  const frequentCategories = useMemo(() => {
    const categoryCount = {};
    
    // Contar transacciones por categoría (últimos 3 meses)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    transactions
      .filter(t => new Date(t.date) >= threeMonthsAgo)
      .forEach(t => {
        if (t.categoryId) {
          categoryCount[t.categoryId] = (categoryCount[t.categoryId] || 0) + 1;
        }
      });
    
    // Ordenar por frecuencia y tomar top 6
    return Object.entries(categoryCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([id]) => categories.find(c => c.id === id))
      .filter(Boolean);
  }, [transactions, categories]);

  // ✅ M36 Fase 7: Filtrar categorías por búsqueda
  const filteredCategories = useMemo(() => {
    if (!categorySearch.trim()) {
      return categories;
    }
    
    const search = categorySearch.toLowerCase();
    return categories.filter(cat => 
      cat.name.toLowerCase().includes(search) ||
      cat.group.toLowerCase().includes(search) ||
      (cat.icon && cat.icon.includes(search))
    );
  }, [categories, categorySearch]);

  // ✅ Agrupar categorías filtradas por grupo
  const groupedCategories = useMemo(() => {
    return filteredCategories.reduce((acc, cat) => {
      if (!acc[cat.group]) {
        acc[cat.group] = [];
      }
      acc[cat.group].push(cat);
      return acc;
    }, {});
  }, [filteredCategories]);

  // Reset form cuando se abre
  useEffect(() => {
    if (isOpen) {
      setFormData({
        date: new Date().toISOString().slice(0, 10),
        description: '',
        amount: '',
        currency: 'EUR',
        categoryId: '',
        paymentMethod: 'Tarjeta'
      });
      setCategorySearch('');
      setShowCategoryDropdown(false);
      setErrors({});
    }
  }, [isOpen]);

  // Click outside para cerrar dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          categoryInputRef.current && !categoryInputRef.current.contains(event.target)) {
        setShowCategoryDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedCategory = categories.find(cat => cat.id === formData.categoryId);
  const isIncome = selectedCategory?.type === 'income';

  // Calcular conversión
  const previewConversion = () => {
    if (!formData.amount || isNaN(parseFloat(formData.amount))) return null;
    if (!formData.currency || !displayCurrency) return null;
    if (formData.currency === displayCurrency) return null;

    const amount = parseFloat(formData.amount);
    return convertCurrencyAtDate(amount, formData.currency, displayCurrency, formData.date);
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.description.trim()) {
      newErrors.description = 'Descripción requerida';
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      newErrors.amount = 'Monto inválido';
    }

    if (!formData.categoryId) {
      newErrors.categoryId = 'Selecciona categoría';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;

    setIsSubmitting(true);
    
    try {
      const transactionData = {
        ...formData,
        amount: parseFloat(formData.amount),
        date: new Date(formData.date).toISOString()
      };

      addTransaction(transactionData);
      
      // Feedback visual
      setTimeout(() => {
        setIsSubmitting(false);
        onClose();
      }, 300);
    } catch (error) {
      console.error('Error al guardar:', error);
      setIsSubmitting(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Auto-detectar moneda al cambiar categoría
      if (field === 'categoryId') {
        const cat = categories.find(c => c.id === value);
        if (cat?.currency) {
          newData.currency = cat.currency;
        }
        setCategorySearch('');
        setShowCategoryDropdown(false);
      }
      
      return newData;
    });
    
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  const handleCategorySelect = (categoryId) => {
    handleChange('categoryId', categoryId);
  };

  const converted = previewConversion();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end md:items-center justify-center z-50 animate-in fade-in duration-200">
      <div 
        className="bg-white w-full md:max-w-lg md:rounded-2xl rounded-t-3xl shadow-2xl max-h-[95vh] md:max-h-[90vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`${isIncome ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-blue-500 to-blue-600'} p-4 md:p-5 flex justify-between items-center sticky top-0 z-10`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <i className={`fas ${isIncome ? 'fa-arrow-down' : 'fa-arrow-up'} text-white text-lg`}></i>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Nueva Transacción</h3>
              <p className="text-white/80 text-sm">Registro rápido</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          >
            <i className="fas fa-times text-white text-lg"></i>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          
          {/* ✅ Categorías Frecuentes */}
          {frequentCategories.length > 0 && !formData.categoryId && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
                Frecuentes
              </label>
              <div className="flex flex-wrap gap-2">
                {frequentCategories.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategorySelect(cat.id)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-blue-100 hover:text-blue-700 rounded-full text-sm transition-colors"
                  >
                    <span>{cat.icon}</span>
                    <span className="font-medium">{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ✅ Buscador de Categoría con Dropdown */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <i className="fas fa-folder mr-2 text-blue-600"></i>
              Categoría *
            </label>
            
            {/* Categoría seleccionada o buscador */}
            {selectedCategory ? (
              <div 
                className={`w-full px-4 py-3 border-2 ${isIncome ? 'border-green-300 bg-green-50' : 'border-blue-300 bg-blue-50'} rounded-xl flex items-center justify-between cursor-pointer`}
                onClick={() => {
                  handleChange('categoryId', '');
                  setShowCategoryDropdown(true);
                  setTimeout(() => categoryInputRef.current?.focus(), 100);
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{selectedCategory.icon}</span>
                  <div>
                    <p className="font-semibold text-gray-800">{selectedCategory.name}</p>
                    <p className="text-xs text-gray-500">{selectedCategory.group}</p>
                  </div>
                </div>
                <i className="fas fa-pen text-gray-400 hover:text-gray-600"></i>
              </div>
            ) : (
              <div className="relative">
                <input
                  ref={categoryInputRef}
                  type="text"
                  value={categorySearch}
                  onChange={(e) => {
                    setCategorySearch(e.target.value);
                    setShowCategoryDropdown(true);
                  }}
                  onFocus={() => setShowCategoryDropdown(true)}
                  placeholder="🔍 Buscar categoría..."
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                    errors.categoryId 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
                {categorySearch && (
                  <button
                    type="button"
                    onClick={() => setCategorySearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                )}
              </div>
            )}
            
            {errors.categoryId && (
              <p className="mt-1 text-sm text-red-600">
                <i className="fas fa-exclamation-circle mr-1"></i>
                {errors.categoryId}
              </p>
            )}

            {/* Dropdown de categorías */}
            {showCategoryDropdown && !selectedCategory && (
              <div 
                ref={dropdownRef}
                className="absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-64 overflow-y-auto"
              >
                {filteredCategories.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <i className="fas fa-search text-2xl mb-2 text-gray-300"></i>
                    <p className="text-sm">No se encontraron categorías</p>
                  </div>
                ) : (
                  Object.entries(groupedCategories).map(([group, cats]) => (
                    <div key={group}>
                      <div className="px-3 py-2 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide sticky top-0">
                        {group}
                      </div>
                      {cats.map(cat => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => handleCategorySelect(cat.id)}
                          className="w-full px-4 py-3 flex items-center gap-3 hover:bg-blue-50 transition-colors text-left"
                        >
                          <span className="text-xl">{cat.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-800 truncate">{cat.name}</p>
                            <p className="text-xs text-gray-500">{cat.currency}</p>
                          </div>
                          {cat.type === 'income' && (
                            <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                              Ingreso
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Monto y Moneda */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <i className="fas fa-dollar-sign mr-2 text-blue-600"></i>
                Monto *
              </label>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                value={formData.amount}
                onChange={(e) => handleChange('amount', e.target.value)}
                placeholder="0.00"
                className={`w-full px-4 py-3 text-xl font-bold border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                  errors.amount 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
              />
              {errors.amount && (
                <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Moneda
              </label>
              <select
                value={formData.currency}
                onChange={(e) => handleChange('currency', e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-center font-semibold"
              >
                <option value="EUR">EUR €</option>
                <option value="CLP">CLP $</option>
                <option value="USD">USD $</option>
                <option value="UF">UF</option>
              </select>
            </div>
          </div>

          {/* Conversión preview */}
          {converted !== null && (
            <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
              <i className="fas fa-exchange-alt mr-2"></i>
              ≈ {converted.toFixed(2)} {displayCurrency}
            </div>
          )}

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <i className="fas fa-tag mr-2 text-blue-600"></i>
              Descripción *
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Ej: Compra supermercado, Netflix..."
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                errors.description 
                  ? 'border-red-300 focus:ring-red-500' 
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
              maxLength={100}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
          </div>

          {/* Fecha y Método de Pago */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <i className="fas fa-calendar mr-2 text-blue-600"></i>
                Fecha
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleChange('date', e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                  errors.date 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
              />
              {errors.date && (
                <p className="mt-1 text-sm text-red-600">{errors.date}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <i className="fas fa-credit-card mr-2 text-blue-600"></i>
                Método
              </label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => handleChange('paymentMethod', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Efectivo">💵 Efectivo</option>
                <option value="Tarjeta">💳 Tarjeta</option>
                <option value="Transferencia">🏦 Transfer.</option>
              </select>
            </div>
          </div>

          {/* Vista previa */}
          {selectedCategory && formData.amount && (
            <div className={`${isIncome ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'} border-2 rounded-xl p-4`}>
              <div className="flex items-center gap-3">
                <span className="text-3xl">{selectedCategory.icon}</span>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{formData.description || 'Sin descripción'}</p>
                  <p className="text-sm text-gray-500">{selectedCategory.name}</p>
                </div>
                <p className={`text-2xl font-bold ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
                  {isIncome ? '+' : '-'}{parseFloat(formData.amount || 0).toFixed(2)}
                </p>
              </div>
            </div>
          )}
        </form>

        {/* Footer con botón */}
        <div className="p-4 bg-gray-50 border-t sticky bottom-0">
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
              isSubmitting
                ? 'bg-gray-400 cursor-not-allowed'
                : isIncome
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl'
                  : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl'
            }`}
          >
            {isSubmitting ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Guardando...
              </>
            ) : (
              <>
                <i className="fas fa-check"></i>
                Guardar Transacción
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}