import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TEST_TYPES } from '@/lib/testTypes';
import { MODEL_SUPPORT } from '@/lib/modelSupport';

interface TestSelectorProps {
  selectedTest: string | null;
  onSelect: (id: string) => void;
}

export default function TestSelector({ selectedTest, onSelect }: TestSelectorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-[20px] p-6 md:p-9 mb-6"
    >
      <div className="text-xs font-bold tracking-widest uppercase text-primary mb-5">Step 01 — Select Test Type</div>
      <h2 className="text-xl font-bold mb-2">Which blood test did you take?</h2>
      <p className="text-muted-foreground text-sm mb-7">Choose the test that matches your report for the most accurate analysis.</p>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {TEST_TYPES.map((t, i) => {
          const support = MODEL_SUPPORT[t.id];

          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              whileHover={{ y: -4, scale: 1.01 }}
              onClick={() => onSelect(t.id)}
              className={cn(
                'group p-4 rounded-[14px] border-[1.5px] cursor-pointer transition-all duration-250 flex flex-col gap-2 relative overflow-hidden',
                selectedTest === t.id
                  ? 'border-primary bg-[linear-gradient(180deg,rgba(124,92,255,0.12),rgba(124,92,255,0.06))] shadow-[0_18px_40px_rgba(124,92,255,0.18)]'
                  : 'border-border bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(245,242,255,0.86))] hover:border-primary/45 hover:bg-[linear-gradient(180deg,rgba(124,92,255,0.09),rgba(130,196,255,0.08))] hover:shadow-[0_16px_36px_rgba(124,92,255,0.14)]'
              )}
            >
              <div
                className={cn(
                  'pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-250',
                  selectedTest === t.id
                    ? 'opacity-100 bg-[radial-gradient(circle_at_top_right,rgba(130,196,255,0.18),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(124,92,255,0.14),transparent_42%)]'
                    : 'group-hover:opacity-100 bg-[radial-gradient(circle_at_top_right,rgba(130,196,255,0.16),transparent_36%),radial-gradient(circle_at_bottom_left,rgba(124,92,255,0.12),transparent_44%)]'
                )}
              />
              {selectedTest === t.id && (
                <span className="absolute top-2 right-2.5 text-xs text-primary font-bold">✓</span>
              )}
              {support && (
                <span
                  className={cn(
                    'absolute left-3 top-3 rounded-full border px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider',
                    support.strategy === 'model'
                      ? 'border-success/30 bg-success/10 text-success'
                      : support.strategy === 'vision'
                        ? 'border-primary/30 bg-primary/10 text-primary'
                      : 'border-warning/30 bg-warning/10 text-warning'
                  )}
                >
                  {support.strategy === 'model'
                    ? `ML/DL ${support.bestModel?.toUpperCase()}`
                    : support.strategy === 'vision'
                      ? 'Vision'
                      : 'Rules'}
                </span>
              )}
              <span className="relative z-10 text-2xl transition-transform duration-200 group-hover:scale-110">{t.icon}</span>
              <span className={cn('relative z-10 font-bold text-sm pt-5 transition-colors', selectedTest === t.id ? 'text-primary' : 'group-hover:text-foreground')}>{t.name}</span>
              <span className="relative z-10 text-xs text-muted-foreground leading-snug">{t.desc}</span>
              {support && (
                <span className="relative z-10 mt-auto text-[0.7rem] text-muted-foreground leading-snug">
                  {support.note}
                </span>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
