import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[linear-gradient(180deg,#fbfbff,#f2efff)]">
        <div className="rounded-[24px] border border-border/70 bg-white/80 px-6 py-4 text-sm text-muted-foreground shadow-[0_20px_50px_rgba(111,76,255,0.08)]">
          Checking your session...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
