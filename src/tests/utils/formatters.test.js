// src/tests/utils/formatters.test.js
import { describe, it, expect } from 'vitest'
import {
  formatNumber,
  formatPercent,
  formatCompact,
  calculateROI,
  getValueColors,
  formatMoney,
  formatCurrency,
  formatPercentage
} from '../../utils/formatters'

describe('formatNumber', () => {
  it('formatea un entero con separador de miles europeo', () => {
    expect(formatNumber(1234567)).toBe('1.234.567')
  })

  it('formatea cero', () => {
    expect(formatNumber(0)).toBe('0')
  })

  it('formatea números negativos', () => {
    expect(formatNumber(-1500)).toBe('-1.500')
  })

  it('retorna "0" para null', () => {
    expect(formatNumber(null)).toBe('0')
  })

  it('retorna "0" para undefined', () => {
    expect(formatNumber(undefined)).toBe('0')
  })

  it('retorna "0" para NaN', () => {
    expect(formatNumber(NaN)).toBe('0')
  })

  it('respeta el número de decimales indicado', () => {
    expect(formatNumber(1234.567, 2)).toBe('1.234,57')
  })

  it('formatea número menor a 1000 sin separador', () => {
    expect(formatNumber(999)).toBe('999')
  })
})

describe('formatPercent', () => {
  it('formatea porcentaje básico con 1 decimal por defecto', () => {
    expect(formatPercent(15.678)).toBe('15.7%')
  })

  it('muestra signo + cuando showSign=true y valor positivo', () => {
    expect(formatPercent(15.5, 1, true)).toBe('+15.5%')
  })

  it('no muestra signo + para valores negativos aunque showSign=true', () => {
    expect(formatPercent(-5.2, 1, true)).toBe('-5.2%')
  })

  it('no muestra signo + para cero', () => {
    expect(formatPercent(0, 1, true)).toBe('0.0%')
  })

  it('retorna "0%" para null', () => {
    expect(formatPercent(null)).toBe('0%')
  })

  it('retorna "0%" para undefined', () => {
    expect(formatPercent(undefined)).toBe('0%')
  })

  it('retorna "0%" para NaN', () => {
    expect(formatPercent(NaN)).toBe('0%')
  })

  it('respeta decimals=0 redondeando al entero más cercano', () => {
    expect(formatPercent(33.7, 0)).toBe('34%') // toFixed(0) rounds 33.7 → 34
  })
})

describe('formatCompact', () => {
  it('formatea millones con una decimal', () => {
    expect(formatCompact(2500000, 'CLP')).toBe('2.5M CLP')
  })

  it('formatea miles sin decimal', () => {
    expect(formatCompact(1500, 'EUR')).toBe('2k EUR')
  })

  it('formatea valores bajo 1000 sin sufijo', () => {
    expect(formatCompact(750, 'EUR')).toBe('750 EUR')
  })

  it('formatea valores negativos en millones', () => {
    expect(formatCompact(-3000000, 'USD')).toBe('-3.0M USD')
  })

  it('formatea valores negativos en miles', () => {
    expect(formatCompact(-2500, 'EUR')).toBe('-3k EUR')
  })

  it('retorna "0" para null', () => {
    expect(formatCompact(null)).toBe('0')
  })

  it('usa EUR como moneda por defecto', () => {
    expect(formatCompact(500)).toBe('500 EUR')
  })
})

describe('calculateROI', () => {
  it('calcula ROI positivo correctamente', () => {
    expect(calculateROI(120, 100)).toBeCloseTo(20)
  })

  it('calcula ROI negativo correctamente', () => {
    expect(calculateROI(80, 100)).toBeCloseTo(-20)
  })

  it('retorna 0 cuando previousValue es 0', () => {
    expect(calculateROI(100, 0)).toBe(0)
  })

  it('retorna 0 cuando previousValue es null', () => {
    expect(calculateROI(100, null)).toBe(0)
  })

  it('retorna 0 cuando previousValue es undefined', () => {
    expect(calculateROI(100, undefined)).toBe(0)
  })

  it('calcula ROI de 0% cuando valores son iguales', () => {
    expect(calculateROI(100, 100)).toBe(0)
  })
})

describe('getValueColors', () => {
  it('retorna colores verdes para valor positivo', () => {
    const colors = getValueColors(50)
    expect(colors.text).toBe('text-green-600')
    expect(colors.bg).toBe('bg-green-50')
    expect(colors.icon).toBe('📈')
  })

  it('retorna colores rojos para valor negativo', () => {
    const colors = getValueColors(-10)
    expect(colors.text).toBe('text-red-600')
    expect(colors.bg).toBe('bg-red-50')
    expect(colors.icon).toBe('📉')
  })

  it('retorna colores grises para cero', () => {
    const colors = getValueColors(0)
    expect(colors.text).toBe('text-gray-600')
    expect(colors.bg).toBe('bg-gray-50')
    expect(colors.icon).toBe('➡️')
  })

  it('retorna border en cada caso', () => {
    expect(getValueColors(1).border).toBe('border-green-200')
    expect(getValueColors(-1).border).toBe('border-red-200')
    expect(getValueColors(0).border).toBe('border-gray-200')
  })
})

describe('formatMoney', () => {
  it('coloca símbolo EUR después del número', () => {
    expect(formatMoney(1234, 'EUR')).toBe('1.234 €')
  })

  it('coloca símbolo UF después del número', () => {
    expect(formatMoney(100, 'UF')).toBe('100 UF')
  })

  it('coloca símbolo $ antes para CLP', () => {
    expect(formatMoney(1000000, 'CLP')).toBe('$1.000.000')
  })

  it('coloca símbolo $ antes para USD', () => {
    expect(formatMoney(500, 'USD')).toBe('$500')
  })

  it('respeta decimals', () => {
    expect(formatMoney(1234.5, 'EUR', 2)).toBe('1.234,50 €')
  })
})

describe('formatCurrency (legacy)', () => {
  it('formatea con símbolo EUR', () => {
    expect(formatCurrency(100, 'EUR')).toBe('100.00 €')
  })

  it('formatea con símbolo CLP', () => {
    expect(formatCurrency(1000, 'CLP')).toBe('1000.00 $')
  })

  it('usa EUR por defecto', () => {
    expect(formatCurrency(50)).toBe('50.00 €')
  })
})

describe('formatPercentage (legacy)', () => {
  it('formatea con 1 decimal y símbolo %', () => {
    expect(formatPercentage(42.5)).toBe('42.5%')
  })

  it('redondea a 1 decimal', () => {
    expect(formatPercentage(33.333)).toBe('33.3%')
  })
})
