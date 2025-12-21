// src/components/common/ErrorBoundary.jsx
// ✅ M24: Captura errores para evitar que la app crashee completa

import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // Log del error (en producción enviar a servicio de monitoreo)
    console.error('ErrorBoundary capturó un error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleClearStorage = () => {
    if (window.confirm('⚠️ Esto borrará todos tus datos guardados. ¿Continuar?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl p-8">
            {/* Icono de error */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                <i className="fas fa-exclamation-triangle text-3xl text-red-600"></i>
              </div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                ¡Ups! Algo salió mal
              </h1>
              <p className="text-gray-600">
                Ha ocurrido un error inesperado en la aplicación.
              </p>
            </div>

            {/* Detalles del error (solo en desarrollo) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
                <p className="font-mono text-sm text-red-800 break-all">
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm text-red-600 hover:text-red-700">
                      Ver detalles técnicos
                    </summary>
                    <pre className="mt-2 text-xs text-red-700 overflow-auto max-h-40">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {/* Acciones */}
            <div className="space-y-3">
              <button
                onClick={this.handleReset}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center"
              >
                <i className="fas fa-redo mr-2"></i>
                Intentar de nuevo
              </button>

              <button
                onClick={this.handleReload}
                className="w-full py-3 px-4 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center"
              >
                <i className="fas fa-sync mr-2"></i>
                Recargar página
              </button>

              <button
                onClick={this.handleClearStorage}
                className="w-full py-3 px-4 bg-red-100 hover:bg-red-200 text-red-700 font-medium rounded-lg transition-colors flex items-center justify-center"
              >
                <i className="fas fa-trash mr-2"></i>
                Limpiar datos y reiniciar
              </button>
            </div>

            {/* Info adicional */}
            <p className="mt-6 text-center text-sm text-gray-500">
              Si el problema persiste, contacta soporte con los detalles del error.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;