import {
  CREDIT_DIMENSIONS,
  CREDIT_DIMENSION_CONFIG,
} from "@/lib/types";

// Horizontal bar visualization across all nine credit dimensions.
export function CreditDistribution({
  byDimension,
  showEmpty = true,
}: {
  byDimension: Record<string, number>;
  showEmpty?: boolean;
}) {
  const max = Math.max(1, ...Object.values(byDimension));
  const dimensions = showEmpty
    ? CREDIT_DIMENSIONS
    : CREDIT_DIMENSIONS.filter((d) => (byDimension[d] || 0) > 0);

  if (dimensions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No credits recorded yet across the nine dimensions.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {dimensions.map((dimension) => {
        const config = CREDIT_DIMENSION_CONFIG[dimension];
        const value = byDimension[dimension] || 0;
        const pct = Math.round((value / max) * 100);
        return (
          <div key={dimension}>
            <div className="mb-0.5 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5" title={config.description}>
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: config.color }}
                />
                {config.label}
              </span>
              <span className="text-muted-foreground">{value.toFixed(2)}</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, backgroundColor: config.color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
