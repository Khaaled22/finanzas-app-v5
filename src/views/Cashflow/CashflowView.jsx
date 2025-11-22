// src/views/Cashflow/CashflowView.jsx
import { useApp } from '../../context/AppContext';
import { useProjection } from '../../hooks/useProjection';
import LineChart from '../../components/charts/LineChart';

export default function CashflowView() {
  const { displayCurrency } = useApp();
  const { cashflowProjection, projectionStats } = useProjection();

  const cashflowChartData = {
    labels: cashflowProjection.map(p => p.month),
    datasets: [
      {
        label: 'Ingresos',
        data: cashflowProjection.map(p => p.income),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderWidth: 3,
        tension: 0.1,
        fill: true
      },
      {
        label: 'Gastos',
        data: cashflowProjection.map(p => p.expenses),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 3,
        tension: 0.1,
        fill: true
      },
      {
        label: 'Balance Acumulado',
        data: cashflowProjection.map(p => p.cumulativeBalance),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.05)',
        borderWidth: 2,
        borderDash: [5, 5],
        tension: 0.1
      }
    ]
  };

  return (
    <div className="space-y-6 animate-in">
      {/* Banner */}
      <div className="bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 rounded-2xl p-8 text-white shadow-2xl">
        <h2 className="text-3xl font-bold mb-2">
          <i className="fas fa-chart-line mr-3"></i>
          Proyección de Cashflow
        </h2>
        <p className="text-cyan-100">
          Visualización de flujo de efectivo para los próximos 12 meses
        </p>
      </div>

      {/* Métricas Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <p className="text-gray-600 text-sm mb-1">Balance Final (12 meses)</p>
          <p className={`text-3xl font-bold ${projectionStats.finalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {projectionStats.finalBalance.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 mt-1">{displayCurrency}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg">
          <p className="text-gray-600 text-sm mb-1">Cashflow Promedio Mensual</p>
          <p className={`text-3xl font-bold ${projectionStats.avgNetCashflow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {projectionStats.avgNetCashflow.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 mt-1">{displayCurrency}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg">
          <p className="text-gray-600 text-sm mb-1">Meses con Déficit</p>
          <p className={`text-3xl font-bold ${projectionStats.deficitMonths === 0 ? 'text-green-600' : 'text-orange-600'}`}>
            {projectionStats.deficitMonths}
          </p>
          <p className="text-xs text-gray-500 mt-1">de 12 meses</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg">
          <p className="text-gray-600 text-sm mb-1">Estado Financiero</p>
          <div className="flex items-center mt-2">
            {projectionStats.isHealthy ? (
              <>
                <i className="fas fa-check-circle text-3xl text-green-600 mr-2"></i>
                <span className="text-xl font-bold text-green-600">Saludable</span>
              </>
            ) : (
              <>
                <i className="fas fa-exclamation-triangle text-3xl text-orange-600 mr-2"></i>
                <span className="text-xl font-bold text-orange-600">Atención</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Gráfico Principal */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          <i className="fas fa-chart-area mr-2 text-blue-600"></i>
          Proyección Anual de Cashflow
        </h3>

        {/* M11: Chart container agregado */}
        <div className="chart-container">
          <LineChart data={cashflowChartData} height={400} />
        </div>
      </div>

      {/* Tabla Detallada */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-4">
          <h3 className="text-xl font-bold text-white">
            <i className="fas fa-table mr-2"></i>
            Detalle Mensual
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mes</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ingresos</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Gastos</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Deudas</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Neto</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Balance Acum.</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {cashflowProjection.map((month, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {month.month}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600 font-semibold">
                    {month.income.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">
                    {month.expenses.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-orange-600">
                    {month.debtPayments.toFixed(2)}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-semibold ${month.netCashflow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {month.netCashflow >= 0 ? '+' : ''}{month.netCashflow.toFixed(2)}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold ${month.cumulativeBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    {month.cumulativeBalance.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>

          </table>
        </div>
      </div>
    </div>
  );
}
