import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { SimpleChart } from "./simple-chart";

// Renders contribution / thread body text as real Markdown (GFM: tables, lists,
// code, links) and turns ```chart fenced blocks into reproducible SVG charts.
// Splitting the chart blocks out first keeps the markdown pipeline simple and
// lets charts render as block-level figures rather than inside <pre>.

type Segment = { type: "md" | "chart"; text: string };

function splitChartBlocks(content: string): Segment[] {
  const re = /```chart\s*\n([\s\S]*?)```/g;
  const out: Segment[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    if (m.index > last) {
      out.push({ type: "md", text: content.slice(last, m.index) });
    }
    out.push({ type: "chart", text: m[1].trim() });
    last = re.lastIndex;
  }
  if (last < content.length) {
    out.push({ type: "md", text: content.slice(last) });
  }
  return out.length ? out : [{ type: "md", text: content }];
}

export function ContributionContent({
  content,
  className = "",
}: {
  content: string;
  className?: string;
}) {
  const segments = splitChartBlocks(content);
  return (
    <div className={`space-y-2 ${className}`}>
      {segments.map((seg, i) =>
        seg.type === "chart" ? (
          <SimpleChart key={i} spec={seg.text} />
        ) : seg.text.trim() ? (
          <div
            key={i}
            className="prose prose-neutral dark:prose-invert max-w-none text-[15px] leading-relaxed prose-headings:font-semibold prose-pre:bg-muted prose-pre:text-foreground prose-code:before:content-none prose-code:after:content-none prose-img:rounded-lg"
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {seg.text}
            </ReactMarkdown>
          </div>
        ) : null
      )}
    </div>
  );
}
