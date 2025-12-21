import React, { useMemo } from 'react';
import Modal from '../common/Modal';
import InvestmentChart from '../charts/InvestmentChart';

export default function PlatformEvolutionModal({ isOpen, onClose, platform, displayCurrency, convertCurrency }) {
  if (!platform) return null;

  const balanceHistory = platform.balanceHistory || [];

  // Calcular métricas
  const metrics = useMemo(() => {
    if (balanceHistory.length < 2) {
      return null;
    }

    // Ordenar por fecha
    const sortedHistory = [...balanceHistory].sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );

    const initialBalance = sortedHistory[0].balance;
    const currentBalance = sortedHistory[sortedHistory.length - 1].balance;
    const initialDate = new Date(sortedHistory[0].date);
    const currentDate = new Date(sortedHistory[sortedHistory.length - 1].date);

    // Calcular cambio total
    const totalChange = currentBalance - initialBalance;
    const totalChangePercent = initialBalance > 0 ? (totalChange / initialBalance * 100) : 0;

    // Calcular tiempo transcurrido
    const monthsElapsed = Math.max(1, Math.round((currentDate - initialDate) / (1000 * 60 * 60 * 24 * 30)));
    const yearsElapsed = (monthsElapsed / 12).toFixed(1);

    // Calcular rentabilidad mensual promedio
    const monthlyReturn = monthsElapsed > 0 ? (totalChangePercent / monthsElapsed) : 0;

    // Calcular mejor y peor mes
    let bestMonth = { change: 0, percent: 0, date: null };
    let worstMonth = { change: 0, percent: 0, date: null };

    for (let i = 1; i < sortedHistory.length; i++) {
      const change = sortedHistory[i].balance - sortedHistory[i - 1].balance;
      const percent = sortedHistory[i - 1].balance > 0 
        ? (change / sortedHistory[i - 1].balance * 100) 
        : 0;

      if (percent > bestMonth.percent) {
        bestMonth = { change, percent, date: new Date(sortedHistory[i].date) };
      }
      if (percent < worstMonth.percent) {
        worstMonth = { change, percent, date: new Date(sortedHistory[i].date) };
      }
    }

    // Calcular balance máximo alcanzado
    const maxBalance = Math.max(...sortedHistory.map(h => h.balance));
    const maxBalanceEntry = sortedHistory.find(h => h.balance === maxBalance);

    // Racha actual (meses consecutivos de crecimiento)
    let currentStreak = 0;
    for (let i = sortedHistory.length - 1; i > 0; i--) {
      if (sortedHistory[i].balance >= sortedHistory[i - 1].balance) {
        currentStreak++;
      } else {
        break;
      }
    }

    return {
      initialBalance,
      currentBalance,
      initialDate,
      currentDate,
      totalChange,
      totalChangePercent,
      monthsElapsed,
      yearsElapsed,
      monthlyReturn,
      bestMonth,
      worstMonth,
      maxBalance,
      maxBalanceDate: maxBalanceEntry ? new Date(maxBalanceEntry.date) : null,
      currentStreak,
      isGrowing: totalChange > 0,
      updates: sortedHistory.length
    };
  }, [balanceHistory]);

  // Función para obtener mensaje motivacional
  const getMotivationalMessage = (roi) => {
    if (roi >= 30) return { emoji: '🚀', text: '¡Rendimiento excepcional!', color: 'text-green-700' };
    if (roi >= 20) return { emoji: '🔥', text: '¡Increíble crecimiento!', color: 'text-green-600' };
    if (roi >= 10) return { emoji: '⭐', text: '¡Excelente trabajo!', color: 'text-green-600' };
    if (roi >= 5) return { emoji: '📈', text: 'Vas por buen camino', color: 'text-blue-600' };
    if (roi >= 0) return { emoji: '💪', text: 'Sigue invirtiendo', color: 'text-blue-500' };
    if (roi >= -5) return { emoji: '📊', text: 'Mantén la calma', color: 'text-gray-600' };
    return { emoji: '🎯', text: 'Momento de revisar estrategia', color: 'text-orange-600' };
  };

  const motivational = metrics ? getMotivationalMessage(metrics.totalChangePercent) : null;

  // Convertir a displayCurrency para comparación
  const currentBalanceInDisplay = convertCurrency(platform.currentBalance, platform.currency, displayCurrency);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`📈 Evolución - ${platform.platform}`}
      size="2xl"
    >
      <div className="space-y-6">
        {/* Header con info básica */}
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-2xl font-bold">{platform.name}</h3>
              <p className="text-purple-100">{platform.platform} • {platform.type}</p>
            </div>
            <div className="text-6xl opacity-20">
              {platform.icon}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-purple-100 text-sm mb-1">Balance Actual</p>
              <p className="text-3xl font-bold">
                {platform.currentBalance.toLocaleString('es-ES', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })} {platform.currency}
              </p>
            </div>
            <div>
              <p className="text-purple-100 text-sm mb-1">Actualizaciones</p>
              <p className="text-3xl font-bold">
                {balanceHistory.length}
              </p>
            </div>
          </div>
        </div>

        {/* Gráfico */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h4 className="text-lg font-bold text-gray-800 mb-4">
            <i className="fas fa-chart-line mr-2 text-purple-600"></i>
            Evolución del Balance
          </h4>
          <InvestmentChart
            balanceHistory={balanceHistory}
            currency={platform.currency}
            platformName={platform.platform}
          />
        </div>

        {/* Métricas Motivacionales */}
        {metrics ? (
          <>
            {/* Mensaje Motivacional Principal */}
            <div className={`${metrics.isGrowing ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'} border rounded-lg p-6 text-center`}>
              <div className="text-6xl mb-3">{motivational.emoji}</div>
              <h3 className={`text-2xl font-bold ${motivational.color} mb-2`}>
                {motivational.text}
              </h3>
              <p className="text-gray-600">
                Tu inversión ha {metrics.isGrowing ? 'crecido' : 'cambiado'} {metrics.isGrowing ? '+' : ''}{metrics.totalChangePercent.toFixed(2)}% 
                {' '}en {metrics.monthsElapsed} {metrics.monthsElapsed === 1 ? 'mes' : 'meses'}
              </p>
            </div>

            {/* Grid de Métricas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Balance Inicial */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-xs text-gray-600 mb-1 flex items-center">
                  <i className="fas fa-flag-checkered mr-1 text-gray-400"></i>
                  Balance Inicial
                </p>
                <p className="text-lg font-bold text-gray-900">
                  {metrics.initialBalance.toLocaleString('es-ES', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  })}
                </p>
                <p className="text-xs text-gray-500">
                  {metrics.initialDate.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}
                </p>
              </div>

              {/* Crecimiento Total */}
              <div className={`${metrics.isGrowing ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border rounded-lg p-4`}>
                <p className="text-xs text-gray-600 mb-1 flex items-center">
                  <i className={`fas fa-arrow-${metrics.isGrowing ? 'up' : 'down'} mr-1 ${metrics.isGrowing ? 'text-green-600' : 'text-red-600'}`}></i>
                  Crecimiento
                </p>
                <p className={`text-lg font-bold ${metrics.isGrowing ? 'text-green-700' : 'text-red-700'}`}>
                  {metrics.isGrowing ? '+' : ''}{metrics.totalChange.toLocaleString('es-ES', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  })}
                </p>
                <p className={`text-xs ${metrics.isGrowing ? 'text-green-600' : 'text-red-600'}`}>
                  {metrics.isGrowing ? '+' : ''}{metrics.totalChangePercent.toFixed(2)}%
                </p>
              </div>

              {/* Tiempo Invertido */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-xs text-gray-600 mb-1 flex items-center">
                  <i className="fas fa-clock mr-1 text-gray-400"></i>
                  Tiempo
                </p>
                <p className="text-lg font-bold text-gray-900">
                  {metrics.monthsElapsed}
                </p>
                <p className="text-xs text-gray-500">
                  {metrics.monthsElapsed === 1 ? 'mes' : 'meses'} ({metrics.yearsElapsed} años)
                </p>
              </div>

              {/* Rentabilidad Mensual */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-xs text-gray-600 mb-1 flex items-center">
                  <i className="fas fa-calendar-alt mr-1 text-gray-400"></i>
                  Promedio Mensual
                </p>
                <p className={`text-lg font-bold ${metrics.monthlyReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {metrics.monthlyReturn >= 0 ? '+' : ''}{metrics.monthlyReturn.toFixed(2)}%
                </p>
                <p className="text-xs text-gray-500">
                  por mes
                </p>
              </div>
            </div>

            {/* Mejor y Peor Mes */}
            {metrics.bestMonth.date && metrics.worstMonth.date && (
              <div className="grid grid-cols-2 gap-4">
                {/* Mejor Mes */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-semibold text-green-900 flex items-center">
                      <i className="fas fa-trophy mr-2 text-yellow-500"></i>
                      Mejor Mes
                    </h5>
                    <span className="text-2xl">🏆</span>
                  </div>
                  <p className="text-2xl font-bold text-green-700 mb-1">
                    +{metrics.bestMonth.percent.toFixed(2)}%
                  </p>
                  <p className="text-sm text-green-600">
                    +{metrics.bestMonth.change.toLocaleString('es-ES')} {platform.currency}
                  </p>
                  <p className="text-xs text-gray-600 mt-2">
                    {metrics.bestMonth.date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                  </p>
                </div>

                {/* Peor Mes */}
                {metrics.worstMonth.percent < 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-semibold text-red-900 flex items-center">
                        <i className="fas fa-chart-line mr-2 text-red-500"></i>
                        Mes Más Bajo
                      </h5>
                      <span className="text-2xl">📉</span>
                    </div>
                    <p className="text-2xl font-bold text-red-700 mb-1">
                      {metrics.worstMonth.percent.toFixed(2)}%
                    </p>
                    <p className="text-sm text-red-600">
                      {metrics.worstMonth.change.toLocaleString('es-ES')} {platform.currency}
                    </p>
                    <p className="text-xs text-gray-600 mt-2">
                      {metrics.worstMonth.date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Balance Máximo */}
            {metrics.maxBalance > metrics.currentBalance && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-semibold text-gray-900 mb-1 flex items-center">
                      <i className="fas fa-mountain mr-2 text-yellow-600"></i>
                      Balance Máximo Histórico
                    </h5>
                    <p className="text-2xl font-bold text-gray-900">
                      {metrics.maxBalance.toLocaleString('es-ES', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })} {platform.currency}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {metrics.maxBalanceDate?.toLocaleDateString('es-ES', { 
                        day: 'numeric', 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                    </p>
                  </div>
                  <div className="text-5xl">🏔️</div>
                </div>
              </div>
            )}

            {/* Racha de Crecimiento */}
            {metrics.currentStreak > 1 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <div className="text-4xl mb-2">🔥</div>
                <h5 className="font-bold text-blue-900 text-lg mb-1">
                  ¡{metrics.currentStreak} actualizaciones consecutivas de crecimiento!
                </h5>
                <p className="text-sm text-blue-700">
                  Mantén el impulso 💪
                </p>
              </div>
            )}

            {/* Proyección Simple */}
            {metrics.monthlyReturn > 0 && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h5 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <i className="fas fa-crystal-ball mr-2 text-purple-600"></i>
                  Proyección a 12 Meses
                </h5>
                <p className="text-sm text-gray-600 mb-2">
                  Si mantienes el rendimiento promedio de {metrics.monthlyReturn >= 0 ? '+' : ''}{metrics.monthlyReturn.toFixed(2)}% mensual:
                </p>
                {(() => {
                  const projected = metrics.currentBalance * Math.pow(1 + (metrics.monthlyReturn / 100), 12);
                  const projectedGain = projected - metrics.currentBalance;
                  return (
                    <>
                      <p className="text-2xl font-bold text-purple-700">
                        {projected.toLocaleString('es-ES', {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        })} {platform.currency}
                      </p>
                      <p className="text-sm text-purple-600 mt-1">
                        +{projectedGain.toLocaleString('es-ES', {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        })} {platform.currency} en un año
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        ⚠️ Esta es solo una proyección basada en rendimiento pasado
                      </p>
                    </>
                  );
                })()}
              </div>
            )}
          </>
        ) : (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <div className="text-4xl text-gray-300 mb-3">
              <i className="fas fa-chart-line"></i>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              No hay suficientes datos
            </h3>
            <p className="text-gray-600 mb-4">
              Actualiza el balance al menos 2 veces para ver métricas detalladas
            </p>
          </div>
        )}

        {/* Botón cerrar */}
        <div className="flex justify-end pt-4 border-t">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  );
}