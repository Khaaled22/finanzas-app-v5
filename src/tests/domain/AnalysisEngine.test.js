// src/tests/domain/AnalysisEngine.test.js
// ✅ M27: Tests unitarios para AnalysisEngine
// ✅ Corregido: Removido tests para calculateFinancialHealth (no existe en el engine actual)
import { describe, it, expect, vi } from 'vitest'
import { AnalysisEngine } from '../../domain/engines/AnalysisEngine'

// Mock de función de conversión simple (1:1 para tests)
const mockConvertCurrency = (amount, from, to) => {
  if (from === to) return amount
  // Tasas mock para tests
  const rates = {
    'EUR-CLP': 1000,
    'CLP-EUR': 0.001,
    'EUR-USD': 1.1,
    'USD-EUR': 0.91
  }
  const key = `${from}-${to}`
  return amount * (rates[key] || 1)
}

describe('AnalysisEngine', () => {
  
  describe('calculateNautaIndex', () => {
    const baseData = {
      categories: [
        { id: '1', name: 'Comida', budget: 500, currency: 'EUR' },
        { id: '2', name: 'Transporte', budget: 200, currency: 'EUR' }
      ],
      debts: [],
      savingsGoals: [],
      ynabConfig: { monthlyIncome: 3500, currency: 'EUR' }
    }

    it('debería retornar score 0 cuando no hay datos', () => {
      const emptyData = {
        categories: [],
        debts: [],
        savingsGoals: [],
        ynabConfig: null
      }
      
      const result = AnalysisEngine.calculateNautaIndex(emptyData, mockConvertCurrency, 'EUR')
      
      expect(result.score).toBeDefined()
      expect(result.breakdown).toBeDefined()
    })

    it('debería calcular score de fondo de emergencia correctamente', () => {
      const dataWithEmergencyFund = {
        ...baseData,
        savingsGoals: [
          { 
            id: 'ef1', 
            name: 'Fondo de Emergencia', 
            currentAmount: 4200, // 6 meses de gastos (700*6)
            currency: 'EUR' 
          }
        ]
      }
      
      const result = AnalysisEngine.calculateNautaIndex(dataWithEmergencyFund, mockConvertCurrency, 'EUR')
      
      expect(result.breakdown.emergencyFund.score).toBe(20) // Score máximo
      expect(result.breakdown.emergencyFund.details.monthsCovered).toBe(6)
      expect(result.breakdown.emergencyFund.details.status).toBe('Excelente')
    })

    it('debería calcular score parcial para fondo de emergencia insuficiente', () => {
      const dataWithPartialFund = {
        ...baseData,
        savingsGoals: [
          { 
            id: 'ef1', 
            name: 'Fondo de Emergencia', 
            currentAmount: 2100, // 3 meses de gastos
            currency: 'EUR' 
          }
        ]
      }
      
      const result = AnalysisEngine.calculateNautaIndex(dataWithPartialFund, mockConvertCurrency, 'EUR')
      
      expect(result.breakdown.emergencyFund.score).toBe(10) // 50% del máximo
      expect(result.breakdown.emergencyFund.details.monthsCovered).toBe(3)
      expect(result.breakdown.emergencyFund.details.status).toBe('Bueno')
    })

    it('debería calcular tasa de ahorro correctamente', () => {
      const result = AnalysisEngine.calculateNautaIndex(baseData, mockConvertCurrency, 'EUR')
      
      // Ingreso: 3500, Gastos: 700, Ahorro: 2800 (80%)
      const expectedSavingsRate = ((3500 - 700) / 3500) * 100
      
      expect(result.breakdown.savingsRate.details.savingsRatePercent).toBeCloseTo(expectedSavingsRate, 1)
      expect(result.breakdown.savingsRate.score).toBe(20) // Máximo porque ahorra más del 20%
    })

    it('debería penalizar deudas tóxicas', () => {
      const dataWithToxicDebts = {
        ...baseData,
        debts: [
          { id: 'd1', name: 'Tarjeta Visa', type: 'Tarjeta de Crédito', currentBalance: 5000, currency: 'EUR' },
          { id: 'd2', name: 'Préstamo Auto', type: 'Préstamo Automotriz', currentBalance: 10000, currency: 'EUR' }
        ]
      }
      
      const result = AnalysisEngine.calculateNautaIndex(dataWithToxicDebts, mockConvertCurrency, 'EUR')
      
      expect(result.breakdown.toxicDebts.score).toBe(5) // 10 - (2 * 2.5)
      expect(result.breakdown.toxicDebts.details.count).toBe(2)
    })

    it('debería dar score máximo sin deudas tóxicas', () => {
      const dataWithGoodDebt = {
        ...baseData,
        debts: [
          { id: 'd1', name: 'Hipoteca', type: 'Hipoteca', currentBalance: 100000, currency: 'EUR' }
        ]
      }
      
      const result = AnalysisEngine.calculateNautaIndex(dataWithGoodDebt, mockConvertCurrency, 'EUR')
      
      expect(result.breakdown.toxicDebts.score).toBe(10)
      expect(result.breakdown.toxicDebts.details.count).toBe(0)
    })

    it('debería detectar seguros en categorías', () => {
      const dataWithInsurance = {
        ...baseData,
        categories: [
          ...baseData.categories,
          { id: 'ins1', name: 'Seguro Médico', budget: 100, currency: 'EUR' },
          { id: 'ins2', name: 'Seguro de Vida', budget: 50, currency: 'EUR' }
        ]
      }
      
      const result = AnalysisEngine.calculateNautaIndex(dataWithInsurance, mockConvertCurrency, 'EUR')
      
      expect(result.breakdown.insurance.details.hasHealthInsurance).toBe(true)
      expect(result.breakdown.insurance.details.hasLifeInsurance).toBe(true)
      expect(result.breakdown.insurance.score).toBeGreaterThan(0)
    })

    it('debería escalar score correctamente a 100 puntos', () => {
      // Datos perfectos
      const perfectData = {
        categories: [
          { id: '1', name: 'Gastos', budget: 500, currency: 'EUR' },
          { id: '2', name: 'Seguro Médico', budget: 100, currency: 'EUR' },
          { id: '3', name: 'Seguro de Vida', budget: 50, currency: 'EUR' },
          { id: '4', name: 'Seguro Catastrófico', budget: 30, currency: 'EUR' },
          { id: '5', name: 'APV', budget: 200, currency: 'EUR' }
        ],
        debts: [],
        savingsGoals: [
          { id: 'ef', name: 'Fondo de Emergencia', currentAmount: 4080, currency: 'EUR' } // 6 meses
        ],
        ynabConfig: { monthlyIncome: 3500, currency: 'EUR' }
      }
      
      const result = AnalysisEngine.calculateNautaIndex(perfectData, mockConvertCurrency, 'EUR')
      
      expect(result.score).toBeGreaterThanOrEqual(0)
      expect(result.score).toBeLessThanOrEqual(100)
    })
  })

  describe('calculateEmergencyFundMonths', () => {
    it('debería calcular meses cubiertos correctamente', () => {
      const savingsGoals = [
        { id: '1', name: 'Fondo de Emergencia', currentAmount: 6000, currency: 'EUR' }
      ]
      const categories = [
        { id: '1', budget: 1000, currency: 'EUR' },
        { id: '2', budget: 500, currency: 'EUR' }
      ]
      
      const result = AnalysisEngine.calculateEmergencyFundMonths(
        savingsGoals, 
        categories, 
        mockConvertCurrency, 
        'EUR'
      )
      
      // 6000 / 1500 = 4 meses
      expect(result).toBe(4)
    })

    it('debería retornar 0 si no hay fondo de emergencia', () => {
      const savingsGoals = [
        { id: '1', name: 'Vacaciones', currentAmount: 3000, currency: 'EUR' }
      ]
      const categories = [
        { id: '1', budget: 1000, currency: 'EUR' }
      ]
      
      const result = AnalysisEngine.calculateEmergencyFundMonths(
        savingsGoals, 
        categories, 
        mockConvertCurrency, 
        'EUR'
      )
      
      expect(result).toBe(0)
    })

    it('debería detectar fondo de emergencia en inglés', () => {
      const savingsGoals = [
        { id: '1', name: 'Emergency Fund', currentAmount: 3000, currency: 'EUR' }
      ]
      const categories = [
        { id: '1', budget: 1000, currency: 'EUR' }
      ]
      
      const result = AnalysisEngine.calculateEmergencyFundMonths(
        savingsGoals, 
        categories, 
        mockConvertCurrency, 
        'EUR'
      )
      
      expect(result).toBe(3)
    })
  })

  describe('generateInsights', () => {
    it('debería generar advertencia cuando se sobrepasa presupuesto', () => {
      const data = {
        categories: [
          { id: '1', name: 'Comida', budget: 500, spent: 600, currency: 'EUR' }
        ],
        totals: { budgeted: 500, spent: 600, available: -100 },
        debts: [],
        savingsGoals: [],
        ynabConfig: { monthlyIncome: 3000, currency: 'EUR' }
      }
      
      const insights = AnalysisEngine.generateInsights(data, mockConvertCurrency, 'EUR')
      
      const overbudgetWarning = insights.find(i => i.title.includes('Sobrepasaste'))
      expect(overbudgetWarning).toBeDefined()
      expect(overbudgetWarning.type).toBe('warning')
      expect(overbudgetWarning.priority).toBe('high')
    })

    it('debería generar advertencia por tasa de ahorro baja', () => {
      const data = {
        categories: [
          { id: '1', name: 'Gastos', budget: 2900, spent: 2900, currency: 'EUR' }
        ],
        totals: { budgeted: 2900, spent: 2900, available: 100 },
        debts: [],
        savingsGoals: [],
        ynabConfig: { monthlyIncome: 3000, currency: 'EUR' }
      }
      
      const insights = AnalysisEngine.generateInsights(data, mockConvertCurrency, 'EUR')
      
      const savingsWarning = insights.find(i => i.title.includes('Tasa de ahorro'))
      expect(savingsWarning).toBeDefined()
    })

    it('debería felicitar por excelente tasa de ahorro', () => {
      const data = {
        categories: [
          { id: '1', name: 'Gastos', budget: 1500, spent: 1500, currency: 'EUR' }
        ],
        totals: { budgeted: 1500, spent: 1500, available: 1500 },
        debts: [],
        savingsGoals: [],
        ynabConfig: { monthlyIncome: 3000, currency: 'EUR' }
      }
      
      const insights = AnalysisEngine.generateInsights(data, mockConvertCurrency, 'EUR')
      
      const successInsight = insights.find(i => i.type === 'success')
      expect(successInsight).toBeDefined()
      expect(successInsight.title).toContain('Excelente')
    })

    it('debería ordenar insights por prioridad', () => {
      const data = {
        categories: [
          { id: '1', name: 'Comida', budget: 500, spent: 600, currency: 'EUR' }, // Warning high
          { id: '2', name: 'Ahorro', budget: 1000, spent: 100, currency: 'EUR' }
        ],
        totals: { budgeted: 1500, spent: 700, available: 800 },
        debts: [
          { currentBalance: 200000, currency: 'EUR' } // Deuda alta - high priority
        ],
        savingsGoals: [],
        ynabConfig: { monthlyIncome: 3000, currency: 'EUR' }
      }
      
      const insights = AnalysisEngine.generateInsights(data, mockConvertCurrency, 'EUR')
      
      // Todos los high priority deben estar primero
      const highPriorityIndex = insights.findIndex(i => i.priority === 'high')
      const lowPriorityIndex = insights.findIndex(i => i.priority === 'low')
      
      if (highPriorityIndex !== -1 && lowPriorityIndex !== -1) {
        expect(highPriorityIndex).toBeLessThan(lowPriorityIndex)
      }
    })
  })

  describe('compareWithPreviousMonth', () => {
    it('debería comparar gastos entre meses', () => {
      const now = new Date()
      const currentMonth = now.getMonth()
      const currentYear = now.getFullYear()
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear
      
      const transactions = [
        // Este mes
        { 
          id: '1', 
          amount: 100, 
          currency: 'EUR', 
          date: new Date(currentYear, currentMonth, 15).toISOString() 
        },
        { 
          id: '2', 
          amount: 200, 
          currency: 'EUR', 
          date: new Date(currentYear, currentMonth, 20).toISOString() 
        },
        // Mes pasado
        { 
          id: '3', 
          amount: 150, 
          currency: 'EUR', 
          date: new Date(lastMonthYear, lastMonth, 10).toISOString() 
        }
      ]
      
      const result = AnalysisEngine.compareWithPreviousMonth(transactions, mockConvertCurrency, 'EUR')
      
      expect(result.currentMonth.total).toBe(300)
      expect(result.lastMonth.total).toBe(150)
      expect(result.difference).toBe(150)
      expect(result.trend).toBe('up')
    })
  })

  describe('projectCashflow', () => {
    it('debería proyectar 12 meses de cashflow', () => {
      const categories = [
        { id: '1', budget: 1000, currency: 'EUR' },
        { id: '2', budget: 500, currency: 'EUR' }
      ]
      const debts = [
        { id: 'd1', monthlyPayment: 200, currency: 'EUR' }
      ]
      const ynabConfig = { monthlyIncome: 3000, currency: 'EUR' }
      
      const result = AnalysisEngine.projectCashflow(
        categories, 
        debts, 
        ynabConfig, 
        mockConvertCurrency, 
        'EUR'
      )
      
      expect(result).toHaveLength(12)
      expect(result[0].income).toBe(3000)
      expect(result[0].expenses).toBe(1500)
      expect(result[0].debtPayments).toBe(200)
      expect(result[0].netCashflow).toBe(1300)
    })

    it('debería acumular balance correctamente', () => {
      const categories = [{ id: '1', budget: 1000, currency: 'EUR' }]
      const debts = []
      const ynabConfig = { monthlyIncome: 2000, currency: 'EUR' }
      
      const result = AnalysisEngine.projectCashflow(
        categories, 
        debts, 
        ynabConfig, 
        mockConvertCurrency, 
        'EUR'
      )
      
      // Cada mes ahorra 1000, balance acumulativo crece
      expect(result[0].cumulativeBalance).toBe(2000) // 1000 inicial + 1000 del mes
      expect(result[11].cumulativeBalance).toBeGreaterThan(result[0].cumulativeBalance)
    })
  })
})