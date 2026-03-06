// src/domain/flowKind.js
// Fuente única de verdad para clasificación de flujos financieros.
// Importar desde aquí en lugar de duplicar la lógica en contextos y engines.

export const FLOW_KINDS = {
  INCOME: 'INCOME',
  OPERATING_EXPENSE: 'OPERATING_EXPENSE',
  DEBT_PAYMENT: 'DEBT_PAYMENT',
  INVESTMENT_CONTRIBUTION: 'INVESTMENT_CONTRIBUTION'
};

/**
 * Determina el flowKind de una categoría.
 * Prioriza flowKind explícito; si no existe, lo infiere de type/group/name.
 */
export const getFlowKind = (category) => {
  if (category.flowKind) return category.flowKind;

  const { type, group, name } = category;

  if (type === 'income') return FLOW_KINDS.INCOME;
  if (type === 'investment') return FLOW_KINDS.INVESTMENT_CONTRIBUTION;

  const groupLower = (group || '').toLowerCase();
  const nameLower = (name || '').toLowerCase();

  if (
    groupLower.includes('debt') || groupLower.includes('deuda') ||
    groupLower.includes('loan') || groupLower.includes('préstamo') ||
    nameLower.includes('hipoteca') || nameLower.includes('mortgage') ||
    nameLower.includes('cae') || nameLower.includes('crédito') ||
    nameLower.includes('cuota')
  ) {
    return FLOW_KINDS.DEBT_PAYMENT;
  }

  return FLOW_KINDS.OPERATING_EXPENSE;
};

export const isIncome = (cat) => getFlowKind(cat) === FLOW_KINDS.INCOME;
export const isOperatingExpense = (cat) => getFlowKind(cat) === FLOW_KINDS.OPERATING_EXPENSE;
export const isDebtPayment = (cat) => getFlowKind(cat) === FLOW_KINDS.DEBT_PAYMENT;
export const isInvestmentContribution = (cat) => getFlowKind(cat) === FLOW_KINDS.INVESTMENT_CONTRIBUTION;
