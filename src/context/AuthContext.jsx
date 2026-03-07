// src/context/AuthContext.jsx
// ✅ M31: Contexto de autenticación con Supabase

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { AuthService, isBackendEnabled } from '../modules/api/APIClient'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Verificar si backend está habilitado
  const backendEnabled = isBackendEnabled()

  useEffect(() => {
    if (!backendEnabled) {
      // Sin backend, usuario "local"
      setUser({ id: 'local', email: 'local@user', name: 'Usuario Local' })
      setLoading(false)
      return
    }

    // Obtener sesión inicial
    const initAuth = async () => {
      try {
        const session = await AuthService.getSession()
        setSession(session)
        
        if (session?.user) {
          setUser(session.user)
        }
      } catch (err) {
        console.error('Error initializing auth:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    initAuth()

    // Escuchar cambios de auth
    const { data: { subscription } } = AuthService.onAuthStateChange((event, session) => {
      if (import.meta.env.DEV) console.log('Auth state changed:', event)
      setSession(session)
      setUser(session?.user || null)
      
      if (event === 'SIGNED_OUT') {
        setUser(null)
        setSession(null)
      }
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [backendEnabled])

  const signUp = useCallback(async (email, password, name) => {
    setError(null)
    setLoading(true)

    try {
      const { user, session } = await AuthService.signUp(email, password, name)
      setUser(user)
      setSession(session)
      return { success: true, user }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }, [])

  const signIn = useCallback(async (email, password) => {
    setError(null)
    setLoading(true)

    try {
      const { user, session } = await AuthService.signIn(email, password)
      setUser(user)
      setSession(session)
      return { success: true, user }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }, [])

  const signOut = useCallback(async () => {
    setError(null)

    try {
      await AuthService.signOut()
      // Clear all financial data from localStorage on logout
      const financialKeys = [
        'transactions_v5', 'categories_v5', 'monthlyBudgets_v5', 'ynabConfig_v5',
        'debts_v5', 'investments_v5', 'savingsGoals_v5', 'exchangeRates_v5',
        'autoUpdateConfig_v5', 'exchangeRatesHistory', 'exchangeRatesHistory_v5',
        'netWorthHistory', 'projection_scenario', 'projection_scheduledEvents',
        'projection_investmentMode', 'projection_flexiblePercent', 'projection_annualGrowthRate'
      ];
      financialKeys.forEach(k => localStorage.removeItem(k))
      setUser(null)
      setSession(null)
      return { success: true }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    }
  }, [])

  const resetPassword = useCallback(async (email) => {
    setError(null)

    try {
      await AuthService.resetPassword(email)
      return { success: true }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    }
  }, [])

  const clearError = useCallback(() => setError(null), [])

  const value = useMemo(() => ({
    user,
    session,
    loading,
    error,
    isAuthenticated: !!user,
    isLocalMode: !backendEnabled,
    signUp,
    signIn,
    signOut,
    resetPassword,
    clearError
  }), [user, session, loading, error, backendEnabled, signUp, signIn, signOut, resetPassword, clearError])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthProvider