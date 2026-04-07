import { motion } from 'framer-motion';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import BrandLogo from '@/components/BrandLogo';

export default function Login() {
  const navigate = useNavigate();
  const { login, register, requestPasswordReset, isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotOpen, setForgotOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);

    if (mode === 'register' && password !== confirmPassword) {
      setError('Password and confirm password must match.');
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'login') {
        await login(email, password);
        navigate('/dashboard');
      } else {
        await register(name, email, password);
        setSuccess('Account created successfully.');
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      const message = await requestPasswordReset(email);
      setSuccess(message);
    } catch (err: any) {
      setError(err.message || 'Could not start password reset.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fbfbff,#f2efff)] px-6 py-10">
      <div className="mx-auto max-w-[1180px]">
        <div className="mb-8 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 no-underline">
            <BrandLogo size="md" />
            <div>
              <div className="text-lg font-extrabold tracking-tight text-foreground">HealthFirst</div>
              <div className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Blood Analysis</div>
            </div>
          </Link>
          <Link to="/" className="rounded-full border border-border bg-white/80 px-4 py-2 text-sm font-semibold text-muted-foreground no-underline">
            Back to Home
          </Link>
        </div>

        <div className="grid items-center gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[38px] border border-border/70 bg-white/80 p-8 shadow-[0_30px_90px_rgba(111,76,255,0.08)]"
          >
            <div className="mb-3 text-xs font-bold uppercase tracking-[0.24em] text-primary">Member Access</div>
            <h1 className="text-4xl font-bold tracking-tight">
              {mode === 'login' ? 'Sign in to your HealthFirst workspace' : 'Create your HealthFirst account'}
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Access saved reports, screening history, dashboard views, and upcoming care reminders from one place.
            </p>

            <div className="mt-6 flex gap-2 rounded-full border border-border bg-secondary/60 p-1">
              <button
                type="button"
                onClick={() => setMode('login')}
                className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold ${mode === 'login' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setMode('register')}
                className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold ${mode === 'register' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
              >
                Create Account
              </button>
            </div>

            <div className="mt-8 space-y-4">
              {mode === 'register' && (
                <input
                  type="text"
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-[22px] border border-border bg-background px-5 py-4 text-sm outline-none"
                />
              )}
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-[22px] border border-border bg-background px-5 py-4 text-sm outline-none"
              />
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-[22px] border border-border bg-background px-5 py-4 pr-16 text-sm outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold uppercase tracking-wider text-primary"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {mode === 'login' && forgotOpen && (
                <div className="rounded-[20px] border border-border/70 bg-secondary/40 p-4">
                  <div className="mb-2 text-sm font-semibold">Forgot password?</div>
                  <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
                    Use your account email above, then send local reset instructions.
                  </p>
                  <button
                    type="button"
                    onClick={() => void handleForgotPassword()}
                    className="rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground"
                  >
                    Send Reset Instructions
                  </button>
                </div>
              )}
              {mode === 'register' && (
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-[22px] border border-border bg-background px-5 py-4 pr-16 text-sm outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((value) => !value)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold uppercase tracking-wider text-primary"
                  >
                    {showConfirmPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              )}
              {error && (
                <div className="rounded-[20px] border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}
              {success && (
                <div className="rounded-[20px] border border-success/20 bg-success/5 px-4 py-3 text-sm text-success">
                  {success}
                </div>
              )}
              {isAuthenticated && user && (
                <div className="rounded-[20px] border border-success/20 bg-success/5 px-4 py-3 text-sm text-success">
                  Signed in as {user.name} ({user.email})
                </div>
              )}
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={submitting || authLoading}
                className="w-full rounded-[22px] bg-primary px-5 py-4 text-sm font-semibold text-primary-foreground shadow-[0_12px_24px_rgba(111,76,255,0.18)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting || authLoading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
              </button>
              {mode === 'login' && (
                <button
                  type="button"
                  onClick={() => setForgotOpen((value) => !value)}
                  className="w-full text-sm font-semibold text-primary"
                >
                  {forgotOpen ? 'Hide password reset' : 'Forgot password?'}
                </button>
              )}
            </div>

            <div className="mt-6 flex items-center justify-between gap-3 text-sm text-muted-foreground">
              <span>{mode === 'login' ? 'New here? Create an account.' : 'Already have an account? Sign in.'}</span>
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'login' ? 'register' : 'login');
                  setError(null);
                  setSuccess(null);
                  setPassword('');
                  setConfirmPassword('');
                  setForgotOpen(false);
                }}
                className="font-semibold text-primary"
              >
                {mode === 'login' ? 'Switch to Register' : 'Switch to Login'}
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="rounded-[38px] border border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(246,242,255,0.88))] p-8 shadow-[0_30px_90px_rgba(111,76,255,0.08)]"
          >
            <div className="mb-6 text-xs font-bold uppercase tracking-[0.24em] text-primary">Inside Your Account</div>
            <div className="grid gap-5">
              {[
                ['Saved Reports', 'Store CBC, thyroid, retina, and future report history in one secure place.'],
                ['Care Dashboard', 'See trends, alerts, parameter drill-downs, and next-step recommendations.'],
                ['Follow-up Tracking', 'Keep upcoming repeat labs, reminders, and health milestones visible.'],
              ].map(([title, body]) => (
                <div key={title} className="rounded-[24px] border border-border/70 bg-white/80 p-5">
                  <div className="mb-1 text-lg font-bold">{title}</div>
                  <div className="text-sm text-muted-foreground">{body}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
