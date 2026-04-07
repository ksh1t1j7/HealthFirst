import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { AnalysisResult } from '@/lib/types';
import { ModelSupportInfo } from '@/lib/modelSupport';
import { fetchSavedReports } from '@/lib/reportEntries';
import { compareReportValues, getLatestPreviousReport, getRecommendationCard, getTestLabel } from '@/lib/reportAnalytics';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';
import MetricsRail from '@/components/MetricsRail';
import HealthCopilotDrawer from '@/components/HealthCopilotDrawer';

const DonutChart = lazy(() => import('./charts/DonutChart'));
const CompareChart = lazy(() => import('./charts/CompareChart'));
const RadarChart = lazy(() => import('./charts/RadarChart'));

interface AnalysisResultsProps {
  data: AnalysisResult;
  testType: string;
  currentValues: Record<string, string>;
  onReset: () => void;
  supportInfo?: ModelSupportInfo | null;
  sourcePreviewUrl?: string | null;
}

const insightIcons: Record<string, string> = { positive: '💚', warning: '⚠️', tip: '💡', info: 'ℹ️' };
const statusColors: Record<string, string> = { normal: 'text-success', high: 'text-destructive', low: 'text-primary', borderline: 'text-warning' };
const barColors: Record<string, string> = { normal: 'bg-gradient-to-r from-success to-green-500', high: 'bg-gradient-to-r from-destructive to-red-500', low: 'bg-gradient-to-r from-primary to-cyan-500', borderline: 'bg-gradient-to-r from-warning to-amber-500' };
const statusBg: Record<string, string> = { normal: 'bg-success/12', high: 'bg-destructive/12', low: 'bg-primary/12', borderline: 'bg-warning/12' };

export default function AnalysisResults({ data, testType, currentValues, onReset, supportInfo, sourcePreviewUrl }: AnalysisResultsProps) {
  const { isAuthenticated } = useAuth();
  const [activeChart, setActiveChart] = useState('compare');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [score, setScore] = useState(0);
  const [expandedParameter, setExpandedParameter] = useState<string | null>(null);
  const [savedReports, setSavedReports] = useState<any[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      setSavedReports([]);
      return;
    }
    fetchSavedReports().then(setSavedReports).catch(() => setSavedReports([]));
  }, [isAuthenticated, testType, data.reportMeta?.analyzedAt]);

  const previousReport = useMemo(
    () => getLatestPreviousReport(savedReports, testType),
    [savedReports, testType]
  );
  const comparison = useMemo(
    () => compareReportValues(testType, currentValues, previousReport),
    [currentValues, previousReport, testType]
  );
  const trendStory = useMemo(
    () =>
      comparison.length > 0
        ? comparison.slice(0, 3).map((point) => ({
            title:
              point.direction === 'flat'
                ? `${point.name} stayed stable`
                : point.direction === 'up'
                  ? `${point.name} is drifting upward`
                  : `${point.name} is settling lower`,
            body: point.summary,
          }))
        : [],
    [comparison]
  );

  const params = data.parameters || [];
  const counts = { all: params.length, normal: 0, high: 0, low: 0, borderline: 0 };
  params.forEach((parameter) => {
    const status = (parameter.status || 'normal').toLowerCase() as keyof typeof counts;
    if (status in counts) counts[status] += 1;
  });

  useEffect(() => {
    const target = data.healthScore || 75;
    let current = 0;
    const step = target / 50;
    const timer = setInterval(() => {
      current = Math.min(target, current + step);
      setScore(Math.round(current));
      if (current >= target) clearInterval(timer);
    }, 20);
    return () => clearInterval(timer);
  }, [data.healthScore]);

  const filteredParams = params.filter((parameter) => {
    const matchesFilter = filter === 'all' || parameter.status === filter;
    const matchesSearch = !search || parameter.name.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const statusClass =
    data.overallStatus === 'Normal'
      ? 'bg-success/10 border-success/30 text-success'
      : data.overallStatus === 'Needs Attention'
        ? 'bg-warning/10 border-warning/30 text-warning'
        : 'bg-destructive/10 border-destructive/30 text-destructive';

  const scoreColor = score >= 70 ? '#4ade80' : score >= 45 ? '#fbbf24' : '#f87171';
  const pct = Math.min(100, Math.max(0, data.healthScore || 75));
  const keyTakeaways = data.keyTakeaways || [];
  const reminders = data.reminders || [];
  const abnormalCount = params.filter((parameter) => parameter.status !== 'normal').length;
  const panelTheme =
    testType === 'retina'
      ? 'bg-[linear-gradient(135deg,rgba(237,255,255,0.92),rgba(243,240,255,0.94))]'
      : testType === 'thyroid'
        ? 'bg-[linear-gradient(135deg,rgba(255,247,237,0.92),rgba(254,242,248,0.94))]'
        : testType === 'cbc'
          ? 'bg-[linear-gradient(135deg,rgba(255,245,247,0.94),rgba(239,246,255,0.94))]'
          : 'bg-[linear-gradient(135deg,rgba(255,255,255,0.95),rgba(246,242,255,0.92))]';

  async function handleDownloadPdf() {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    let y = 18;

    doc.setFillColor(111, 76, 255);
    doc.roundedRect(14, 10, 182, 18, 4, 4, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('HealthFirst Blood Report Summary', 20, 22);

    doc.setTextColor(34, 34, 34);
    doc.setFontSize(11);
    y = 38;
    doc.text(`Panel: ${data.testName || getTestLabel(testType)}`, 14, y);
    y += 7;
    doc.text(`Generated: ${new Date(data.reportMeta?.analyzedAt || Date.now()).toLocaleString()}`, 14, y);
    y += 7;
    doc.text(`Overall status: ${data.overallStatus} | Health score: ${data.healthScore}/100`, 14, y);

    y += 12;
    doc.setFont('helvetica', 'bold');
    doc.text('Detected Values', 14, y);
    y += 7;
    doc.setFont('helvetica', 'normal');
    params.slice(0, 12).forEach((parameter) => {
      doc.text(`${parameter.name}: ${parameter.value} (${parameter.status})`, 14, y);
      y += 6;
    });

    y += 4;
    doc.setFont('helvetica', 'bold');
    doc.text('Key Takeaways', 14, y);
    y += 7;
    doc.setFont('helvetica', 'normal');
    (keyTakeaways.length > 0 ? keyTakeaways : [{ title: 'Summary', body: data.summary }]).forEach((takeaway) => {
      const lines = doc.splitTextToSize(`${takeaway.title}: ${takeaway.body}`, 178);
      doc.text(lines, 14, y);
      y += lines.length * 5 + 2;
    });

    y += 2;
    doc.setFont('helvetica', 'bold');
    doc.text('Lifestyle Suggestions', 14, y);
    y += 7;
    doc.setFont('helvetica', 'normal');
    params
      .filter((parameter) => parameter.status !== 'normal')
      .slice(0, 5)
      .forEach((parameter) => {
        const card = getRecommendationCard(parameter.name, parameter.status);
        const lines = doc.splitTextToSize(`${parameter.name}: ${card.foodTips.slice(0, 3).join(', ')}. ${card.repeatAfter}`, 178);
        doc.text(lines, 14, y);
        y += lines.length * 5 + 2;
      });

    doc.save(`healthfirst-${testType}-summary.pdf`);
    toast.success('PDF summary downloaded.');
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-[32px] border border-border/70 ${panelTheme} p-6 shadow-[0_30px_90px_rgba(111,76,255,0.08)] md:p-9`}
    >
      <div className="grid gap-6 xl:grid-cols-[1fr_220px]">
      <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="mb-1 text-xs font-bold uppercase tracking-widest text-primary">Analysis Complete</div>
          <h2 className="text-2xl font-bold">{data.testName || getTestLabel(testType)} Results</h2>
          <div className="mt-2 text-sm text-muted-foreground">
            {new Date(data.reportMeta?.analyzedAt || Date.now()).toLocaleString()}
          </div>
        </div>
        <div className={cn('inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-widest', statusClass)}>
          {data.urgentAttention ? '🚨' : '✅'} {data.overallStatus}
        </div>
      </div>

      {data.urgentAttention && (
        <div className="mb-6 rounded-[26px] border border-destructive/20 bg-destructive/6 p-5">
          <div className="mb-2 text-sm font-bold uppercase tracking-widest text-destructive">Urgent Attention Banner</div>
          <div className="text-sm leading-relaxed text-muted-foreground">
            One or more markers are clearly outside the expected range. Use the recommendation cards below, compare with your previous report, and seek medical review sooner if symptoms are present.
          </div>
        </div>
      )}

      <div className="mb-7 grid items-start gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[28px] border border-primary/15 bg-[linear-gradient(135deg,rgba(111,76,255,0.08),rgba(116,232,211,0.08))] p-7">
          <div className="grid items-center gap-6 sm:grid-cols-[auto_1fr]">
            <div className="relative h-[70px] w-[110px] flex-shrink-0">
              <svg viewBox="0 0 110 62" className="h-full w-full">
                <path d="M9 55 A46 46 0 0 1 101 55" fill="none" stroke="rgba(99,179,237,0.1)" strokeWidth="9" strokeLinecap="round" />
                <path
                  d="M9 55 A46 46 0 0 1 101 55"
                  fill="none"
                  stroke={scoreColor}
                  strokeWidth="9"
                  strokeLinecap="round"
                  strokeDasharray={`${(144.5 * pct) / 100} 144.5`}
                />
              </svg>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center leading-none">
                <span className="font-mono text-2xl font-bold">{score}</span>
                <small className="mt-0.5 block text-[0.55rem] uppercase tracking-wider text-muted-foreground">/100</small>
              </div>
            </div>
            <div>
              <div className="mb-2 text-lg font-bold">Smart Health Summary</div>
              <p className="text-sm leading-relaxed text-muted-foreground">{data.summary}</p>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-border/70 bg-secondary/60 p-6">
          <div className="mb-3 text-xs font-bold uppercase tracking-widest text-primary">Key Takeaways</div>
          <div className="space-y-3">
            {keyTakeaways.map((takeaway) => (
              <div key={takeaway.title} className="rounded-[20px] border border-border/70 bg-white/80 p-4">
                <div className="mb-1 text-sm font-bold">{takeaway.title}</div>
                <div className="text-xs leading-relaxed text-muted-foreground">{takeaway.body}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {supportInfo && (
        <div className="mb-7 rounded-[28px] border border-border/70 bg-secondary/70 p-5">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="mb-1 text-xs font-bold uppercase tracking-widest text-primary">Analysis Engine</div>
              <div className="text-base font-bold">
                {supportInfo.strategy === 'model'
                  ? 'Offline Trained ML/DL Model'
                  : supportInfo.strategy === 'vision'
                    ? 'Retina Vision Screening Engine'
                    : 'Reference Range Rule Engine'}
              </div>
            </div>
            <span className={cn(
              'rounded-full border px-3 py-1 text-[0.68rem] font-bold uppercase tracking-wider',
              supportInfo.strategy === 'model'
                ? 'border-success/30 bg-success/10 text-success'
                : supportInfo.strategy === 'vision'
                  ? 'border-primary/30 bg-primary/10 text-primary'
                  : 'border-warning/30 bg-warning/10 text-warning'
            )}>
              {supportInfo.strategy === 'model'
                ? `${supportInfo.bestModel?.toUpperCase() || 'ML/DL'} Ready`
                : supportInfo.strategy === 'vision'
                  ? 'Vision Ready'
                  : 'Rules Ready'}
            </span>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">{supportInfo.note}</p>
          {data.reportMeta && (
            <div className="mt-3 flex flex-wrap gap-2">
              {data.reportMeta.backendMode && (
                <span className="rounded-full border border-border/70 bg-white/75 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-wider text-muted-foreground">
                  {data.reportMeta.backendMode === 'backend' ? 'Backend inference' : 'Browser fallback'}
                </span>
              )}
              {data.reportMeta.extractionMethod && (
                <span className="rounded-full border border-border/70 bg-white/75 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-wider text-muted-foreground">
                  {data.reportMeta.extractionMethod}
                </span>
              )}
              {typeof data.reportMeta.extractionConfidence === 'number' && (
                <span className="rounded-full border border-border/70 bg-white/75 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-wider text-muted-foreground">
                  {Math.round(data.reportMeta.extractionConfidence * 100)}% OCR confidence
                </span>
              )}
              {data.reportMeta.pageCount ? (
                <span className="rounded-full border border-border/70 bg-white/75 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-wider text-muted-foreground">
                  {data.reportMeta.pageCount} page{data.reportMeta.pageCount === 1 ? '' : 's'}
                </span>
              ) : null}
            </div>
          )}
        </div>
      )}

      <div className="mb-7 grid grid-cols-2 gap-4 md:grid-cols-4">
        {([
          { key: 'normal', label: 'Normal', color: 'text-success' },
          { key: 'high', label: 'High', color: 'text-destructive' },
          { key: 'low', label: 'Low', color: 'text-primary' },
          { key: 'borderline', label: 'Borderline', color: 'text-warning' },
        ] as const).map(({ key, label, color }) => (
          <div key={key} className="rounded-[22px] border border-border/70 bg-white/75 p-5 text-center shadow-[0_12px_24px_rgba(111,76,255,0.04)]">
            <div className={cn('font-mono text-2xl font-bold', color)}>{counts[key]}</div>
            <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>

      {comparison.length > 0 && previousReport && (
        <div className="mb-7 rounded-[28px] border border-border/70 bg-white/85 p-6">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="mb-1 text-xs font-bold uppercase tracking-widest text-primary">Compare With Previous Report</div>
              <div className="text-lg font-bold">Latest saved {getTestLabel(testType)} report</div>
            </div>
            <div className="text-sm text-muted-foreground">{new Date(previousReport.createdAt).toLocaleString()}</div>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {comparison.map((point) => (
              <div key={point.key} className="rounded-[20px] border border-border/70 bg-secondary/50 p-4">
                <div className="mb-1 font-semibold">{point.name}</div>
                <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Prev {point.previousValue}</span>
                  <span>→</span>
                  <span>Now {point.currentValue}</span>
                </div>
                <div className={cn(
                  'inline-flex rounded-full px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-wider',
                  point.direction === 'up'
                    ? 'bg-warning/12 text-warning'
                    : point.direction === 'down'
                      ? 'bg-primary/12 text-primary'
                      : 'bg-success/12 text-success'
                )}>
                  {point.direction === 'flat' ? 'Stable' : `${point.direction === 'up' ? 'Up' : 'Down'} ${point.delta ?? ''}`}
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{point.summary}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {trendStory.length > 0 && (
        <div className="mb-7 rounded-[28px] border border-border/70 bg-white/85 p-6">
          <div className="mb-4 text-xs font-bold uppercase tracking-widest text-primary">Trend Storytelling Mode</div>
          <div className="grid gap-3 md:grid-cols-3">
            {trendStory.map((story) => (
              <div key={story.title} className="rounded-[20px] border border-border/70 bg-secondary/45 p-4">
                <div className="mb-1 text-sm font-bold">{story.title}</div>
                <div className="text-xs leading-relaxed text-muted-foreground">{story.body}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-7 rounded-[28px] border border-border/70 bg-secondary/60 p-6">
        <div className="mb-4 text-xs font-bold uppercase tracking-widest text-primary">Visual Analysis</div>
        <div className="mb-5 flex flex-wrap gap-2">
          {[
            { id: 'compare', icon: '📊', label: 'Value vs Normal Range' },
            { id: 'donut', icon: '🍩', label: 'Status Breakdown' },
            { id: 'radar', icon: '🕸️', label: 'Health Radar' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveChart(tab.id)}
              className={cn(
                'rounded-full border-[1.5px] px-4 py-1.5 text-sm font-semibold transition-all',
                activeChart === tab.id
                  ? 'border-primary bg-primary/8 text-primary'
                  : 'border-border bg-white/70 text-muted-foreground hover:border-primary/30 hover:text-foreground'
              )}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
        <Suspense fallback={<div className="rounded-[24px] border border-border/70 bg-white/70 p-6 text-sm text-muted-foreground">Loading chart...</div>}>
          {activeChart === 'compare' && <CompareChart data={data} />}
          {activeChart === 'donut' && <DonutChart data={data} />}
          {activeChart === 'radar' && <RadarChart data={data} />}
        </Suspense>
      </div>

      {data.modality === 'retina' && data.retinaOverlays && data.retinaOverlays.length > 0 && (
        <div className="mb-7 rounded-[28px] border border-border/70 bg-white/85 p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="mb-1 text-xs font-bold uppercase tracking-widest text-primary">Retina Overlay Review</div>
              <div className="text-lg font-bold">Candidate lesion and hotspot regions</div>
            </div>
            <div className="text-sm text-muted-foreground">Local screening overlay map</div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[24px] border border-border/70 bg-secondary/40 p-4">
              <div className="relative aspect-square overflow-hidden rounded-[22px] border border-border/70 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.96),rgba(239,231,255,0.9))]">
                {sourcePreviewUrl ? (
                  <img src={sourcePreviewUrl} alt="Retina source" className="h-full w-full object-cover opacity-90" />
                ) : (
                  <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.98)_0%,rgba(245,240,255,0.92)_52%,rgba(229,222,255,0.7)_78%,transparent_82%)]" />
                )}
                <div className="pointer-events-none absolute inset-0">
                  {data.retinaOverlays.map((overlay) => (
                    <div
                      key={overlay.id}
                      className="absolute rounded-xl border-2 shadow-[0_12px_24px_rgba(15,23,42,0.12)]"
                      style={{
                        left: `${overlay.x * 100}%`,
                        top: `${overlay.y * 100}%`,
                        width: `${overlay.width * 100}%`,
                        height: `${overlay.height * 100}%`,
                        borderColor: overlay.color,
                        backgroundColor: `${overlay.color}22`,
                      }}
                    >
                      <div
                        className="absolute -top-6 left-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
                        style={{ backgroundColor: overlay.color }}
                      >
                        {overlay.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {data.retinaOverlays.map((overlay) => (
                <div key={overlay.id} className="rounded-[20px] border border-border/70 bg-secondary/40 p-4">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm font-bold">{overlay.label}</div>
                    <div className="flex items-center gap-2">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: overlay.color }}
                      />
                      <span className="rounded-full bg-white/75 px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-wider text-muted-foreground">
                        {overlay.severity}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Confidence {Math.round(overlay.confidence * 100)}% · Region x {Math.round(overlay.x * 100)} y {Math.round(overlay.y * 100)}
                  </div>
                  {overlay.note && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{overlay.note}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {reminders.length > 0 && (
        <div className="mb-7 rounded-[28px] border border-border/70 bg-white/85 p-6">
          <div className="mb-4 text-xs font-bold uppercase tracking-widest text-primary">Upcoming Follow-up Reminders</div>
          <div className="grid gap-3 md:grid-cols-3">
            {reminders.map((reminder) => (
              <div key={reminder.id} className="rounded-[22px] border border-border/70 bg-secondary/50 p-4">
                <div className="mb-1 text-sm font-bold">{reminder.title}</div>
                <div className="text-xs leading-relaxed text-muted-foreground">{reminder.body}</div>
                <div className="mt-3 text-xs font-semibold uppercase tracking-widest text-primary">
                  Due {new Date(reminder.dueDate).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-3 mt-2 text-xs font-bold uppercase tracking-widest text-primary">
        {data.modality === 'retina' ? 'Image Markers' : 'Blood Parameters'}
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {(['all', 'normal', 'high', 'low', 'borderline'] as const).map((entry) => {
          const count = entry === 'all' ? counts.all : counts[entry];
          if (entry !== 'all' && count === 0) return null;
          return (
            <button
              key={entry}
              onClick={() => setFilter(entry)}
              className={cn(
                'flex items-center gap-1.5 rounded-full border-[1.5px] px-3.5 py-1.5 text-sm font-semibold transition-all',
                filter === entry
                  ? 'border-primary bg-primary/8 text-primary'
                  : 'border-border bg-white/70 text-muted-foreground hover:border-primary/30'
              )}
            >
              {entry.charAt(0).toUpperCase() + entry.slice(1)}
              <span className={cn('rounded-lg px-1.5 text-xs font-bold', filter === entry ? 'bg-primary/15' : 'bg-foreground/8')}>{count}</span>
            </button>
          );
        })}
      </div>

      <div className="mb-3.5 flex items-center gap-2.5 rounded-2xl border border-border/70 bg-white/75 px-4 py-3">
        <span className="text-muted-foreground">🔍</span>
        <input
          type="text"
          placeholder="Search parameters..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="flex-1 border-none bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/50"
        />
      </div>

      <div className="mb-7 grid grid-cols-1 gap-4 md:grid-cols-2">
        {filteredParams.map((parameter, index) => {
          const status = (parameter.status || 'normal').toLowerCase();
          const percent = Math.min(100, Math.max(0, parameter.barPercent || 50));
          const comparisonPoint = comparison.find((point) => point.name === parameter.name);
          const card = getRecommendationCard(parameter.name, parameter.status);
          const expandedId = `${parameter.name}-${index}`;

          return (
            <motion.div
              key={expandedId}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="relative overflow-hidden rounded-[24px] border border-border/70 bg-white/80 p-5 shadow-[0_12px_24px_rgba(111,76,255,0.04)]"
            >
              <div className={cn(
                'absolute left-0 top-0 bottom-0 w-[3px] rounded-l-[14px]',
                status === 'normal' ? 'bg-success' : status === 'high' ? 'bg-destructive' : status === 'low' ? 'bg-primary' : 'bg-warning'
              )} />
              <div className="mb-2.5 flex items-start justify-between">
                <span className="font-bold text-sm">{parameter.name}</span>
                <span className={cn('rounded-md px-2 py-0.5 text-[0.68rem] font-bold uppercase tracking-wider', statusBg[status], statusColors[status])}>
                  {status}
                </span>
              </div>
              <div className="mb-1 font-mono text-2xl font-bold">{parameter.value || '—'}</div>
              <div className="mb-2.5 text-xs text-muted-foreground">Ref: {parameter.referenceRange || '—'}</div>
              <div className="relative mb-2.5 h-1.5 overflow-hidden rounded bg-background">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percent}%` }}
                  transition={{ duration: 1.2, ease: [0.34, 1.56, 0.64, 1] }}
                  className={cn('h-full rounded', barColors[status])}
                />
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">{parameter.insight}</p>

              {comparisonPoint && (
                <div className="mt-3 rounded-[16px] border border-border/70 bg-secondary/50 p-3">
                  <div className="mb-1 text-[0.68rem] font-bold uppercase tracking-widest text-primary">Mini Trend</div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{comparisonPoint.previousValue}</span>
                    <div className="h-1 flex-1 rounded bg-background">
                      <div className={cn(
                        'h-1 rounded',
                        comparisonPoint.direction === 'up'
                          ? 'bg-warning'
                          : comparisonPoint.direction === 'down'
                            ? 'bg-primary'
                            : 'bg-success'
                      )} style={{ width: '60%' }} />
                    </div>
                    <span>{comparisonPoint.currentValue}</span>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => setExpandedParameter(expandedParameter === expandedId ? null : expandedId)}
                className="mt-3 text-[0.68rem] font-bold uppercase tracking-wider text-primary"
              >
                {expandedParameter === expandedId ? 'Hide care guidance' : 'Open care guidance'}
              </button>

              {expandedParameter === expandedId && (
                <div className="mt-4 rounded-[18px] border border-primary/15 bg-primary/5 p-4">
                  <div className="mb-2 text-xs font-bold uppercase tracking-widest text-primary">{card.title}</div>
                  <p className="mb-3 text-sm leading-relaxed text-muted-foreground">{card.meaning}</p>
                  <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">Possible Causes</div>
                  <div className="mb-3 flex flex-wrap gap-2">
                    {card.possibleCauses.map((item) => (
                      <span key={item} className="rounded-full bg-white/85 px-3 py-1 text-xs text-muted-foreground">{item}</span>
                    ))}
                  </div>
                  <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">Food Tips</div>
                  <p className="mb-3 text-sm leading-relaxed text-muted-foreground">{card.foodTips.join(', ')}.</p>
                  <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">Lifestyle Tips</div>
                  <p className="mb-3 text-sm leading-relaxed text-muted-foreground">{card.lifestyleTips.join(', ')}.</p>
                  <div className="text-xs font-semibold uppercase tracking-widest text-primary">Follow-up</div>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{card.repeatAfter}</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{card.doctorAdvice}</p>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {data.insights?.length > 0 && (
        <>
          <div className="mb-3.5 mt-1 text-xs font-bold uppercase tracking-widest text-primary">Health Insights & Recommendations</div>
          <div className="mb-7 grid gap-4 md:grid-cols-2">
            {data.insights.map((insight, index) => (
              <div key={`${insight.title}-${index}`} className="flex items-start gap-3.5 rounded-[24px] border border-border/70 bg-white/80 p-5 shadow-[0_12px_24px_rgba(111,76,255,0.04)]">
                <span className="mt-0.5 flex-shrink-0 text-xl">{insightIcons[insight.type] || '💡'}</span>
                <div>
                  <div className="mb-1 text-sm font-semibold">{insight.title}</div>
                  <div className="text-xs leading-relaxed text-muted-foreground">{insight.body}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="mt-6 rounded-[24px] border border-warning/20 bg-warning/10 p-5 text-xs leading-relaxed text-muted-foreground">
        <strong>Medical Disclaimer:</strong> This analysis is for educational purposes only. It does not replace professional medical advice, diagnosis, or treatment.
      </div>

      <div className="mt-6 flex flex-wrap gap-2.5">
        <button
          onClick={onReset}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-[0_12px_24px_rgba(111,76,255,0.18)] transition-transform hover:-translate-y-0.5"
        >
          ← Analyze Another
        </button>
        <button
          onClick={() => void handleDownloadPdf()}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-white/80 px-5 py-3 text-sm font-medium text-muted-foreground transition-all hover:border-primary hover:text-primary"
        >
          ⬇️ Download PDF Summary
        </button>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-white/80 px-5 py-3 text-sm font-medium text-muted-foreground transition-all hover:border-primary hover:text-primary"
        >
          🖨️ Print Report
        </button>
      </div>
      </div>
      <MetricsRail
        healthScore={data.healthScore}
        riskLevel={data.overallStatus}
        lastUpload={new Date(data.reportMeta?.analyzedAt || Date.now()).toLocaleDateString()}
        currentPanel={data.testName || getTestLabel(testType)}
        abnormalCount={abnormalCount}
      />
      </div>
      <HealthCopilotDrawer data={data} comparison={comparison} />
    </motion.div>
  );
}
