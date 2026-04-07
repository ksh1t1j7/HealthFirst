import { useMemo } from 'react';
import { SavedEntry } from '@/lib/reportEntries';
import { summarizeAbnormalMarkers } from '@/lib/reportAnalytics';

interface NotificationCenterProps {
  open: boolean;
  onClose: () => void;
  reports: SavedEntry[];
}

export default function NotificationCenter({ open, onClose, reports }: NotificationCenterProps) {
  const items = useMemo(() => {
    const notifications: Array<{ id: string; tone: string; title: string; body: string }> = [];
    const latest = reports[0];
    if (latest) {
      const abnormal = summarizeAbnormalMarkers(latest).slice(0, 2);
      abnormal.forEach((marker, index) =>
        notifications.push({
          id: `${latest.id}-${marker.key}-${index}`,
          tone: marker.status === 'borderline' ? 'warning' : 'critical',
          title: `${marker.name} needs attention`,
          body: `${marker.value} was flagged in your latest ${latest.testType.toUpperCase()} report.`,
        })
      );
      if (latest.analysis?.reminders?.[0]) {
        notifications.push({
          id: `${latest.id}-reminder`,
          tone: 'info',
          title: latest.analysis.reminders[0].title,
          body: latest.analysis.reminders[0].body,
        });
      }
    }
    if (notifications.length === 0) {
      notifications.push({
        id: 'empty',
        tone: 'success',
        title: 'No active alerts',
        body: 'Upload your next report to generate reminders, extraction alerts, and follow-up insights.',
      });
    }
    return notifications.slice(0, 5);
  }, [reports]);

  return (
    <div className={`fixed right-5 top-24 z-[90] w-[min(360px,calc(100%-32px))] transition-all duration-300 ${open ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-3 opacity-0'}`}>
      <div className="rounded-[28px] border border-border/70 bg-white/92 p-5 shadow-[0_28px_80px_rgba(111,76,255,0.16)] backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Notification Center</div>
            <div className="text-sm text-muted-foreground">Reminders, extraction alerts, and report insights</div>
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-border/70 bg-secondary/60 px-3 py-1 text-xs font-semibold text-muted-foreground">
            Close
          </button>
        </div>
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className={`rounded-[20px] border px-4 py-3 ${
                item.tone === 'critical'
                  ? 'border-destructive/25 bg-destructive/6'
                  : item.tone === 'warning'
                    ? 'border-warning/25 bg-warning/8'
                    : item.tone === 'success'
                      ? 'border-success/25 bg-success/8'
                      : 'border-border/70 bg-secondary/40'
              }`}
            >
              <div className="text-sm font-semibold">{item.title}</div>
              <div className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.body}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
