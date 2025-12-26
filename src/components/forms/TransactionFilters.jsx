// src/components/forms/TransactionFilters.jsx
// ✅ M36 Fase 7: Filtros con quick buttons para tipo
import { useMemo } from 'react';

export default function TransactionFilters({ 
  filters, 
  setFilters, 
  availableMonths, 
  categories = [],
  resultCount = 0 
}) {
  // Agrupar categorías
  const groupedCategories = useMemo(() => {
    return categories.reduce((acc, cat) => {
      if (!acc[cat.group]) acc[cat.group] = [];
      acc[cat.group].push(cat);
      return acc;
    }, {});
  }, [categories]);

  // Tipos con colores
  const typeButtons = [
    { id: 'all', label: 'Todas', icon: 'fa-list', color: 'blue' },
    { id: 'income', label: 'Ingresos', icon: 'fa-arrow-down', color: 'green' },
    { id: 'expense', label: 'Gastos', icon: 'fa-arrow-up', color: 'red' },
    { id: 'investment', label: 'Inversión', icon: 'fa-chart-line', color: 'purple' }
  ];

  const handleClearFilters = () => {
    setFilters({ 
      ...filters,
      search: '', 
      month: '', 
      categoryId: '', 
      type: 'all' 
    });
  };

  const hasActiveFilters = filters.search || filters.month || filters.categoryId || (filters.type && filters.type !== 'all');

  const getButtonClasses = (type) => {
    const isActive = (filters.type || 'all') === type.id;
    const baseClasses = "px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 text-sm";
    
    if (isActive) {
      const colorMap = {
        blue: 'bg-blue-100 text-blue-700 border-2 border-blue-300',
        green: 'bg-green-100 text-green-700 border-2 border-green-300',
        red: 'bg-red-100 text-red-700 border-2 border-red-300',
        purple: 'bg-purple-100 text-purple-700 border-2 border-purple-300'
      };
      return `${baseClasses} ${colorMap[type.color]}`;
    }
    return `${baseClasses} bg-gray-100 text-gray-600 hover:bg-gray-200 border-2 border-transparent`;
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-4 mb-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <i className="fas fa-filter text-blue-600"></i>
          <span className="font-semibold text-gray-800">Filtros</span>
          {resultCount > 0 && (
            <span className="text-sm text-gray-500">
              ({resultCount} resultado{resultCount !== 1 ? 's' : ''})
            </span>
          )}
        </div>
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="text-sm text-red-600 hover:text-red-700 font-medium"
          >
            <i className="fas fa-times mr-1"></i>
            Limpiar
          </button>
        )}
      </div>

      {/* Quick Buttons - Tipo */}
      <div className="flex flex-wrap gap-2">
        {typeButtons.map(type => (
          <button
            key={type.id}
            onClick={() => setFilters({ ...filters, type: type.id })}
            className={getButtonClasses(type)}
          >
            <i className={`fas ${type.icon} text-xs`}></i>
            <span className="hidden sm:inline">{type.label}</span>
          </button>
        ))}
      </div>

      {/* Filtros en grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Buscar */}
        <div className="relative">
          <input
            type="text"
            value={filters.search || ''}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            placeholder="🔍 Buscar..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          {filters.search && (
            <button
              onClick={() => setFilters({ ...filters, search: '' })}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <i className="fas fa-times text-xs"></i>
            </button>
          )}
        </div>

        {/* Mes */}
        <select
          value={filters.month || ''}
          onChange={(e) => setFilters({ ...filters, month: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        >
          <option value="">📅 Todos los meses</option>
          {availableMonths.map(month => {
            const [year, monthNum] = month.split('-');
            const date = new Date(year, parseInt(monthNum) - 1);
            const monthName = date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
            return (
              <option key={month} value={month}>
                {monthName.charAt(0).toUpperCase() + monthName.slice(1)}
              </option>
            );
          })}
        </select>

        {/* Categoría */}
        <select
          value={filters.categoryId || ''}
          onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        >
          <option value="">📁 Todas las categorías</option>
          {Object.entries(groupedCategories).map(([group, cats]) => (
            <optgroup key={group} label={group}>
              {cats.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
    </div>
  );
}