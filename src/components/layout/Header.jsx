// src/components/layout/Header.jsx
// ✅ M31: Header optimizado y responsivo
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import ExportPDFButton from '../common/ExportPDFButton';
import ExportExcelButton from '../common/ExportExcelButton';

export default function Header() {
  const { 
    displayCurrency, 
    setDisplayCurrency, 
    financialHealth
  } = useApp();
  
  const { user, isLocalMode } = useAuth();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Obtener nombre o email del usuario
  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Usuario';

  return (
    <header className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-2xl">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          
          {/* Logo y título - siempre visible */}
          <div className="flex items-center space-x-2">
            <i className="fas fa-rocket text-2xl md:text-3xl"></i>
            <div>
              <h1 className="text-lg md:text-2xl font-bold">Finanzas PRO</h1>
              <p className="text-xs text-purple-200 hidden sm:block">
                {isLocalMode ? 'Modo Local' : 'Cloud Sync'}
              </p>
            </div>
          </div>

          {/* Controles Desktop - ocultos en móvil */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Salud Financiera */}
            <div className="bg-white bg-opacity-20 px-3 py-1.5 rounded-lg backdrop-blur">
              <p className="text-xs text-purple-100">Salud</p>
              <p className="text-lg font-bold">{financialHealth}/100</p>
            </div>

            {/* Botones Export */}
            <ExportPDFButton />
            <ExportExcelButton />

            {/* Selector de Moneda */}
            <select 
              value={displayCurrency}
              onChange={(e) => setDisplayCurrency(e.target.value)}
              className="bg-purple-500 bg-opacity-50 text-white px-3 py-2 rounded-lg border border-purple-400 focus:outline-none focus:border-white text-sm"
            >
              <option value="EUR">EUR €</option>
              <option value="CLP">CLP $</option>
              <option value="USD">USD $</option>
              <option value="UF">UF</option>
            </select>

            {/* Usuario actual */}
            <div className="flex items-center gap-2 bg-white bg-opacity-20 px-3 py-2 rounded-lg">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-purple-600 font-bold">
                {userName[0]?.toUpperCase()}
              </div>
              <span className="text-sm font-medium max-w-24 truncate">{userName}</span>
            </div>
          </div>

          {/* Controles Móvil - solo visible en móvil */}
          <div className="flex md:hidden items-center space-x-2">
            {/* Salud compacta */}
            <div className="bg-white bg-opacity-20 px-2 py-1 rounded text-center">
              <p className="text-lg font-bold">{financialHealth}</p>
            </div>

            {/* Selector moneda compacto */}
            <select 
              value={displayCurrency}
              onChange={(e) => setDisplayCurrency(e.target.value)}
              className="bg-purple-500 bg-opacity-50 text-white px-2 py-1.5 rounded border border-purple-400 text-sm"
            >
              <option value="EUR">€</option>
              <option value="CLP">$CLP</option>
              <option value="USD">$US</option>
              <option value="UF">UF</option>
            </select>

            {/* Menú hamburguesa */}
            <button 
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2 rounded-lg bg-white bg-opacity-20"
            >
              <i className={`fas ${showMobileMenu ? 'fa-times' : 'fa-bars'} text-lg`}></i>
            </button>
          </div>
        </div>

        {/* Menú móvil expandido */}
        {showMobileMenu && (
          <div className="md:hidden mt-3 pt-3 border-t border-purple-400 border-opacity-50">
            <div className="flex flex-wrap gap-2 items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-purple-600 font-bold text-sm">
                  {userName[0]?.toUpperCase()}
                </div>
                <span className="text-sm">{userName}</span>
                {!isLocalMode && (
                  <span className="text-xs bg-green-500 px-2 py-0.5 rounded">Sync</span>
                )}
              </div>
              <div className="flex gap-2">
                <ExportPDFButton />
                <ExportExcelButton />
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}