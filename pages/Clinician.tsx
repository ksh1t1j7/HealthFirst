import { useEffect, useMemo, useState } from 'react';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { fetchAllSavedReportsByUser } from '@/lib/reportEntries';
import { listLocalAccounts } from '@/lib/auth';
import { getTestLabel } from '@/lib/reportAnalytics';

export default function Clinician() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Array<{ id: string; name: string; email: string; isVerified: boolean; role: 'patient' | 'clinician'; createdAt: string; totalUsers: number }>>([]);
  const [reportsByUser, setReportsByUser] = useState<Record<string, Array<{ testType: string }>>>(() => ({}));

  useEffect(() => {
    listLocalAccounts().then(setAccounts).catch(() => setAccounts([]));
    fetchAllSavedReportsByUser().then(setReportsByUser).catch(() => setReportsByUser({}));
  }, []);

  const totalReports = Object.values(reportsByUser).reduce((sum, reports) => sum + reports.length, 0);
  const panelMix = Object.values(reportsByUser)
    .flat()
    .reduce<Record<string, number>>((acc, report) => {
      acc[report.testType] = (acc[report.testType] || 0) + 1;
      return acc;
    }, {});

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fbfbff,#f2efff)]">
      <Navbar />
      <div className="mx-auto max-w-[1180px] px-6 pb-20 pt-32">
        <section className="rounded-[36px] border border-border/70 bg-white/85 p-8 shadow-[0_30px_90px_rgba(111,76,255,0.08)]">
          <div className="mb-3 text-xs font-bold uppercase tracking-[0.24em] text-primary">Clinician Mode</div>
          <h1 className="text-4xl font-bold tracking-tight">Lab review and monitoring workspace</h1>
          <p className="mt-3 max-w-[760px] text-sm leading-relaxed text-muted-foreground">
            This local clinician panel helps review uploaded reports, structured values, account adoption, and panel usage. It is meant for development and demo workflows unless you connect a production backend database.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-4">
            <div className="rounded-[24px] border border-border/70 bg-secondary/55 p-5">
              <div className="text-xs font-bold uppercase tracking-widest text-primary">Clinician User</div>
              <div className="mt-2 text-lg font-bold">{user?.name || 'Local User'}</div>
            </div>
            <div className="rounded-[24px] border border-border/70 bg-secondary/55 p-5">
              <div className="text-xs font-bold uppercase tracking-widest text-primary">Accounts</div>
              <div className="mt-2 font-mono text-3xl font-bold">{accounts.length}</div>
            </div>
            <div className="rounded-[24px] border border-border/70 bg-secondary/55 p-5">
              <div className="text-xs font-bold uppercase tracking-widest text-primary">Reports Reviewed</div>
              <div className="mt-2 font-mono text-3xl font-bold">{totalReports}</div>
            </div>
            <div className="rounded-[24px] border border-border/70 bg-secondary/55 p-5">
              <div className="text-xs font-bold uppercase tracking-widest text-primary">Role Mode</div>
              <div className="mt-2 text-lg font-bold">{user?.role || 'patient'}</div>
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-[36px] border border-border/70 bg-white/85 p-8 shadow-[0_30px_90px_rgba(111,76,255,0.08)]">
            <div className="mb-4 text-xs font-bold uppercase tracking-[0.24em] text-primary">Panel Usage</div>
            <div className="space-y-3">
              {Object.entries(panelMix).length > 0 ? (
                Object.entries(panelMix)
                  .sort((a, b) => b[1] - a[1])
                  .map(([panel, count]) => (
                    <div key={panel} className="rounded-[20px] border border-border/70 bg-secondary/45 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-semibold">{getTestLabel(panel)}</div>
                        <div className="font-mono text-sm font-bold">{count}</div>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="rounded-[20px] border border-border/70 bg-secondary/45 p-4 text-sm text-muted-foreground">
                  No report activity yet.
                </div>
              )}
            </div>
          </section>

          <section className="rounded-[36px] border border-border/70 bg-white/85 p-8 shadow-[0_30px_90px_rgba(111,76,255,0.08)]">
            <div className="mb-4 text-xs font-bold uppercase tracking-[0.24em] text-primary">Accounts and Status</div>
            <div className="grid gap-3 md:grid-cols-2">
              {accounts.length > 0 ? (
                accounts.map((account) => (
                  <div key={account.id} className="rounded-[20px] border border-border/70 bg-secondary/45 p-4">
                    <div className="font-semibold">{account.name}</div>
                    <div className="mt-1 text-sm text-muted-foreground">{account.email}</div>
                    <div className="mt-2 flex items-center gap-2 text-xs uppercase tracking-widest">
                      <span className={`rounded-full px-2 py-1 ${account.isVerified ? 'bg-success/12 text-success' : 'bg-warning/12 text-warning'}`}>
                        {account.isVerified ? 'Active' : 'Limited'}
                      </span>
                      <span className="rounded-full bg-primary/12 px-2 py-1 text-primary">{account.role}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[20px] border border-border/70 bg-secondary/45 p-4 text-sm text-muted-foreground md:col-span-2">
                  No accounts created yet.
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
