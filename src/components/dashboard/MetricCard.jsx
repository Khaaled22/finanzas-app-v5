// src/components/dashboard/MetricCard.jsx
export default function MetricCard({ title, value, currency, subtitle, icon, color, highlight = false }) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    red: 'from-red-500 to-red-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600'
  };

  const bgClass = highlight
    ? `bg-gradient-to-br ${colorClasses[color]} text-white`
    : 'bg-white';
  const textClass = highlight ? 'text-white' : 'text-gray-800';
  const subtitleClass = highlight ? 'text-white/80' : 'text-gray-500';

  return (
    <div className={`${bgClass} rounded-xl shadow-lg p-6 hover:shadow-xl transition-all ${highlight ? 'ring-2 ring-offset-2 ring-green-300' : ''}`}>
      <div className="flex items-center justify-between mb-4">
        <span className={`text-sm font-medium ${highlight ? 'text-white/90' : 'text-gray-600'}`}>
          {title}
        </span>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${highlight ? 'bg-white/20' : `bg-${color}-100`}`}>
          <i className={`fas ${icon} ${highlight ? 'text-white' : `text-${color}-600`}`}></i>
        </div>
      </div>
      <p className={`text-3xl font-bold ${textClass}`}>
        {value}
        <span className="text-lg ml-1 font-normal opacity-70">{currency}</span>
      </p>
      {subtitle && (
        <p className={`text-sm mt-2 ${subtitleClass}`}>{subtitle}</p>
      )}
    </div>
  );
}
