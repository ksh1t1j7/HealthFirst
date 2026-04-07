interface TimelineEvent {
  id: string;
  title: string;
  date: string;
  tone: string;
  note: string;
}

interface PatientTimelineProps {
  events: TimelineEvent[];
}

export default function PatientTimeline({ events }: PatientTimelineProps) {
  if (events.length === 0) {
    return (
      <div className="rounded-[28px] border border-border/70 bg-white/80 p-5 text-sm text-muted-foreground">
        Upload and save reports to unlock your floating patient timeline.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[28px] border border-border/70 bg-white/84 p-5 shadow-[0_18px_40px_rgba(111,76,255,0.08)]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Patient Timeline</div>
          <div className="text-sm text-muted-foreground">Health journey, abnormal events, and screenings over time</div>
        </div>
        <div className="rounded-full border border-border/70 bg-secondary/60 px-3 py-1 text-xs font-semibold text-muted-foreground">
          {events.length} events
        </div>
      </div>
      <div className="overflow-x-auto pb-2">
        <div className="flex min-w-max items-start gap-4">
          {events.map((event, index) => (
            <div key={event.id} className="flex items-center gap-4">
              <div className="w-[180px] rounded-[22px] border border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(245,240,255,0.9))] p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div
                    className={`h-3 w-3 rounded-full ${
                      event.tone === 'critical'
                        ? 'bg-destructive'
                        : event.tone === 'attention'
                          ? 'bg-warning'
                          : event.tone === 'vision'
                            ? 'bg-primary'
                            : 'bg-success'
                    }`}
                  />
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{event.date}</div>
                </div>
                <div className="text-sm font-bold">{event.title}</div>
                <div className="mt-2 text-xs leading-relaxed text-muted-foreground">{event.note}</div>
              </div>
              {index < events.length - 1 && <div className="h-[2px] w-14 rounded-full bg-[linear-gradient(90deg,rgba(124,92,255,0.55),rgba(116,232,211,0.45))]" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
