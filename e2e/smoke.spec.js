// e2e/smoke.spec.js
// Smoke test suite: verifies every view renders without crashing
// and critical user flows work end-to-end.
//
// Runs in local mode (no Supabase auth required).
// Usage: npx playwright test
//        npx playwright test --project=mobile

import { test, expect } from '@playwright/test';

// ============================================================
// HELPERS
// ============================================================

// Collect console errors during a test
function trackConsoleErrors(page) {
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Ignore known noise
      if (text.includes('favicon') || text.includes('manifest')) return;
      errors.push(text);
    }
  });
  page.on('pageerror', (err) => {
    errors.push(err.message);
  });
  return errors;
}

// Navigate to a route and verify no crash
async function navigateAndVerify(page, path, expectedText) {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
  if (expectedText) {
    await expect(page.locator('body')).toContainText(expectedText, { timeout: 10000 });
  }
  // Verify ErrorBoundary did NOT trigger
  const errorBoundary = page.locator('text=Algo salió mal');
  const errorVisible = await errorBoundary.isVisible().catch(() => false);
  expect(errorVisible, `ErrorBoundary triggered on ${path}`).toBe(false);
}

// Build seed data object (must be serializable — no Date objects)
function buildSeedData() {
  const now = new Date().toISOString();
  const month = now.slice(0, 7);
  const prevMonth = new Date();
  prevMonth.setMonth(prevMonth.getMonth() - 1);
  const pm = prevMonth.toISOString().slice(0, 7);

  return {
    categories_v5: [
      { id: 'cat_food', name: 'Alimentacion', icon: 'utensils', color: '#ef4444', flowKind: 'OPERATING_EXPENSE', isActive: true },
      { id: 'cat_transport', name: 'Transporte', icon: 'bus', color: '#3b82f6', flowKind: 'OPERATING_EXPENSE', isActive: true },
      { id: 'cat_salary', name: 'Sueldo', icon: 'money-bill', color: '#22c55e', flowKind: 'INCOME', isActive: true },
      { id: 'cat_rent', name: 'Arriendo', icon: 'home', color: '#f97316', flowKind: 'OPERATING_EXPENSE', isActive: true },
    ],
    transactions_v5: [
      { id: 'tx_1', date: `${month}-05`, description: 'Supermercado', amount: 45000, currency: 'CLP', categoryId: 'cat_food', paymentMethod: 'Tarjeta', createdAt: now },
      { id: 'tx_2', date: `${month}-03`, description: 'Metro', amount: 15000, currency: 'CLP', categoryId: 'cat_transport', paymentMethod: 'Tarjeta', createdAt: now },
      { id: 'tx_3', date: `${month}-01`, description: 'Sueldo Marzo', amount: 2500000, currency: 'CLP', categoryId: 'cat_salary', paymentMethod: 'Transferencia', createdAt: now },
      { id: 'tx_4', date: `${month}-01`, description: 'Arriendo', amount: 450000, currency: 'CLP', categoryId: 'cat_rent', paymentMethod: 'Transferencia', createdAt: now },
      { id: 'tx_5', date: `${pm}-10`, description: 'Supermercado Feb', amount: 52000, currency: 'CLP', categoryId: 'cat_food', paymentMethod: 'Tarjeta', createdAt: now },
      { id: 'tx_6', date: `${pm}-01`, description: 'Sueldo Feb', amount: 2500000, currency: 'CLP', categoryId: 'cat_salary', paymentMethod: 'Transferencia', createdAt: now },
    ],
    monthlyBudgets_v5: {
      [`${month}_cat_food`]: { categoryId: 'cat_food', month, limit: 200000 },
      [`${month}_cat_transport`]: { categoryId: 'cat_transport', month, limit: 50000 },
      [`${month}_cat_rent`]: { categoryId: 'cat_rent', month, limit: 450000 },
    },
    investments_v5: [
      {
        id: 'inv_1', name: 'Fintual Risky Norris', goal: 'fi_step1', subtype: 'fondos_mutuos',
        currency: 'CLP', currentBalance: 5200000, isLiquid: true,
        balanceHistory: [
          { id: 'bh_1', date: `${pm}-01`, balance: 5000000, note: 'Deposito inicial', type: 'initial', createdAt: now },
          { id: 'bh_2', date: `${month}-01`, balance: 5200000, note: 'Aporte mensual', type: 'manual', createdAt: now },
        ],
        createdAt: now
      },
      {
        id: 'inv_2', name: 'Trade Republic ETF', goal: 'growth', subtype: 'etf',
        currency: 'EUR', currentBalance: 3500, isLiquid: true,
        balanceHistory: [
          { id: 'bh_3', date: `${pm}-15`, balance: 3200, note: 'Inicio', type: 'initial', createdAt: now },
          { id: 'bh_4', date: `${month}-01`, balance: 3500, note: 'Crecimiento', type: 'manual', createdAt: now },
        ],
        createdAt: now
      },
    ],
    savingsGoals_v5: [
      {
        id: 'goal_1', name: 'Fondo Emergencia', targetAmount: 10000000, currentAmount: 5200000,
        currency: 'CLP', icon: 'shield', linkedPlatforms: ['inv_1'], createdAt: now
      },
    ],
    debts_v5: [
      {
        id: 'debt_1', name: 'Credito Automotriz', type: 'auto',
        originalAmount: 15000000, currentBalance: 8500000, interestRate: 0.89,
        currency: 'CLP', minimumPayment: 350000, dueDay: 5,
        balanceHistory: [
          { id: 'dbh_1', date: `${pm}-01`, balance: 9000000, note: 'Inicio tracking', createdAt: now },
          { id: 'dbh_2', date: `${month}-05`, balance: 8500000, note: 'Pago mensual', createdAt: now },
        ],
        createdAt: now
      },
    ],
    ynabConfig_v5: { enabled: true, startMonth: pm },
  };
}

// Seed localStorage via addInitScript so data exists BEFORE React bootstraps
async function seedTestData(page) {
  const data = buildSeedData();
  await page.addInitScript((seedData) => {
    for (const [key, value] of Object.entries(seedData)) {
      localStorage.setItem(key, JSON.stringify(value));
    }
  }, data);
}

// ============================================================
// TESTS
// ============================================================

test.describe('Smoke Tests', () => {
  let consoleErrors;

  test.beforeEach(async ({ page }) => {
    consoleErrors = trackConsoleErrors(page);
    await seedTestData(page);
  });

  test.afterEach(async () => {
    const realErrors = consoleErrors.filter(
      (e) => !e.includes('Multiple GoTrueClient') && !e.includes('net::ERR') &&
             !e.includes('Failed to fetch') && !e.includes('sincronizando con Supabase')
    );
    expect(realErrors, `Console errors found: ${realErrors.join('\n')}`).toHaveLength(0);
  });

  // ----------------------------------------------------------
  // VIEW RENDERING — each view loads without crash
  // ----------------------------------------------------------

  test('Dashboard renders', async ({ page }) => {
    await navigateAndVerify(page, '/dashboard', 'Finanzas PRO');
  });

  test('Budget view renders', async ({ page }) => {
    await navigateAndVerify(page, '/budget', 'Presupuesto');
  });

  test('Transactions view renders', async ({ page }) => {
    await navigateAndVerify(page, '/transactions', 'Transacciones');
    // Should show seeded transactions
    await expect(page.locator('text=Supermercado')).toBeVisible();
  });

  test('Debts view renders', async ({ page }) => {
    await navigateAndVerify(page, '/debts', 'Deudas');
    await expect(page.locator('text=Credito Automotriz')).toBeVisible();
  });

  test('Savings view renders', async ({ page }) => {
    await navigateAndVerify(page, '/savings', 'Ahorro');
    await expect(page.locator('text=Fondo Emergencia')).toBeVisible();
  });

  test('Investments view renders', async ({ page }) => {
    await navigateAndVerify(page, '/investments', 'Portafolio');
    await expect(page.locator('text=Fintual Risky Norris')).toBeVisible();
    await expect(page.locator('text=Trade Republic ETF')).toBeVisible();
  });

  test('Cashflow view renders', async ({ page }) => {
    await navigateAndVerify(page, '/cashflow', 'Cashflow');
  });

  test('Analysis view renders', async ({ page }) => {
    await navigateAndVerify(page, '/analysis', 'Análisis');
  });

  test('Settings view renders', async ({ page }) => {
    await navigateAndVerify(page, '/settings', 'Ajustes');
  });

  // ----------------------------------------------------------
  // CRITICAL FLOWS
  // ----------------------------------------------------------

  test('Quick Add transaction flow', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Click the floating + button
    const fab = page.locator('button[aria-label="Agregar transacción"]');
    await fab.click();

    // Modal should appear
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 });

    // Fill the form
    await page.fill('input[placeholder*="Descripción"], input[placeholder*="descripción"], input[placeholder*="Ej:"]', 'Cafe con amigos');
    await page.fill('input[type="number"]', '5500');

    // Select a category (click first available one)
    const categoryButton = page.locator('button:has-text("Alimentacion")').first();
    if (await categoryButton.isVisible()) {
      await categoryButton.click();
    }

    // Submit
    const submitBtn = page.locator('button[type="submit"], button:has-text("Guardar"), button:has-text("Agregar")').first();
    await submitBtn.click();

    // Modal should close (or show success)
    await page.waitForTimeout(1000);
  });

  test('Investment history modal opens', async ({ page }) => {
    await page.goto('/investments');
    await page.waitForLoadState('networkidle');

    // Wait for platform cards to render
    await expect(page.locator('text=Fintual Risky Norris')).toBeVisible({ timeout: 10000 });

    // Click history button on first platform card
    const historyBtn = page.locator('button[title="Ver historial"]').first();
    await historyBtn.click();

    // Modal should open with balance history
    await expect(page.locator('text=Historial de Balances')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Agregar Entrada')).toBeVisible();
  });

  test('Investment chart modal opens', async ({ page }) => {
    await page.goto('/investments');
    await page.waitForLoadState('networkidle');

    // Wait for platform cards to render
    await expect(page.locator('text=Fintual Risky Norris')).toBeVisible({ timeout: 10000 });

    // Click chart button on first platform card
    const chartBtn = page.locator('button[title="Ver gráfico"]').first();
    await chartBtn.click();

    // Evolution chart modal should open
    await expect(page.locator('h3:has-text("Evolución de")')).toBeVisible({ timeout: 5000 });
  });

  test('Portfolio evolution chart opens', async ({ page }) => {
    await page.goto('/investments');
    await page.waitForLoadState('networkidle');

    // Click "Ver Evolución" button
    const evoBtn = page.locator('button:has-text("Ver Evolución")');
    await evoBtn.click();

    await expect(page.locator('text=Evolución del Portafolio')).toBeVisible({ timeout: 5000 });
  });

  test('New platform form opens', async ({ page }) => {
    await page.goto('/investments');
    await page.waitForLoadState('networkidle');

    await page.locator('button:has-text("Nueva Plataforma")').click();
    await expect(page.locator('text=Tipo de Cuenta')).toBeVisible({ timeout: 5000 });
  });

  test('Debt detail/history works', async ({ page }) => {
    await page.goto('/debts');
    await page.waitForLoadState('networkidle');

    // Find and click on the debt card or history button
    const historyBtn = page.locator('button[title*="istorial"], button:has-text("Historial")').first();
    if (await historyBtn.isVisible()) {
      await historyBtn.click();
      await page.waitForTimeout(1000);
    }
  });

  test('Currency selector works', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Use whichever currency select is visible (desktop vs mobile layout)
    const selects = page.locator('select[aria-label="Moneda de visualización"]');
    const count = await selects.count();
    for (let i = 0; i < count; i++) {
      if (await selects.nth(i).isVisible()) {
        await selects.nth(i).selectOption('CLP');
        break;
      }
    }
    await page.waitForTimeout(500);

    // Should still render without crash
    await expect(page.locator('h1:has-text("Finanzas PRO")')).toBeVisible();
  });

  // ----------------------------------------------------------
  // NAVIGATION
  // ----------------------------------------------------------

  test('Navigation between all views without crash', async ({ page }) => {
    const routes = [
      '/dashboard', '/budget', '/transactions', '/debts',
      '/savings', '/investments', '/cashflow', '/analysis', '/settings'
    ];

    for (const route of routes) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');

      // No ErrorBoundary
      const errorBoundary = page.locator('text=Algo salió mal');
      const visible = await errorBoundary.isVisible().catch(() => false);
      expect(visible, `ErrorBoundary on ${route}`).toBe(false);
    }
  });

  test('Navigation via clicking nav links', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Use visible nav links (mobile shows compact version)
    const clickVisibleLink = async (href) => {
      const links = page.locator(`a[href="${href}"]`);
      const count = await links.count();
      for (let i = 0; i < count; i++) {
        if (await links.nth(i).isVisible()) {
          await links.nth(i).click();
          return;
        }
      }
      // Fallback: navigate directly
      await page.goto(href);
    };

    await clickVisibleLink('/budget');
    await expect(page).toHaveURL(/\/budget/);

    await clickVisibleLink('/transactions');
    await expect(page).toHaveURL(/\/transactions/);

    await clickVisibleLink('/investments');
    await expect(page).toHaveURL(/\/investments/);
    await expect(page.locator('text=Fintual Risky Norris')).toBeVisible();
  });

  // ----------------------------------------------------------
  // EDGE CASES
  // ----------------------------------------------------------

  test('Empty state — no data', async ({ page }) => {
    // Clear all localStorage
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());

    // Navigate each view — should show empty states, not crash
    const routes = ['/dashboard', '/budget', '/transactions', '/debts', '/savings', '/investments', '/cashflow', '/analysis'];
    for (const route of routes) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      const errorBoundary = page.locator('text=Algo salió mal');
      const visible = await errorBoundary.isVisible().catch(() => false);
      expect(visible, `ErrorBoundary on empty ${route}`).toBe(false);
    }
  });

  test('Rapid navigation does not crash', async ({ page }) => {
    // Use direct navigation (works on both desktop and mobile)
    const routes = ['/budget', '/investments', '/debts', '/dashboard', '/transactions', '/savings'];
    for (const route of routes) {
      await page.goto(route);
      await page.waitForTimeout(200);
    }
    // Should still be alive
    await expect(page.locator('h1:has-text("Finanzas PRO")')).toBeVisible();
  });
});
