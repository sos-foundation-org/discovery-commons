// Shown immediately on navigation while the server renders the target page.
// Turns "clicked but nothing happened" into instant visual feedback.
export default function Loading() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 animate-pulse">
      <div className="h-8 w-2/3 rounded bg-muted mb-4" />
      <div className="h-4 w-1/3 rounded bg-muted mb-8" />
      <div className="space-y-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-lg border p-5">
            <div className="h-5 w-1/2 rounded bg-muted mb-3" />
            <div className="h-4 w-full rounded bg-muted mb-2" />
            <div className="h-4 w-5/6 rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
