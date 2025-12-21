// src/components/common/VirtualizedList.jsx
// ✅ M28: Lista virtualizada para datasets grandes
// Solo renderiza los items visibles en pantalla

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'

/**
 * VirtualizedList - Renderiza solo items visibles
 * Optimizado para listas de 1000+ transacciones
 * 
 * @param {Array} items - Lista completa de items
 * @param {Function} renderItem - (item, index) => JSX
 * @param {number} itemHeight - Altura fija de cada item en px
 * @param {number} containerHeight - Altura del contenedor visible
 * @param {number} overscan - Items extra a renderizar fuera de vista (default: 5)
 */
export const VirtualizedList = ({ 
  items, 
  renderItem, 
  itemHeight = 60, 
  containerHeight = 400,
  overscan = 5,
  className = ''
}) => {
  const [scrollTop, setScrollTop] = useState(0)
  const containerRef = useRef(null)

  // Calcular qué items son visibles
  const { startIndex, endIndex, visibleItems, offsetY } = useMemo(() => {
    const totalHeight = items.length * itemHeight
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
    const visibleCount = Math.ceil(containerHeight / itemHeight) + (overscan * 2)
    const endIndex = Math.min(items.length - 1, startIndex + visibleCount)
    
    return {
      startIndex,
      endIndex,
      visibleItems: items.slice(startIndex, endIndex + 1),
      offsetY: startIndex * itemHeight,
      totalHeight
    }
  }, [items, scrollTop, itemHeight, containerHeight, overscan])

  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop)
  }, [])

  const totalHeight = items.length * itemHeight

  if (items.length === 0) {
    return (
      <div className={`flex items-center justify-center h-32 text-gray-500 ${className}`}>
        No hay items para mostrar
      </div>
    )
  }

  // Para listas pequeñas, renderizar normalmente
  if (items.length < 50) {
    return (
      <div className={`overflow-auto ${className}`} style={{ maxHeight: containerHeight }}>
        {items.map((item, index) => (
          <div key={item.id || index}>
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div 
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      {/* Contenedor con altura total para scroll correcto */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {/* Items visibles posicionados absolutamente */}
        <div style={{ 
          position: 'absolute', 
          top: offsetY, 
          left: 0, 
          right: 0 
        }}>
          {visibleItems.map((item, i) => (
            <div 
              key={item.id || (startIndex + i)} 
              style={{ height: itemHeight }}
            >
              {renderItem(item, startIndex + i)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Hook para paginación de datos grandes
 * Útil cuando no se quiere virtualización pero sí limitar renders
 */
export const usePagination = (items, pageSize = 50) => {
  const [page, setPage] = useState(0)
  
  const totalPages = Math.ceil(items.length / pageSize)
  const paginatedItems = useMemo(() => {
    const start = page * pageSize
    return items.slice(start, start + pageSize)
  }, [items, page, pageSize])

  const nextPage = useCallback(() => {
    setPage(p => Math.min(p + 1, totalPages - 1))
  }, [totalPages])

  const prevPage = useCallback(() => {
    setPage(p => Math.max(p - 1, 0))
  }, [])

  const goToPage = useCallback((pageNum) => {
    setPage(Math.max(0, Math.min(pageNum, totalPages - 1)))
  }, [totalPages])

  // Reset a página 0 cuando cambian los items
  useEffect(() => {
    setPage(0)
  }, [items.length])

  return {
    items: paginatedItems,
    page,
    totalPages,
    totalItems: items.length,
    nextPage,
    prevPage,
    goToPage,
    hasNext: page < totalPages - 1,
    hasPrev: page > 0
  }
}

/**
 * Componente de paginación UI
 */
export const PaginationControls = ({ 
  page, 
  totalPages, 
  totalItems,
  onNext, 
  onPrev, 
  onGoTo,
  hasNext,
  hasPrev 
}) => {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between py-3 px-4 bg-gray-50 border-t">
      <span className="text-sm text-gray-600">
        {totalItems.toLocaleString()} items
      </span>
      
      <div className="flex items-center gap-2">
        <button
          onClick={onPrev}
          disabled={!hasPrev}
          className="px-3 py-1 text-sm bg-white border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Anterior
        </button>
        
        <span className="text-sm text-gray-600">
          Página {page + 1} de {totalPages}
        </span>
        
        <button
          onClick={onNext}
          disabled={!hasNext}
          className="px-3 py-1 text-sm bg-white border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Siguiente →
        </button>
      </div>
    </div>
  )
}

export default VirtualizedList