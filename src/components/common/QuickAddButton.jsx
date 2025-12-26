// src/components/common/QuickAddButton.jsx
// ✅ M36 Fase 7: Botón flotante para agregar transacciones rápidamente
import { useState } from 'react';
import QuickTransactionModal from './QuickTransactionModal';

export default function QuickAddButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = () => {
    setIsAnimating(true);
    setIsOpen(true);
    setTimeout(() => setIsAnimating(false), 300);
  };

  return (
    <>
      {/* Botón Flotante */}
      <button
        onClick={handleClick}
        className={`
          fixed bottom-6 right-6 z-40
          w-14 h-14 md:w-16 md:h-16
          bg-gradient-to-br from-blue-500 to-blue-600
          hover:from-blue-600 hover:to-blue-700
          text-white rounded-full
          shadow-lg hover:shadow-xl
          flex items-center justify-center
          transition-all duration-300
          ${isAnimating ? 'scale-90' : 'scale-100 hover:scale-110'}
          group
        `}
        title="Agregar transacción rápida"
        aria-label="Agregar transacción"
      >
        <i className={`fas fa-plus text-2xl transition-transform duration-300 ${isAnimating ? 'rotate-90' : 'group-hover:rotate-90'}`}></i>
      </button>

      {/* Tooltip en hover (solo desktop) */}
      <div className="fixed bottom-8 right-24 z-30 hidden md:block pointer-events-none">
        <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-white text-sm px-3 py-1.5 rounded-lg whitespace-nowrap">
          Nueva transacción
        </div>
      </div>

      {/* Modal */}
      <QuickTransactionModal 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
      />
    </>
  );
}