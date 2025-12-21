// src/views/Settings/components/ImportCategoriesModal.jsx
// ✅ M20: CORREGIDO - Mejor manejo de onImport y resultados
import React, { useState } from 'react';

export default function ImportCategoriesModal({ isOpen, onClose, onImport, existingCategories = [] }) {
  const [csvText, setCsvText] = useState('');
  const [parsedData, setParsedData] = useState([]);
  const [validationResults, setValidationResults] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState(1); // 1: input, 2: preview, 3: result

  // Parsear CSV
  const parseCSV = (text) => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) {
      return { success: false, error: 'El CSV debe tener al menos 2 líneas (encabezado + datos)' };
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, '').toLowerCase());
    
    const requiredColumns = ['nombre', 'grupo', 'presupuesto', 'moneda', 'icon', 'tipo'];
    const missingColumns = requiredColumns.filter(col => !headers.includes(col));
    
    if (missingColumns.length > 0) {
      return { 
        success: false, 
        error: `Faltan columnas requeridas: ${missingColumns.join(', ')}` 
      };
    }

    const data = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

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
      values.push(currentValue.trim());

      if (values.length !== headers.length) {
        return {
          success: false,
          error: `Línea ${i + 1}: número de columnas incorrecto (esperadas: ${headers.length}, encontradas: ${values.length})`
        };
      }

      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index].replace(/^"|"$/g, '');
      });
      data.push(row);
    }

    return { success: true, data };
  };

  // Validar datos
  const validateData = (data) => {
    const results = data.map((item, index) => {
      const errors = [];

      if (!item.nombre || item.nombre.trim() === '') {
        errors.push('Nombre vacío');
      }

      if (!item.grupo || item.grupo.trim() === '') {
        errors.push('Grupo vacío');
      }

      const presupuesto = parseFloat(item.presupuesto);
      if (isNaN(presupuesto) || presupuesto < 0) {
        errors.push('Presupuesto inválido');
      }

      if (!['EUR', 'CLP', 'USD', 'UF'].includes(item.moneda.toUpperCase())) {
        errors.push('Moneda inválida (EUR, CLP, USD, UF)');
      }

      if (!['income', 'expense', 'savings', 'investment'].includes(item.tipo.toLowerCase())) {
        errors.push('Tipo inválido (income, expense, savings, investment)');
      }

      const isDuplicate = existingCategories.some(
        cat => cat.name.toLowerCase() === item.nombre.trim().toLowerCase()
      );

      return {
        ...item,
        line: index + 2,
        status: errors.length > 0 ? 'error' : (isDuplicate ? 'warning' : 'success'),
        errors,
        isDuplicate
      };
    });

    const summary = {
      total: results.length,
      success: results.filter(r => r.status === 'success').length,
      warnings: results.filter(r => r.status === 'warning').length,
      errors: results.filter(r => r.status === 'error').length
    };

    return { results, summary };
  };

  // Manejar archivo
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setCsvText(e.target.result);
    };
    reader.readAsText(file);
  };

  // Validar y previsualizar
  const handleValidate = async () => {
    if (!csvText.trim()) {
      alert('Por favor ingresa o sube un archivo CSV');
      return;
    }

    setIsProcessing(true);

    try {
      const parseResult = parseCSV(csvText);
      
      if (!parseResult.success) {
        alert(parseResult.error);
        return;
      }

      setParsedData(parseResult.data);
      const validation = validateData(parseResult.data);
      setValidationResults(validation);
      setStep(2);
    } catch (error) {
      alert('Error al procesar el CSV: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // ✅ M20: CORREGIDO - Manejar importación con resultado
  const handleImport = () => {
    if (!validationResults || !onImport) return;

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

    // ✅ Llamar a onImport y guardar resultado
    const result = onImport(categoriesToImport);
    setImportResult(result);
    setStep(3);
  };

  // Reset y cerrar
  const handleClose = () => {
    setCsvText('');
    setParsedData([]);
    setValidationResults(null);
    setImportResult(null);
    setStep(1);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 rounded-t-xl">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <i className="fas fa-file-import mr-3"></i>
              Importar Categorías desde CSV
            </h2>
            <button
              onClick={handleClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <i className="fas fa-times text-2xl"></i>
            </button>
          </div>
        </div>

        {/* Steps Indicator */}
        <div className="flex justify-center items-center p-6 border-b">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center ${step >= 1 ? 'text-purple-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= 1 ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}>
                1
              </div>
              <span className="ml-2 font-medium">Pegar CSV</span>
            </div>
            <i className="fas fa-arrow-right text-gray-400"></i>
            <div className={`flex items-center ${step >= 2 ? 'text-purple-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= 2 ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}>
                2
              </div>
              <span className="ml-2 font-medium">Preview</span>
            </div>
            <i className="fas fa-arrow-right text-gray-400"></i>
            <div className={`flex items-center ${step >= 3 ? 'text-purple-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= 3 ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}>
                3
              </div>
              <span className="ml-2 font-medium">Resultado</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Input */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800 mb-2">
                  <i className="fas fa-info-circle mr-2"></i>
                  <strong>Formato CSV esperado:</strong>
                </p>
                <pre className="text-xs bg-white p-3 rounded border border-blue-200 overflow-x-auto">
{`nombre,grupo,presupuesto,moneda,icon,tipo
💼 Khaled Salary,💼 Income,0,EUR,💼,income
🏠 Rent,🏠 Housing & Utilities,1200,EUR,🏠,expense
💶 EUR Savings Account,💰 Savings & Investments,500,EUR,💶,savings`}
                </pre>
                <p className="text-xs text-blue-700 mt-2">
                  <strong>Columnas requeridas:</strong> nombre, grupo, presupuesto, moneda, icon, tipo
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Subir archivo CSV:
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  O pegar contenido CSV:
                </label>
                <textarea
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder="Pega tu CSV aquí..."
                  rows={12}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleClose}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleValidate}
                  disabled={!csvText.trim() || isProcessing}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Validando...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-arrow-right mr-2"></i>
                      Validar y Previsualizar
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Preview */}
          {step === 2 && validationResults && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-blue-700">{validationResults.summary.total}</p>
                  <p className="text-sm text-blue-600">Total</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-green-700">{validationResults.summary.success}</p>
                  <p className="text-sm text-green-600">Válidas</p>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-yellow-700">{validationResults.summary.warnings}</p>
                  <p className="text-sm text-yellow-600">Duplicadas</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-red-700">{validationResults.summary.errors}</p>
                  <p className="text-sm text-red-600">Errores</p>
                </div>
              </div>

              {/* Results Table */}
              <div className="border border-gray-200 rounded-lg overflow-hidden max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left">Estado</th>
                      <th className="px-4 py-2 text-left">Nombre</th>
                      <th className="px-4 py-2 text-left">Grupo</th>
                      <th className="px-4 py-2 text-left">Presupuesto</th>
                      <th className="px-4 py-2 text-left">Tipo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validationResults.results.map((item, index) => (
                      <tr key={index} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-2">
                          {item.status === 'success' && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                              ✓ OK
                            </span>
                          )}
                          {item.status === 'warning' && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                              ⚠ Duplicado
                            </span>
                          )}
                          {item.status === 'error' && (
                            <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
                              ✗ Error
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2">{item.nombre}</td>
                        <td className="px-4 py-2">{item.grupo}</td>
                        <td className="px-4 py-2">{item.presupuesto} {item.moneda}</td>
                        <td className="px-4 py-2">{item.tipo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  <i className="fas fa-arrow-left mr-2"></i>
                  Volver
                </button>
                <button
                  onClick={handleImport}
                  disabled={validationResults.summary.success === 0}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <i className="fas fa-check mr-2"></i>
                  Importar {validationResults.summary.success} Categorías
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Result */}
          {step === 3 && importResult && (
            <div className="space-y-6 text-center py-8">
              <div className="text-6xl text-green-600 mb-4">
                <i className="fas fa-check-circle"></i>
              </div>
              <h3 className="text-2xl font-bold text-gray-800">¡Importación Completada!</h3>
              
              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-3xl font-bold text-green-700">{importResult.added}</p>
                  <p className="text-sm text-green-600">Importadas</p>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-3xl font-bold text-yellow-700">{importResult.skipped}</p>
                  <p className="text-sm text-yellow-600">Omitidas (duplicadas)</p>
                </div>
              </div>

              <button
                onClick={handleClose}
                className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                <i className="fas fa-check mr-2"></i>
                Finalizar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}