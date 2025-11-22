import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AnalysisEngine } from '../../domain/engines/AnalysisEngine';
import { PDFExporter } from '../../modules/export/PDFExporter';

export default function ExportPDFButton() {
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

  const handleExport = async () => {
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
      
      const insights = AnalysisEngine.generateInsights({
        totals: { budgeted, spent, available, totalDebt },
        debts,
        savingsGoals,
        investments,
        categories,
        transactions
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
        insights,
        displayCurrency
      };
      
      // Generar PDF
      const exporter = new PDFExporter();
      await exporter.generateReport(data);
      
      // Notificación de éxito
      alert('✅ Reporte PDF generado exitosamente');
    } catch (error) {
      console.error('Error generando PDF:', error);
      alert('❌ Error al generar el PDF. Revisa la consola para más detalles.');
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
          : 'bg-red-600 hover:bg-red-700 text-white'
      }`}
    >
      <i className={`fas ${isExporting ? 'fa-spinner fa-spin' : 'fa-file-pdf'}`}></i>
      <span className="hidden sm:inline">{isExporting ? 'Generando...' : 'PDF'}</span>
    </button>
  );
}