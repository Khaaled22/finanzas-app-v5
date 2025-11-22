import { useApp } from '../../context/AppContext';
import ExportPDFButton from '../common/ExportPDFButton';
import ExportExcelButton from '../common/ExportExcelButton';

export default function Header() {
  const { 
    displayCurrency, 
    setDisplayCurrency, 
    currentUser, 
    setCurrentUser,
    financialHealth
  } = useApp();

  const USERS = ['Usuario 1', 'Usuario 2'];

  return (
    <header className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-2xl">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center flex-wrap gap-4">
          {/* Logo y título */}
          <div className="flex items-center space-x-3">
            <i className="fas fa-rocket text-3xl"></i>
            <div>
              <h1 className="text-2xl font-bold">Finanzas PRO Ultimate</h1>
              <p className="text-sm text-purple-100">v5.0 - Versión Definitiva</p>
            </div>
          </div>

          {/* Controles */}
          <div className="flex items-center space-x-4 flex-wrap gap-2">
            {/* Salud Financiera */}
            <div className="bg-white bg-opacity-20 px-4 py-2 rounded-lg backdrop-blur">
              <p className="text-xs text-purple-100">Salud Financiera</p>
              <p className="text-xl font-bold">{financialHealth}/100</p>
            </div>

            {/* Botón PDF */}
            <ExportPDFButton />

            {/* Botón Excel */}
            <ExportExcelButton />

            {/* Selector de Moneda */}
            <select 
              value={displayCurrency}
              onChange={(e) => setDisplayCurrency(e.target.value)}
              className="bg-purple-500 text-white px-3 py-2 rounded-lg border-2 border-purple-400 focus:outline-none focus:border-white"
            >
              <option value="EUR">EUR €</option>
              <option value="CLP">CLP $</option>
              <option value="USD">USD $</option>
              <option value="UF">UF</option>
            </select>

            {/* Selector de Usuario */}
            <select 
              value={currentUser}
              onChange={(e) => setCurrentUser(e.target.value)}
              className="bg-purple-500 text-white px-3 py-2 rounded-lg border-2 border-purple-400 focus:outline-none focus:border-white"
            >
              {USERS.map(user => (
                <option key={user} value={user}>{user}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </header>
  );
}