// src/modules/storage/migrations.js
// ✅ M20: Migración para inicializar monthlyBudgets del mes actual

/**
 * Migra datos de v4 a v5
 * Cambia las claves de localStorage de _v4 a _v5
 */
export function migrateFromV4ToV5() {
  const v4Keys = [
    'categories_v5',
    'transactions_v4',
    'debts_v4',
    'savingsGoals_v4',
    'investments_v4'
  ];
  
  let migrated = false;
  
  v4Keys.forEach(oldKey => {
    const data = localStorage.getItem(oldKey);
    if (data) {
      const newKey = oldKey.replace('_v4', '_v5');
      localStorage.setItem(newKey, data);
      console.log(`✅ Migrado: ${oldKey} → ${newKey}`);
      migrated = true;
    }
  });
  
  if (migrated) {
    localStorage.setItem('migration_v4_v5_done', 'true');
    console.log('✅ Migración v4→v5 completada');
  }
}

/**
 * ✅ M20: Migración para inicializar monthlyBudgets del mes actual
 * Solo se ejecuta si NO existe monthlyBudgets o está vacío
 */
export function migrateToMonthlyBudgets() {
  try {
    // Verificar si ya se ejecutó esta migración
    if (localStorage.getItem('migration_monthly_budgets_done') === 'true') {
      console.log('ℹ️ Migración monthlyBudgets ya ejecutada previamente');
      return;
    }

    // Cargar datos existentes
    const categories = JSON.parse(localStorage.getItem('categories_v5') || '[]');
    const monthlyBudgets = JSON.parse(localStorage.getItem('monthlyBudgets_v5') || '{}');
    
    // Obtener mes actual
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    // Si ya existe presupuesto para el mes actual, no hacer nada
    if (monthlyBudgets[currentMonth] && Object.keys(monthlyBudgets[currentMonth]).length > 0) {
      console.log(`ℹ️ Ya existen presupuestos para ${currentMonth}`);
      localStorage.setItem('migration_monthly_budgets_done', 'true');
      return;
    }
    
    // Inicializar presupuestos del mes actual desde category.budget
    const newMonthBudgets = {};
    let initializedCount = 0;
    
    categories.forEach(cat => {
      newMonthBudgets[cat.id] = {
        budget: cat.budget || 0,
        spent: 0
      };
      initializedCount++;
    });
    
    // Guardar
    monthlyBudgets[currentMonth] = newMonthBudgets;
    localStorage.setItem('monthlyBudgets_v5', JSON.stringify(monthlyBudgets));
    localStorage.setItem('migration_monthly_budgets_done', 'true');
    
    console.log(`✅ M20: Inicializadas ${initializedCount} categorías para ${currentMonth}`);
    console.log('   Presupuestos copiados desde category.budget (plantilla base)');
    
  } catch (error) {
    console.error('❌ Error en migración monthlyBudgets:', error);
  }
}

/**
 * Verifica si ya se ejecutó la migración v4→v5
 */
export function isMigrationDone() {
  return localStorage.getItem('migration_v4_v5_done') === 'true';
}

/**
 * Verifica si ya se ejecutó la migración monthlyBudgets
 */
export function isMonthlyBudgetsMigrationDone() {
  return localStorage.getItem('migration_monthly_budgets_done') === 'true';
}

/**
 * ✅ M20: Ejecuta todas las migraciones necesarias
 */
export function runMigrations() {
  console.log('🔄 Verificando migraciones necesarias...');
  
  // Migración v4→v5
  if (!isMigrationDone()) {
    console.log('🔄 Ejecutando migración v4→v5...');
    migrateFromV4ToV5();
  }
  
  // ✅ M20: Migración monthlyBudgets
  if (!isMonthlyBudgetsMigrationDone()) {
    console.log('🔄 Ejecutando migración M20: monthlyBudgets...');
    migrateToMonthlyBudgets();
  }
  
  console.log('✅ Todas las migraciones completadas');
}

/**
 * ✅ M20: Función para resetear migración (solo para desarrollo/testing)
 * ADVERTENCIA: Esto borrará los presupuestos mensuales existentes
 */
export function resetMonthlyBudgetsMigration() {
  if (confirm('⚠️ ADVERTENCIA: Esto borrará todos los presupuestos mensuales y reiniciará la migración. ¿Continuar?')) {
    localStorage.removeItem('migration_monthly_budgets_done');
    localStorage.removeItem('monthlyBudgets_v5');
    console.log('🔄 Migración monthlyBudgets reseteada. Recarga la página para ejecutar de nuevo.');
    return true;
  }
  return false;
}