// Visualizes the AI Reviewer's confidence score (0.0–1.0).
export function AIConfidenceBar({ score }: { score: number }) {
  const pct = Math.round(Math.min(1, Math.max(0, score)) * 100);
  // Low confidence reads amber/red; high reads green.
  const color = pct >= 70 ? "#22C55E" : pct >= 40 ? "#F59E0B" : "#F43F5E";

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">AI confidence</span>
        <span className="font-medium">{pct}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
