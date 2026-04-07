import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import Navbar from '@/components/Navbar';
import BrandLogo from '@/components/BrandLogo';
import PatientTimeline from '@/components/PatientTimeline';
import { useAuth } from '@/contexts/AuthContext';
import { fetchSavedReports, SavedEntry } from '@/lib/reportEntries';
import { buildTimelineEvents, buildTrendSeries, buildTrendStory, compareReportValues, getLatestPreviousReport, getTestLabel, summarizeAbnormalMarkers } from '@/lib/reportAnalytics';
import { PANEL_FIELDS } from '@/lib/panelFields';
import { toast } from '@/components/ui/sonner';

export default function Dashboard() {
  const {
    user,
    updateProfile,
    requestPasswordReset,
    logoutEverywhere,
  } = useAuth();
  const [reports, setReports] = useState<SavedEntry[]>([]);
  const [displayName, setDisplayName] = useState(user?.name || '');

  useEffect(() => {
    setDisplayName(user?.name || '');
  }, [user?.name]);

  useEffect(() => {
    fetchSavedReports().then(setReports).catch(() => setReports([]));
  }, []);

  const latestReport = reports[0] || null;
  const groupedByPanel = useMemo(() => {
    return reports.reduce<Record<string, SavedEntry[]>>((acc, report) => {
      acc[report.testType] = [...(acc[report.testType] || []), report];
      return acc;
    }, {});
  }, [reports]);

  const panelCounts = Object.entries(groupedByPanel).sort((a, b) => b[1].length - a[1].length);
  const trendPanel = panelCounts[0]?.[0] || latestReport?.testType || 'cbc';
  const trendMarkers = (PANEL_FIELDS[trendPanel] || []).slice(0, 3).map((field) => field.key);
  const trendSeries = buildTrendSeries(reports, trendPanel, trendMarkers);
  const latestPanelReport = latestReport ? groupedByPanel[latestReport.testType]?.[0] : null;
  const previousPanelReport = latestPanelReport ? getLatestPreviousReport(reports, latestPanelReport.testType, latestPanelReport.id) : null;
  const reportComparison = latestPanelReport ? compareReportValues(latestPanelReport.testType, latestPanelReport.values, previousPanelReport) : [];
  const trendStory = latestPanelReport ? buildTrendStory(latestPanelReport.testType, latestPanelReport.values, previousPanelReport) : [];
  const abnormalMarkers = latestReport ? summarizeAbnormalMarkers(latestReport).slice(0, 6) : [];
  const reminders = reports.flatMap((report) => report.analysis?.reminders || []).slice(0, 4);
  const timelineEvents = buildTimelineEvents(reports);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fbfbff,#f2efff)]">
      <Navbar />
      <div className="mx-auto max-w-[1180px] px-6 pb-20 pt-32">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-[36px] border border-border/70 bg-white/85 p-8 shadow-[0_30px_90px_rgba(111,76,255,0.08)]">
            <div className="mb-3 text-xs font-bold uppercase tracking-[0.24em] text-primary">Patient Dashboard</div>
            <h1 className="text-4xl font-bold tracking-tight">Your real report history is now here</h1>
            <p className="mt-3 max-w-[680px] text-sm leading-relaxed text-muted-foreground">
              {user ? `Signed in as ${user.name} (${user.email}).` : 'Signed in.'} Review trend charts, last report date, abnormal markers, follow-up reminders, and compare the latest report with the previous one.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-4">
              <div className="rounded-[24px] border border-border/70 bg-secondary/55 p-5">
                <div className="text-xs font-bold uppercase tracking-widest text-primary">Analyses Completed</div>
                <div className="mt-2 font-mono text-3xl font-bold">{reports.length}</div>
              </div>
              <div className="rounded-[24px] border border-border/70 bg-secondary/55 p-5">
                <div className="text-xs font-bold uppercase tracking-widest text-primary">Panels Used</div>
                <div className="mt-2 font-mono text-3xl font-bold">{panelCounts.length}</div>
              </div>
              <div className="rounded-[24px] border border-border/70 bg-secondary/55 p-5">
                <div className="text-xs font-bold uppercase tracking-widest text-primary">Last Report Date</div>
                <div className="mt-2 text-lg font-bold">{latestReport ? new Date(latestReport.createdAt).toLocaleDateString() : 'None yet'}</div>
              </div>
              <div className="rounded-[24px] border border-border/70 bg-secondary/55 p-5">
                <div className="text-xs font-bold uppercase tracking-widest text-primary">Abnormal Markers</div>
                <div className="mt-2 font-mono text-3xl font-bold">{abnormalMarkers.length}</div>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/"
                className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground no-underline shadow-[0_12px_24px_rgba(111,76,255,0.18)]"
              >
                Start New Analysis
              </Link>
              <Link
                to="/clinician"
                className="rounded-full border border-border bg-white/80 px-5 py-3 text-sm font-semibold text-muted-foreground no-underline"
              >
                Clinician Mode
              </Link>
            </div>
          </section>

          <section className="rounded-[36px] border border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(246,242,255,0.88))] p-8 shadow-[0_30px_90px_rgba(111,76,255,0.08)]">
            <div className="mb-5 flex items-center gap-3">
              <BrandLogo size="lg" />
              <div>
                <div className="text-lg font-bold">Account Center</div>
                <div className="text-sm text-muted-foreground">Profile settings, verification, and session controls</div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-[22px] border border-border/70 bg-white/80 p-4">
                <div className="mb-2 text-sm font-semibold">Display name</div>
                <input
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    void updateProfile({ name: displayName })
                      .then(() => toast.success('Profile updated.'))
                      .catch((error: any) => toast.error(error?.message || 'Could not update profile.'));
                  }}
                  className="mt-3 rounded-full bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-widest text-primary-foreground"
                >
                  Save Profile
                </button>
              </div>

              <div className="rounded-[22px] border border-border/70 bg-white/80 p-4">
                <div className="mb-1 text-sm font-semibold">Account status</div>
                <div className="text-xs text-muted-foreground">
                  Your local account is active and ready. Email verification is disabled for now so sign-in and saved reports work without inbox setup.
                </div>
              </div>

              <div className="rounded-[22px] border border-border/70 bg-white/80 p-4">
                <div className="mb-1 text-sm font-semibold">Forgot password</div>
                <div className="text-xs text-muted-foreground">Trigger a local reset flow for this email address.</div>
                <button
                  type="button"
                  onClick={() => {
                    if (!user?.email) return;
                    void requestPasswordReset(user.email)
                      .then((message) => toast.success(message))
                      .catch((error: any) => toast.error(error?.message || 'Could not trigger password reset.'));
                  }}
                  className="mt-3 rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground"
                >
                  Send Reset Instructions
                </button>
              </div>

              <div className="rounded-[22px] border border-border/70 bg-white/80 p-4">
                <div className="mb-1 text-sm font-semibold">Role mode</div>
                <div className="text-xs text-muted-foreground">Switch between patient and clinician mode for local admin review features.</div>
                <div className="mt-3 flex gap-2">
                  {(['patient', 'clinician'] as const).map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => {
                        void updateProfile({ role })
                          .then(() => toast.success(`Switched to ${role} mode.`))
                          .catch((error: any) => toast.error(error?.message || 'Could not switch role.'));
                      }}
                      className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-widest ${
                        user?.role === role ? 'bg-primary text-primary-foreground' : 'border border-border bg-background text-muted-foreground'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  void logoutEverywhere()
                    .then(() => toast.success('Logged out from all local sessions.'))
                    .catch((error: any) => toast.error(error?.message || 'Could not log out everywhere.'));
                }}
                className="w-full rounded-full border border-destructive/25 bg-destructive/10 px-4 py-3 text-xs font-semibold uppercase tracking-widest text-destructive"
              >
                Logout Everywhere
              </button>
            </div>
          </section>
        </div>

        <div className="mt-6">
          <PatientTimeline events={timelineEvents} />
        </div>

        <div className="mt-6 rounded-[36px] border border-border/70 bg-white/85 p-8 shadow-[0_30px_90px_rgba(111,76,255,0.08)]">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="mb-2 text-xs font-bold uppercase tracking-[0.24em] text-primary">History</div>
              <h2 className="text-2xl font-bold tracking-tight">Your recent analyses</h2>
            </div>
            <div className="rounded-full border border-primary/20 bg-primary/8 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-primary">
              {reports.length} total analyses
            </div>
          </div>
          {reports.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {reports.slice(0, 6).map((report) => (
                <div key={report.id} className="rounded-[22px] border border-border/70 bg-secondary/45 p-4">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="font-semibold">{report.title}</div>
                    <div className="rounded-full bg-white/80 px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-wider text-muted-foreground">
                      {getTestLabel(report.testType)}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">{new Date(report.createdAt).toLocaleString()}</div>
                  <div className="mt-3 text-sm text-muted-foreground">
                    {report.analysis?.summary || 'Saved analysis snapshot ready for review.'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[24px] border border-border/70 bg-secondary/45 p-6 text-sm text-muted-foreground">
              No analyses yet. Run your first report to build out this history timeline.
            </div>
          )}
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-[36px] border border-border/70 bg-white/85 p-8 shadow-[0_30px_90px_rgba(111,76,255,0.08)]">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <div className="mb-2 text-xs font-bold uppercase tracking-[0.24em] text-primary">Trend Charts</div>
                <h2 className="text-2xl font-bold tracking-tight">{getTestLabel(trendPanel)} trend overview</h2>
              </div>
              <div className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground">
                {trendSeries.length} report point{trendSeries.length === 1 ? '' : 's'}
              </div>
            </div>

            {trendSeries.length > 0 ? (
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="h-[260px] rounded-[24px] border border-border/70 bg-secondary/45 p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendSeries}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(111,76,255,0.12)" />
                      <XAxis dataKey="date" stroke="#8c84b7" />
                      <YAxis stroke="#8c84b7" />
                      <Tooltip />
                      {trendMarkers.map((marker, index) => (
                        <Line
                          key={marker}
                          type="monotone"
                          dataKey={marker}
                          stroke={['#7c5cff', '#44c8dd', '#ff9c43'][index % 3]}
                          strokeWidth={3}
                          dot={{ r: 4 }}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="h-[260px] rounded-[24px] border border-border/70 bg-secondary/45 p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendSeries}>
                      <defs>
                        <linearGradient id="healthfirstArea" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#7c5cff" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="#7c5cff" stopOpacity={0.04} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(111,76,255,0.12)" />
                      <XAxis dataKey="date" stroke="#8c84b7" />
                      <YAxis stroke="#8c84b7" />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey={trendMarkers[0]}
                        stroke="#7c5cff"
                        fill="url(#healthfirstArea)"
                        strokeWidth={3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  ['Upload your first CBC', 'Start with a CBC report to unlock blood count trends and risk stories.'],
                  ['Try a retina screening', 'Add a retina image to blend vision events into the patient timeline.'],
                  ['Connect a PDF report', 'Use a structured PDF lab file to see richer extraction and comparison history.'],
                ].map(([title, body]) => (
                  <div key={title} className="rounded-[24px] border border-border/70 bg-secondary/45 p-6">
                    <div className="mb-2 text-base font-bold">{title}</div>
                    <div className="text-sm leading-relaxed text-muted-foreground">{body}</div>
                  </div>
                ))}
              </div>
            )}

            {trendStory.length > 0 && (
              <div className="mt-6 grid gap-3 md:grid-cols-3">
                {trendStory.map((story) => (
                  <div key={story.title} className="rounded-[22px] border border-border/70 bg-white/80 p-4">
                    <div className="mb-1 text-sm font-bold">{story.title}</div>
                    <div className="text-xs leading-relaxed text-muted-foreground">{story.body}</div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-[36px] border border-border/70 bg-white/85 p-8 shadow-[0_30px_90px_rgba(111,76,255,0.08)]">
            <div className="mb-4 text-xs font-bold uppercase tracking-[0.24em] text-primary">Abnormal Markers</div>
            <div className="space-y-3">
              {abnormalMarkers.length > 0 ? (
                abnormalMarkers.map((marker) => (
                  <div key={marker.key} className="rounded-[20px] border border-border/70 bg-secondary/45 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-semibold">{marker.name}</div>
                        <div className="text-xs uppercase tracking-widest text-muted-foreground">{marker.status}</div>
                      </div>
                      <div className="font-mono text-sm font-bold">{marker.value}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[20px] border border-border/70 bg-secondary/45 p-4 text-sm text-muted-foreground">
                  No abnormal markers in your latest saved report.
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <section className="rounded-[36px] border border-border/70 bg-white/85 p-8 shadow-[0_30px_90px_rgba(111,76,255,0.08)]">
            <div className="mb-4 text-xs font-bold uppercase tracking-[0.24em] text-primary">Upcoming Follow-up Reminders</div>
            <div className="space-y-3">
              {reminders.length > 0 ? (
                reminders.map((reminder) => (
                  <div key={reminder.id} className="rounded-[20px] border border-border/70 bg-secondary/45 p-4">
                    <div className="font-semibold">{reminder.title}</div>
                    <div className="mt-1 text-sm text-muted-foreground">{reminder.body}</div>
                    <div className="mt-2 text-xs font-semibold uppercase tracking-widest text-primary">
                      Due {new Date(reminder.dueDate).toLocaleDateString()}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[20px] border border-border/70 bg-secondary/45 p-4 text-sm text-muted-foreground">
                  No follow-up reminders yet. Analyze and save a report to start building your care timeline.
                </div>
              )}
            </div>
          </section>

          <section className="rounded-[36px] border border-border/70 bg-white/85 p-8 shadow-[0_30px_90px_rgba(111,76,255,0.08)]">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <div className="mb-2 text-xs font-bold uppercase tracking-[0.24em] text-primary">Compare With Previous Report</div>
                <h2 className="text-2xl font-bold tracking-tight">Latest panel comparison</h2>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {reportComparison.length > 0 ? (
                reportComparison.map((item) => (
                  <div key={item.key} className="rounded-[20px] border border-border/70 bg-secondary/45 p-4">
                    <div className="font-semibold">{item.name}</div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      Previous {item.previousValue} → Current {item.currentValue}
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">{item.summary}</div>
                  </div>
                ))
              ) : (
                <div className="rounded-[20px] border border-border/70 bg-secondary/45 p-4 text-sm text-muted-foreground md:col-span-2">
                  Save two reports from the same panel to unlock side-by-side comparison here.
                </div>
              )}
            </div>
          </section>
        </div>

        <section className="mt-6 rounded-[36px] border border-border/70 bg-white/85 p-8 shadow-[0_30px_90px_rgba(111,76,255,0.08)]">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <div className="mb-2 text-xs font-bold uppercase tracking-[0.24em] text-primary">Report History</div>
              <h2 className="text-2xl font-bold tracking-tight">Recent saved reports</h2>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {reports.length > 0 ? (
              reports.map((report) => (
                <div key={report.id} className="rounded-[24px] border border-border/70 bg-secondary/50 p-5">
                  <div className="mb-1 text-lg font-bold">{report.title}</div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-primary">{getTestLabel(report.testType)}</div>
                  <div className="mt-2 text-sm text-muted-foreground">{new Date(report.createdAt).toLocaleString()}</div>
                  <div className="mt-3 text-sm text-muted-foreground">
                    {Object.keys(report.values).length} captured parameter{Object.keys(report.values).length === 1 ? '' : 's'}
                  </div>
                  {report.analysis?.overallStatus && (
                    <div className="mt-3 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary">
                      {report.analysis.overallStatus} · Score {report.analysis.healthScore}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="rounded-[24px] border border-border/70 bg-secondary/50 p-5 text-sm text-muted-foreground md:col-span-2 xl:col-span-3">
                No saved reports yet.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
