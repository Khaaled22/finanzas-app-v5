import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AnalysisEngine } from '../../domain/engines/AnalysisEngine';
import { ExcelExporter } from '../../modules/export/ExcelExporter';

export default function ExportExcelButton() {
  const [isExporting, setIsExporting] = useState(false);
  const { 
    categories, 
    transactions, 
    debts, 
    savingsGoals, 
    investments,
    displayCurrency,
    ynabConfig
  } = useApp();

  const handleExport = () => {
    setIsExporting(true);
    
    try {
      // Preparar datos
      const budgeted = categories.reduce((sum, cat) => sum + cat.budget, 0);
      const spent = categories.reduce((sum, cat) => sum + cat.spent, 0);
      const available = budgeted - spent;
      
      const totalDebt = debts.reduce((sum, d) => sum + d.currentBalance, 0);
      const totalSavings = savingsGoals.reduce((sum, g) => sum + g.currentAmount, 0);
      const totalInvestments = investments.reduce((sum, inv) => sum + (inv.quantity * inv.currentPrice), 0);
      
      const netWorth = available + totalSavings + totalInvestments - totalDebt;
      
      const financialHealth = AnalysisEngine.calculateFinancialHealth({
        totals: { budgeted, spent, available, totalDebt, totalSavings, totalInvestments },
        debts,
        savingsGoals,
        investments,
        categories
      });
      
      const data = {
        categories,
        transactions,
        debts,
        savingsGoals,
        investments,
        totals: { budgeted, spent, available },
        totalDebt,
        totalSavings,
        totalInvestments,
        netWorth,
        financialHealth,
        displayCurrency
      };
      
      // Generar Excel
      ExcelExporter.generateReport(data);
      
      // Notificación de éxito
      alert('✅ Reporte Excel generado exitosamente');
    } catch (error) {
      console.error('Error generando Excel:', error);
      alert('❌ Error al generar el Excel. Revisa la consola para más detalles.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
        isExporting
          ? 'bg-gray-400 cursor-not-allowed'
          : 'bg-green-500 hover:bg-green-600 text-white'
      }`}
    >
      <i className={`fas ${isExporting ? 'fa-spinner fa-spin' : 'fa-file-excel'}`}></i>
      <span className="hidden sm:inline">{isExporting ? 'Generando...' : 'Excel'}</span>
    </button>
  );
}