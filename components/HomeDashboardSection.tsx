import { motion } from 'framer-motion';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.55, delay, ease: 'easeOut' },
});

export default function HomeDashboardSection() {
  return (
    <div className="relative z-[1] px-6 pb-24">
      <motion.section
        {...fadeUp(0)}
        className="mx-auto max-w-[1180px] rounded-[38px] border border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(246,242,255,0.88))] p-8 shadow-[0_30px_90px_rgba(111,76,255,0.08)]"
      >
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-2 text-xs font-bold uppercase tracking-[0.24em] text-primary">Dashboard Preview</div>
            <h2 className="text-3xl font-bold tracking-tight">A brighter health dashboard after every report</h2>
          </div>
          <div className="rounded-full border border-primary/20 bg-primary/8 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-primary">
            Trends, alerts, and next steps
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[0.12fr_1fr]">
          <div className="hidden rounded-[28px] border border-border/70 bg-white/70 p-4 lg:flex lg:flex-col lg:items-center lg:gap-4">
            {['⬢', '◫', '◌', '⌁', '◎', '◍'].map((icon, index) => (
              <div
                key={icon + index}
                className={`flex h-12 w-12 items-center justify-center rounded-2xl text-lg ${
                  index === 1 ? 'bg-primary text-primary-foreground shadow-[0_12px_24px_rgba(111,76,255,0.18)]' : 'bg-secondary/70 text-muted-foreground'
                }`}
              >
                {icon}
              </div>
            ))}
          </div>

          <div className="grid gap-5">
            <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
              <div className="rounded-[28px] border border-border/70 bg-white/80 p-6 shadow-[0_12px_24px_rgba(111,76,255,0.04)]">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-lg font-bold">Blood Test Summary</div>
                    <div className="text-sm text-muted-foreground">See status shifts across report dates</div>
                  </div>
                  <button className="rounded-full bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-wider text-primary-foreground">
                    See Details
                  </button>
                </div>
                <div className="grid grid-cols-6 items-end gap-5 pt-2">
                  {[68, 75, 62, 83, 57, 79].map((height, i) => (
                    <div key={i} className="text-center">
                      <div className="mx-auto flex h-40 w-4 items-end rounded-full bg-secondary">
                        <div
                          className="w-4 rounded-full bg-[linear-gradient(180deg,#5FE0B4,#FFD45B,#FF6F6F)]"
                          style={{ height: `${height}%` }}
                        />
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">{['Jan', 'Apr', 'Jul', 'Oct', 'Jan', 'Apr'][i]}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[28px] border border-border/70 bg-white/80 p-6 shadow-[0_12px_24px_rgba(111,76,255,0.04)]">
                <div className="mb-4 text-lg font-bold">Organ View</div>
                <div className="space-y-4">
                  {[
                    ['Heart and Circulation', 'Optimal', 'Cholesterol, HDL, Triglycerides', 'text-success'],
                    ['Liver Function', 'Monitor', 'Albumin, GGT, AST, ALT', 'text-warning'],
                    ['Kidney Function', 'Watch', 'Creatinine, Total Protein, Uric Acid', 'text-destructive'],
                  ].map(([title, state, body, tone]) => (
                    <div key={title} className="flex items-start gap-3 rounded-[20px] border border-border/70 bg-secondary/50 p-4">
                      <div className={`mt-0.5 flex h-12 w-12 items-center justify-center rounded-full border border-current/15 bg-white ${tone}`}>
                        ◔
                      </div>
                      <div>
                        <div className="font-semibold">{title}</div>
                        <div className={`text-sm font-semibold ${tone}`}>{state}</div>
                        <div className="text-xs text-muted-foreground">{body}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-5 xl:grid-cols-2">
              <div className="rounded-[28px] border border-border/70 bg-white/80 p-6 shadow-[0_12px_24px_rgba(111,76,255,0.04)]">
                <div className="mb-4 text-lg font-bold">You Are At Risk</div>
                <div className="space-y-3">
                  {[
                    ['GGT', '58.75 mg/dL', 'High'],
                    ['AST', '58.75 mg/dL', 'High'],
                    ['Platelet Count', '150000 cumm', 'Borderline'],
                  ].map(([name, value, state]) => (
                    <div key={name} className="flex items-center justify-between rounded-[18px] border border-border/70 bg-secondary/50 px-4 py-3">
                      <div>
                        <div className="font-semibold">{name}</div>
                        <div className="text-xs text-muted-foreground">{state}</div>
                      </div>
                      <div className="font-mono text-sm font-bold">{value}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[28px] border border-border/70 bg-white/80 p-6 shadow-[0_12px_24px_rgba(111,76,255,0.04)]">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="text-lg font-bold">Health Routine</div>
                  <div className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground">Apr 15 - Apr 21</div>
                </div>
                <div className="mb-5 grid grid-cols-7 gap-2">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => (
                    <div
                      key={day}
                      className={`rounded-[18px] px-3 py-4 text-center text-xs ${idx === 3 ? 'bg-primary text-primary-foreground' : 'bg-secondary/60 text-muted-foreground'}`}
                    >
                      <div>{day}</div>
                      <div className="mt-1 text-base font-bold">{14 + idx}</div>
                    </div>
                  ))}
                </div>
                <div className="rounded-[20px] border border-border/70 bg-secondary/50 p-4">
                  <div className="font-semibold">Medication and meal reminders</div>
                  <div className="mt-1 text-sm text-muted-foreground">Track iron supplements, hydration, repeat labs, and planned check-ins from one view.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>
    </div>
  );
}
