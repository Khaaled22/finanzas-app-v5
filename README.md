# 💰 Finanzas PRO v5.0 - Proyecto Base

## 🚀 Inicio Rápido

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Compilar para producción
npm run build
```

## 📋 Estado del Proyecto

Este es el **scaffolding inicial** del proyecto Finanzas App v5.0.

### ✅ Implementado (Fases 0-3)

- ✅ Configuración Vite + React + Tailwind
- ✅ Estructura de carpetas completa
- ✅ AppContext con estado global
- ✅ StorageManager con localStorage
- ✅ Migración automática v4 → v5
- ✅ Header y Navegación funcionales
- ✅ 8 vistas básicas (vacías)
- ✅ Datos iniciales de ejemplo

### ⏳ Pendiente (Mejoras M1-M9)

- ⏳ M1: Gráficos en Dashboard
- ⏳ M2: Vista Cashflow completa
- ⏳ M3: YNAB (dinero sin asignar)
- ⏳ M4: Transacciones mejoradas (filtros, fecha, comentarios)
- ⏳ M5: CRUD completo Deudas
- ⏳ M6: CRUD completo Ahorros
- ⏳ M7: Campo Plataforma en Inversiones
- ⏳ M8: Índice de Tranquilidad Financiera (Nauta)
- ⏳ M9: KPIs adicionales

## 📁 Estructura del Proyecto

```
src/
├── main.jsx              # Punto de entrada
├── App.jsx               # Componente raíz
├── components/           # Componentes reutilizables
│   ├── common/          # UI genéricos
│   ├── charts/          # Gráficos (vacío por ahora)
│   ├── layout/          # Header, Navigation
│   └── forms/           # Formularios (vacío por ahora)
├── views/               # Vistas principales
│   ├── Dashboard/
│   ├── Budget/
│   ├── Transactions/
│   ├── Debts/
│   ├── Savings/
│   ├── Investments/
│   ├── Cashflow/
│   └── Analysis/
├── domain/              # Lógica de negocio
│   ├── models/
│   ├── services/
│   └── engines/
├── modules/             # Funcionalidades transversales
│   ├── storage/         # StorageManager
│   ├── export/
│   └── validation/
├── context/             # React Context
│   └── AppContext.jsx
├── hooks/               # Custom Hooks
├── utils/               # Utilidades
│   ├── constants.js
│   └── formatters.js
├── config/              # Configuraciones
│   └── initialData.js
└── styles/              # Estilos globales
    └── index.css
```

## 🎯 Próximos Pasos

1. **Verificar instalación**: `npm install`
2. **Iniciar app**: `npm run dev`
3. **Explorar código**: Revisar AppContext, vistas, etc.
4. **Implementar mejoras**: Seguir plan del documento maestro (M1-M9)

## 📖 Documentación

Consulta el **DOCUMENTO-MAESTRO-FINANZAS-APP.md** para:
- Plan de implementación completo
- Arquitectura detallada
- Especificaciones de mejoras M1-M9
- Cronograma de desarrollo

## 💡 Notas Importantes

- Los datos se guardan en **localStorage** con claves `_v5`
- La migración de v4 a v5 es **automática** al cargar la app
- Las vistas actuales son **placeholders** - implementar funcionalidad según necesidad
- El proyecto está listo para agregar Chart.js, XLSX, etc. cuando sea necesario

---

**Versión:** 5.0.0 (Base)  
**Estado:** Scaffolding completo, listo para desarrollo de mejoras
