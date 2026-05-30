export default function ReaderLoading() {
  return (
    <div className="min-h-screen bg-reader-bg flex flex-col">
      {/* Topbar skeleton */}
      <div className="h-12 bg-reader-surface border-b border-reader-border flex items-center px-4 gap-3">
        <div className="h-5 w-32 bg-reader-skeleton rounded animate-pulse" />
        <div className="ml-auto flex gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 w-8 bg-reader-skeleton rounded-lg animate-pulse" />
          ))}
        </div>
      </div>

      {/* Pages skeleton */}
      <div className="flex-1 flex flex-col items-center gap-0 bg-reader-bg pt-0">
        {[16 / 11, 16 / 11, 16 / 11].map((ratio, i) => (
          <div
            key={i}
            className="w-full max-w-2xl bg-reader-skeleton animate-pulse"
            style={{ aspectRatio: `1 / ${ratio}` }}
          />
        ))}
      </div>
    </div>
  );
}