import { PropsWithChildren, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { fetchSavedReports, SavedEntry } from '@/lib/reportEntries';
import CommandPalette from '@/components/CommandPalette';
import FloatingDock from '@/components/FloatingDock';
import NotificationCenter from '@/components/NotificationCenter';

export default function AppInteractiveShell({ children }: PropsWithChildren) {
  const location = useLocation();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [reports, setReports] = useState<SavedEntry[]>([]);

  useEffect(() => {
    fetchSavedReports().then(setReports).catch(() => setReports([]));
  }, [location.pathname]);

  return (
    <>
      <CommandPalette onOpenNotifications={() => setNotificationsOpen(true)} />
      <NotificationCenter open={notificationsOpen} onClose={() => setNotificationsOpen(false)} reports={reports} />
      {children}
      <FloatingDock />
      <button
        type="button"
        onClick={() => setNotificationsOpen((current) => !current)}
        className="fixed right-5 bottom-24 z-40 hidden h-12 w-12 items-center justify-center rounded-full border border-border/70 bg-white/85 text-lg shadow-[0_20px_50px_rgba(111,76,255,0.14)] backdrop-blur-xl md:flex"
      >
        🔔
      </button>
    </>
  );
}
