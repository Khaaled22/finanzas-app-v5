import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export class PDFExporter {
  constructor() {
    this.pdf = null;
    this.pageWidth = 210; // A4 width in mm
    this.pageHeight = 297; // A4 height in mm
    this.margin = 15;
    this.currentY = this.margin;
  }

  async generateReport(data) {
    this.pdf = new jsPDF('p', 'mm', 'a4');
    
    // Página 1: Portada
    await this.createCoverPage(data);
    
    // Página 2: Resumen Ejecutivo
    this.pdf.addPage();
    this.currentY = this.margin;
    this.createExecutiveSummary(data);
    
    // Página 3: Gráficos
    this.pdf.addPage();
    this.currentY = this.margin;
    await this.captureCharts();
    
    // Página 4: Presupuesto
    this.pdf.addPage();
    this.currentY = this.margin;
    this.createBudgetTable(data);
    
    // Página 5: Transacciones
    this.pdf.addPage();
    this.currentY = this.margin;
    this.createTransactionsTable(data);
    
    // Página 6: Deudas y Ahorros
    this.pdf.addPage();
    this.currentY = this.margin;
    this.createDebtsAndSavingsTables(data);
    
    // Página 7: Inversiones
    this.pdf.addPage();
    this.currentY = this.margin;
    this.createInvestmentsTable(data);
    
    // Guardar
    const filename = `finanzas-reporte-${new Date().toISOString().split('T')[0]}.pdf`;
    this.pdf.save(filename);
  }

  async createCoverPage(data) {
    // Fondo degradado (simulado con rectángulos)
    this.pdf.setFillColor(99, 102, 241); // Indigo
    this.pdf.rect(0, 0, this.pageWidth, 100, 'F');
    
    // Título
    this.pdf.setTextColor(255, 255, 255);
    this.pdf.setFontSize(32);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Reporte Financiero', this.pageWidth / 2, 40, { align: 'center' });
    
    // Subtítulo
    this.pdf.setFontSize(16);
    this.pdf.setFont('helvetica', 'normal');
    const today = new Date().toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    this.pdf.text(today, this.pageWidth / 2, 55, { align: 'center' });
    
    // Métricas principales (cuadros blancos)
    this.pdf.setTextColor(0, 0, 0);
    const metrics = [
      { label: 'Patrimonio Neto', value: `€${data.netWorth.toFixed(0)}`, color: data.netWorth >= 0 ? [34, 197, 94] : [239, 68, 68] },
      { label: 'Salud Financiera', value: `${data.financialHealth}/100`, color: [139, 92, 246] },
      { label: 'Presupuesto', value: `€${data.totals.budgeted.toFixed(0)}`, color: [59, 130, 246] },
      { label: 'Disponible', value: `€${data.totals.available.toFixed(0)}`, color: [34, 197, 94] }
    ];
    
    let startY = 120;
    metrics.forEach((metric, index) => {
      const x = this.margin + (index % 2) * 90;
      const y = startY + Math.floor(index / 2) * 50;
      
      // Rectángulo blanco con sombra
      this.pdf.setFillColor(255, 255, 255);
      this.pdf.roundedRect(x, y, 80, 35, 3, 3, 'F');
      
      // Label
      this.pdf.setFontSize(10);
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.setTextColor(107, 114, 128);
      this.pdf.text(metric.label, x + 5, y + 10);
      
      // Value
      this.pdf.setFontSize(18);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.setTextColor(...metric.color);
      this.pdf.text(metric.value, x + 5, y + 25);
    });
    
    // Footer
    this.pdf.setFontSize(8);
    this.pdf.setFont('helvetica', 'italic');
    this.pdf.setTextColor(107, 114, 128);
    this.pdf.text('Generado por Finanzas PRO v5.0', this.pageWidth / 2, this.pageHeight - 10, { align: 'center' });
  }

  createExecutiveSummary(data) {
    // Título
    this.pdf.setFontSize(20);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setTextColor(0, 0, 0);
    this.pdf.text('Resumen Ejecutivo', this.margin, this.currentY);
    this.currentY += 15;
    
    // Línea divisoria
    this.pdf.setDrawColor(229, 231, 235);
    this.pdf.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    this.currentY += 10;
    
    // Resumen de Presupuesto
    this.pdf.setFontSize(14);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('📊 Presupuesto', this.margin, this.currentY);
    this.currentY += 8;
    
    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'normal');
    const budgetText = [
      `Presupuestado: €${data.totals.budgeted.toFixed(2)}`,
      `Gastado: €${data.totals.spent.toFixed(2)}`,
      `Disponible: €${data.totals.available.toFixed(2)}`,
      `Tasa de uso: ${((data.totals.spent / data.totals.budgeted) * 100).toFixed(1)}%`
    ];
    budgetText.forEach(line => {
      this.pdf.text(line, this.margin + 5, this.currentY);
      this.currentY += 6;
    });
    this.currentY += 5;
    
    // Resumen de Deudas
    this.pdf.setFontSize(14);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('💳 Deudas', this.margin, this.currentY);
    this.currentY += 8;
    
    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'normal');
    const debtText = [
      `Deuda Total: €${data.totalDebt.toFixed(2)}`,
      `Pago Mensual: €${data.debts.reduce((sum, d) => sum + d.monthlyPayment, 0).toFixed(2)}`,
      `Número de deudas: ${data.debts.length}`
    ];
    debtText.forEach(line => {
      this.pdf.text(line, this.margin + 5, this.currentY);
      this.currentY += 6;
    });
    this.currentY += 5;
    
    // Resumen de Ahorros
    this.pdf.setFontSize(14);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('🏦 Ahorros', this.margin, this.currentY);
    this.currentY += 8;
    
    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'normal');
    const savingsText = [
      `Total Ahorrado: €${data.totalSavings.toFixed(2)}`,
      `Objetivos activos: ${data.savingsGoals.length}`,
      `Progreso promedio: ${data.savingsGoals.length > 0 ? ((data.savingsGoals.reduce((sum, g) => sum + (g.currentAmount / g.targetAmount), 0) / data.savingsGoals.length) * 100).toFixed(1) : 0}%`
    ];
    savingsText.forEach(line => {
      this.pdf.text(line, this.margin + 5, this.currentY);
      this.currentY += 6;
    });
    this.currentY += 5;
    
    // Resumen de Inversiones
    this.pdf.setFontSize(14);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('📈 Inversiones', this.margin, this.currentY);
    this.currentY += 8;
    
    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'normal');
    const portfolioValue = data.investments.reduce((sum, inv) => sum + (inv.quantity * inv.currentPrice), 0);
    const portfolioCost = data.investments.reduce((sum, inv) => sum + (inv.quantity * inv.purchasePrice), 0);
    const roi = portfolioCost > 0 ? ((portfolioValue - portfolioCost) / portfolioCost) * 100 : 0;
    const invText = [
      `Valor del Portafolio: €${portfolioValue.toFixed(2)}`,
      `Inversión Total: €${portfolioCost.toFixed(2)}`,
      `ROI: ${roi >= 0 ? '+' : ''}${roi.toFixed(2)}%`
    ];
    invText.forEach(line => {
      this.pdf.text(line, this.margin + 5, this.currentY);
      this.currentY += 6;
    });
    this.currentY += 10;
    
    // Insights
    if (data.insights && data.insights.length > 0) {
      this.pdf.setFontSize(14);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text('💡 Insights Principales', this.margin, this.currentY);
      this.currentY += 8;
      
      this.pdf.setFontSize(9);
      this.pdf.setFont('helvetica', 'normal');
      data.insights.slice(0, 3).forEach((insight, index) => {
        const icon = insight.type === 'success' ? '✅' : insight.type === 'warning' ? '⚠️' : '❌';
        this.pdf.text(`${icon} ${insight.title}`, this.margin + 5, this.currentY);
        this.currentY += 5;
        const wrappedMessage = this.pdf.splitTextToSize(insight.message, this.pageWidth - this.margin * 2 - 10);
        this.pdf.text(wrappedMessage, this.margin + 8, this.currentY);
        this.currentY += wrappedMessage.length * 4 + 3;
      });
    }
  }

  async captureCharts() {
    // Título
    this.pdf.setFontSize(20);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setTextColor(0, 0, 0);
    this.pdf.text('Visualizaciones', this.margin, this.currentY);
    this.currentY += 15;
    
    // Capturar gráficos del DOM
    const chartsContainer = document.querySelectorAll('.chart-container canvas');
    
    for (let i = 0; i < Math.min(chartsContainer.length, 3); i++) {
      const canvas = chartsContainer[i];
      
      try {
        // Capturar el canvas directamente (ya es una imagen)
        const imgData = canvas.toDataURL('image/png');
        
        // Calcular dimensiones manteniendo aspect ratio
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const maxWidth = this.pageWidth - this.margin * 2;
        const maxHeight = 80;
        
        let imgWidth = maxWidth;
        let imgHeight = (canvasHeight * maxWidth) / canvasWidth;
        
        if (imgHeight > maxHeight) {
          imgHeight = maxHeight;
          imgWidth = (canvasWidth * maxHeight) / canvasHeight;
        }
        
        // Centrar horizontalmente
        const x = this.margin + (maxWidth - imgWidth) / 2;
        
        // Agregar imagen
        this.pdf.addImage(imgData, 'PNG', x, this.currentY, imgWidth, imgHeight);
        this.currentY += imgHeight + 10;
        
        // Si no cabe más, nueva página
        if (this.currentY > this.pageHeight - 50 && i < chartsContainer.length - 1) {
          this.pdf.addPage();
          this.currentY = this.margin;
        }
      } catch (error) {
        console.error('Error capturando gráfico:', error);
      }
    }
  }

  createBudgetTable(data) {
    // Título
    this.pdf.setFontSize(20);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Presupuesto Detallado', this.margin, this.currentY);
    this.currentY += 12;
    
    // Encabezados de tabla
    const headers = ['Categoría', 'Presup.', 'Gastado', 'Dispon.', '%'];
    const colWidths = [70, 30, 30, 30, 20];
    
    // Fondo de encabezado
    this.pdf.setFillColor(59, 130, 246);
    this.pdf.rect(this.margin, this.currentY, this.pageWidth - this.margin * 2, 8, 'F');
    
    // Texto de encabezado
    this.pdf.setFontSize(9);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setTextColor(255, 255, 255);
    let x = this.margin + 2;
    headers.forEach((header, i) => {
      this.pdf.text(header, x, this.currentY + 6);
      x += colWidths[i];
    });
    this.currentY += 10;
    
    // Agrupar por categoría
    const grouped = {};
    data.categories.forEach(cat => {
      if (!grouped[cat.group]) grouped[cat.group] = [];
      grouped[cat.group].push(cat);
    });
    
    // Filas
    this.pdf.setFontSize(8);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setTextColor(0, 0, 0);
    
    Object.entries(grouped).forEach(([group, cats]) => {
      // Grupo
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.setFillColor(243, 244, 246);
      this.pdf.rect(this.margin, this.currentY, this.pageWidth - this.margin * 2, 6, 'F');
      this.pdf.text(group, this.margin + 2, this.currentY + 4);
      this.currentY += 7;
      
      // Categorías del grupo
      this.pdf.setFont('helvetica', 'normal');
      cats.forEach((cat, index) => {
        const percentage = cat.budget > 0 ? ((cat.spent / cat.budget) * 100).toFixed(0) : '0';
        const available = cat.budget - cat.spent;
        
        // Fondo alternado
        if (index % 2 === 1) {
          this.pdf.setFillColor(249, 250, 251);
          this.pdf.rect(this.margin, this.currentY - 1, this.pageWidth - this.margin * 2, 5, 'F');
        }
        
        x = this.margin + 2;
        this.pdf.text(cat.name, x, this.currentY + 3);
        x += colWidths[0];
        this.pdf.text(`€${cat.budget.toFixed(0)}`, x, this.currentY + 3);
        x += colWidths[1];
        this.pdf.text(`€${cat.spent.toFixed(0)}`, x, this.currentY + 3);
        x += colWidths[2];
        this.pdf.text(`€${available.toFixed(0)}`, x, this.currentY + 3);
        x += colWidths[3];
        this.pdf.text(`${percentage}%`, x, this.currentY + 3);
        
        this.currentY += 5;
        
        // Nueva página si es necesario
        if (this.currentY > this.pageHeight - 30) {
          this.pdf.addPage();
          this.currentY = this.margin;
        }
      });
      
      this.currentY += 2;
    });
  }

  createTransactionsTable(data) {
    // Título
    this.pdf.setFontSize(20);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Transacciones Recientes', this.margin, this.currentY);
    this.currentY += 10;
    
    this.pdf.setFontSize(9);
    this.pdf.setFont('helvetica', 'italic');
    this.pdf.text(`(Mostrando últimas 50 de ${data.transactions.length} totales)`, this.margin, this.currentY);
    this.currentY += 10;
    
    // Encabezados
    const headers = ['Fecha', 'Descripción', 'Categoría', 'Monto'];
    const colWidths = [25, 80, 40, 30];
    
    this.pdf.setFillColor(59, 130, 246);
    this.pdf.rect(this.margin, this.currentY, this.pageWidth - this.margin * 2, 7, 'F');
    
    this.pdf.setFontSize(8);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setTextColor(255, 255, 255);
    let x = this.margin + 2;
    headers.forEach((header, i) => {
      this.pdf.text(header, x, this.currentY + 5);
      x += colWidths[i];
    });
    this.currentY += 9;
    
    // Filas
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setTextColor(0, 0, 0);
    
    data.transactions.slice(0, 50).forEach((trans, index) => {
      const cat = data.categories.find(c => c.id === trans.categoryId);
      
      if (index % 2 === 1) {
        this.pdf.setFillColor(249, 250, 251);
        this.pdf.rect(this.margin, this.currentY - 1, this.pageWidth - this.margin * 2, 5, 'F');
      }
      
      x = this.margin + 2;
      this.pdf.text(new Date(trans.date).toLocaleDateString('es-ES'), x, this.currentY + 3);
      x += colWidths[0];
      
      const desc = trans.description.length > 35 ? trans.description.substring(0, 32) + '...' : trans.description;
      this.pdf.text(desc, x, this.currentY + 3);
      x += colWidths[1];
      
      const catName = cat?.name || 'N/A';
      this.pdf.text(catName.length > 15 ? catName.substring(0, 12) + '...' : catName, x, this.currentY + 3);
      x += colWidths[2];
      
      this.pdf.setTextColor(239, 68, 68);
      this.pdf.text(`-€${trans.amount.toFixed(2)}`, x, this.currentY + 3);
      this.pdf.setTextColor(0, 0, 0);
      
      this.currentY += 5;
      
      if (this.currentY > this.pageHeight - 30) {
        this.pdf.addPage();
        this.currentY = this.margin;
      }
    });
  }

  createDebtsAndSavingsTables(data) {
    // Deudas
    this.pdf.setFontSize(20);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Deudas', this.margin, this.currentY);
    this.currentY += 12;
    
    if (data.debts.length === 0) {
      this.pdf.setFontSize(10);
      this.pdf.setFont('helvetica', 'italic');
      this.pdf.text('✅ No hay deudas registradas', this.margin, this.currentY);
      this.currentY += 10;
    } else {
      const headers = ['Nombre', 'Saldo', 'Cuota', 'Tasa', 'Pagos'];
      const colWidths = [60, 30, 30, 25, 20];
      
      this.pdf.setFillColor(239, 68, 68);
      this.pdf.rect(this.margin, this.currentY, this.pageWidth - this.margin * 2, 7, 'F');
      
      this.pdf.setFontSize(8);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.setTextColor(255, 255, 255);
      let x = this.margin + 2;
      headers.forEach((header, i) => {
        this.pdf.text(header, x, this.currentY + 5);
        x += colWidths[i];
      });
      this.currentY += 9;
      
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.setTextColor(0, 0, 0);
      
      data.debts.forEach((debt, index) => {
        if (index % 2 === 1) {
          this.pdf.setFillColor(249, 250, 251);
          this.pdf.rect(this.margin, this.currentY - 1, this.pageWidth - this.margin * 2, 5, 'F');
        }
        
        x = this.margin + 2;
        this.pdf.text(debt.name, x, this.currentY + 3);
        x += colWidths[0];
        this.pdf.text(`€${debt.currentBalance.toFixed(0)}`, x, this.currentY + 3);
        x += colWidths[1];
        this.pdf.text(`€${debt.monthlyPayment.toFixed(0)}`, x, this.currentY + 3);
        x += colWidths[2];
        this.pdf.text(`${debt.interestRate}%`, x, this.currentY + 3);
        x += colWidths[3];
        this.pdf.text(`${debt.paymentsMade}`, x, this.currentY + 3);
        
        this.currentY += 5;
      });
      
      this.currentY += 10;
    }
    
    // Ahorros
    this.pdf.setFontSize(20);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Objetivos de Ahorro', this.margin, this.currentY);
    this.currentY += 12;
    
    if (data.savingsGoals.length === 0) {
      this.pdf.setFontSize(10);
      this.pdf.setFont('helvetica', 'italic');
      this.pdf.text('ℹ️ No hay objetivos de ahorro', this.margin, this.currentY);
      this.currentY += 10;
    } else {
      const headers = ['Nombre', 'Meta', 'Actual', 'Falta', 'Progreso'];
      const colWidths = [60, 30, 30, 30, 25];
      
      this.pdf.setFillColor(34, 197, 94);
      this.pdf.rect(this.margin, this.currentY, this.pageWidth - this.margin * 2, 7, 'F');
      
      this.pdf.setFontSize(8);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.setTextColor(255, 255, 255);
      let x = this.margin + 2;
      headers.forEach((header, i) => {
        this.pdf.text(header, x, this.currentY + 5);
        x += colWidths[i];
      });
      this.currentY += 9;
      
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.setTextColor(0, 0, 0);
      
      data.savingsGoals.forEach((goal, index) => {
        if (index % 2 === 1) {
          this.pdf.setFillColor(249, 250, 251);
          this.pdf.rect(this.margin, this.currentY - 1, this.pageWidth - this.margin * 2, 5, 'F');
        }
        
        const remaining = goal.targetAmount - goal.currentAmount;
        const progress = (goal.currentAmount / goal.targetAmount) * 100;
        
        x = this.margin + 2;
        this.pdf.text(goal.name, x, this.currentY + 3);
        x += colWidths[0];
        this.pdf.text(`€${goal.targetAmount.toFixed(0)}`, x, this.currentY + 3);
        x += colWidths[1];
        this.pdf.text(`€${goal.currentAmount.toFixed(0)}`, x, this.currentY + 3);
        x += colWidths[2];
        this.pdf.text(`€${remaining.toFixed(0)}`, x, this.currentY + 3);
        x += colWidths[3];
        this.pdf.text(`${progress.toFixed(0)}%`, x, this.currentY + 3);
        
        this.currentY += 5;
      });
    }
  }

  createInvestmentsTable(data) {
    // Título
    this.pdf.setFontSize(20);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Portafolio de Inversiones', this.margin, this.currentY);
    this.currentY += 12;
    
    if (data.investments.length === 0) {
      this.pdf.setFontSize(10);
      this.pdf.setFont('helvetica', 'italic');
      this.pdf.text('ℹ️ No hay inversiones registradas', this.margin, this.currentY);
      return;
    }
    
    // Encabezados
    const headers = ['Símbolo', 'Nombre', 'Cant.', 'P. Compra', 'P. Actual', 'Valor', 'ROI'];
    const colWidths = [20, 45, 15, 25, 25, 25, 20];
    
    this.pdf.setFillColor(139, 92, 246);
    this.pdf.rect(this.margin, this.currentY, this.pageWidth - this.margin * 2, 7, 'F');
    
    this.pdf.setFontSize(8);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setTextColor(255, 255, 255);
    let x = this.margin + 2;
    headers.forEach((header, i) => {
      this.pdf.text(header, x, this.currentY + 5);
      x += colWidths[i];
    });
    this.currentY += 9;
    
    // Filas
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setTextColor(0, 0, 0);
    
    data.investments.forEach((inv, index) => {
      if (index % 2 === 1) {
        this.pdf.setFillColor(249, 250, 251);
        this.pdf.rect(this.margin, this.currentY - 1, this.pageWidth - this.margin * 2, 5, 'F');
      }
      
      const currentValue = inv.quantity * inv.currentPrice;
      const purchaseValue = inv.quantity * inv.purchasePrice;
      const roi = purchaseValue > 0 ? ((currentValue - purchaseValue) / purchaseValue) * 100 : 0;
      
      x = this.margin + 2;
      this.pdf.text(inv.symbol, x, this.currentY + 3);
      x += colWidths[0];
      
      const name = inv.name.length > 20 ? inv.name.substring(0, 17) + '...' : inv.name;
      this.pdf.text(name, x, this.currentY + 3);
      x += colWidths[1];
      
      this.pdf.text(inv.quantity.toString(), x, this.currentY + 3);
      x += colWidths[2];
      this.pdf.text(`€${inv.purchasePrice.toFixed(2)}`, x, this.currentY + 3);
      x += colWidths[3];
      this.pdf.text(`€${inv.currentPrice.toFixed(2)}`, x, this.currentY + 3);
      x += colWidths[4];
      this.pdf.text(`€${currentValue.toFixed(0)}`, x, this.currentY + 3);
      x += colWidths[5];
      
      this.pdf.setTextColor(roi >= 0 ? 34 : 239, roi >= 0 ? 197 : 68, roi >= 0 ? 94 : 68);
      this.pdf.text(`${roi >= 0 ? '+' : ''}${roi.toFixed(1)}%`, x, this.currentY + 3);
      this.pdf.setTextColor(0, 0, 0);
      
      this.currentY += 5;
      
      if (this.currentY > this.pageHeight - 30) {
        this.pdf.addPage();
        this.currentY = this.margin;
      }
    });
  }
}