# Dominio - Lógica de Negocio

Esta carpeta contiene la lógica de negocio pura (sin dependencias de React).

## Subcarpetas:

### `/models`
Modelos de datos con validación:
- `Category.js`
- `Transaction.js`
- `Debt.js`
- `SavingsGoal.js`
- `Investment.js`

### `/services`
Servicios con lógica específica:
- `BudgetService.js` - Cálculos de presupuesto
- `DebtService.js` - Cálculos de deudas
- `InvestmentService.js` - Cálculos de inversiones
- `CashflowService.js` - Proyecciones de cashflow (M2)

### `/engines`
Motores complejos de análisis:
- `AnalysisEngine.js` - Motor de análisis financiero (M8, M9)
- `ProjectionEngine.js` - Motor de proyecciones
- `InsightsEngine.js` - Generación de insights

**Ventaja:** Código testeable sin necesidad de UI.
