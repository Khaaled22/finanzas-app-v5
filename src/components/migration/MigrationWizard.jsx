// src/components/migration/MigrationWizard.jsx
// ✅ M31: Asistente para migrar datos de localStorage a Supabase

import React, { useState } from 'react'
import { MigrationService, isBackendEnabled, enableBackend } from '../../modules/api/APIClient'

export const MigrationWizard = ({ onComplete, onSkip }) => {
  const [step, setStep] = useState(1) // 1: intro, 2: preview, 3: migrating, 4: done
  const [localData, setLocalData] = useState(null)
  const [progress, setProgress] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  // Paso 1: Analizar datos locales
  const analyzeLocalData = async () => {
    try {
      const data = await MigrationService.exportLocalData()
      setLocalData(data)
      setStep(2)
    } catch (err) {
      setError('Error analizando datos: ' + err.message)
    }
  }

  // Paso 2: Ejecutar migración
  const runMigration = async () => {
    setStep(3)
    setError(null)
    
    try {
      // Habilitar backend
      enableBackend()
      
      const result = await MigrationService.migrateToSupabase((msg) => {
        setProgress(msg)
      })
      
      setResult(result)
      setStep(4)
    } catch (err) {
      setError('Error en migración: ' + err.message)
      setStep(2)
    }
  }

  // Calcular estadísticas de datos locales
  const getDataStats = () => {
    if (!localData) return null
    
    return {
      transactions: localData.transactions?.length || 0,
      categories: localData.categories?.length || 0,
      debts: localData.debts?.length || 0,
      savings: localData.savingsGoals?.length || 0,
      investments: localData.investments?.length || 0,
      budgetMonths: Object.keys(localData.monthlyBudgets || {}).length,
      rateDays: Object.keys(localData.exchangeRatesHistory || {}).length
    }
  }

  // Renderizar según el paso
  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="text-center">
            <div className="text-6xl mb-6">🚀</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              ¡Bienvenido a la nube!
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Detectamos que tienes datos guardados localmente. 
              ¿Deseas migrarlos a tu cuenta en la nube para acceder desde cualquier dispositivo?
            </p>
            
            <div className="space-y-3">
              <button
                onClick={analyzeLocalData}
                className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
              >
                Sí, migrar mis datos
              </button>
              <br />
              <button
                onClick={onSkip}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                No, empezar desde cero
              </button>
            </div>
          </div>
        )

      case 2:
        const stats = getDataStats()
        return (
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">
              📊 Datos a migrar
            </h2>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
              <DataCard icon="💳" label="Transacciones" value={stats.transactions} />
              <DataCard icon="📁" label="Categorías" value={stats.categories} />
              <DataCard icon="💰" label="Deudas" value={stats.debts} />
              <DataCard icon="🎯" label="Metas de Ahorro" value={stats.savings} />
              <DataCard icon="📈" label="Inversiones" value={stats.investments} />
              <DataCard icon="📅" label="Meses de Presupuesto" value={stats.budgetMonths} />
              <DataCard icon="💱" label="Días de Tasas" value={stats.rateDays} />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
              >
                ← Atrás
              </button>
              <button
                onClick={runMigration}
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition"
              >
                Iniciar Migración
              </button>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="text-center">
            <svg className="animate-spin h-16 w-16 text-blue-600 mx-auto mb-6" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Migrando datos...
            </h2>
            <p className="text-gray-600">{progress || 'Iniciando...'}</p>
          </div>
        )

      case 4:
        return (
          <div className="text-center">
            {result?.success ? (
              <>
                <div className="text-6xl mb-6">✅</div>
                <h2 className="text-2xl font-bold text-green-600 mb-4">
                  ¡Migración completada!
                </h2>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-left">
                  <h3 className="font-medium text-green-800 mb-2">Datos migrados:</h3>
                  <ul className="text-green-700 text-sm space-y-1">
                    {result.results.success.map((item, i) => (
                      <li key={i}>✓ {item}</li>
                    ))}
                  </ul>
                </div>
              </>
            ) : (
              <>
                <div className="text-6xl mb-6">⚠️</div>
                <h2 className="text-2xl font-bold text-yellow-600 mb-4">
                  Migración parcial
                </h2>
                {result?.results?.errors?.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
                    <h3 className="font-medium text-red-800 mb-2">Errores:</h3>
                    <ul className="text-red-700 text-sm space-y-1">
                      {result.results.errors.map((err, i) => (
                        <li key={i}>✗ {err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}

            <button
              onClick={onComplete}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
            >
              Continuar a la App
            </button>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full">
        {/* Progress indicator */}
        <div className="flex justify-center mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${step >= s ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                {s}
              </div>
              {s < 4 && (
                <div className={`w-12 h-1 ${step > s ? 'bg-blue-600' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        {renderStep()}
      </div>
    </div>
  )
}

// Componente auxiliar para mostrar estadísticas
const DataCard = ({ icon, label, value }) => (
  <div className="bg-gray-50 rounded-lg p-4 text-center">
    <div className="text-2xl mb-1">{icon}</div>
    <div className="text-2xl font-bold text-gray-800">{value.toLocaleString()}</div>
    <div className="text-sm text-gray-500">{label}</div>
  </div>
)

export default MigrationWizard