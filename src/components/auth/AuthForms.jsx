// src/components/auth/AuthForms.jsx
// ✅ M31: Componentes de autenticación optimizados

import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'

// =====================================================
// LOGIN FORM
// =====================================================

export const LoginForm = ({ onSuccess, onSwitchToRegister }) => {
  const { signIn, loading, error, clearError } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [localError, setLocalError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLocalError('')
    clearError()

    if (!email || !password) {
      setLocalError('Por favor completa todos los campos')
      return
    }

    const result = await signIn(email, password)
    
    if (result.success) {
      onSuccess?.()
    }
  }

  return (
    <div className="w-full max-w-md mx-auto px-4">
      <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">💰</div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Finanzas App</h1>
          <p className="text-gray-600 mt-1 text-sm">Inicia sesión en tu cuenta</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {(error || localError) && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
              {error || localError}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
              placeholder="tu@email.com"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Iniciando...
              </span>
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-gray-600 text-sm">
            ¿No tienes cuenta?{' '}
            <button
              onClick={onSwitchToRegister}
              className="text-blue-600 font-medium hover:underline"
            >
              Regístrate
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

// =====================================================
// REGISTER FORM
// =====================================================

export const RegisterForm = ({ onSuccess, onSwitchToLogin }) => {
  const { signUp, loading, error, clearError } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [localError, setLocalError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLocalError('')
    clearError()

    if (!name || !email || !password || !confirmPassword) {
      setLocalError('Por favor completa todos los campos')
      return
    }

    if (password !== confirmPassword) {
      setLocalError('Las contraseñas no coinciden')
      return
    }

    if (password.length < 6) {
      setLocalError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    const result = await signUp(email, password, name)
    
    if (result.success) {
      setSuccess(true)
    }
  }

  if (success) {
    return (
      <div className="w-full max-w-md mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg p-6 text-center">
          <div className="text-5xl mb-4">📧</div>
          <h2 className="text-lg font-bold text-gray-800 mb-2">
            ¡Revisa tu email!
          </h2>
          <p className="text-gray-600 text-sm mb-4">
            Te enviamos un enlace de confirmación a <strong>{email}</strong>
          </p>
          <button
            onClick={onSwitchToLogin}
            className="text-blue-600 font-medium hover:underline text-sm"
          >
            Volver al login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto px-4">
      <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">💰</div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Finanzas App</h1>
          <p className="text-gray-600 mt-1 text-sm">Crea tu cuenta</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {(error || localError) && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
              {error || localError}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
              placeholder="Tu nombre"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
              placeholder="tu@email.com"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
              placeholder="Mínimo 6 caracteres"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Contraseña</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
              placeholder="Repite la contraseña"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-green-700 focus:ring-4 focus:ring-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
          >
            {loading ? 'Creando...' : 'Crear Cuenta'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-gray-600 text-sm">
            ¿Ya tienes cuenta?{' '}
            <button
              onClick={onSwitchToLogin}
              className="text-blue-600 font-medium hover:underline"
            >
              Inicia sesión
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

// =====================================================
// AUTH PAGE
// =====================================================

export const AuthPage = ({ onAuthenticated }) => {
  const [mode, setMode] = useState('login')

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      {mode === 'login' ? (
        <LoginForm
          onSuccess={onAuthenticated}
          onSwitchToRegister={() => setMode('register')}
        />
      ) : (
        <RegisterForm
          onSuccess={onAuthenticated}
          onSwitchToLogin={() => setMode('login')}
        />
      )}
    </div>
  )
}

// =====================================================
// USER MENU - Optimizado y compacto
// =====================================================

export const UserMenu = () => {
  const { user, signOut, isLocalMode } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  if (isLocalMode) {
    return null // El indicador de modo local está en SyncBadge
  }

  if (!user) return null

  const userName = user.user_metadata?.name || user.email?.split('@')[0] || '?'
  const initial = userName[0]?.toUpperCase() || '?'

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 p-1.5 hover:bg-gray-100 rounded-lg transition"
      >
        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
          {initial}
        </div>
        <svg className="w-3 h-3 text-gray-500 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border z-50">
            <div className="p-3 border-b">
              <p className="text-sm font-medium text-gray-800 truncate">{userName}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
            <div className="p-1">
              <button
                onClick={async () => {
                  await signOut()
                  setIsOpen(false)
                }}
                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition flex items-center gap-2"
              >
                <i className="fas fa-sign-out-alt"></i>
                Cerrar Sesión
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// =====================================================
// PROTECTED ROUTE
// =====================================================

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, isLocalMode } = useAuth()

  if (isLocalMode) {
    return children
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <svg className="animate-spin h-10 w-10 text-purple-600 mx-auto mb-3" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-600 text-sm">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <AuthPage />
  }

  return children
}

export default {
  LoginForm,
  RegisterForm,
  AuthPage,
  UserMenu,
  ProtectedRoute
}