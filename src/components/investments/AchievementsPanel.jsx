import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';

export default function AchievementsPanel() {
  const { investments, displayCurrency, convertCurrency } = useApp();

  const achievements = useMemo(() => {
    // Separar plataformas y activos
    const platforms = investments.filter(inv => inv.platform && !inv.quantity);
    const assets = investments.filter(inv => inv.quantity);

    // Calcular métricas
    const platformsValue = platforms.reduce((sum, inv) => {
      return sum + convertCurrency(inv.currentBalance, inv.currency, displayCurrency);
    }, 0);

    let assetsValue = 0;
    let assetsCost = 0;
    assets.forEach(inv => {
      const value = inv.quantity * inv.currentPrice;
      const cost = inv.quantity * inv.purchasePrice;
      assetsValue += convertCurrency(value, inv.currency, displayCurrency);
      assetsCost += convertCurrency(cost, inv.currency, displayCurrency);
    });

    const totalValue = platformsValue + assetsValue;
    const totalROI = assetsCost > 0 ? ((assetsValue - assetsCost) / assetsCost) * 100 : 0;

    // Calcular tiempo invertido (meses desde primera inversión)
    let monthsInvesting = 0;
    if (investments.length > 0) {
      const dates = investments.map(inv => {
        if (inv.balanceHistory && inv.balanceHistory.length > 0) {
          return new Date(inv.balanceHistory[0].date);
        }
        return new Date(inv.lastUpdated);
      });
      const firstDate = new Date(Math.min(...dates));
      const now = new Date();
      monthsInvesting = Math.max(1, Math.round((now - firstDate) / (1000 * 60 * 60 * 24 * 30)));
    }

    // Calcular actualizaciones totales
    const totalUpdates = investments.reduce((sum, inv) => {
      return sum + (inv.balanceHistory?.length || 1);
    }, 0);

    // Definir logros
    const allAchievements = [
      {
        id: 'first_investment',
        title: 'Primera Inversión',
        description: 'Registra tu primera inversión',
        icon: '🎯',
        unlocked: investments.length >= 1,
        progress: Math.min(investments.length, 1),
        total: 1,
        color: 'from-blue-500 to-blue-600',
        rarity: 'common'
      },
      {
        id: 'diversified',
        title: 'Inversionista Diversificado',
        description: 'Ten al menos 3 plataformas diferentes',
        icon: '🌈',
        unlocked: platforms.length >= 3,
        progress: Math.min(platforms.length, 3),
        total: 3,
        color: 'from-purple-500 to-purple-600',
        rarity: 'rare'
      },
      {
        id: 'multi_asset',
        title: 'Portafolio Variado',
        description: 'Invierte en 5 activos diferentes',
        icon: '💎',
        unlocked: (platforms.length + assets.length) >= 5,
        progress: Math.min(platforms.length + assets.length, 5),
        total: 5,
        color: 'from-indigo-500 to-indigo-600',
        rarity: 'rare'
      },
      {
        id: 'positive_roi',
        title: 'En Positivo',
        description: 'Logra un ROI mayor a 0%',
        icon: '📈',
        unlocked: totalROI > 0,
        progress: totalROI > 0 ? 1 : 0,
        total: 1,
        color: 'from-green-500 to-green-600',
        rarity: 'common'
      },
      {
        id: 'roi_10',
        title: 'Rentabilidad Sólida',
        description: 'Alcanza un ROI de 10% o más',
        icon: '⭐',
        unlocked: totalROI >= 10,
        progress: Math.min(totalROI, 10),
        total: 10,
        color: 'from-yellow-500 to-yellow-600',
        rarity: 'rare'
      },
      {
        id: 'roi_20',
        title: 'Inversionista Experto',
        description: 'Logra un ROI de 20% o más',
        icon: '🔥',
        unlocked: totalROI >= 20,
        progress: Math.min(totalROI, 20),
        total: 20,
        color: 'from-orange-500 to-orange-600',
        rarity: 'epic'
      },
      {
        id: 'long_term',
        title: 'Inversionista de Largo Plazo',
        description: 'Invierte durante 6 meses o más',
        icon: '⏰',
        unlocked: monthsInvesting >= 6,
        progress: Math.min(monthsInvesting, 6),
        total: 6,
        color: 'from-teal-500 to-teal-600',
        rarity: 'rare'
      },
      {
        id: 'consistent',
        title: 'Disciplina Consistente',
        description: 'Realiza 10 actualizaciones',
        icon: '📊',
        unlocked: totalUpdates >= 10,
        progress: Math.min(totalUpdates, 10),
        total: 10,
        color: 'from-cyan-500 to-cyan-600',
        rarity: 'rare'
      },
      {
        id: 'whale',
        title: 'Ballena Inversionista',
        description: 'Alcanza 10,000 en inversiones',
        icon: '🐋',
        unlocked: totalValue >= 10000,
        progress: Math.min(totalValue, 10000),
        total: 10000,
        color: 'from-blue-600 to-blue-700',
        rarity: 'epic'
      },
      {
        id: 'millionaire',
        title: 'Millonario',
        description: 'Supera 1,000,000 en inversiones',
        icon: '💰',
        unlocked: totalValue >= 1000000,
        progress: Math.min(totalValue, 1000000),
        total: 1000000,
        color: 'from-yellow-600 to-yellow-700',
        rarity: 'legendary'
      }
    ];

    const unlockedCount = allAchievements.filter(a => a.unlocked).length;
    const totalCount = allAchievements.length;

    return {
      achievements: allAchievements,
      unlockedCount,
      totalCount,
      completionPercent: (unlockedCount / totalCount) * 100
    };
  }, [investments, displayCurrency, convertCurrency]);

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'common': return 'border-gray-300';
      case 'rare': return 'border-blue-400';
      case 'epic': return 'border-purple-500';
      case 'legendary': return 'border-yellow-500';
      default: return 'border-gray-300';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-800 flex items-center">
            <i className="fas fa-trophy mr-2 text-yellow-500"></i>
            Logros de Inversión
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {achievements.unlockedCount} de {achievements.totalCount} desbloqueados
          </p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-gray-800">
            {achievements.completionPercent.toFixed(0)}%
          </p>
          <p className="text-xs text-gray-500">Completado</p>
        </div>
      </div>

      {/* Barra de progreso global */}
      <div className="mb-6">
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${achievements.completionPercent}%` }}
          ></div>
        </div>
      </div>

      {/* Grid de logros */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {achievements.achievements.map((achievement) => (
          <div
            key={achievement.id}
            className={`${
              achievement.unlocked
                ? `border-2 ${getRarityColor(achievement.rarity)}`
                : 'border-2 border-gray-200 opacity-50'
            } rounded-lg p-4 text-center transition-all hover:scale-105 cursor-pointer`}
            title={achievement.description}
          >
            <div className={`text-4xl mb-2 ${achievement.unlocked ? '' : 'grayscale'}`}>
              {achievement.icon}
            </div>
            <h4 className={`text-xs font-semibold mb-1 ${
              achievement.unlocked ? 'text-gray-900' : 'text-gray-400'
            }`}>
              {achievement.title}
            </h4>
            
            {achievement.unlocked ? (
              <div className="flex items-center justify-center">
                <i className="fas fa-check-circle text-green-500 text-sm"></i>
              </div>
            ) : (
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-blue-500 h-1.5 rounded-full"
                    style={{ 
                      width: `${(achievement.progress / achievement.total) * 100}%` 
                    }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {achievement.progress}/{achievement.total}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Mensaje motivacional */}
      {achievements.completionPercent === 100 ? (
        <div className="mt-6 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-lg p-4 text-center">
          <p className="text-white font-bold text-lg mb-1">
            🎉 ¡Felicitaciones! 🎉
          </p>
          <p className="text-yellow-100 text-sm">
            Has desbloqueado todos los logros de inversión
          </p>
        </div>
      ) : (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <i className="fas fa-lightbulb mr-2"></i>
            {achievements.unlockedCount === 0 
              ? 'Comienza registrando tu primera inversión para desbloquear logros.'
              : `¡Sigue invirtiendo! Te faltan ${achievements.totalCount - achievements.unlockedCount} logros por desbloquear.`
            }
          </p>
        </div>
      )}
    </div>
  );
}