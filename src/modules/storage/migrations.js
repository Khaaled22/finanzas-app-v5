/**
 * Sistema de migraciones de datos entre versiones
 */

/**
 * Migra datos de v4 a v5
 * Cambia las claves de localStorage de _v4 a _v5
 */
export function migrateFromV4ToV5() {
  const v4Keys = [
    'categories_v4',
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
 * Verifica si ya se ejecutó la migración
 */
export function isMigrationDone() {
  return localStorage.getItem('migration_v4_v5_done') === 'true';
}

/**
 * Ejecuta todas las migraciones necesarias
 */
export function runMigrations() {
  if (!isMigrationDone()) {
    console.log('🔄 Ejecutando migración v4→v5...');
    migrateFromV4ToV5();
  }
}
