import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import Modal from '../common/Modal';
import { createTransactionImporter } from '../../utils/TransactionImporter';

export default function ImportTransactionsModal({ isOpen, onClose }) {
  // ✅ M35: Agregar categories del context
  const { addTransactionsBatch, clearAllTransactions, categories } = useApp();
  
  const [step, setStep] = useState(1); // 1: Upload, 2: Preview, 3: Importing, 4: Complete
  const [file, setFile] = useState(null);
  const [processResult, setProcessResult] = useState(null);
  const [selectedTransactions, setSelectedTransactions] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
  const [clearBeforeImport, setClearBeforeImport] = useState(true); // ✅ Default: true
  
  const fileInputRef = useRef(null);

  // Reset al cerrar
  const handleClose = () => {
    setStep(1);
    setFile(null);
    setProcessResult(null);
    setSelectedTransactions([]);
    setImporting(false);
    setImportResult(null);
    setDateFilter({ start: '', end: '' });
    setClearBeforeImport(true);
    onClose();
  };

  // Paso 1: Seleccionar archivo
  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validar extensión
      const validExtensions = ['.xlsx', '.xls'];
      const fileExtension = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();
      
      if (!validExtensions.includes(fileExtension)) {
        alert('Por favor selecciona un archivo Excel (.xlsx o .xls)');
        return;
      }
      
      setFile(selectedFile);
    }
  };

  // Paso 2: Procesar archivo
  const handleProcessFile = async () => {
    if (!file) return;
    
    setStep(3); // Mostrar loading
    
    try {
      // ✅ M35: Crear importer con categorías del context
      const importer = createTransactionImporter(categories);
      const result = await importer.processFile(file);
      
      if (result.success) {
        setProcessResult(result);
        setSelectedTransactions(result.transactions); // Seleccionar todas por defecto
        setStep(2); // Ir a preview
      } else {
        alert(`❌ Errores encontrados:\n\n${result.errors.slice(0, 10).join('\n')}\n\n${result.errors.length > 10 ? `... y ${result.errors.length - 10} errores más` : ''}`);
        setStep(1);
      }
    } catch (error) {
      alert(`❌ Error procesando archivo: ${error.message}`);
      setStep(1);
    }
  };

  // Aplicar filtro de fechas
  const handleApplyDateFilter = () => {
    if (!processResult) return;
    
    let filtered = processResult.transactions;
    
    if (dateFilter.start || dateFilter.end) {
      filtered = filtered.filter(trans => {
        const transDate = new Date(trans.date);
        const startDate = dateFilter.start ? new Date(dateFilter.start) : null;
        const endDate = dateFilter.end ? new Date(dateFilter.end + 'T23:59:59') : null;
        
        if (startDate && transDate < startDate) return false;
        if (endDate && transDate > endDate) return false;
        return true;
      });
    }
    
    setSelectedTransactions(filtered);
  };

  // Paso 3: Importar transacciones
  const handleImport = async () => {
    if (selectedTransactions.length === 0) {
      alert('No hay transacciones seleccionadas para importar');
      return;
    }
    
    const confirmImport = window.confirm(
      `¿Estás seguro de importar ${selectedTransactions.length} transacciones?\n\n` +
      `${clearBeforeImport ? '⚠️ Se eliminarán TODAS las transacciones existentes primero.\n\n' : ''}` +
      `Esta acción agregará todas las transacciones a tu cuenta.`
    );
    
    if (!confirmImport) return;
    
    setImporting(true);
    setStep(3);
    
    try {
      // Limpiar transacciones existentes si está activado
      if (clearBeforeImport) {
        clearAllTransactions();
      }
      
      // Importar en batch
      await addTransactionsBatch(selectedTransactions);
      
      setImportResult({
        success: true,
        imported: selectedTransactions.length,
        cleared: clearBeforeImport
      });
      
      setStep(4);
    } catch (error) {
      alert(`❌ Error importando: ${error.message}`);
      setImporting(false);
      setStep(2);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl">
      <div className="p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              <i className="fas fa-file-import mr-3 text-blue-600"></i>
              Importar Transacciones
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Importa tus transacciones desde Excel
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-medium ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              1. Seleccionar
            </span>
            <span className={`text-sm font-medium ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              2. Vista Previa
            </span>
            <span className={`text-sm font-medium ${step >= 4 ? 'text-blue-600' : 'text-gray-400'}`}>
              3. Completo
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* STEP 1: Upload File */}
        {step === 1 && (
          <div className="space-y-6">
            {/* Instrucciones */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
                <i className="fas fa-info-circle mr-2"></i>
                Formato esperado
              </h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>Archivo:</strong> Excel (.xlsx o .xls)</li>
                <li>• <strong>Columnas requeridas:</strong> Date, Category, Subcategory, Type, Amount, Currency</li>
                <li>• <strong>Columnas opcionales:</strong> Description</li>
                <li>• <strong>Category:</strong> Debe coincidir con el Grupo (ej: "Food & Drinks")</li>
                <li>• <strong>Subcategory:</strong> Debe coincidir con el Nombre (ej: "Groceries")</li>
              </ul>
            </div>

            {/* ✅ M35: Info categorías disponibles */}
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-2">
                <i className="fas fa-check-circle mr-2"></i>
                Categorías disponibles: {categories.length}
              </h3>
              {categories.length === 0 ? (
                <p className="text-sm text-red-600">
                  ⚠️ No hay categorías. Ve a Ajustes → Categorías para importar primero.
                </p>
              ) : (
                <div className="text-xs text-green-700 max-h-24 overflow-y-auto">
                  {Object.entries(
                    categories.reduce((acc, cat) => {
                      if (!acc[cat.group]) acc[cat.group] = [];
                      acc[cat.group].push(cat.name);
                      return acc;
                    }, {})
                  ).slice(0, 5).map(([group, cats]) => (
                    <div key={group} className="mb-1">
                      <strong>{group}:</strong> {cats.slice(0, 4).join(', ')}{cats.length > 4 ? '...' : ''}
                    </div>
                  ))}
                  {Object.keys(categories.reduce((acc, cat) => { acc[cat.group] = true; return acc; }, {})).length > 5 && (
                    <div className="text-gray-500">... y más grupos</div>
                  )}
                </div>
              )}
            </div>

            {/* Upload Area */}
            <div 
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
                file 
                  ? 'border-green-400 bg-green-50' 
                  : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              {file ? (
                <div>
                  <i className="fas fa-file-excel text-5xl text-green-600 mb-4"></i>
                  <p className="text-lg font-medium text-green-700">{file.name}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                    className="mt-3 px-4 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                  >
                    <i className="fas fa-times mr-1"></i>
                    Cambiar archivo
                  </button>
                </div>
              ) : (
                <div>
                  <i className="fas fa-cloud-upload-alt text-5xl text-gray-400 mb-4"></i>
                  <p className="text-lg text-gray-600">
                    Haz clic para seleccionar archivo Excel
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    o arrastra y suelta aquí
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleClose}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleProcessFile}
                disabled={!file || categories.length === 0}
                className={`px-6 py-2 rounded-lg font-medium ${
                  file && categories.length > 0
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <i className="fas fa-arrow-right mr-2"></i>
                Procesar Archivo
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Preview */}
        {step === 2 && processResult && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-blue-600">{selectedTransactions.length}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Income</p>
                <p className="text-2xl font-bold text-green-600">{processResult.stats.byType.Income || 0}</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Expense</p>
                <p className="text-2xl font-bold text-red-600">{processResult.stats.byType.Expense || 0}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Monedas</p>
                <p className="text-2xl font-bold text-purple-600">
                  {Object.keys(processResult.stats.byCurrency).length}
                </p>
              </div>
            </div>

            {/* Filtros de fecha */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3">
                <i className="fas fa-filter mr-2"></i>
                Filtrar por Fechas (opcional)
              </h3>
              <div className="flex space-x-4 items-end">
                <div className="flex-1">
                  <label className="block text-sm text-gray-600 mb-1">Desde</label>
                  <input
                    type="date"
                    value={dateFilter.start}
                    onChange={(e) => setDateFilter({ ...dateFilter, start: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm text-gray-600 mb-1">Hasta</label>
                  <input
                    type="date"
                    value={dateFilter.end}
                    onChange={(e) => setDateFilter({ ...dateFilter, end: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <button
                  onClick={handleApplyDateFilter}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Aplicar
                </button>
                {(dateFilter.start || dateFilter.end) && (
                  <button
                    onClick={() => {
                      setDateFilter({ start: '', end: '' });
                      setSelectedTransactions(processResult.transactions);
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Limpiar
                  </button>
                )}
              </div>
            </div>

            {/* ✅ M16: Checkbox para limpiar transacciones existentes */}
            <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={clearBeforeImport}
                  onChange={(e) => setClearBeforeImport(e.target.checked)}
                  className="mt-1 h-5 w-5 text-orange-600 rounded focus:ring-orange-500"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <i className="fas fa-trash-alt text-orange-600"></i>
                    <span className="font-semibold text-orange-900">
                      Eliminar transacciones existentes antes de importar
                    </span>
                  </div>
                  <p className="text-sm text-orange-700 mt-1">
                    Recomendado: Limpia todas las transacciones de prueba antes de importar tus datos reales.
                  </p>
                </div>
              </label>
            </div>

            {/* Preview Table */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b">
                <h3 className="font-semibold text-gray-800">
                  Vista Previa (primeras 10 transacciones)
                </h3>
              </div>
              <div className="overflow-x-auto overflow-y-auto" style={{ maxHeight: '300px' }}>
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left">Fecha</th>
                      <th className="px-4 py-2 text-left">Descripción</th>
                      <th className="px-4 py-2 text-right">Monto</th>
                      <th className="px-4 py-2 text-left">Moneda</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {selectedTransactions.slice(0, 10).map((trans, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-2">
                          {new Date(trans.date).toLocaleDateString('es-ES')}
                        </td>
                        <td className="px-4 py-2">{trans.description}</td>
                        <td className="px-4 py-2 text-right font-medium">
                          {trans.amount.toFixed(2)}
                        </td>
                        <td className="px-4 py-2">{trans.currency}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {selectedTransactions.length > 10 && (
                <div className="bg-gray-50 px-4 py-2 text-center text-sm text-gray-600 border-t">
                  ... y {selectedTransactions.length - 10} transacciones más
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                <i className="fas fa-arrow-left mr-2"></i>
                Volver
              </button>
              <button
                onClick={handleImport}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              >
                <i className="fas fa-download mr-2"></i>
                Importar {selectedTransactions.length} Transacciones
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Importing */}
        {step === 3 && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg font-medium text-gray-700">
              {importing ? 'Importando transacciones...' : 'Procesando archivo...'}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Por favor espera, esto puede tomar unos segundos
            </p>
          </div>
        )}

        {/* STEP 4: Complete */}
        {step === 4 && importResult && (
          <div className="text-center py-12">
            <div className="bg-green-100 rounded-full h-24 w-24 flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-check text-5xl text-green-600"></i>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              ¡Importación Completada!
            </h3>
            <p className="text-gray-600 mb-2">
              Se importaron <strong>{importResult.imported}</strong> transacciones exitosamente
            </p>
            {importResult.cleared && (
              <p className="text-sm text-orange-600 mb-6">
                <i className="fas fa-info-circle mr-1"></i>
                Las transacciones anteriores fueron eliminadas
              </p>
            )}
            <button
              onClick={handleClose}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Cerrar
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}