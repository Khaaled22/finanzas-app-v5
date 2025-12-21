// src/components/auth/AuthForms.jsx
// ✅ M31: Componentes de autenticación

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
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">💰 Finanzas App</h1>
          <p className="text-gray-600 mt-2">Inicia sesión en tu cuenta</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {(error || localError) && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error || localError}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="tu@email.com"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Iniciando sesión...
              </span>
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
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
      // Supabase requiere confirmación de email por defecto
    }
  }

  if (success) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">📧</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            ¡Revisa tu email!
          </h2>
          <p className="text-gray-600 mb-6">
            Te hemos enviado un enlace de confirmación a <strong>{email}</strong>.
            Haz clic en el enlace para activar tu cuenta.
          </p>
          <button
            onClick={onSwitchToLogin}
            className="text-blue-600 font-medium hover:underline"
          >
            Volver al login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">💰 Finanzas App</h1>
          <p className="text-gray-600 mt-2">Crea tu cuenta</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {(error || localError) && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error || localError}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="Tu nombre"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="tu@email.com"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="Mínimo 6 caracteres"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirmar Contraseña
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="Repite la contraseña"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 focus:ring-4 focus:ring-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Creando cuenta...
              </span>
            ) : (
              'Crear Cuenta'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
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
// AUTH PAGE (Login + Register)
// =====================================================

export const AuthPage = ({ onAuthenticated }) => {
  const [mode, setMode] = useState('login') // 'login' | 'register'

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
// USER MENU (para navbar)
// =====================================================

export const UserMenu = () => {
  const { user, signOut, isLocalMode } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  if (isLocalMode) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-yellow-100 text-yellow-800 rounded-lg text-sm">
        <span>💾</span>
        <span>Modo Local</span>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
      >
        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
          {user.email?.[0]?.toUpperCase() || '?'}
        </div>
        <span className="text-sm text-gray-700 hidden sm:block">
          {user.user_metadata?.name || user.email?.split('@')[0]}
        </span>
        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-20">
            <div className="p-3 border-b">
              <p className="text-sm font-medium text-gray-800 truncate">
                {user.user_metadata?.name || 'Usuario'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user.email}
              </p>
            </div>
            <div className="p-2">
              <button
                onClick={async () => {
                  await signOut()
                  setIsOpen(false)
                }}
                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
              >
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

  // En modo local, siempre permitir
  if (isLocalMode) {
    return children
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-600">Cargando...</p>
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