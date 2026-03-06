// src/tests/domain/flowKind.test.js
import { describe, it, expect } from 'vitest';
import {
  FLOW_KINDS,
  getFlowKind,
  isIncome,
  isOperatingExpense,
  isDebtPayment,
  isInvestmentContribution
} from '../../domain/flowKind';

describe('flowKind', () => {
  describe('FLOW_KINDS constants', () => {
    it('should export all four kinds', () => {
      expect(FLOW_KINDS.INCOME).toBe('INCOME');
      expect(FLOW_KINDS.OPERATING_EXPENSE).toBe('OPERATING_EXPENSE');
      expect(FLOW_KINDS.DEBT_PAYMENT).toBe('DEBT_PAYMENT');
      expect(FLOW_KINDS.INVESTMENT_CONTRIBUTION).toBe('INVESTMENT_CONTRIBUTION');
    });
  });

  describe('getFlowKind — explicit flowKind field', () => {
    it('returns explicit flowKind when set', () => {
      expect(getFlowKind({ flowKind: 'INCOME' })).toBe('INCOME');
      expect(getFlowKind({ flowKind: 'DEBT_PAYMENT' })).toBe('DEBT_PAYMENT');
      expect(getFlowKind({ flowKind: 'INVESTMENT_CONTRIBUTION' })).toBe('INVESTMENT_CONTRIBUTION');
    });

    it('ignores type/name when explicit flowKind is set', () => {
      // Even if type says something else, explicit flowKind wins
      expect(getFlowKind({ flowKind: 'INCOME', type: 'investment' })).toBe('INCOME');
    });
  });

  describe('getFlowKind — type inference', () => {
    it('classifies type=income as INCOME', () => {
      expect(getFlowKind({ type: 'income', name: 'Salario' })).toBe('INCOME');
    });

    it('classifies type=investment as INVESTMENT_CONTRIBUTION', () => {
      expect(getFlowKind({ type: 'investment', name: 'Fintual' })).toBe('INVESTMENT_CONTRIBUTION');
    });
  });

  describe('getFlowKind — group inference', () => {
    it('classifies group containing "deuda" as DEBT_PAYMENT', () => {
      expect(getFlowKind({ group: 'Deudas', name: 'Visa' })).toBe('DEBT_PAYMENT');
    });

    it('classifies group containing "debt" as DEBT_PAYMENT', () => {
      expect(getFlowKind({ group: 'Debt Payments', name: 'Car' })).toBe('DEBT_PAYMENT');
    });

    it('classifies group containing "loan" as DEBT_PAYMENT', () => {
      expect(getFlowKind({ group: 'Loan', name: 'Personal' })).toBe('DEBT_PAYMENT');
    });

    it('classifies group containing "préstamo" as DEBT_PAYMENT', () => {
      expect(getFlowKind({ group: 'Préstamos', name: 'Consumo' })).toBe('DEBT_PAYMENT');
    });
  });

  describe('getFlowKind — name inference', () => {
    it('classifies name containing "hipoteca" as DEBT_PAYMENT', () => {
      expect(getFlowKind({ name: 'Hipoteca BancoEstado' })).toBe('DEBT_PAYMENT');
    });

    it('classifies name containing "mortgage" as DEBT_PAYMENT', () => {
      expect(getFlowKind({ name: 'Mortgage Payment' })).toBe('DEBT_PAYMENT');
    });

    it('classifies name containing "crédito" as DEBT_PAYMENT', () => {
      expect(getFlowKind({ name: 'Crédito de consumo' })).toBe('DEBT_PAYMENT');
    });

    it('classifies name containing "cuota" as DEBT_PAYMENT', () => {
      expect(getFlowKind({ name: 'Cuota auto' })).toBe('DEBT_PAYMENT');
    });

    it('classifies name containing "cae" as DEBT_PAYMENT', () => {
      expect(getFlowKind({ name: 'CAE universidad' })).toBe('DEBT_PAYMENT');
    });
  });

  describe('getFlowKind — fallback', () => {
    it('returns OPERATING_EXPENSE when nothing matches', () => {
      expect(getFlowKind({ name: 'Comida', group: 'Hogar' })).toBe('OPERATING_EXPENSE');
      expect(getFlowKind({ name: 'Netflix' })).toBe('OPERATING_EXPENSE');
      expect(getFlowKind({})).toBe('OPERATING_EXPENSE');
    });
  });

  describe('helper predicates', () => {
    const income = { type: 'income' };
    const expense = { name: 'Supermercado' };
    const debt = { name: 'hipoteca' };
    const investment = { type: 'investment' };

    it('isIncome', () => {
      expect(isIncome(income)).toBe(true);
      expect(isIncome(expense)).toBe(false);
      expect(isIncome(debt)).toBe(false);
    });

    it('isOperatingExpense', () => {
      expect(isOperatingExpense(expense)).toBe(true);
      expect(isOperatingExpense(income)).toBe(false);
      expect(isOperatingExpense(debt)).toBe(false);
    });

    it('isDebtPayment', () => {
      expect(isDebtPayment(debt)).toBe(true);
      expect(isDebtPayment(expense)).toBe(false);
      expect(isDebtPayment(income)).toBe(false);
    });

    it('isInvestmentContribution', () => {
      expect(isInvestmentContribution(investment)).toBe(true);
      expect(isInvestmentContribution(expense)).toBe(false);
      expect(isInvestmentContribution(income)).toBe(false);
    });

    it('all predicates are mutually exclusive for a given category', () => {
      const cat = { name: 'Arriendo' };
      const results = [isIncome(cat), isOperatingExpense(cat), isDebtPayment(cat), isInvestmentContribution(cat)];
      expect(results.filter(Boolean)).toHaveLength(1);
    });
  });
});
