/** Animated placeholder rows shown while the menu tree is loading. */
export function LoadingSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading menus">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3"
          style={{ paddingLeft: `${(i % 3) * 20}px` }}
        >
          <div className="h-4 w-4 animate-pulse rounded bg-slate-200" />
          <div
            className="h-4 animate-pulse rounded bg-slate-200"
            style={{ width: `${140 - (i % 3) * 20}px` }}
          />
        </div>
      ))}
    </div>
  );
}
