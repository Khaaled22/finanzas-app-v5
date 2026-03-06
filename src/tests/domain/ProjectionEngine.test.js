// src/tests/domain/ProjectionEngine.test.js
import { describe, it, expect } from 'vitest';
import { ProjectionEngine } from '../../domain/engines/ProjectionEngine';

// 1:1 conversion mock (EUR = base)
const convert = (amount, from, to) => {
  if (from === to) return amount;
  const rates = { 'EUR-CLP': 1000, 'CLP-EUR': 0.001, 'EUR-USD': 1.1, 'USD-EUR': 0.909 };
  return amount * (rates[`${from}-${to}`] || 1);
};

const BASE_CATEGORIES = [
  { id: 'c1', name: 'Comida', budget: 600, currency: 'EUR' },
  { id: 'c2', name: 'Transporte', budget: 400, currency: 'EUR' }
];
const BASE_YNAB = { monthlyIncome: 3000, currency: 'EUR' };

describe('ProjectionEngine', () => {
  describe('projectCashflow', () => {
    it('returns exactly 12 months', () => {
      const result = ProjectionEngine.projectCashflow(BASE_CATEGORIES, [], BASE_YNAB, convert, 'EUR');
      expect(result).toHaveLength(12);
    });

    it('each month has required fields', () => {
      const result = ProjectionEngine.projectCashflow(BASE_CATEGORIES, [], BASE_YNAB, convert, 'EUR');
      const first = result[0];
      expect(first).toHaveProperty('income');
      expect(first).toHaveProperty('operatingExpenses');
      expect(first).toHaveProperty('debtPayments');
      expect(first).toHaveProperty('investmentContribution');
      expect(first).toHaveProperty('netCashflow');
      expect(first).toHaveProperty('cumulativeBalance');
      expect(first).toHaveProperty('monthKey');
    });

    it('calculates correct income and expenses for realistic scenario', () => {
      const result = ProjectionEngine.projectCashflow(BASE_CATEGORIES, [], BASE_YNAB, convert, 'EUR');
      expect(result[0].income).toBe(3000);
      expect(result[0].operatingExpenses).toBe(1000); // 600 + 400
    });

    it('netCashflow = income - operatingExpenses - debtPayments - investmentContribution', () => {
      const result = ProjectionEngine.projectCashflow(BASE_CATEGORIES, [], BASE_YNAB, convert, 'EUR');
      const m = result[0];
      const expected = m.income - m.operatingExpenses - m.debtPayments - m.investmentContribution;
      expect(m.netCashflow).toBeCloseTo(expected, 5);
    });

    it('cumulativeBalance accumulates month over month', () => {
      const result = ProjectionEngine.projectCashflow(BASE_CATEGORIES, [], BASE_YNAB, convert, 'EUR');
      expect(result[1].cumulativeBalance).toBeCloseTo(result[0].cumulativeBalance + result[1].netCashflow, 2);
      expect(result[11].cumulativeBalance).toBeGreaterThan(result[0].cumulativeBalance);
    });

    it('includes debt payments from debts array', () => {
      const debts = [{ id: 'd1', monthlyPayment: 500, currency: 'EUR' }];
      const result = ProjectionEngine.projectCashflow(BASE_CATEGORIES, debts, BASE_YNAB, convert, 'EUR');
      expect(result[0].debtPayments).toBe(500);
    });

    it('uses max of debtCategories vs debtObjects to avoid double-counting', () => {
      // debt categories = 0, debt objects = 500 → should use 500
      const debts = [{ id: 'd1', monthlyPayment: 500, currency: 'EUR' }];
      const withDebtCat = [
        ...BASE_CATEGORIES,
        { id: 'c3', name: 'hipoteca', budget: 200, currency: 'EUR' } // DEBT_PAYMENT category
      ];
      const result = ProjectionEngine.projectCashflow(withDebtCat, debts, BASE_YNAB, convert, 'EUR');
      // max(200, 500) = 500
      expect(result[0].debtPayments).toBe(500);
    });
  });

  describe('scenario factors', () => {
    it('optimistic scenario increases income and reduces expenses', () => {
      const realistic = ProjectionEngine.projectCashflow(BASE_CATEGORIES, [], BASE_YNAB, convert, 'EUR', { scenario: 'realistic' });
      const optimistic = ProjectionEngine.projectCashflow(BASE_CATEGORIES, [], BASE_YNAB, convert, 'EUR', { scenario: 'optimistic' });
      expect(optimistic[0].income).toBeGreaterThan(realistic[0].income);
      expect(optimistic[0].operatingExpenses).toBeLessThan(realistic[0].operatingExpenses);
    });

    it('pessimistic scenario decreases income and increases expenses', () => {
      const realistic = ProjectionEngine.projectCashflow(BASE_CATEGORIES, [], BASE_YNAB, convert, 'EUR', { scenario: 'realistic' });
      const pessimistic = ProjectionEngine.projectCashflow(BASE_CATEGORIES, [], BASE_YNAB, convert, 'EUR', { scenario: 'pessimistic' });
      expect(pessimistic[0].income).toBeLessThan(realistic[0].income);
      expect(pessimistic[0].operatingExpenses).toBeGreaterThan(realistic[0].operatingExpenses);
    });
  });

  describe('investment modes', () => {
    const investmentCategories = [
      ...BASE_CATEGORIES,
      { id: 'inv', name: 'Inversión', type: 'investment', budget: 300, currency: 'EUR' }
    ];

    it('fixed mode uses budgeted investment contribution', () => {
      const result = ProjectionEngine.projectCashflow(
        investmentCategories, [], BASE_YNAB, convert, 'EUR',
        { investmentMode: 'fixed' }
      );
      expect(result[0].investmentContribution).toBe(300);
    });

    it('none mode has zero investment contribution', () => {
      const result = ProjectionEngine.projectCashflow(
        investmentCategories, [], BASE_YNAB, convert, 'EUR',
        { investmentMode: 'none' }
      );
      expect(result[0].investmentContribution).toBe(0);
    });

    it('flexible mode invests a % of surplus', () => {
      const result = ProjectionEngine.projectCashflow(
        BASE_CATEGORIES, [], BASE_YNAB, convert, 'EUR',
        { investmentMode: 'flexible', flexibleInvestmentPercent: 20 }
      );
      const m = result[0];
      // surplus = income - (operatingExpenses + debtPayments)
      const surplus = m.income - m.operatingExpenses - m.debtPayments;
      expect(m.investmentContribution).toBeCloseTo(surplus * 0.2, 2);
    });

    it('flexible mode has zero contribution when surplus is negative', () => {
      const highExpenses = [{ id: 'c1', name: 'Todo', budget: 5000, currency: 'EUR' }];
      const result = ProjectionEngine.projectCashflow(
        highExpenses, [], BASE_YNAB, convert, 'EUR',
        { investmentMode: 'flexible', flexibleInvestmentPercent: 20 }
      );
      expect(result[0].investmentContribution).toBe(0);
    });
  });

  describe('scheduled events', () => {
    it('adds income event to the correct month', () => {
      const now = new Date();
      const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const events = [{
        id: 'e1', name: 'Bono', type: 'income', amount: 1000, currency: 'EUR',
        date: `${monthKey}-15`, enabled: true
      }];
      const result = ProjectionEngine.projectCashflow(BASE_CATEGORIES, [], BASE_YNAB, convert, 'EUR', { scheduledEvents: events });
      expect(result[0].income).toBe(4000); // 3000 base + 1000 event
    });

    it('adds expense event to the correct month', () => {
      const now = new Date();
      const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const events = [{
        id: 'e1', name: 'Impuesto', type: 'expense', amount: 500, currency: 'EUR',
        date: `${monthKey}-10`, enabled: true
      }];
      const result = ProjectionEngine.projectCashflow(BASE_CATEGORIES, [], BASE_YNAB, convert, 'EUR', { scheduledEvents: events });
      expect(result[0].operatingExpenses).toBe(1500); // 1000 base + 500 event
    });

    it('ignores disabled events', () => {
      const now = new Date();
      const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const events = [{
        id: 'e1', name: 'Bono', type: 'income', amount: 1000, currency: 'EUR',
        date: `${monthKey}-15`, enabled: false
      }];
      const result = ProjectionEngine.projectCashflow(BASE_CATEGORIES, [], BASE_YNAB, convert, 'EUR', { scheduledEvents: events });
      expect(result[0].income).toBe(3000); // unchanged
    });
  });

  describe('getProjectionStats', () => {
    it('returns zeros for empty projection', () => {
      const stats = ProjectionEngine.getProjectionStats([]);
      expect(stats.deficitMonths).toBe(0);
      expect(stats.avgNetCashflow).toBe(0);
      expect(stats.finalBalance).toBe(0);
    });

    it('counts deficit months correctly', () => {
      const projection = ProjectionEngine.projectCashflow(
        [{ id: 'c1', name: 'Todo', budget: 5000, currency: 'EUR' }],
        [], BASE_YNAB, convert, 'EUR'
      );
      const stats = ProjectionEngine.getProjectionStats(projection);
      expect(stats.deficitMonths).toBe(12); // always in deficit
    });

    it('reports healthy when no deficit months', () => {
      const projection = ProjectionEngine.projectCashflow(BASE_CATEGORIES, [], BASE_YNAB, convert, 'EUR');
      const stats = ProjectionEngine.getProjectionStats(projection);
      expect(stats.deficitMonths).toBe(0);
      expect(stats.isHealthy).toBe(true);
    });

    it('calculates totalIncome across 12 months', () => {
      const projection = ProjectionEngine.projectCashflow(BASE_CATEGORIES, [], BASE_YNAB, convert, 'EUR');
      const stats = ProjectionEngine.getProjectionStats(projection);
      expect(stats.totalIncome).toBeCloseTo(3000 * 12, 0);
    });
  });

  describe('compareScenarios', () => {
    it('returns all three scenarios', () => {
      const result = ProjectionEngine.compareScenarios(
        BASE_CATEGORIES, [], BASE_YNAB, convert, 'EUR'
      );
      expect(result).toHaveProperty('realistic');
      expect(result).toHaveProperty('optimistic');
      expect(result).toHaveProperty('pessimistic');
    });

    it('optimistic final balance > realistic > pessimistic', () => {
      const result = ProjectionEngine.compareScenarios(
        BASE_CATEGORIES, [], BASE_YNAB, convert, 'EUR'
      );
      const optBalance = result.optimistic.stats.finalBalance;
      const realBalance = result.realistic.stats.finalBalance;
      const pessBalance = result.pessimistic.stats.finalBalance;
      expect(optBalance).toBeGreaterThan(realBalance);
      expect(realBalance).toBeGreaterThan(pessBalance);
    });
  });

  describe('validateScheduledEvent', () => {
    it('validates a correct event', () => {
      const event = { name: 'Bono', date: '2026-03-15', amount: 1000, type: 'income' };
      const result = ProjectionEngine.validateScheduledEvent(event);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects event with empty name', () => {
      const event = { name: '', date: '2026-03-15', amount: 1000, type: 'income' };
      const result = ProjectionEngine.validateScheduledEvent(event);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('nombre'))).toBe(true);
    });

    it('rejects event with missing date', () => {
      const event = { name: 'Bono', amount: 1000, type: 'income' };
      const result = ProjectionEngine.validateScheduledEvent(event);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('fecha'))).toBe(true);
    });

    it('rejects event with zero or negative amount', () => {
      const event = { name: 'Bono', date: '2026-03-15', amount: 0, type: 'income' };
      const result = ProjectionEngine.validateScheduledEvent(event);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('monto'))).toBe(true);
    });

    it('rejects event with invalid type', () => {
      const event = { name: 'Bono', date: '2026-03-15', amount: 500, type: 'savings' };
      const result = ProjectionEngine.validateScheduledEvent(event);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('tipo'))).toBe(true);
    });

    it('rejects event with multiple errors', () => {
      const event = { name: '', amount: -100, type: 'bad' };
      const result = ProjectionEngine.validateScheduledEvent(event);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(3);
    });
  });
});
