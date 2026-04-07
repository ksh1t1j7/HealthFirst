import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import BrandLogo from '@/components/BrandLogo';
import { dispatchOpenCommandPalette } from '@/lib/interactionEvents';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const actionPillClass =
    'inline-flex h-9 items-center justify-center rounded-full border border-primary/18 bg-white/28 px-4 text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-muted-foreground no-underline transition-all duration-200 hover:border-primary/38 hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30';

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed left-4 right-4 top-6 z-50 flex items-center justify-between gap-4 rounded-[28px] border border-primary/10 bg-white/18 px-4 py-3 shadow-[0_16px_50px_rgba(111,76,255,0.06)] backdrop-blur-xl"
    >
      <Link
        to="/"
        aria-label="Go to HealthFirst home page"
        className="group flex min-w-0 items-center gap-3 rounded-[22px] border border-transparent px-1 py-1 no-underline transition-all duration-200"
      >
        <div className="relative">
          <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(circle,rgba(124,92,255,0.16),transparent_68%)] opacity-0 blur-xl transition-opacity duration-200 group-hover:opacity-100" />
          <BrandLogo size="md" className="relative h-10 w-10 rounded-[16px] transition-transform duration-200 group-hover:scale-[1.03]" />
        </div>
        <div className="min-w-0 flex flex-col leading-none">
          <span className="truncate text-[0.98rem] font-extrabold tracking-tight text-foreground transition-colors duration-200 group-hover:text-primary sm:text-[1.05rem]">
            Health<span className="text-primary">First</span>
          </span>
          <span className="mt-1 truncate text-[0.56rem] font-semibold uppercase tracking-[0.3em] text-muted-foreground transition-colors duration-200 group-hover:text-foreground/70">
            Blood Analysis
          </span>
        </div>
      </Link>
      <div className="flex min-w-0 items-center justify-end gap-2 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button
          type="button"
          onClick={dispatchOpenCommandPalette}
          className={actionPillClass}
        >
          Search
        </button>
        <Link
          to={isAuthenticated ? "/dashboard" : "/"}
          className={actionPillClass}
        >
          Dashboard
        </Link>
        {isAuthenticated && (
          <Link
            to="/clinician"
            className={`${actionPillClass} hidden xl:inline-flex`}
          >
            Clinician
          </Link>
        )}
        {isAuthenticated && user ? (
          <>
            <div className="hidden h-9 max-w-[140px] items-center truncate rounded-full border border-primary/12 bg-white/28 px-4 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-primary lg:inline-flex">
              {user.name}
            </div>
            <button
              type="button"
              onClick={() => void logout()}
              className="inline-flex h-9 items-center justify-center rounded-full border border-primary/20 bg-primary/10 px-4 text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-primary transition-all duration-200 hover:border-primary/40 hover:bg-primary/16"
            >
              Logout
            </button>
          </>
        ) : (
          <Link
            to="/login"
            className="inline-flex h-9 items-center justify-center rounded-full border border-primary/20 bg-primary/10 px-4 text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-primary no-underline transition-all duration-200 hover:border-primary/40 hover:bg-primary/16"
          >
            Login
          </Link>
        )}
      </div>
    </motion.nav>
  );
}
