// src/components/dashboard/MiniKPI.jsx
export default function MiniKPI({ label, value, suffix = '', icon, status }) {
  const statusColors = {
    good: 'bg-green-50 border-green-200 text-green-700',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    danger: 'bg-red-50 border-red-200 text-red-700',
    neutral: 'bg-gray-50 border-gray-200 text-gray-700'
  };

  return (
    <div className={`p-4 rounded-lg border-2 ${statusColors[status]}`}>
      <div className="flex items-center gap-2 mb-1">
        <i className={`fas ${icon} text-sm opacity-70`}></i>
        <span className="text-xs font-medium opacity-80">{label}</span>
      </div>
      <p className="text-lg font-bold">
        {value} {suffix && <span className="text-sm font-normal">{suffix}</span>}
      </p>
    </div>
  );
}
