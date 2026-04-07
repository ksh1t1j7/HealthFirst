import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import BrandLogo from '@/components/BrandLogo';

interface HeroProps {
  onStart: () => void;
}

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: 'easeOut' },
});

export default function Hero({ onStart }: HeroProps) {
  const { isAuthenticated, user } = useAuth();

  return (
    <section className="relative z-[1] min-h-screen px-6 pt-32 pb-20">
      <div className="mx-auto grid max-w-[1180px] items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="text-left">
          <motion.div {...fadeUp(0)} className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-primary bg-primary/10 border border-primary/15 px-4 py-2 rounded-full mb-7">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            AI Blood Test Interpretation
          </motion.div>

          <motion.h1
            {...fadeUp(0.1)}
            className="text-[clamp(3rem,7vw,5.6rem)] font-extrabold leading-[0.95] tracking-tight"
          >
            Understand Your <span className="text-gradient">Blood</span>
            <br />
            Test Report
          </motion.h1>

          <motion.p {...fadeUp(0.2)} className="max-w-[560px] mt-6 text-lg text-muted-foreground leading-relaxed">
            Upload a screenshot of your blood report, prefill the values with OCR, review them, and get a bright dashboard-style interpretation powered by advanced ML/DL models.
          </motion.p>

          <motion.div {...fadeUp(0.3)} className="mt-10 flex gap-4 flex-wrap">
            <button
              onClick={onStart}
              className="inline-flex items-center gap-2.5 text-base font-semibold text-primary-foreground gradient-primary border-none cursor-pointer px-9 py-4 rounded-full transition-all duration-300 glow hover:-translate-y-0.5 hover:glow-strong"
            >
              Start Analysis
            </button>
            <Link
              to="/login"
              className="inline-flex items-center rounded-full border border-primary/20 bg-white/85 px-5 py-4 text-sm font-semibold text-primary no-underline shadow-[0_10px_30px_rgba(111,76,255,0.08)]"
            >
              {isAuthenticated && user ? `Signed in as ${user.name}` : 'Login / Create Account'}
            </Link>
          </motion.div>

          <motion.div
            {...fadeUp(0.36)}
            className="mt-5 max-w-[420px] rounded-[24px] border border-border/70 bg-white/80 p-5 shadow-[0_12px_24px_rgba(111,76,255,0.06)]"
          >
            <div className="mb-3 flex items-center gap-3">
              <BrandLogo size="sm" />
              <div className="text-xs font-bold uppercase tracking-[0.22em] text-primary">Account Access</div>
            </div>
            <div className="text-base font-bold">
              {isAuthenticated && user ? `Welcome back, ${user.name}` : 'Sign in to save reports to your account'}
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {isAuthenticated
                ? 'Your saved reports, dashboard views, and health history are ready in your HealthFirst account.'
                : 'Use the login page to create an account, store report history, and keep your saved analysis separate for each user.'}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                to="/login"
                className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground no-underline shadow-[0_10px_20px_rgba(111,76,255,0.16)]"
              >
                {isAuthenticated ? 'Open Account' : 'Go to Login'}
              </Link>
              <div className="inline-flex items-center rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Saved reports by user
              </div>
            </div>
          </motion.div>

          <motion.div {...fadeUp(0.45)} className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { val: '12', label: 'ML/DL Panels' },
              { val: '15+', label: 'Test Types' },
              { val: '3', label: 'Live Charts' },
              { val: 'Smart', label: 'Privacy First' },
            ].map((s) => (
              <div key={s.label} className="rounded-[24px] border border-border/70 bg-white/70 px-5 py-4 shadow-[0_10px_30px_rgba(111,76,255,0.06)]">
                <div className="font-mono text-3xl font-bold text-primary">{s.val}</div>
                <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        <motion.div {...fadeUp(0.2)} className="relative">
          <div className="rounded-[40px] border border-border/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(247,243,255,0.92))] p-6 shadow-[0_40px_100px_rgba(111,76,255,0.12)]">
            <div className="rounded-[28px] border border-border/60 bg-white p-4 shadow-[0_18px_40px_rgba(111,76,255,0.06)]">
              <div className="mb-4 flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-primary/30" />
                <span className="h-3 w-3 rounded-full bg-primary/20" />
                <span className="h-3 w-3 rounded-full bg-primary/10" />
              </div>
              <div className="grid gap-4">
                <div className="rounded-[26px] bg-gradient-to-br from-primary to-accent p-8 text-white shadow-[0_20px_50px_rgba(111,76,255,0.28)]">
                  <div className="text-6xl font-black tracking-tight">&lt;/&gt;</div>
                </div>
                <div className="grid gap-4 sm:grid-cols-[0.9fr_1.1fr]">
                  <div className="rounded-[24px] border border-border/60 bg-secondary/60 p-5">
                    <div className="mb-4 text-4xl">🩸</div>
                    <div className="h-4 rounded-full bg-primary/10">
                      <div className="h-4 w-2/3 rounded-full gradient-primary" />
                    </div>
                    <div className="mt-3 text-xl font-semibold">Balanced</div>
                    <div className="text-sm text-muted-foreground">Status card preview</div>
                  </div>
                  <div className="rounded-[24px] border border-border/60 bg-secondary/60 p-5">
                    <div className="space-y-3">
                      {[72, 88, 64, 93].map((v, i) => (
                        <div key={i} className="flex items-end gap-3">
                          <div className="w-8 text-xs text-muted-foreground">{['Jan', 'Apr', 'Jul', 'Oct'][i]}</div>
                          <div className="h-16 w-3 rounded-full bg-primary/10">
                            <div className="w-3 rounded-full bg-[linear-gradient(180deg,#74E8D3,#7D7AFF)]" style={{ height: `${v}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                  <div className="rounded-[24px] border border-border/60 bg-secondary/60 p-5">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-bold">Clinical Guidance</div>
                        <div className="text-xs text-muted-foreground">Interactive care assistant preview</div>
                      </div>
                      <div className="rounded-full bg-primary px-3 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-primary-foreground">
                        AI
                      </div>
                    </div>
                    <div className="space-y-2">
                      {[
                        'Low hemoglobin guidance',
                        'Compare with previous CBC',
                        'Food and follow-up suggestions',
                      ].map((line) => (
                        <div key={line} className="rounded-[16px] border border-border/60 bg-white/80 px-4 py-3 text-sm text-muted-foreground">
                          {line}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="relative overflow-hidden rounded-[24px] border border-border/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(243,240,255,0.92))] p-4">
                    <div className="absolute right-3 top-3 h-16 w-16 rounded-full bg-primary/10 blur-2xl" />
                    <svg viewBox="0 0 240 220" className="mx-auto h-[220px] w-full max-w-[240px]">
                      <circle cx="126" cy="44" r="24" fill="#F8C7B8" />
                      <path d="M100 44c2-18 16-30 34-30 16 0 28 10 33 24-10-8-22-10-35-8-10 1-22 7-32 14z" fill="#232748" />
                      <rect x="106" y="66" width="38" height="24" rx="12" fill="#F6B9A5" />
                      <path d="M76 102c0-18 14-32 32-32h36c18 0 32 14 32 32v72H76z" fill="#ffffff" stroke="#D7D0F3" strokeWidth="2" />
                      <path d="M104 88l-12 104h22l10-66 12 66h22l-12-104z" fill="#F6F5FF" />
                      <path d="M112 86h16l6 24h-28z" fill="#7C5CFF" />
                      <rect x="113" y="112" width="14" height="48" rx="7" fill="#7C5CFF" />
                      <rect x="129" y="112" width="14" height="48" rx="7" fill="#7C5CFF" opacity="0.9" />
                      <path d="M90 104c-18 10-24 24-24 42v36h18l8-46 16-10z" fill="#ffffff" stroke="#D7D0F3" strokeWidth="2" />
                      <path d="M162 104c18 10 24 24 24 42v36h-18l-8-46-16-10z" fill="#ffffff" stroke="#D7D0F3" strokeWidth="2" />
                      <rect x="146" y="122" width="34" height="42" rx="8" fill="#1E2148" />
                      <rect x="150" y="126" width="26" height="34" rx="5" fill="#DCEBFF" />
                      <path d="M163 131v24" stroke="#7C5CFF" strokeWidth="3" strokeLinecap="round" />
                      <path d="M151 143h24" stroke="#7C5CFF" strokeWidth="3" strokeLinecap="round" />
                      <rect x="104" y="188" width="18" height="24" rx="8" fill="#1E2148" />
                      <rect x="130" y="188" width="18" height="24" rx="8" fill="#1E2148" />
                      <circle cx="42" cy="68" r="10" fill="#ECE7FF" />
                      <circle cx="201" cy="52" r="7" fill="#D9FFF8" />
                      <path d="M32 152c18-8 34-8 48 0" stroke="#7C5CFF" strokeWidth="4" strokeLinecap="round" opacity="0.4" />
                    </svg>
                    <div className="mt-2 text-center">
                      <div className="text-sm font-bold">Doctor-guided interpretation</div>
                      <div className="text-xs text-muted-foreground">A more human, complete analysis surface</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
