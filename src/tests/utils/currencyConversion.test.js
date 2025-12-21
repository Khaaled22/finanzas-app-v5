// src/tests/utils/currencyConversion.test.js
// ✅ M27: Tests para conversión de monedas
import { describe, it, expect } from 'vitest'

// Función de conversión extraída para testing
// En producción está en ExchangeRatesContext
const createConvertCurrency = (rates) => {
  return (amount, fromCurrency, toCurrency) => {
    if (fromCurrency === toCurrency) return amount
    if (!amount || isNaN(amount)) return 0
    
    let amountInEUR
    
    switch (fromCurrency) {
      case 'EUR':
        amountInEUR = amount
        break
      case 'CLP':
        amountInEUR = amount / rates.EUR_CLP
        break
      case 'USD':
        amountInEUR = amount / rates.EUR_USD
        break
      case 'UF':
        const clpAmount = amount * (rates.CLP_UF || rates.UF_CLP)
        amountInEUR = clpAmount / rates.EUR_CLP
        break
      default:
        amountInEUR = amount
    }
    
    switch (toCurrency) {
      case 'EUR':
        return amountInEUR
      case 'CLP':
        return amountInEUR * rates.EUR_CLP
      case 'USD':
        return amountInEUR * rates.EUR_USD
      case 'UF':
        const clpValue = amountInEUR * rates.EUR_CLP
        return clpValue / (rates.CLP_UF || rates.UF_CLP)
      default:
        return amountInEUR
    }
  }
}

describe('Currency Conversion', () => {
  const testRates = {
    EUR_CLP: 1000,
    EUR_USD: 1.1,
    CLP_UF: 37000
  }
  
  const convertCurrency = createConvertCurrency(testRates)

  describe('Same currency', () => {
    it('debería retornar el mismo monto si las monedas son iguales', () => {
      expect(convertCurrency(100, 'EUR', 'EUR')).toBe(100)
      expect(convertCurrency(50000, 'CLP', 'CLP')).toBe(50000)
      expect(convertCurrency(200, 'USD', 'USD')).toBe(200)
      expect(convertCurrency(10, 'UF', 'UF')).toBe(10)
    })
  })

  describe('Invalid inputs', () => {
    it('debería retornar 0 para montos inválidos', () => {
      expect(convertCurrency(null, 'EUR', 'CLP')).toBe(0)
      expect(convertCurrency(undefined, 'EUR', 'CLP')).toBe(0)
      expect(convertCurrency(NaN, 'EUR', 'CLP')).toBe(0)
      expect(convertCurrency('abc', 'EUR', 'CLP')).toBe(0)
    })

    it('debería manejar monto 0 correctamente', () => {
      expect(convertCurrency(0, 'EUR', 'CLP')).toBe(0)
    })
  })

  describe('EUR conversions', () => {
    it('EUR → CLP', () => {
      const result = convertCurrency(100, 'EUR', 'CLP')
      expect(result).toBe(100000) // 100 * 1000
    })

    it('EUR → USD', () => {
      const result = convertCurrency(100, 'EUR', 'USD')
      expect(result).toBeCloseTo(110, 5) // 100 * 1.1
    })

    it('EUR → UF', () => {
      const result = convertCurrency(100, 'EUR', 'UF')
      // 100 EUR = 100000 CLP = 100000/37000 UF ≈ 2.7027
      expect(result).toBeCloseTo(2.7027, 3)
    })
  })

  describe('CLP conversions', () => {
    it('CLP → EUR', () => {
      const result = convertCurrency(100000, 'CLP', 'EUR')
      expect(result).toBe(100) // 100000 / 1000
    })

    it('CLP → USD', () => {
      const result = convertCurrency(100000, 'CLP', 'USD')
      // 100000 CLP = 100 EUR = 110 USD
      expect(result).toBeCloseTo(110, 5)
    })

    it('CLP → UF', () => {
      const result = convertCurrency(37000, 'CLP', 'UF')
      // 37000 CLP / 37000 = 1 UF
      expect(result).toBeCloseTo(1, 5)
    })
  })

  describe('USD conversions', () => {
    it('USD → EUR', () => {
      const result = convertCurrency(110, 'USD', 'EUR')
     expect(result).toBeCloseTo(100, 5) // 110 / 1.1
    })

    it('USD → CLP', () => {
      const result = convertCurrency(110, 'USD', 'CLP')
      // 110 USD = 100 EUR = 100000 CLP
      expect(result).toBeCloseTo(100000, 0)
    })
  })

  describe('UF conversions', () => {
    it('UF → CLP', () => {
      const result = convertCurrency(1, 'UF', 'CLP')
      expect(result).toBe(37000) // 1 * 37000
    })

    it('UF → EUR', () => {
      const result = convertCurrency(1, 'UF', 'EUR')
      // 1 UF = 37000 CLP = 37 EUR
      expect(result).toBe(37)
    })

    it('UF → USD', () => {
      const result = convertCurrency(1, 'UF', 'USD')
      // 1 UF = 37000 CLP = 37 EUR = 40.7 USD
      expect(result).toBeCloseTo(40.7, 1)
    })
  })

  describe('Round-trip conversions', () => {
    it('EUR → CLP → EUR debería dar el mismo valor', () => {
      const original = 100
      const toCLP = convertCurrency(original, 'EUR', 'CLP')
      const backToEUR = convertCurrency(toCLP, 'CLP', 'EUR')
      expect(backToEUR).toBeCloseTo(original, 5)
    })

    it('USD → EUR → USD debería dar el mismo valor', () => {
      const original = 100
      const toEUR = convertCurrency(original, 'USD', 'EUR')
      const backToUSD = convertCurrency(toEUR, 'EUR', 'USD')
      expect(backToUSD).toBeCloseTo(original, 5)
    })

    it('UF → CLP → UF debería dar el mismo valor', () => {
      const original = 5
      const toCLP = convertCurrency(original, 'UF', 'CLP')
      const backToUF = convertCurrency(toCLP, 'CLP', 'UF')
      expect(backToUF).toBeCloseTo(original, 5)
    })
  })

  describe('Real-world scenarios', () => {
    // Tasas más realistas
    const realRates = {
      EUR_CLP: 1050,
      EUR_USD: 1.09,
      CLP_UF: 37500
    }
    const realConvert = createConvertCurrency(realRates)

    it('debería convertir un salario chileno a EUR', () => {
      const salarioCLP = 2000000 // 2 millones CLP
      const enEUR = realConvert(salarioCLP, 'CLP', 'EUR')
      
      // 2000000 / 1050 ≈ 1904.76 EUR
      expect(enEUR).toBeCloseTo(1904.76, 0)
    })

    it('debería convertir alquiler en EUR a CLP', () => {
      const alquilerEUR = 800
      const enCLP = realConvert(alquilerEUR, 'EUR', 'CLP')
      
      // 800 * 1050 = 840000 CLP
      expect(enCLP).toBe(840000)
    })

    it('debería convertir ahorro en UF a EUR', () => {
      const ahorroUF = 100
      const enEUR = realConvert(ahorroUF, 'UF', 'EUR')
      
      // 100 UF * 37500 CLP/UF / 1050 EUR/CLP ≈ 3571.43 EUR
      expect(enEUR).toBeCloseTo(3571.43, 0)
    })
  })

  describe('Edge cases', () => {
    it('debería manejar montos muy pequeños', () => {
      const result = convertCurrency(0.01, 'EUR', 'CLP')
      expect(result).toBe(10)
    })

    it('debería manejar montos muy grandes', () => {
      const result = convertCurrency(1000000, 'EUR', 'CLP')
      expect(result).toBe(1000000000)
    })

    it('debería manejar números negativos', () => {
      const result = convertCurrency(-100, 'EUR', 'CLP')
      expect(result).toBe(-100000)
    })
  })
})

describe('Historical Rate Conversion', () => {
  // Simula getRateForDate
  const historicalRates = {
    '2024-01-15': { EUR_CLP: 980, EUR_USD: 1.08, CLP_UF: 36500 },
    '2024-06-15': { EUR_CLP: 1020, EUR_USD: 1.09, CLP_UF: 37000 },
    '2024-12-15': { EUR_CLP: 1050, EUR_USD: 1.10, CLP_UF: 37500 }
  }

  const getRateForDate = (date) => {
    if (historicalRates[date]) {
      return historicalRates[date]
    }
    // Buscar fecha más cercana anterior
    const dates = Object.keys(historicalRates).sort()
    const closest = dates.filter(d => d <= date).pop()
    return closest ? historicalRates[closest] : historicalRates[dates[dates.length - 1]]
  }

  const convertAtDate = (amount, from, to, date) => {
    const rates = getRateForDate(date)
    return createConvertCurrency(rates)(amount, from, to)
  }

  it('debería usar tasa exacta cuando existe', () => {
    const result = convertAtDate(100, 'EUR', 'CLP', '2024-01-15')
    expect(result).toBe(98000) // 100 * 980
  })

  it('debería usar tasa más cercana anterior', () => {
    // No hay tasa para 2024-03-01, usa la de 2024-01-15
    const result = convertAtDate(100, 'EUR', 'CLP', '2024-03-01')
    expect(result).toBe(98000)
  })

  it('debería mostrar diferencia por fluctuación de tasas', () => {
    const eneroResult = convertAtDate(100, 'EUR', 'CLP', '2024-01-15')
    const dicResult = convertAtDate(100, 'EUR', 'CLP', '2024-12-15')
    
    expect(eneroResult).toBe(98000)
    expect(dicResult).toBe(105000)
    expect(dicResult - eneroResult).toBe(7000) // 7% de diferencia
  })
})