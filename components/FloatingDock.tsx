import { useLocation, useNavigate } from 'react-router-dom';
import { dispatchSelectPanel, dispatchStartAnalysis } from '@/lib/interactionEvents';

export default function FloatingDock() {
  const navigate = useNavigate();
  const location = useLocation();

  const items = [
    {
      label: 'Upload',
      icon: '⬆',
      action: () => {
        navigate('/');
        setTimeout(() => dispatchStartAnalysis(), 50);
      },
    },
    {
      label: 'Dashboard',
      icon: '◫',
      action: () => navigate('/dashboard'),
    },
    {
      label: 'History',
      icon: '◎',
      action: () => navigate('/dashboard'),
    },
    {
      label: 'Retina',
      icon: '◉',
      action: () => {
        navigate('/');
        setTimeout(() => {
          dispatchStartAnalysis();
          dispatchSelectPanel('retina');
        }, 70);
      },
    },
    {
      label: 'Compare',
      icon: '⇄',
      action: () => navigate('/dashboard'),
    },
    {
      label: 'Export',
      icon: '↓',
      action: () => window.print(),
    },
  ];

  return (
    <div className="fixed bottom-5 left-1/2 z-40 hidden -translate-x-1/2 rounded-full border border-border/70 bg-white/78 px-3 py-2 shadow-[0_24px_60px_rgba(111,76,255,0.16)] backdrop-blur-xl md:block">
      <div className="flex items-center gap-1.5">
        {items.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={item.action}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition-all ${
              (item.label === 'Dashboard' && location.pathname === '/dashboard') ||
              (item.label === 'Upload' && location.pathname === '/')
                ? 'bg-primary text-primary-foreground shadow-[0_10px_24px_rgba(111,76,255,0.24)]'
                : 'text-muted-foreground hover:bg-primary/8 hover:text-primary'
            }`}
          >
            <span className="mr-1.5">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
