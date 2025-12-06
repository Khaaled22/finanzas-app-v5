// src/views/Settings/components/ImportCategoriesModal.jsx
import React, { useState } from 'react';

export default function ImportCategoriesModal({ isOpen, onClose, onImport, existingCategories = [] }) {
  const [csvText, setCsvText] = useState('');
  const [parsedData, setParsedData] = useState([]);
  const [validationResults, setValidationResults] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState(1); // 1: input, 2: preview, 3: result

  // Parsear CSV
  const parseCSV = (text) => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) {
      return { success: false, error: 'El CSV debe tener al menos 2 líneas (encabezado + datos)' };
    }

    // Parsear encabezado
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, '').toLowerCase());
    
    // Verificar columnas requeridas
    const requiredColumns = ['nombre', 'grupo', 'presupuesto', 'moneda', 'icon', 'tipo'];
    const missingColumns = requiredColumns.filter(col => !headers.includes(col));
    
    if (missingColumns.length > 0) {
      return { 
        success: false, 
        error: `Faltan columnas requeridas: ${missingColumns.join(', ')}` 
      };
    }

    // Parsear filas de datos
    const data = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue; // Saltar líneas vacías

      // Parsear valores (maneja comillas)
      const values = [];
      let currentValue = '';
      let insideQuotes = false;

      for (let char of line) {
        if (char === '"') {
          insideQuotes = !insideQuotes;
        } else if (char === ',' && !insideQuotes) {
          values.push(currentValue.trim());
          currentValue = '';
        } else {
          currentValue += char;
        }
      }
      values.push(currentValue.trim()); // Último valor

      // Crear objeto categoría
      const category = {};
      headers.forEach((header, index) => {
        category[header] = values[index] ? values[index].replace(/"/g, '') : '';
      });

      data.push({
        rowNumber: i + 1,
        nombre: category.nombre || '',
        grupo: category.grupo || '',
        presupuesto: category.presupuesto || '0',
        moneda: category.moneda || 'EUR',
        icon: category.icon || '📁',
        tipo: category.tipo || 'expense'
      });
    }

    return { success: true, data };
  };

  // Validar datos parseados
  const validateData = (data) => {
    const validCurrencies = ['EUR', 'CLP', 'USD', 'UF'];
    const validTypes = ['income', 'expense', 'savings', 'investment'];
    const existingNames = existingCategories.map(cat => cat.name.toLowerCase());

    const results = data.map(item => {
      const errors = [];
      const warnings = [];

      // Validar nombre
      if (!item.nombre.trim()) {
        errors.push('Nombre vacío');
      } else if (existingNames.includes(item.nombre.toLowerCase())) {
        warnings.push('Ya existe (será omitida)');
      }

      // Validar grupo
      if (!item.grupo.trim()) {
        errors.push('Grupo vacío');
      }

      // Validar presupuesto
      const budget = parseFloat(item.presupuesto);
      if (isNaN(budget)) {
        errors.push('Presupuesto inválido');
      } else if (budget < 0) {
        warnings.push('Presupuesto negativo (se ajustará a 0)');
      }

      // Validar moneda
      if (!validCurrencies.includes(item.moneda.toUpperCase())) {
        warnings.push(`Moneda inválida (se usará EUR)`);
      }

      // Validar tipo
      if (!validTypes.includes(item.tipo.toLowerCase())) {
        warnings.push(`Tipo inválido (se usará expense)`);
      }

      // Validar icon
      if (!item.icon.trim()) {
        warnings.push('Sin ícono (se usará 📁)');
      }

      return {
        ...item,
        errors,
        warnings,
        status: errors.length > 0 ? 'error' : warnings.length > 0 ? 'warning' : 'ok'
      };
    });

    const summary = {
      total: results.length,
      valid: results.filter(r => r.status === 'ok').length,
      warnings: results.filter(r => r.status === 'warning').length,
      errors: results.filter(r => r.status === 'error').length
    };

    return { results, summary };
  };

  // Manejar input de CSV
  const handleCSVInput = () => {
    if (!csvText.trim()) {
      alert('Por favor, pega el contenido CSV');
      return;
    }

    setIsProcessing(true);

    try {
      const parseResult = parseCSV(csvText);
      
      if (!parseResult.success) {
        alert(parseResult.error);
        setIsProcessing(false);
        return;
      }

      setParsedData(parseResult.data);
      
      const validation = validateData(parseResult.data);
      setValidationResults(validation);
      
      setStep(2); // Ir a preview
    } catch (error) {
      console.error('Error al parsear CSV:', error);
      alert('Error al procesar el CSV. Verifica el formato.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Manejar importación
  const handleImport = () => {
    if (!validationResults) return;

    const categoriesToImport = validationResults.results
      .filter(item => item.status !== 'error')
      .map(item => ({
        name: item.nombre.trim(),
        group: item.grupo.trim(),
        budget: Math.max(0, parseFloat(item.presupuesto) || 0),
        currency: ['EUR', 'CLP', 'USD', 'UF'].includes(item.moneda.toUpperCase()) 
          ? item.moneda.toUpperCase() 
          : 'EUR',
        icon: item.icon.trim() || '📁',
        type: ['income', 'expense', 'savings', 'investment'].includes(item.tipo.toLowerCase())
          ? item.tipo.toLowerCase()
          : 'expense'
      }));

    onImport(categoriesToImport);
    setStep(3); // Mostrar resultado
  };

  // Reset y cerrar
  const handleClose = () => {
    setCsvText('');
    setParsedData([]);
    setValidationResults(null);
    setStep(1);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-teal-600 p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <i className="fas fa-file-csv mr-3"></i>
              Importar Categorías desde CSV
            </h2>
            <button
              onClick={handleClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <i className="fas fa-times text-2xl"></i>
            </button>
          </div>
          
          {/* Steps indicator */}
          <div className="flex items-center justify-center mt-4 space-x-4">
            <div className={`flex items-center ${step >= 1 ? 'text-white' : 'text-green-300'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 1 ? 'bg-white text-green-600' : 'bg-green-500'
              } font-bold mr-2`}>
                1
              </div>
              <span className="text-sm font-medium">Pegar CSV</span>
            </div>
            <i className="fas fa-arrow-right text-white"></i>
            <div className={`flex items-center ${step >= 2 ? 'text-white' : 'text-green-300'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 2 ? 'bg-white text-green-600' : 'bg-green-500'
              } font-bold mr-2`}>
                2
              </div>
              <span className="text-sm font-medium">Preview</span>
            </div>
            <i className="fas fa-arrow-right text-white"></i>
            <div className={`flex items-center ${step >= 3 ? 'text-white' : 'text-green-300'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 3 ? 'bg-white text-green-600' : 'bg-green-500'
              } font-bold mr-2`}>
                3
              </div>
              <span className="text-sm font-medium">Resultado</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* STEP 1: Input CSV */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">
                  <i className="fas fa-info-circle mr-2"></i>
                  Formato CSV esperado:
                </h3>
                <pre className="text-xs text-blue-800 bg-white p-3 rounded overflow-x-auto">
{`nombre,grupo,presupuesto,moneda,icon,tipo
"💼 Khaled Salary","💼 Income",0,EUR,💼,income
"🏠 Rent","🏠 Housing & Utilities",800,EUR,🏠,expense
"📊 Fintual","💰 Savings & Investments",200,CLP,📊,investment`}
                </pre>
                <p className="text-xs text-blue-700 mt-2">
                  <strong>Columnas requeridas:</strong> nombre, grupo, presupuesto, moneda, icon, tipo
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Pega tu CSV aquí:
                </label>
                <textarea
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder="Pega el contenido de tu CSV aquí..."
                  rows={12}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {csvText.trim().split('\n').length - 1} filas (excluyendo encabezado)
                </p>
              </div>

              <button
                onClick={handleCSVInput}
                disabled={!csvText.trim() || isProcessing}
                className="w-full py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:from-green-700 hover:to-teal-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Procesando...
                  </>
                ) : (
                  <>
                    <i className="fas fa-arrow-right mr-2"></i>
                    Validar y Previsualizar
                  </>
                )}
              </button>
            </div>
          )}

          {/* STEP 2: Preview */}
          {step === 2 && validationResults && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-blue-600">{validationResults.summary.total}</div>
                  <div className="text-sm text-blue-800">Total</div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-green-600">{validationResults.summary.valid}</div>
                  <div className="text-sm text-green-800">Válidas</div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-yellow-600">{validationResults.summary.warnings}</div>
                  <div className="text-sm text-yellow-800">Advertencias</div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-red-600">{validationResults.summary.errors}</div>
                  <div className="text-sm text-red-800">Errores</div>
                </div>
              </div>

              {/* Preview table */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left">#</th>
                        <th className="px-3 py-2 text-left">Nombre</th>
                        <th className="px-3 py-2 text-left">Grupo</th>
                        <th className="px-3 py-2 text-left">Presup.</th>
                        <th className="px-3 py-2 text-left">Moneda</th>
                        <th className="px-3 py-2 text-left">Tipo</th>
                        <th className="px-3 py-2 text-left">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {validationResults.results.map((item, index) => (
                        <tr key={index} className={`border-t ${
                          item.status === 'error' ? 'bg-red-50' :
                          item.status === 'warning' ? 'bg-yellow-50' :
                          'bg-white'
                        }`}>
                          <td className="px-3 py-2">{item.rowNumber}</td>
                          <td className="px-3 py-2 font-medium">{item.nombre || '(vacío)'}</td>
                          <td className="px-3 py-2">{item.grupo || '(vacío)'}</td>
                          <td className="px-3 py-2">{item.presupuesto}</td>
                          <td className="px-3 py-2">{item.moneda}</td>
                          <td className="px-3 py-2">{item.tipo}</td>
                          <td className="px-3 py-2">
                            {item.status === 'ok' && (
                              <span className="text-green-600">
                                <i className="fas fa-check-circle mr-1"></i>OK
                              </span>
                            )}
                            {item.status === 'warning' && (
                              <span className="text-yellow-600 text-xs">
                                <i className="fas fa-exclamation-triangle mr-1"></i>
                                {item.warnings.join(', ')}
                              </span>
                            )}
                            {item.status === 'error' && (
                              <span className="text-red-600 text-xs">
                                <i className="fas fa-times-circle mr-1"></i>
                                {item.errors.join(', ')}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center pt-4 border-t">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  <i className="fas fa-arrow-left mr-2"></i>
                  Volver
                </button>
                <button
                  onClick={handleImport}
                  disabled={validationResults.summary.errors > 0}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:from-green-700 hover:to-teal-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <i className="fas fa-upload mr-2"></i>
                  Importar {validationResults.summary.valid + validationResults.summary.warnings} Categorías
                </button>
              </div>

              {validationResults.summary.errors > 0 && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  <i className="fas fa-exclamation-circle mr-2"></i>
                  No se puede importar porque hay {validationResults.summary.errors} error(es). 
                  Corrige los errores y vuelve a intentar.
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Result */}
          {step === 3 && (
            <div className="text-center py-8 space-y-6">
              <div className="text-green-600">
                <i className="fas fa-check-circle text-6xl"></i>
              </div>
              <h3 className="text-2xl font-bold text-gray-800">
                ¡Importación Exitosa!
              </h3>
              <p className="text-gray-600">
                Las categorías han sido importadas correctamente.
              </p>
              <button
                onClick={handleClose}
                className="px-8 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:from-green-700 hover:to-teal-700 transition-all font-medium"
              >
                <i className="fas fa-check mr-2"></i>
                Cerrar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}