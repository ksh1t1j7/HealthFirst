import { AnalysisResult } from '@/lib/types';

interface RadarChartProps {
  data: AnalysisResult;
}

export default function RadarChart({ data }: RadarChartProps) {
  const params = data.parameters || [];
  if (params.length < 3) {
    return <div className="text-center py-10 text-muted-foreground text-sm">Not enough parameters to draw radar chart.</div>;
  }

  const pts = params.slice(0, 8);
  const n = pts.length;
  const cx = 200, cy = 200, r = 140;
  const levels = 4;
  const statusColors: Record<string, string> = { normal: '#4ade80', high: '#f87171', low: '#22d3ee', borderline: '#fbbf24' };

  const score = (p: any) => {
    const pct = Math.min(100, Math.max(0, p.barPercent || 50));
    return 1 - Math.abs(pct - 50) / 50;
  };

  const angle = (i: number) => ((2 * Math.PI * i) / n) - Math.PI / 2;
  const ptX = (i: number, dist: number) => cx + dist * Math.cos(angle(i));
  const ptY = (i: number, dist: number) => cy + dist * Math.sin(angle(i));

  let svgContent = '';
  for (let l = 1; l <= levels; l++) {
    const dist = r * (l / levels);
    const points = Array.from({ length: n }, (_, i) => `${ptX(i, dist)},${ptY(i, dist)}`).join(' ');
    svgContent += `<polygon points="${points}" fill="none" stroke="rgba(99,179,237,0.12)" stroke-width="1"/>`;
  }

  for (let i = 0; i < n; i++) {
    svgContent += `<line x1="${cx}" y1="${cy}" x2="${ptX(i, r)}" y2="${ptY(i, r)}" stroke="rgba(99,179,237,0.15)" stroke-width="1"/>`;
  }

  const normPts = pts.map((_, i) => `${ptX(i, r)},${ptY(i, r)}`).join(' ');
  svgContent += `<polygon points="${normPts}" fill="rgba(99,179,237,0.05)" stroke="rgba(99,179,237,0.25)" stroke-width="1.5" stroke-dasharray="4 3"/>`;

  const dataPts = pts.map((p, i) => `${ptX(i, r * score(p))},${ptY(i, r * score(p))}`).join(' ');
  svgContent += `<polygon points="${dataPts}" fill="rgba(34,211,238,0.15)" stroke="#22d3ee" stroke-width="2"/>`;

  pts.forEach((p, i) => {
    const s = score(p);
    const sc = (p.status || 'normal').toLowerCase();
    const px = ptX(i, r * s), py = ptY(i, r * s);
    svgContent += `<circle cx="${px}" cy="${py}" r="5" fill="${statusColors[sc] || '#4ade80'}" stroke="rgba(6,9,18,0.8)" stroke-width="1.5"/>`;
    const lx = ptX(i, r + 22), ly = ptY(i, r + 22);
    const anchor = lx < cx - 5 ? 'end' : lx > cx + 5 ? 'start' : 'middle';
    const name = p.name.length > 14 ? p.name.slice(0, 13) + '…' : p.name;
    svgContent += `<text x="${lx}" y="${ly}" fill="rgba(240,246,255,0.75)" font-size="10" font-family="Outfit,sans-serif" font-weight="600" text-anchor="${anchor}" dominant-baseline="middle">${name}</text>`;
  });

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-4">Spider chart showing how close each parameter is to its ideal value.</p>
      <div className="flex justify-center">
        <div className="w-full max-w-[420px]" dangerouslySetInnerHTML={{
          __html: `<svg viewBox="0 0 400 385" xmlns="http://www.w3.org/2000/svg" style="width:100%;display:block;">${svgContent}</svg>`
        }} />
      </div>
    </div>
  );
}
