// src/views/Settings/components/CategoriesPanel.jsx
// ✅ M20: CORREGIDO - updateCategory solo con metadata, budget va a category.budget (plantilla)
import React, { useState, useMemo } from 'react';
import { useApp } from '../../../context/AppContext';
import CategoryModal from './CategoryModal';
import ImportCategoriesModal from './ImportCategoriesModal';

export default function CategoriesPanel() {
  const { categories, setCategories, updateCategory, deleteCategory, importCategories } = useApp();
  
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCurrency, setFilterCurrency] = useState('all');

  // Estadísticas
  const stats = useMemo(() => {
    return {
      total: categories.length,
      income: categories.filter(c => c.type === 'income').length,
      expense: categories.filter(c => c.type === 'expense').length,
      savings: categories.filter(c => c.type === 'savings').length,
      investment: categories.filter(c => c.type === 'investment').length,
      eur: categories.filter(c => c.currency === 'EUR').length,
      clp: categories.filter(c => c.currency === 'CLP').length,
      usd: categories.filter(c => c.currency === 'USD').length,
      uf: categories.filter(c => c.currency === 'UF').length,
    };
  }, [categories]);

  // Filtrar categorías
  const filteredCategories = useMemo(() => {
    return categories.filter(cat => {
      const matchesSearch = cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           cat.group.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || cat.type === filterType;
      const matchesCurrency = filterCurrency === 'all' || cat.currency === filterCurrency;
      return matchesSearch && matchesType && matchesCurrency;
    });
  }, [categories, searchTerm, filterType, filterCurrency]);

  // Agrupar por grupo
  const groupedCategories = useMemo(() => {
    const groups = {};
    filteredCategories.forEach(cat => {
      if (!groups[cat.group]) groups[cat.group] = [];
      groups[cat.group].push(cat);
    });
    return groups;
  }, [filteredCategories]);

  const handleNewCategory = () => {
    setEditingCategory(null);
    setShowCategoryModal(true);
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setShowCategoryModal(true);
  };

  // ✅ M20: CORREGIDO - Actualizar plantilla directamente en setCategories
  const handleCategoryModalClose = (categoryData) => {
    if (categoryData) {
      if (categoryData.id) {
        // ✅ M20: Editar categoría existente
        // En Settings, permitimos actualizar category.budget (plantilla)
        // porque es donde se define el presupuesto base para nuevos meses
        setCategories(prev => 
          prev.map(cat => 
            cat.id === categoryData.id 
              ? { ...cat, ...categoryData }  // Actualiza TODO incluyendo budget (plantilla)
              : cat
          )
        );
        alert('✅ Categoría actualizada correctamente');
      } else {
        // Crear nueva
        const newCategory = {
          id: `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ...categoryData,
          spent: 0
        };
        setCategories([...categories, newCategory]);
        alert('✅ Categoría creada correctamente');
      }
    }
    setShowCategoryModal(false);
    setEditingCategory(null);
  };

  const handleDeleteCategory = (category) => {
    if (!window.confirm(`¿Estás seguro de eliminar "${category.name}"?`)) {
      return;
    }
    
    const success = deleteCategory(category.id);
    if (success) {
      alert('✅ Categoría eliminada');
    } else {
      alert('❌ No se puede eliminar (puede tener transacciones)');
    }
  };

  const handleImportModalClose = () => {
    setShowImportModal(false);
  };

  const handleExportCSV = () => {
    const csv = [
      ['Nombre', 'Grupo', 'Tipo', 'Moneda', 'Presupuesto Base', 'Ícono'].join(','),
      ...categories.map(cat => 
        [cat.name, cat.group, cat.type, cat.currency, cat.budget, cat.icon].join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `categorias-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Total</p>
              <p className="text-3xl font-bold text-blue-700">{stats.total}</p>
            </div>
            <i className="fas fa-list text-3xl text-blue-400"></i>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Ingresos</p>
              <p className="text-3xl font-bold text-green-700">{stats.income}</p>
            </div>
            <i className="fas fa-arrow-up text-3xl text-green-400"></i>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 font-medium">Gastos</p>
              <p className="text-3xl font-bold text-red-700">{stats.expense}</p>
            </div>
            <i className="fas fa-arrow-down text-3xl text-red-400"></i>
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Ahorro/Inv.</p>
              <p className="text-3xl font-bold text-purple-700">{stats.savings + stats.investment}</p>
            </div>
            <i className="fas fa-piggy-bank text-3xl text-purple-400"></i>
          </div>
        </div>
      </div>

      {/* Gestión de Categorías */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800 flex items-center">
            <i className="fas fa-folder-open mr-3 text-purple-600"></i>
            Gestión de Categorías
          </h3>
          <div className="flex gap-2">
            <button
              onClick={handleNewCategory}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-all"
            >
              <i className="fas fa-plus mr-2"></i>
              Nueva Categoría
            </button>
            <button
              onClick={() => setShowImportModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all"
            >
              <i className="fas fa-file-import mr-2"></i>
              Importar CSV
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
            <div className="relative">
              <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nombre o grupo..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">Todos ({stats.total})</option>
              <option value="income">Ingresos ({stats.income})</option>
              <option value="expense">Gastos ({stats.expense})</option>
              <option value="savings">Ahorros ({stats.savings})</option>
              <option value="investment">Inversiones ({stats.investment})</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Moneda</label>
            <select
              value={filterCurrency}
              onChange={(e) => setFilterCurrency(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">Todas</option>
              <option value="EUR">EUR ({stats.eur})</option>
              <option value="CLP">CLP ({stats.clp})</option>
              <option value="USD">USD ({stats.usd})</option>
              <option value="UF">UF ({stats.uf})</option>
            </select>
          </div>
        </div>

        {/* Lista de categorías agrupadas */}
        <div className="space-y-4">
          {Object.keys(groupedCategories).length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <i className="fas fa-search text-6xl mb-4 text-gray-300"></i>
              <p className="text-lg font-medium">No se encontraron categorías</p>
              <p className="text-sm">Intenta con otros filtros</p>
            </div>
          ) : (
            Object.entries(groupedCategories).map(([group, cats]) => (
              <div key={group} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-100 px-4 py-3 flex justify-between items-center">
                  <h4 className="font-bold text-gray-800 flex items-center">
                    <span className="mr-2">{cats[0]?.icon || '📁'}</span>
                    {group}
                  </h4>
                  <span className="text-sm text-gray-600">{cats.length} categorías</span>
                </div>
                <div className="divide-y divide-gray-200">
                  {cats.map(cat => (
                    <div key={cat.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-3 flex-1">
                          <span className="text-2xl">{cat.icon}</span>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-800">{cat.name}</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                cat.type === 'income' ? 'bg-green-100 text-green-800' :
                                cat.type === 'expense' ? 'bg-red-100 text-red-800' :
                                cat.type === 'savings' ? 'bg-blue-100 text-blue-800' :
                                'bg-purple-100 text-purple-800'
                              }`}>
                                {cat.type === 'income' ? '💼 Ingreso' :
                                 cat.type === 'expense' ? '💳 Gasto' :
                                 cat.type === 'savings' ? '💰 Ahorro' :
                                 '📈 Inversión'}
                              </span>
                              <span className="flex items-center">
                                <i className="fas fa-coins mr-1"></i>
                                {cat.currency}
                              </span>
                              <span className="flex items-center">
                                <i className="fas fa-wallet mr-1"></i>
                                Presupuesto: {cat.budget.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditCategory(cat)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-all"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(cat)}
                            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-all"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modals */}
      <CategoryModal
        isOpen={showCategoryModal}
        onClose={handleCategoryModalClose}
        category={editingCategory}
        existingCategories={categories}
      />

      <ImportCategoriesModal
        isOpen={showImportModal}
        onClose={handleImportModalClose}
        onImport={importCategories}
        existingCategories={categories}
      />
    </div>
  );
}