import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';

export default function InvestmentSummaryCard() {
  const { investments, displayCurrency, convertCurrency } = useApp();

  const summary = useMemo(() => {
    // Separar plataformas y activos
    const platforms = investments.filter(inv => inv.platform && !inv.quantity);
    const assets = investments.filter(inv => inv.quantity);

    // Calcular valor de plataformas
    const platformsValue = platforms.reduce((sum, inv) => {
      return sum + convertCurrency(inv.currentBalance, inv.currency, displayCurrency);
    }, 0);

    // Calcular valor y costo de activos
    let assetsValue = 0;
    let assetsCost = 0;

    assets.forEach(inv => {
      const value = inv.quantity * inv.currentPrice;
      const cost = inv.quantity * inv.purchasePrice;
      assetsValue += convertCurrency(value, inv.currency, displayCurrency);
      assetsCost += convertCurrency(cost, inv.currency, displayCurrency);
    });

    const totalValue = platformsValue + assetsValue;
    const totalGainLoss = assetsValue - assetsCost;
    const totalROI = assetsCost > 0 ? (totalGainLoss / assetsCost) * 100 : 0;

    // Calcular cambio en últimas 24h (simulado con lastUpdated)
    const recentUpdates = investments.filter(inv => {
      const updateDate = new Date(inv.lastUpdated);
      const now = new Date();
      const diffHours = (now - updateDate) / (1000 * 60 * 60);
      return diffHours <= 24;
    });

    return {
      totalValue,
      platformsValue,
      assetsValue,
      totalROI,
      totalGainLoss,
      platformsCount: platforms.length,
      assetsCount: assets.length,
      recentUpdates: recentUpdates.length,
      hasInvestments: investments.length > 0
    };
  }, [investments, displayCurrency, convertCurrency]);

  if (!summary.hasInvestments) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center">
            <i className="fas fa-chart-line mr-2 text-purple-600"></i>
            Portafolio de Inversiones
          </h3>
        </div>
        
        <div className="text-center py-8">
          <div className="text-5xl mb-3">📊</div>
          <p className="text-gray-600 mb-4">No tienes inversiones registradas</p>
          <button
            onClick={() => window.location.hash = '/inversiones'}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
          >
            <i className="fas fa-plus mr-2"></i>
            Comenzar a Invertir
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white hover:shadow-xl transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold flex items-center">
          <i className="fas fa-chart-line mr-2"></i>
          Portafolio de Inversiones
        </h3>
        <button
          onClick={() => window.location.hash = '/inversiones'}
          className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg transition-colors text-sm font-medium"
        >
          Ver Todo
          <i className="fas fa-arrow-right ml-2"></i>
        </button>
      </div>

      {/* Valor Total */}
      <div className="mb-6">
        <p className="text-purple-100 text-sm mb-1">Valor Total del Portafolio</p>
        <p className="text-4xl font-bold mb-1">
          {summary.totalValue.toLocaleString('es-ES', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          })}
        </p>
        <p className="text-purple-100 text-sm">{displayCurrency}</p>
      </div>

      {/* Grid de métricas */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white bg-opacity-10 rounded-lg p-4">
          <p className="text-purple-100 text-xs mb-1">Plataformas</p>
          <p className="text-2xl font-bold">{summary.platformsCount}</p>
          <p className="text-xs text-purple-100 mt-1">
            {summary.platformsValue.toLocaleString('es-ES', { maximumFractionDigits: 0 })} {displayCurrency}
          </p>
        </div>

        <div className="bg-white bg-opacity-10 rounded-lg p-4">
          <p className="text-purple-100 text-xs mb-1">Activos</p>
          <p className="text-2xl font-bold">{summary.assetsCount}</p>
          <p className="text-xs text-purple-100 mt-1">
            {summary.assetsValue.toLocaleString('es-ES', { maximumFractionDigits: 0 })} {displayCurrency}
          </p>
        </div>
      </div>

      {/* ROI si hay activos */}
      {summary.assetsCount > 0 && (
        <div className={`${summary.totalROI >= 0 ? 'bg-green-500' : 'bg-red-500'} bg-opacity-20 rounded-lg p-4 mb-4`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-purple-100 mb-1">ROI de Activos</p>
              <p className="text-2xl font-bold">
                {summary.totalROI >= 0 ? '+' : ''}{summary.totalROI.toFixed(2)}%
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-purple-100 mb-1">Ganancia/Pérdida</p>
              <p className="text-lg font-bold">
                {summary.totalGainLoss >= 0 ? '+' : ''}{summary.totalGainLoss.toLocaleString('es-ES', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Actualizaciones recientes */}
      {summary.recentUpdates > 0 && (
        <div className="flex items-center text-sm text-purple-100">
          <i className="fas fa-sync-alt mr-2"></i>
          {summary.recentUpdates} actualización{summary.recentUpdates !== 1 ? 'es' : ''} en las últimas 24h
        </div>
      )}
    </div>
  );
}