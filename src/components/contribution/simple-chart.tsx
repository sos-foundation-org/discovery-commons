// Zero-dependency, server-rendered chart from a JSON spec embedded in a
// ```chart fenced code block. The spec is plain text stored in the contribution,
// so it is hashed, versioned, and reproduces identically — a natural fit for
// DC's verification model. Supports bar and line; extend later with Vega-Lite.
//
// Spec shape:
//   { "type": "bar" | "line", "title"?: string, "unit"?: string,
//     "data": [{ "label": string, "value": number }] }

interface ChartSpec {
  type?: "bar" | "line";
  title?: string;
  unit?: string;
  data?: { label: string; value: number }[];
}

const BAR_COLORS = [
  "#3b82f6",
  "#22c55e",
  "#a855f7",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#ec4899",
  "#6366f1",
];

export function SimpleChart({ spec }: { spec: string }) {
  let parsed: ChartSpec | null = null;
  try {
    parsed = JSON.parse(spec);
  } catch {
    parsed = null;
  }

  const data = parsed?.data;
  if (!parsed || !Array.isArray(data) || data.length === 0) {
    return (
      <pre className="overflow-x-auto rounded-lg border bg-muted p-3 text-xs">
        {spec}
      </pre>
    );
  }

  const type = parsed.type === "line" ? "line" : "bar";
  const max = Math.max(...data.map((d) => Number(d.value) || 0), 1);
  const W = 640;
  const H = 240;
  const padL = 44;
  const padB = 44;
  const padT = parsed.title ? 28 : 12;
  const plotW = W - padL - 16;
  const plotH = H - padT - padB;

  return (
    <figure className="my-3 overflow-x-auto rounded-xl border bg-card p-3">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label={parsed.title || "chart"}
      >
        {parsed.title && (
          <text x={padL} y={18} className="fill-foreground" fontSize="14" fontWeight="600">
            {parsed.title}
          </text>
        )}
        {/* baseline */}
        <line
          x1={padL}
          y1={padT + plotH}
          x2={padL + plotW}
          y2={padT + plotH}
          stroke="currentColor"
          className="text-border"
        />
        {type === "bar"
          ? data.map((d, i) => {
              const bw = plotW / data.length;
              const h = ((Number(d.value) || 0) / max) * plotH;
              const x = padL + i * bw + bw * 0.15;
              const y = padT + plotH - h;
              return (
                <g key={i}>
                  <rect
                    x={x}
                    y={y}
                    width={bw * 0.7}
                    height={h}
                    rx="3"
                    fill={BAR_COLORS[i % BAR_COLORS.length]}
                  />
                  <text
                    x={x + bw * 0.35}
                    y={padT + plotH + 16}
                    textAnchor="middle"
                    fontSize="11"
                    className="fill-muted-foreground"
                  >
                    {truncate(d.label, 10)}
                  </text>
                  <text
                    x={x + bw * 0.35}
                    y={y - 4}
                    textAnchor="middle"
                    fontSize="10"
                    className="fill-foreground"
                  >
                    {d.value}
                  </text>
                </g>
              );
            })
          : (() => {
              const step = data.length > 1 ? plotW / (data.length - 1) : 0;
              const pts = data.map((d, i) => {
                const x = padL + i * step;
                const y = padT + plotH - ((Number(d.value) || 0) / max) * plotH;
                return { x, y, d };
              });
              const path = pts
                .map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`)
                .join(" ");
              return (
                <g>
                  <path d={path} fill="none" stroke="#3b82f6" strokeWidth="2" />
                  {pts.map((p, i) => (
                    <g key={i}>
                      <circle cx={p.x} cy={p.y} r="3" fill="#3b82f6" />
                      <text
                        x={p.x}
                        y={padT + plotH + 16}
                        textAnchor="middle"
                        fontSize="11"
                        className="fill-muted-foreground"
                      >
                        {truncate(p.d.label, 10)}
                      </text>
                    </g>
                  ))}
                </g>
              );
            })()}
      </svg>
      {parsed.unit && (
        <figcaption className="mt-1 text-center text-xs text-muted-foreground">
          {parsed.unit}
        </figcaption>
      )}
    </figure>
  );
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}
