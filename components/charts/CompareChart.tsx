import {
  Bar,
  Cell,
  ComposedChart,
  LabelList,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AnalysisResult, Parameter } from '@/lib/types';

interface CompareChartProps {
  data: AnalysisResult;
}

const STATUS_CONFIG: Record<string, { color: string; soft: string; label: string }> = {
  normal: { color: '#4ade80', soft: 'rgba(74, 222, 128, 0.18)', label: 'Within range' },
  high: { color: '#f87171', soft: 'rgba(248, 113, 113, 0.18)', label: 'Above range' },
  low: { color: '#22d3ee', soft: 'rgba(34, 211, 238, 0.18)', label: 'Below range' },
  borderline: { color: '#fbbf24', soft: 'rgba(251, 191, 36, 0.18)', label: 'Near boundary' },
};

function formatValue(value: number) {
  if (Math.abs(value) >= 1000) return value.toLocaleString();
  if (Math.abs(value) >= 100) return value.toFixed(0);
  if (Math.abs(value) >= 10) return value.toFixed(1).replace(/\.0$/, '');
  return value.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}

function shorten(label: string) {
  return label.length > 18 ? `${label.slice(0, 17)}…` : label;
}

function buildChartRows(parameters: Parameter[]) {
  return parameters
    .filter((parameter) => Number.isFinite(parameter.refLow) && Number.isFinite(parameter.refHigh) && parameter.refHigh > parameter.refLow)
    .slice(0, 12)
    .map((parameter) => {
      const status = STATUS_CONFIG[parameter.status] || STATUS_CONFIG.normal;
      const span = Math.max(parameter.refHigh - parameter.refLow, 0.0001);
      const domainMin = Math.min(parameter.refLow - span * 0.4, parameter.numericValue - span * 0.15);
      const domainMax = Math.max(parameter.refHigh + span * 0.4, parameter.numericValue + span * 0.15);
      const domainSpan = Math.max(domainMax - domainMin, 0.0001);
      const normalize = (value: number) => ((value - domainMin) / domainSpan) * 100;

      return {
        ...parameter,
        shortName: shorten(parameter.name),
        normalizedStart: Math.max(0, Math.min(100, normalize(parameter.refLow))),
        normalizedWidth: Math.max(4, normalize(parameter.refHigh) - normalize(parameter.refLow)),
        normalizedValue: Math.max(0, Math.min(100, normalize(parameter.numericValue))),
        domainMin,
        domainMax,
        statusColor: status.color,
        statusSoft: status.soft,
        statusLabel: status.label,
      };
    });
}

function CompareTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const datum = payload[0]?.payload;
  if (!datum) return null;

  return (
    <div className="min-w-[220px] rounded-2xl border border-border/70 bg-white/95 p-4 shadow-[0_18px_40px_rgba(111,76,255,0.14)] backdrop-blur">
      <div className="mb-1 text-sm font-bold text-foreground">{datum.name}</div>
      <div className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">{datum.statusLabel}</div>
      <div className="grid gap-2 text-sm text-muted-foreground">
        <div className="flex items-center justify-between gap-3">
          <span>Measured</span>
          <span className="font-mono font-bold text-foreground">
            {datum.value} {datum.unit || ''}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span>Reference range</span>
          <span className="font-mono">
            {formatValue(datum.refLow)} - {formatValue(datum.refHigh)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span>Display window</span>
          <span className="font-mono">
            {formatValue(datum.domainMin)} to {formatValue(datum.domainMax)}
          </span>
        </div>
        <div className="border-t border-border/70 pt-2 text-xs leading-relaxed">{datum.insight}</div>
      </div>
    </div>
  );
}

function MeasurementDot(props: any) {
  const { cx, cy, payload } = props;
  if (cx == null || cy == null || !payload) return null;
  return (
    <g>
      <circle cx={cx} cy={cy} r={10} fill={payload.statusSoft} />
      <circle cx={cx} cy={cy} r={6.5} fill={payload.statusColor} stroke="#ffffff" strokeWidth={2.5} />
      <circle cx={cx} cy={cy} r={2} fill="#0f172a" opacity={0.35} />
    </g>
  );
}

function ValueBadge(props: any) {
  const { x, y, width, value, payload } = props;
  if (x == null || y == null || width == null || !payload) return null;
  const label = `${value}`;
  const badgeX = x + width + 10;
  const badgeY = y - 2;

  return (
    <g>
      <rect
        x={badgeX - 4}
        y={badgeY - 11}
        width={Math.max(30, label.length * 7 + 8)}
        height={22}
        rx={11}
        fill="#ffffff"
        stroke={payload.statusSoft}
        strokeWidth={1.2}
      />
      <text
        x={badgeX + 6}
        y={badgeY + 4}
        fill={payload.statusColor}
        fontSize={11}
        fontWeight={700}
        fontFamily="Space Mono, monospace"
      >
        {label}
      </text>
    </g>
  );
}

export default function CompareChart({ data }: CompareChartProps) {
  const rows = buildChartRows(data.parameters || []);

  if (rows.length === 0) {
    return <div className="py-10 text-center text-sm text-muted-foreground">Numeric reference ranges not available for this report.</div>;
  }

  const chartHeight = Math.max(420, rows.length * 58);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Each marker is shown on its own normalized clinical scale so different lab units remain readable in one dashboard.
        </p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(STATUS_CONFIG).map(([key, config]) => (
            <div key={key} className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-white/80 px-3 py-1 text-xs font-semibold text-muted-foreground">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: config.color }} />
              {config.label}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[24px] border border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(244,240,255,0.9))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
        <div style={{ height: chartHeight }} className="w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={rows}
              layout="vertical"
              margin={{ top: 10, right: 92, bottom: 14, left: 18 }}
              barCategoryGap={16}
            >
              <XAxis
                type="number"
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                tick={{ fill: '#8c84b7', fontSize: 11 }}
                tickFormatter={(value) => `${value}%`}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="shortName"
                width={120}
                tick={{ fill: '#5b5678', fontSize: 11, fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip cursor={{ fill: 'rgba(124,92,255,0.04)' }} content={<CompareTooltip />} />

              <ReferenceLine x={25} stroke="rgba(124,92,255,0.12)" strokeDasharray="3 5" />
              <ReferenceLine x={50} stroke="rgba(124,92,255,0.12)" strokeDasharray="3 5" />
              <ReferenceLine x={75} stroke="rgba(124,92,255,0.12)" strokeDasharray="3 5" />

              <Bar dataKey={() => 100} fill="rgba(124,92,255,0.05)" barSize={24} radius={12} />
              <Bar dataKey="normalizedStart" stackId="range" fill="transparent" barSize={18} />
              <Bar dataKey="normalizedWidth" stackId="range" fill="url(#compareRange)" barSize={18} radius={10}>
                {rows.map((row) => (
                  <Cell key={row.name} fill="url(#compareRange)" />
                ))}
              </Bar>

              <Scatter data={rows} dataKey="normalizedValue" shape={<MeasurementDot />} />

              <Bar dataKey="normalizedValue" fill="transparent" barSize={2}>
                {rows.map((row) => (
                  <Cell key={row.name} fill="transparent" />
                ))}
                <LabelList dataKey="value" content={<ValueBadge />} />
              </Bar>

              <defs>
                <linearGradient id="compareRange" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="rgba(124,92,255,0.50)" />
                  <stop offset="100%" stopColor="rgba(95,215,231,0.55)" />
                </linearGradient>
              </defs>
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 grid gap-2 md:grid-cols-3">
          <div className="rounded-2xl border border-border/70 bg-white/80 px-4 py-3 text-xs text-muted-foreground">
            The full pale row is the display window for that individual marker.
          </div>
          <div className="rounded-2xl border border-border/70 bg-white/80 px-4 py-3 text-xs text-muted-foreground">
            The gradient band is the healthy reference interval for that marker.
          </div>
          <div className="rounded-2xl border border-border/70 bg-white/80 px-4 py-3 text-xs text-muted-foreground">
            The colored dot shows where your measured value sits relative to that marker’s own range.
          </div>
        </div>
      </div>
    </div>
  );
}
