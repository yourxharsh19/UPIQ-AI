const SkeletonLoader = ({ type = "card", count = 1 }) => {
  const CardSkeleton = () => (
    <div className="bg-[var(--bg-card)] p-6 rounded-xl border border-[var(--border-base)] shadow-sm animate-pulse">
      <div className="h-4 bg-[var(--bg-surface)] rounded w-1/4 mb-4"></div>
      <div className="h-8 bg-[var(--bg-surface)] rounded w-1/2 mb-2"></div>
      <div className="h-4 bg-[var(--bg-surface)] rounded w-3/4"></div>
    </div>
  );

  const KPISkeleton = () => (
    <div className="bg-[var(--bg-card)] rounded-xl shadow-sm border border-[var(--border-base)] overflow-hidden animate-pulse">
      <div className="p-5 bg-[var(--bg-surface)]">
        <div className="h-4 bg-[var(--bg-card)] rounded w-1/3 mb-2"></div>
        <div className="h-8 bg-[var(--bg-card)] rounded w-1/2"></div>
      </div>
    </div>
  );

  const TableSkeleton = () => (
    <div className="bg-[var(--bg-card)] rounded-xl shadow-sm border border-[var(--border-base)] animate-pulse">
      <div className="p-6">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between py-4 border-b border-[var(--border-base)]">
              <div className="flex items-center gap-4 flex-1">
                <div className="h-10 w-10 bg-[var(--bg-main)] rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-4 bg-[var(--bg-main)] rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-[var(--bg-main)] rounded w-1/4"></div>
                </div>
              </div>
              <div className="h-6 bg-[var(--bg-main)] rounded w-24"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const components = {
    card: CardSkeleton,
    kpi: KPISkeleton,
    table: TableSkeleton
  };

  const Component = components[type] || CardSkeleton;

  if (count === 1) {
    return <Component />;
  }

  return (
    <div className={type === "kpi" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" : "space-y-4"}>
      {[...Array(count)].map((_, i) => (
        <Component key={i} />
      ))}
    </div>
  );
};

export default SkeletonLoader;

