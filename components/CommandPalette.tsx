import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { dispatchSelectPanel, dispatchStartAnalysis, HF_OPEN_COMMAND_PALETTE_EVENT } from '@/lib/interactionEvents';

interface CommandPaletteProps {
  onOpenNotifications?: () => void;
}

interface CommandItem {
  id: string;
  title: string;
  subtitle: string;
  keywords: string[];
  run: () => void;
}

export default function CommandPalette({ onOpenNotifications }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen((current) => !current);
      }
      if (event.key === 'Escape') setOpen(false);
    };
    const onOpen = () => setOpen(true);
    window.addEventListener('keydown', onKey);
    window.addEventListener(HF_OPEN_COMMAND_PALETTE_EVENT, onOpen);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener(HF_OPEN_COMMAND_PALETTE_EVENT, onOpen);
    };
  }, []);

  useEffect(() => {
    setOpen(false);
    setQuery('');
  }, [location.pathname]);

  const commands = useMemo<CommandItem[]>(
    () => [
      {
        id: 'upload-report',
        title: 'Upload report',
        subtitle: 'Open the analysis flow and choose a panel',
        keywords: ['upload', 'report', 'blood', 'analysis', 'cbc'],
        run: () => {
          navigate('/');
          setTimeout(() => dispatchStartAnalysis(), 60);
        },
      },
      {
        id: 'open-dashboard',
        title: 'Open dashboard',
        subtitle: 'Jump to your patient dashboard',
        keywords: ['dashboard', 'history', 'patient'],
        run: () => navigate(isAuthenticated ? '/dashboard' : '/login'),
      },
      {
        id: 'compare-reports',
        title: 'Compare reports',
        subtitle: 'Open dashboard trend comparison view',
        keywords: ['compare', 'reports', 'trend', 'history'],
        run: () => navigate(isAuthenticated ? '/dashboard' : '/login'),
      },
      {
        id: 'go-retina',
        title: 'Go to retina screening',
        subtitle: 'Start diabetic retinopathy image screening',
        keywords: ['retina', 'eye', 'vision', 'diabetic retinopathy'],
        run: () => {
          navigate('/');
          setTimeout(() => {
            dispatchStartAnalysis();
            dispatchSelectPanel('retina');
          }, 80);
        },
      },
      {
        id: 'saved-reports',
        title: 'Saved reports',
        subtitle: 'Review your saved report library',
        keywords: ['saved', 'reports', 'history'],
        run: () => navigate(isAuthenticated ? '/dashboard' : '/login'),
      },
      {
        id: 'login',
        title: isAuthenticated ? 'Account center' : 'Login',
        subtitle: isAuthenticated ? 'Open your signed-in dashboard' : 'Create an account or sign in',
        keywords: ['login', 'account', 'register', 'profile'],
        run: () => navigate(isAuthenticated ? '/dashboard' : '/login'),
      },
      {
        id: 'notifications',
        title: 'Open notifications',
        subtitle: 'See reminders, extraction alerts, and report insights',
        keywords: ['notification', 'alerts', 'reminders'],
        run: () => onOpenNotifications?.(),
      },
    ],
    [isAuthenticated, navigate, onOpenNotifications]
  );

  const filtered = commands.filter((command) => {
    const haystack = `${command.title} ${command.subtitle} ${command.keywords.join(' ')}`.toLowerCase();
    return haystack.includes(query.toLowerCase());
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-[rgba(15,23,42,0.36)] backdrop-blur-sm" onClick={() => setOpen(false)}>
      <div
        className="mx-auto mt-24 w-[min(720px,calc(100%-24px))] rounded-[28px] border border-border/70 bg-white/95 p-5 shadow-[0_30px_90px_rgba(111,76,255,0.18)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Command Palette</div>
            <div className="text-sm text-muted-foreground">Navigate the product with one shortcut</div>
          </div>
          <div className="rounded-full border border-border/70 bg-secondary/60 px-3 py-1 text-xs font-semibold text-muted-foreground">Cmd/Ctrl + K</div>
        </div>
        <input
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search actions, pages, and workflows..."
          className="w-full rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm outline-none"
        />
        <div className="mt-4 max-h-[420px] space-y-2 overflow-auto">
          {filtered.map((command) => (
            <button
              key={command.id}
              type="button"
              onClick={() => {
                command.run();
                setOpen(false);
              }}
              className="w-full rounded-[20px] border border-border/70 bg-white/80 px-4 py-3 text-left transition-all hover:border-primary/30 hover:bg-primary/5"
            >
              <div className="text-sm font-semibold">{command.title}</div>
              <div className="mt-1 text-xs text-muted-foreground">{command.subtitle}</div>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="rounded-[20px] border border-border/70 bg-secondary/50 px-4 py-6 text-center text-sm text-muted-foreground">
              No commands matched. Try “dashboard”, “retina”, or “upload”.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
