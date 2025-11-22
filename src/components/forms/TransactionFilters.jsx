import React from 'react';

export default function TransactionFilters({ filters, setFilters, availableMonths, resultCount }) {
  const handleClearFilters = () => {
    setFilters({ search: '', month: '' });
  };

  const hasActiveFilters = filters.search || filters.month;

  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          <i className="fas fa-filter mr-2 text-blue-600"></i>
          Filtros
        </h3>
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            <i className="fas fa-times-circle mr-1"></i>
            Limpiar filtros
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* M4.4: Buscador en tiempo real */}
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
            <i className="fas fa-search mr-2 text-gray-500"></i>
            Buscar por descripción o comentario
          </label>
          <input
            id="search"
            type="text"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            placeholder="Escribe para buscar..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
          {filters.search && (
            <p className="mt-1 text-xs text-gray-500">
              <i className="fas fa-info-circle mr-1"></i>
              Mostrando resultados para "{filters.search}"
            </p>
          )}
        </div>

        {/* M4.5: Filtro por mes */}
        <div>
          <label htmlFor="monthFilter" className="block text-sm font-medium text-gray-700 mb-2">
            <i className="fas fa-calendar-alt mr-2 text-gray-500"></i>
            Filtrar por mes
          </label>
          <select
            id="monthFilter"
            value={filters.month}
            onChange={(e) => setFilters({ ...filters, month: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          >
            <option value="">Todos los meses</option>
            {availableMonths.map(month => {
              const [year, monthNum] = month.split('-');
              const date = new Date(year, parseInt(monthNum) - 1);
              const monthName = date.toLocaleDateString('es-ES', { 
                month: 'long', 
                year: 'numeric' 
              });
              return (
                <option key={month} value={month}>
                  {monthName.charAt(0).toUpperCase() + monthName.slice(1)}
                </option>
              );
            })}
          </select>
          {filters.month && (
            <p className="mt-1 text-xs text-gray-500">
              <i className="fas fa-info-circle mr-1"></i>
              Filtrando por mes seleccionado
            </p>
          )}
        </div>
      </div>

      {/* Contador de resultados */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t">
          <p className="text-sm text-gray-600">
            <i className="fas fa-check-circle text-green-600 mr-2"></i>
            Se encontraron <span className="font-bold text-gray-800">{resultCount}</span> transacciones
          </p>
        </div>
      )}
    </div>
  );
}