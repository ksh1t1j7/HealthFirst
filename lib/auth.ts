const AUTH_TOKEN_KEY = 'healthfirst_auth_token_v2';
const LOCAL_ACCOUNTS_KEY = 'healthfirst_local_accounts_v1';
const DEFAULT_API_BASE_URL = 'http://127.0.0.1:8000';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  isVerified: boolean;
  role: 'patient' | 'clinician';
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

interface LocalAccount extends AuthUser {
  password: string;
}

function getApiBaseUrl() {
  return import.meta.env.VITE_LOCAL_ANALYZE_URL || DEFAULT_API_BASE_URL;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, init);
  if (!response.ok) {
    let detail = 'Request failed.';
    try {
      const payload = await response.json();
      detail = payload?.detail || payload?.message || detail;
    } catch {
      detail = response.statusText || detail;
    }
    throw new Error(detail);
  }
  return response.json() as Promise<T>;
}

function isNetworkError(error: unknown) {
  return error instanceof Error && /failed to fetch|networkerror|load failed/i.test(error.message);
}

function loadLocalAccounts(): LocalAccount[] {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_ACCOUNTS_KEY) || '[]') as LocalAccount[];
  } catch {
    return [];
  }
}

function saveLocalAccounts(accounts: LocalAccount[]) {
  localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(accounts));
}

function makeLocalToken(userId: string) {
  return `local-auth:${userId}`;
}

function parseLocalToken(token: string) {
  return token.startsWith('local-auth:') ? token.slice('local-auth:'.length) : null;
}

function toPublicUser(account: LocalAccount): AuthUser {
  const { password, ...user } = account;
  void password;
  return user;
}

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
  };
}

export function getStoredToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function storeToken(token: string) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearStoredToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

export async function register(name: string, email: string, password: string): Promise<AuthResponse & { message?: string }> {
  const trimmedName = name.trim();
  const normalizedEmail = normalizeEmail(email);
  const trimmedPassword = password.trim();

  if (trimmedName.length < 2) throw new Error('Name must be at least 2 characters.');
  if (!normalizedEmail.includes('@')) throw new Error('Enter a valid email address.');
  if (trimmedPassword.length < 6) throw new Error('Password must be at least 6 characters.');

  try {
    return await request('/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: trimmedName,
        email: normalizedEmail,
        password: trimmedPassword,
      }),
    });
  } catch (error) {
    if (!isNetworkError(error)) throw error;

    const accounts = loadLocalAccounts();
    if (accounts.some((account) => account.email === normalizedEmail)) {
      throw new Error('An account already exists for this email.');
    }

    const account: LocalAccount = {
      id: crypto.randomUUID(),
      name: trimmedName,
      email: normalizedEmail,
      password: trimmedPassword,
      isVerified: true,
      role: 'patient',
      createdAt: new Date().toISOString(),
    };
    accounts.push(account);
    saveLocalAccounts(accounts);
    return {
      token: makeLocalToken(account.id),
      user: toPublicUser(account),
      message: 'Account created locally.',
    };
  }
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const normalizedEmail = normalizeEmail(email);
  const trimmedPassword = password.trim();
  try {
    return await request('/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: normalizedEmail,
        password: trimmedPassword,
      }),
    });
  } catch (error) {
    if (!isNetworkError(error)) throw error;

    const account = loadLocalAccounts().find((entry) => entry.email === normalizedEmail);
    if (!account || account.password !== trimmedPassword) {
      throw new Error('Invalid email or password.');
    }
    return {
      token: makeLocalToken(account.id),
      user: toPublicUser(account),
    };
  }
}

export async function me(token: string): Promise<AuthUser> {
  const localUserId = parseLocalToken(token);
  if (localUserId) {
    const account = loadLocalAccounts().find((entry) => entry.id === localUserId);
    if (!account) throw new Error('Session expired.');
    return toPublicUser(account);
  }

  const payload = await request<{ user: AuthUser }>('/auth/me', {
    headers: authHeaders(token),
  });
  return payload.user;
}

export async function logout(token: string) {
  if (parseLocalToken(token)) {
    return;
  }
  await request('/auth/logout', {
    method: 'POST',
    headers: authHeaders(token),
  });
}

export async function updateProfile(token: string, updates: { name?: string; role?: 'patient' | 'clinician' }) {
  const localUserId = parseLocalToken(token);
  if (localUserId) {
    const accounts = loadLocalAccounts();
    const index = accounts.findIndex((entry) => entry.id === localUserId);
    if (index === -1) throw new Error('Sign in again to update your profile.');
    accounts[index] = {
      ...accounts[index],
      ...(updates.name ? { name: updates.name.trim() } : {}),
      ...(updates.role ? { role: updates.role } : {}),
    };
    saveLocalAccounts(accounts);
    return toPublicUser(accounts[index]);
  }

  const payload = await request<{ user: AuthUser }>('/auth/profile', {
    method: 'POST',
    headers: {
      ...authHeaders(token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });
  return payload.user;
}

export async function markEmailVerified(token: string) {
  return me(token);
}

export async function requestEmailVerificationOtp(email: string) {
  return {
    message: `Email verification is disabled for now. You can sign in directly with ${normalizeEmail(email)}.`,
  };
}

export async function verifyEmailOtp(email: string, otp: string) {
  void otp;
  throw new Error(`OTP verification is disabled for now. Sign in directly with ${normalizeEmail(email)}.`);
}

export async function requestPasswordReset(email: string) {
  return {
    message: `Password reset is not configured yet. Use the verified account ${normalizeEmail(email)} or add a backend reset flow next.`,
  };
}

export async function logoutEverywhere(token: string) {
  if (parseLocalToken(token)) {
    return;
  }
  await request('/auth/logout-everywhere', {
    method: 'POST',
    headers: authHeaders(token),
  });
}

export async function listLocalAccounts(): Promise<Array<AuthUser & { totalUsers: number }>> {
  try {
    const payload = await request<{ users: AuthUser[] }>('/auth/users');
    return payload.users.map((user, _, all) => ({
      ...user,
      totalUsers: all.length,
    }));
  } catch (error) {
    if (!isNetworkError(error)) throw error;
    const users = loadLocalAccounts().map(toPublicUser);
    return users.map((user) => ({
      ...user,
      totalUsers: users.length,
    }));
  }
}
