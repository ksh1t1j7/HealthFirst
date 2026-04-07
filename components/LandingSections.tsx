import { motion } from 'framer-motion';
import { TEST_TYPES } from '@/lib/testTypes';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.25 },
  transition: { duration: 0.55, delay, ease: 'easeOut' },
});

export default function LandingSections() {
  return (
    <div className="relative z-[1] px-6 pb-24">
      <div className="mx-auto max-w-[1180px] space-y-8">
        <motion.section
          {...fadeUp(0)}
          className="grid gap-5 rounded-[36px] border border-border/70 bg-white/80 p-8 shadow-[0_30px_90px_rgba(111,76,255,0.08)] md:grid-cols-3"
        >
          {[
            {
              title: 'How it works',
              body: 'Choose your report type, upload the screenshot, let OCR detect the values, and get a full analysis dashboard in seconds.',
            },
            {
              title: 'What you get',
              body: 'Detected parameters, visual charts, flagged highs and lows, health score, and recommendation cards with practical food guidance.',
            },
            {
              title: 'Why it feels safer',
              body: 'Your workflow is built around private report review, structured extraction, and a clear account-based history for quick reloads.',
            },
          ].map((item) => (
            <div key={item.title} className="rounded-[28px] border border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(247,243,255,0.86))] p-6">
              <div className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-primary">{item.title}</div>
              <p className="text-sm leading-relaxed text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </motion.section>

        <motion.section
          {...fadeUp(0.1)}
          className="rounded-[36px] border border-border/70 bg-card/90 p-8 shadow-[0_30px_90px_rgba(111,76,255,0.08)]"
        >
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-primary">Supported Workflows</div>
              <h2 className="text-3xl font-bold tracking-tight">Built for real blood report journeys</h2>
            </div>
            <div className="rounded-full border border-primary/20 bg-primary/8 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-primary">
              Upload first, no manual typing
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {TEST_TYPES.slice(0, 8).map((item) => (
              <div key={item.id} className="rounded-[26px] border border-border/70 bg-white/75 p-5 shadow-[0_12px_24px_rgba(111,76,255,0.04)]">
                <div className="mb-3 text-3xl">{item.icon}</div>
                <div className="mb-1 text-base font-bold">{item.name}</div>
                <p className="text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section
          {...fadeUp(0.15)}
          className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]"
        >
          <div className="rounded-[36px] border border-border/70 bg-white/80 p-8 shadow-[0_30px_90px_rgba(111,76,255,0.08)]">
            <div className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-primary">Analysis Features</div>
            <h3 className="mb-6 text-3xl font-bold tracking-tight">What the product now does</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {[
                'Automatic OCR extraction from uploaded blood report images',
                'Panel-specific ML/DL or rule-based interpretation',
                'Charts for value comparison, radar balance, and status split',
                'Smarter recommendation cards for low and high parameters',
                'CSV import if you already have lab values in spreadsheet form',
                'Save and reload patient report entries inside your HealthFirst workspace',
              ].map((line) => (
                <div key={line} className="rounded-[24px] border border-border/70 bg-secondary/55 px-5 py-4 text-sm text-foreground">
                  {line}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[36px] border border-border/70 bg-[linear-gradient(180deg,rgba(125,122,255,0.12),rgba(116,232,211,0.10))] p-8 shadow-[0_30px_90px_rgba(111,76,255,0.08)]">
            <div className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-primary">Quick Flow</div>
            <h3 className="mb-6 text-3xl font-bold tracking-tight">Three-step experience</h3>
            <div className="space-y-4">
              {[
                ['01', 'Select your panel', 'Pick CBC, thyroid, kidney, liver, lipid, or another blood report type.'],
                ['02', 'Upload the report', 'Use a clear screenshot or report image and let the OCR detector capture the values.'],
                ['03', 'See the dashboard', 'Review abnormal parameters, charts, low-value suggestions, and the model-backed result.'],
              ].map(([step, title, body]) => (
                <div key={step} className="flex gap-4 rounded-[24px] border border-white/60 bg-white/70 p-5">
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {step}
                  </div>
                  <div>
                    <div className="mb-1 font-semibold">{title}</div>
                    <div className="text-sm leading-relaxed text-muted-foreground">{body}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
