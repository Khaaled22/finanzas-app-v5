// src/views/Settings/components/CategoriesPanel.jsx
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
  const [filterType, setFilterType] = useState('all'); // all, income, expense, savings, investment
  const [filterCurrency, setFilterCurrency] = useState('all'); // all, EUR, CLP, USD, UF

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
      // Filtro por búsqueda
      const matchesSearch = cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           cat.group.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filtro por tipo
      const matchesType = filterType === 'all' || cat.type === filterType;
      
      // Filtro por moneda
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

  // Abrir modal de nueva categoría
  const handleNewCategory = () => {
    setEditingCategory(null);
    setShowCategoryModal(true);
  };

  // Abrir modal de editar categoría
  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setShowCategoryModal(true);
  };

  // Cerrar modal de categoría y guardar si hay datos
  const handleCategoryModalClose = (categoryData) => {
    if (categoryData) {
      if (categoryData.id) {
        // Editar existente
        const success = updateCategory(categoryData.id, categoryData);
        if (success) {
          alert('✅ Categoría actualizada correctamente');
        } else {
          alert('❌ Error al actualizar categoría');
        }
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

  // Eliminar categoría
  const handleDeleteCategory = (category) => {
    if (!window.confirm(`¿Estás seguro de eliminar "${category.name}"?`)) {
      return;
    }

    const result = deleteCategory(category.id);
    
    if (result.success) {
      alert('✅ Categoría eliminada correctamente');
    } else {
      alert(`❌ ${result.message}`);
    }
  };

  // Importar categorías
  const handleImport = (categoriesToImport) => {
    const result = importCategories(categoriesToImport);
    
    if (result.success) {
      const message = `✅ Importación exitosa!\n\n` +
                     `✓ Importadas: ${result.imported}\n` +
                     `⊘ Omitidas: ${result.skipped}\n` +
                     (result.errors.length > 0 ? `\n⚠️ Advertencias:\n${result.errors.join('\n')}` : '');
      alert(message);
    } else {
      alert('❌ Error al importar categorías');
    }
  };

  // Limpiar filtros
  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterType('all');
    setFilterCurrency('all');
  };

  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Total</p>
              <p className="text-3xl font-bold text-blue-700">{stats.total}</p>
            </div>
            <i className="fas fa-list text-3xl text-blue-300"></i>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Ingresos</p>
              <p className="text-3xl font-bold text-green-700">{stats.income}</p>
            </div>
            <i className="fas fa-arrow-up text-3xl text-green-300"></i>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 font-medium">Gastos</p>
              <p className="text-3xl font-bold text-red-700">{stats.expense}</p>
            </div>
            <i className="fas fa-arrow-down text-3xl text-red-300"></i>
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Ahorro/Inv.</p>
              <p className="text-3xl font-bold text-purple-700">{stats.savings + stats.investment}</p>
            </div>
            <i className="fas fa-piggy-bank text-3xl text-purple-300"></i>
          </div>
        </div>
      </div>

      {/* Acciones y filtros */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h3 className="text-xl font-bold text-gray-800">
            <i className="fas fa-folder-open mr-2 text-purple-600"></i>
            Gestión de Categorías
          </h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleNewCategory}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-medium"
            >
              <i className="fas fa-plus mr-2"></i>
              Nueva Categoría
            </button>
            <button
              onClick={() => setShowImportModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:from-green-700 hover:to-teal-700 transition-all font-medium"
            >
              <i className="fas fa-file-csv mr-2"></i>
              Importar CSV
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Búsqueda */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buscar
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nombre o grupo..."
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <i className="fas fa-search absolute left-3 top-3 text-gray-400"></i>
            </div>
          </div>

          {/* Filtro tipo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo
            </label>
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

          {/* Filtro moneda */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Moneda
            </label>
            <div className="flex items-center space-x-2">
              <select
                value={filterCurrency}
                onChange={(e) => setFilterCurrency(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">Todas</option>
                <option value="EUR">EUR ({stats.eur})</option>
                <option value="CLP">CLP ({stats.clp})</option>
                <option value="USD">USD ({stats.usd})</option>
                <option value="UF">UF ({stats.uf})</option>
              </select>
              {(searchTerm || filterType !== 'all' || filterCurrency !== 'all') && (
                <button
                  onClick={handleClearFilters}
                  className="px-3 py-2 text-gray-600 hover:text-red-600 transition-colors"
                  title="Limpiar filtros"
                >
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Resultado de filtros */}
        {(searchTerm || filterType !== 'all' || filterCurrency !== 'all') && (
          <div className="mb-4 text-sm text-gray-600">
            <i className="fas fa-filter mr-2"></i>
            Mostrando {filteredCategories.length} de {stats.total} categorías
          </div>
        )}

        {/* Lista de categorías agrupadas */}
        {Object.keys(groupedCategories).length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <i className="fas fa-folder-open text-6xl mb-4 text-gray-300"></i>
            <p className="text-lg font-medium">No hay categorías que coincidan</p>
            <p className="text-sm">Intenta ajustar los filtros</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedCategories).map(([group, cats]) => (
              <div key={group} className="border border-gray-200 rounded-lg overflow-hidden">
                {/* Header del grupo */}
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h4 className="font-semibold text-gray-800 flex items-center justify-between">
                    <span>{group}</span>
                    <span className="text-sm font-normal text-gray-500">
                      {cats.length} categoría{cats.length !== 1 ? 's' : ''}
                    </span>
                  </h4>
                </div>

                {/* Categorías del grupo */}
                <div className="divide-y divide-gray-200">
                  {cats.map(category => (
                    <div
                      key={category.id}
                      className="px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        {/* Info categoría */}
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="text-3xl">{category.icon}</div>
                          <div className="flex-1">
                            <h5 className="font-semibold text-gray-800">{category.name}</h5>
                            <div className="flex items-center space-x-3 text-sm text-gray-600 mt-1">
                              <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-medium">
                                {category.type === 'income' ? '💰 Ingreso' :
                                 category.type === 'savings' ? '🐷 Ahorro' :
                                 category.type === 'investment' ? '📈 Inversión' :
                                 '💳 Gasto'}
                              </span>
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                {category.currency}
                              </span>
                              <span>
                                Presupuesto: <strong>{category.budget.toFixed(2)}</strong>
                              </span>
                              <span className="text-gray-400">
                                Gastado: {category.spent.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Acciones */}
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEditCategory(category)}
                            className="px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category)}
                            className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modales */}
      <CategoryModal
        isOpen={showCategoryModal}
        onClose={handleCategoryModalClose}
        category={editingCategory}
        existingCategories={categories}
      />

      <ImportCategoriesModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImport}
        existingCategories={categories}
      />
    </div>
  );
}