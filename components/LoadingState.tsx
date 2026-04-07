import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const loadingSteps = [
  'Detecting report structure',
  'Transforming report into extracted markers',
  'Scoring the selected panel',
  'Building the dashboard experience',
];

export default function LoadingState() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const timers = [0, 2200, 4600, 7000].map((d, i) =>
      setTimeout(() => setActiveStep(i), d)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-card border border-border rounded-[20px] p-10 md:p-16 text-center"
    >
      <div className="relative w-[72px] h-[72px] mx-auto mb-7">
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin" />
        <div className="absolute inset-[10px] rounded-full border-2 border-transparent border-r-accent animate-[spin_1s_linear_infinite_reverse]" />
        <div className="absolute inset-[20px] rounded-full border-2 border-transparent border-b-info animate-[spin_0.8s_linear_infinite]" />
      </div>

      <div className="text-xl font-semibold mb-2">Turning your report into a health dashboard…</div>
      <div className="text-muted-foreground text-sm">HealthFirst is extracting markers, shaping the cards, and preparing your results view</div>

      <div className="mx-auto mt-8 grid max-w-lg gap-4 md:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[24px] border border-border/70 bg-white/80 p-4">
          <div className="mb-3 text-xs font-bold uppercase tracking-[0.24em] text-primary">Report</div>
          <div className="space-y-2">
            {[1, 2, 3, 4].map((line) => (
              <div key={line} className="h-3 rounded-full bg-secondary/80" />
            ))}
            <div className="mt-4 h-28 rounded-[18px] border border-dashed border-primary/25 bg-primary/5" />
          </div>
        </div>
        <div className="rounded-[24px] border border-border/70 bg-white/80 p-4">
          <div className="mb-3 text-xs font-bold uppercase tracking-[0.24em] text-primary">Dashboard</div>
          <div className="grid gap-2">
            {[1, 2, 3].map((line) => (
              <motion.div
                key={line}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 * line }}
                className="h-14 rounded-[16px] bg-[linear-gradient(135deg,rgba(111,76,255,0.10),rgba(116,232,211,0.10))]"
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2.5 mt-8 max-w-xs mx-auto">
        {loadingSteps.map((step, i) => {
          const isActive = i === activeStep;
          const isDone = i < activeStep;
          return (
            <motion.div
              key={step}
              animate={isActive ? { scale: 1.02 } : { scale: 1 }}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-[10px] text-sm transition-all duration-400',
                isActive && 'bg-primary/8 text-foreground',
                isDone && 'text-success',
                !isActive && !isDone && 'bg-secondary text-muted-foreground'
              )}
            >
              <div className={cn(
                'w-2 h-2 rounded-full flex-shrink-0',
                isActive && 'bg-primary animate-pulse',
                isDone && 'bg-success',
                !isActive && !isDone && 'bg-border'
              )} />
              {step}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
