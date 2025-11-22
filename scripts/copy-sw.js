// scripts/copy-sw.js
// Script para copiar service-worker.js a dist/ después del build
import { copyFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const source = join(__dirname, '../public/service-worker.js');
const dest = join(__dirname, '../dist/service-worker.js');

try {
  // Verificar que existe el archivo fuente
  if (!existsSync(source)) {
    console.log('⚠️  Service Worker no encontrado en public/, saltando copia...');
    process.exit(0);
  }

  // Verificar que existe la carpeta dist/
  const distDir = join(__dirname, '../dist');
  if (!existsSync(distDir)) {
    mkdirSync(distDir, { recursive: true });
  }

  // Copiar el archivo
  copyFileSync(source, dest);
  console.log('✅ Service Worker copiado exitosamente a dist/');
} catch (error) {
  console.error('❌ Error copiando Service Worker:', error.message);
  // No fallar el build por esto
  process.exit(0);
}