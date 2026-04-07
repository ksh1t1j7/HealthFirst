import { useMemo, useState } from 'react';
import { AnalysisResult } from '@/lib/types';
import { ComparisonPoint } from '@/lib/types';

interface HealthCopilotDrawerProps {
  data?: AnalysisResult | null;
  comparison?: ComparisonPoint[];
}

const suggestedPrompts = [
  'Why is my RBC high?',
  'Compare this with my last CBC',
  'What should I improve first?',
];

export default function HealthCopilotDrawer({ data, comparison = [] }: HealthCopilotDrawerProps) {
  const [open, setOpen] = useState(false);
  const [activePrompt, setActivePrompt] = useState('');

  const response = useMemo(() => {
    if (!data) {
      return 'Run an analysis first so the copilot can answer with context from your current report.';
    }

    const prompt = activePrompt.toLowerCase();
    if (!prompt) {
      return 'Ask about abnormal markers, what improved or worsened, or which parameter to prioritize first.';
    }

    if (prompt.includes('rbc')) {
      const marker = data.parameters.find((parameter) => parameter.name.toLowerCase().includes('rbc'));
      return marker
        ? `${marker.name} is currently ${marker.status}. ${marker.insight} Focus on hydration, iron status, and follow-up CBC context rather than looking at RBC alone.`
        : 'RBC Count is not present in the current panel.';
    }

    if (prompt.includes('compare')) {
      return comparison.length > 0
        ? comparison.slice(0, 2).map((item) => item.summary).join(' ')
        : 'There is no previous saved report yet, so comparison insights will appear after you save and analyze another report.';
    }

    if (prompt.includes('improve first')) {
      const priority = data.parameters.find((parameter) => parameter.status === 'high' || parameter.status === 'low') || data.parameters.find((parameter) => parameter.status === 'borderline');
      return priority
        ? `${priority.name} is the clearest place to start. ${priority.insight} Open its care guidance card for food, lifestyle, repeat-testing, and doctor follow-up suggestions.`
        : 'Most markers are stable, so the best next step is maintaining your current routine and tracking trends over time.';
    }

    return data.summary;
  }, [activePrompt, comparison, data]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-5 z-40 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-[0_20px_50px_rgba(111,76,255,0.22)]"
      >
        AI Copilot
      </button>
      <div className={`fixed inset-y-0 right-0 z-[95] w-[min(420px,100%)] transform transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex h-full flex-col border-l border-border/70 bg-white/95 p-6 shadow-[-24px_0_60px_rgba(111,76,255,0.16)] backdrop-blur-xl">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.24em] text-primary">AI Health Copilot</div>
              <div className="text-sm text-muted-foreground">Context-aware report guidance and comparison help</div>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="rounded-full border border-border/70 bg-secondary/60 px-3 py-1 text-xs font-semibold text-muted-foreground">
              Close
            </button>
          </div>
          <div className="space-y-2">
            {suggestedPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => setActivePrompt(prompt)}
                className="w-full rounded-[18px] border border-border/70 bg-secondary/40 px-4 py-3 text-left text-sm font-medium transition-all hover:border-primary/30 hover:bg-primary/5"
              >
                {prompt}
              </button>
            ))}
          </div>
          <textarea
            value={activePrompt}
            onChange={(event) => setActivePrompt(event.target.value)}
            placeholder="Ask about this report..."
            className="mt-5 min-h-[110px] rounded-[20px] border border-border/70 bg-background px-4 py-3 text-sm outline-none"
          />
          <div className="mt-5 flex-1 rounded-[24px] border border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(245,240,255,0.88))] p-5">
            <div className="mb-2 text-xs font-bold uppercase tracking-[0.24em] text-primary">Copilot Reply</div>
            <div className="text-sm leading-relaxed text-muted-foreground">{response}</div>
          </div>
        </div>
      </div>
    </>
  );
}
