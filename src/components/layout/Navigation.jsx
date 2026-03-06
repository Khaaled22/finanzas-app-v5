// src/components/layout/Navigation.jsx
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { UserMenu } from '../auth/AuthForms';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { icon: 'fa-chart-line', text: 'Dashboard', path: '/dashboard' },
  { icon: 'fa-calculator', text: 'Presupuesto', path: '/budget' },
  { icon: 'fa-receipt', text: 'Transacciones', path: '/transactions' },
  { icon: 'fa-credit-card', text: 'Deudas', path: '/debts' },
  { icon: 'fa-piggy-bank', text: 'Ahorros', path: '/savings' },
  { icon: 'fa-chart-pie', text: 'Inversiones', path: '/investments' },
  { icon: 'fa-calendar-alt', text: 'Cashflow', path: '/cashflow' },
  { icon: 'fa-brain', text: 'Análisis', path: '/analysis' },
  { icon: 'fa-cog', text: 'Ajustes', path: '/settings' },
];

function NavItem({ icon, text, path, compact = false }) {
  return (
    <NavLink
      to={path}
      className={({ isActive }) => `
        flex items-center justify-center gap-1.5 px-3 py-2.5 font-medium transition-all whitespace-nowrap rounded-lg
        ${isActive
          ? 'bg-purple-100 text-purple-700'
          : 'text-gray-600 hover:bg-gray-100 hover:text-purple-600'
        }
        ${compact ? 'flex-col text-xs px-2' : ''}
      `}
      title={text}
    >
      <i className={`fas ${icon} ${compact ? 'text-lg' : 'text-sm'}`}></i>
      {!compact && <span className="hidden lg:inline text-sm">{text}</span>}
      {compact && <span className="text-[10px]">{text.slice(0, 6)}</span>}
    </NavLink>
  );
}

function SyncBadge() {
  const { isLocalMode } = useAuth();

  return (
    <div className={`
      flex items-center gap-1 px-2 py-1 rounded text-xs font-medium
      ${isLocalMode
        ? 'bg-yellow-100 text-yellow-700'
        : 'bg-green-100 text-green-700'
      }
    `}>
      <i className={`fas ${isLocalMode ? 'fa-database' : 'fa-cloud'} text-[10px]`}></i>
      <span className="hidden sm:inline">{isLocalMode ? 'Local' : 'Sync'}</span>
    </div>
  );
}

export default function Navigation() {
  const [showAllMobile, setShowAllMobile] = useState(false);

  return (
    <nav className="bg-white shadow-md sticky top-0 z-40">
      <div className="container mx-auto px-2 md:px-4">

        {/* Desktop */}
        <div className="hidden md:flex items-center justify-between py-1">
          <div className="flex items-center space-x-1 overflow-x-auto scrollbar-hide">
            {NAV_ITEMS.map(item => (
              <NavItem key={item.path} {...item} />
            ))}
          </div>
          <div className="flex items-center gap-2 pl-3 border-l border-gray-200 ml-2">
            <SyncBadge />
            <UserMenu />
          </div>
        </div>

        {/* Mobile */}
        <div className="md:hidden">
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-hide flex-1">
              {NAV_ITEMS.slice(0, 5).map(item => (
                <NavItem key={item.path} {...item} compact />
              ))}
              <button
                onClick={() => setShowAllMobile(!showAllMobile)}
                className={`
                  flex flex-col items-center justify-center gap-0.5 px-2 py-2.5 rounded-lg transition-all
                  ${showAllMobile ? 'bg-purple-100 text-purple-700' : 'text-gray-500 hover:bg-gray-100'}
                `}
              >
                <i className={`fas ${showAllMobile ? 'fa-chevron-up' : 'fa-ellipsis-h'} text-lg`}></i>
                <span className="text-[10px]">Más</span>
              </button>
            </div>
            <div className="flex items-center gap-1 pl-2 border-l border-gray-200">
              <SyncBadge />
              <UserMenu />
            </div>
          </div>

          {showAllMobile && (
            <div className="flex items-center gap-1 py-2 border-t border-gray-100 overflow-x-auto">
              {NAV_ITEMS.slice(5).map(item => (
                <NavItem key={item.path} {...item} compact />
              ))}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
