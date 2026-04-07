import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface StepperProps {
  currentStep: number; // 1, 2, or 3
}

const steps = ['Select Test', 'Upload Report', 'View Results'];

export default function Stepper({ currentStep }: StepperProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-center mb-12 pt-28"
    >
      {steps.map((label, i) => {
        const stepNum = i + 1;
        const isActive = stepNum === currentStep;
        const isDone = stepNum < currentStep;
        return (
          <div key={label} className="flex items-center">
            {i > 0 && (
              <div className={cn(
                'h-0.5 w-16 md:w-20 mb-6 relative overflow-hidden',
                isDone ? 'bg-success' : 'bg-border/80'
              )} />
            )}
            <div className="flex flex-col items-center gap-2">
              <div className={cn(
                'w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all duration-400',
                isActive && 'gradient-primary border-transparent text-primary-foreground shadow-[0_18px_40px_rgba(111,76,255,0.22)]',
                isDone && 'bg-success/15 border-success text-success',
                !isActive && !isDone && 'bg-white/80 border-border text-muted-foreground'
              )}>
                {isDone ? '✓' : stepNum}
              </div>
              <span className={cn(
                'text-[0.72rem] font-semibold tracking-wide uppercase whitespace-nowrap transition-colors duration-400',
                isActive && 'text-primary',
                isDone && 'text-success',
                !isActive && !isDone && 'text-muted-foreground'
              )}>
                {label}
              </span>
            </div>
          </div>
        );
      })}
    </motion.div>
  );
}
