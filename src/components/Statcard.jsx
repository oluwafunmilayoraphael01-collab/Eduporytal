function StatCard({ title, value, change, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <h3 className="mt-3 text-3xl font-bold tracking-tight text-gray-900">
            {value}
          </h3>
        </div>

        <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
          {Icon && <Icon size={22} />}
        </div>
      </div>

      {change && (
        <p className="mt-4 text-xs font-medium text-emerald-600">{change}</p>
      )}
    </div>
  );
}

export default StatCard;