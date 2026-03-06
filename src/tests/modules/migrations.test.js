// src/tests/modules/migrations.test.js
// localStorage está mocked globalmente en setup.js como vi.fn()
// Usamos mockImplementation / mockReturnValue para controlar retornos
import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  migrateFromV4ToV5,
  migrateToMonthlyBudgets,
  isMigrationDone,
  isMonthlyBudgetsMigrationDone,
  runMigrations
} from '../../modules/storage/migrations'

// Helper: construye un mock de localStorage con estado real en memoria
function buildLocalStorageMock() {
  const store = {}
  localStorage.getItem.mockImplementation(key => store[key] ?? null)
  localStorage.setItem.mockImplementation((key, val) => { store[key] = val })
  localStorage.removeItem.mockImplementation(key => { delete store[key] })
  localStorage.clear.mockImplementation(() => { Object.keys(store).forEach(k => delete store[k]) })
  return store
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('isMigrationDone', () => {
  it('retorna false cuando no existe el flag', () => {
    localStorage.getItem.mockReturnValue(null)
    expect(isMigrationDone()).toBe(false)
  })

  it('retorna true cuando el flag está seteado', () => {
    localStorage.getItem.mockReturnValue('true')
    expect(isMigrationDone()).toBe(true)
  })
})

describe('isMonthlyBudgetsMigrationDone', () => {
  it('retorna false cuando no existe el flag', () => {
    localStorage.getItem.mockReturnValue(null)
    expect(isMonthlyBudgetsMigrationDone()).toBe(false)
  })

  it('retorna true cuando el flag está seteado', () => {
    localStorage.getItem.mockReturnValue('true')
    expect(isMonthlyBudgetsMigrationDone()).toBe(true)
  })
})

describe('migrateFromV4ToV5', () => {
  it('no setea flag si no hay datos v4', () => {
    buildLocalStorageMock() // todo vacío
    migrateFromV4ToV5()
    expect(localStorage.setItem).not.toHaveBeenCalledWith('migration_v4_v5_done', 'true')
  })

  it('migra datos v4 existentes a clave v5', () => {
    const store = buildLocalStorageMock()
    store['transactions_v4'] = JSON.stringify([{ id: '1' }])
    migrateFromV4ToV5()
    expect(localStorage.setItem).toHaveBeenCalledWith('transactions_v5', JSON.stringify([{ id: '1' }]))
  })

  it('setea el flag de migración cuando hay datos v4', () => {
    const store = buildLocalStorageMock()
    store['debts_v4'] = JSON.stringify([])
    migrateFromV4ToV5()
    expect(localStorage.setItem).toHaveBeenCalledWith('migration_v4_v5_done', 'true')
  })

  it('no toca v5 ni setea flag si no hay datos v4', () => {
    buildLocalStorageMock()
    migrateFromV4ToV5()
    expect(localStorage.setItem).not.toHaveBeenCalled()
  })
})

describe('migrateToMonthlyBudgets', () => {
  it('no hace nada si el flag ya está seteado (idempotente)', () => {
    const store = buildLocalStorageMock()
    store['migration_monthly_budgets_done'] = 'true'
    migrateToMonthlyBudgets()
    // Solo debería haber leído el flag, nada más
    expect(localStorage.setItem).not.toHaveBeenCalled()
  })

  it('setea el flag al completar', () => {
    buildLocalStorageMock() // sin flag, sin categorías
    migrateToMonthlyBudgets()
    expect(localStorage.setItem).toHaveBeenCalledWith('migration_monthly_budgets_done', 'true')
  })

  it('con categorías vacías inicializa presupuesto vacío para el mes actual', () => {
    const store = buildLocalStorageMock()
    store['categories_v5'] = JSON.stringify([])
    migrateToMonthlyBudgets()
    const monthlyBudgetsCall = localStorage.setItem.mock.calls
      .find(([key]) => key === 'monthlyBudgets_v5')
    expect(monthlyBudgetsCall).toBeDefined()
    const budgets = JSON.parse(monthlyBudgetsCall[1])
    const now = new Date()
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    expect(budgets[currentMonth]).toBeDefined()
    expect(Object.keys(budgets[currentMonth])).toHaveLength(0)
  })

  it('copia budget de cada categoría al mes actual', () => {
    const store = buildLocalStorageMock()
    store['categories_v5'] = JSON.stringify([
      { id: 'c1', name: 'Comida', budget: 500 },
      { id: 'c2', name: 'Transporte', budget: 200 }
    ])
    migrateToMonthlyBudgets()
    const monthlyBudgetsCall = localStorage.setItem.mock.calls
      .find(([key]) => key === 'monthlyBudgets_v5')
    const budgets = JSON.parse(monthlyBudgetsCall[1])
    const now = new Date()
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    expect(budgets[currentMonth]['c1'].budget).toBe(500)
    expect(budgets[currentMonth]['c2'].budget).toBe(200)
    expect(budgets[currentMonth]['c1'].spent).toBe(0)
  })

  it('no sobreescribe presupuestos existentes para el mes actual', () => {
    const store = buildLocalStorageMock()
    const now = new Date()
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    store['monthlyBudgets_v5'] = JSON.stringify({ [currentMonth]: { c1: { budget: 999, spent: 50 } } })
    migrateToMonthlyBudgets()
    // Debe setear el flag pero no llamar setItem para monthlyBudgets_v5
    const monthlyBudgetsCalls = localStorage.setItem.mock.calls
      .filter(([key]) => key === 'monthlyBudgets_v5')
    expect(monthlyBudgetsCalls).toHaveLength(0)
    expect(localStorage.setItem).toHaveBeenCalledWith('migration_monthly_budgets_done', 'true')
  })

  it('usa budget=0 para categorías sin presupuesto definido', () => {
    const store = buildLocalStorageMock()
    store['categories_v5'] = JSON.stringify([{ id: 'c1', name: 'Sin Budget' }])
    migrateToMonthlyBudgets()
    const monthlyBudgetsCall = localStorage.setItem.mock.calls
      .find(([key]) => key === 'monthlyBudgets_v5')
    const budgets = JSON.parse(monthlyBudgetsCall[1])
    const now = new Date()
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    expect(budgets[currentMonth]['c1'].budget).toBe(0)
  })
})

describe('runMigrations', () => {
  it('ejecuta migrateFromV4ToV5 cuando no está completada', () => {
    const store = buildLocalStorageMock()
    store['transactions_v4'] = JSON.stringify([{ id: '1' }])
    // flag monthly ya seteado para aislar la prueba de v4→v5
    store['migration_monthly_budgets_done'] = 'true'
    runMigrations()
    expect(localStorage.setItem).toHaveBeenCalledWith('migration_v4_v5_done', 'true')
  })

  it('ejecuta migrateToMonthlyBudgets cuando no está completada', () => {
    const store = buildLocalStorageMock()
    // flag v4→v5 ya seteado para aislar la prueba de monthly
    store['migration_v4_v5_done'] = 'true'
    runMigrations()
    expect(localStorage.setItem).toHaveBeenCalledWith('migration_monthly_budgets_done', 'true')
  })

  it('no re-ejecuta migraciones ya completadas', () => {
    const store = buildLocalStorageMock()
    store['migration_v4_v5_done'] = 'true'
    store['migration_monthly_budgets_done'] = 'true'
    store['transactions_v4'] = JSON.stringify([{ id: 'new' }])
    runMigrations()
    // Con ambos flags activos, no debe migrar transactions_v4 a v5
    const v5Call = localStorage.setItem.mock.calls
      .find(([key]) => key === 'transactions_v5')
    expect(v5Call).toBeUndefined()
  })
})
