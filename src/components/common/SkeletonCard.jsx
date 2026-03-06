// src/components/common/SkeletonCard.jsx
export default function SkeletonCard({ className = '' }) {
  return (
    <div className={`animate-pulse bg-white rounded-2xl p-6 shadow ${className}`}>
      <div className="h-3 bg-gray-200 rounded w-1/3 mb-4" />
      <div className="h-8 bg-gray-200 rounded w-2/3 mb-3" />
      <div className="h-3 bg-gray-100 rounded w-1/2" />
    </div>
  );
}
