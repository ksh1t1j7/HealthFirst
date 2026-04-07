interface MetricsRailProps {
  healthScore: number;
  riskLevel: string;
  lastUpload?: string;
  currentPanel: string;
  abnormalCount: number;
}

export default function MetricsRail({ healthScore, riskLevel, lastUpload, currentPanel, abnormalCount }: MetricsRailProps) {
  return (
    <div className="sticky top-28 space-y-3">
      {[
        ['Health score', `${healthScore}/100`],
        ['Risk level', riskLevel],
        ['Last upload', lastUpload || 'Today'],
        ['Current panel', currentPanel],
        ['Abnormal markers', String(abnormalCount)],
      ].map(([label, value]) => (
        <div key={label} className="rounded-[24px] border border-border/70 bg-white/82 p-4 shadow-[0_18px_40px_rgba(111,76,255,0.08)] backdrop-blur-xl">
          <div className="text-[0.68rem] font-bold uppercase tracking-[0.24em] text-primary">{label}</div>
          <div className="mt-2 text-lg font-bold">{value}</div>
        </div>
      ))}
    </div>
  );
}
