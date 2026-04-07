import { AnalysisResult, Parameter } from '@/lib/types';

interface DonutChartProps {
  data: AnalysisResult;
}

export default function DonutChart({ data }: DonutChartProps) {
  const params = data.parameters || [];
  const counts: Record<string, number> = { normal: 0, high: 0, low: 0, borderline: 0 };
  params.forEach((p) => {
    const s = (p.status || 'normal').toLowerCase();
    if (s in counts) counts[s]++;
  });
  const total = params.length || 1;
  const colors: Record<string, string> = { normal: '#4ade80', high: '#f87171', low: '#22d3ee', borderline: '#fbbf24' };
  const labels: Record<string, string> = { normal: 'Normal', high: 'High', low: 'Low', borderline: 'Borderline' };
  const r = 72, stroke = 28, circ = 2 * Math.PI * r;
  let offset = 0;
  const segments: string[] = [];

  Object.entries(counts).forEach(([k, v]) => {
    if (v === 0) return;
    const dash = circ * (v / total);
    const gap = circ - dash;
    segments.push(`<circle cx="100" cy="100" r="${r}" fill="none" stroke="${colors[k]}" stroke-width="${stroke}" stroke-dasharray="${dash} ${gap}" stroke-dashoffset="${-offset}" stroke-linecap="butt" style="transition:stroke-dasharray 1s ease,stroke-dashoffset 1s ease"/>`);
    offset += dash;
  });

  const svg = `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style="transform:rotate(-90deg)">${segments.join('')}</svg>`;

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-5">Distribution of your parameters across status categories.</p>
      <div className="flex items-center gap-10 flex-wrap">
        <div className="relative w-[200px] h-[200px] flex-shrink-0 mx-auto">
          <div dangerouslySetInnerHTML={{ __html: svg }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
            <div className="font-mono text-3xl font-bold">{total}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Total</div>
          </div>
        </div>
        <div className="flex flex-col gap-3 flex-1">
          {Object.entries(counts).filter(([, v]) => v > 0).map(([k, v]) => (
            <div key={k} className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: colors[k] }} />
              <div className="flex-1">
                <div className="text-sm font-semibold">{labels[k]}</div>
                <div className="text-xs text-muted-foreground">{v} parameter{v !== 1 ? 's' : ''}</div>
              </div>
              <div className="font-mono text-sm text-muted-foreground">{Math.round(v / total * 100)}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
