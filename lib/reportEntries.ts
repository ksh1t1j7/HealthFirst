import { AnalysisResult } from './types';
import { getStoredToken, me } from './auth';

const DEFAULT_API_BASE_URL = 'http://127.0.0.1:8000';
const LOCAL_REPORTS_KEY = 'healthfirst_local_reports_v1';

export interface SavedEntry {
  id: string;
  title: string;
  testType: string;
  createdAt: string;
  values: Record<string, string>;
  sourceType?: 'image' | 'pdf' | 'csv' | 'manual' | 'retina';
  sourceName?: string;
  analysis?: Pick<AnalysisResult, 'overallStatus' | 'healthScore' | 'summary' | 'parameters' | 'keyTakeaways' | 'reminders' | 'urgentAttention'>;
}

function getApiBaseUrl() {
  return import.meta.env.VITE_LOCAL_ANALYZE_URL || DEFAULT_API_BASE_URL;
}

function requireToken() {
  const token = getStoredToken();
  if (!token) {
    throw new Error('Please sign in to access this feature.');
  }
  return token;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = requireToken();
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

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

function loadLocalReports(): Record<string, SavedEntry[]> {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_REPORTS_KEY) || '{}') as Record<string, SavedEntry[]>;
  } catch {
    return {};
  }
}

function saveLocalReports(reportMap: Record<string, SavedEntry[]>) {
  localStorage.setItem(LOCAL_REPORTS_KEY, JSON.stringify(reportMap));
}

async function getCurrentUserId() {
  const token = requireToken();
  const user = await me(token);
  return user.id;
}

export function getAllSavedReportsByUser(): Record<string, SavedEntry[]> {
  return loadLocalReports();
}

export async function fetchAllSavedReportsByUser(): Promise<Record<string, SavedEntry[]>> {
  try {
    const payload = await request<{ reports_by_user: Record<string, SavedEntry[]> }>('/reports/all');
    return payload.reports_by_user || {};
  } catch (error) {
    if (!isNetworkError(error)) throw error;
    return loadLocalReports();
  }
}

export async function fetchSavedReports(): Promise<SavedEntry[]> {
  try {
    const payload = await request<{ reports: SavedEntry[] }>('/reports');
    return payload.reports || [];
  } catch (error) {
    if (!isNetworkError(error)) throw error;
    const userId = await getCurrentUserId();
    return loadLocalReports()[userId] || [];
  }
}

export async function saveReport(entry: SavedEntry): Promise<SavedEntry[]> {
  try {
    const payload = await request<{ reports: SavedEntry[] }>('/reports', {
      method: 'POST',
      body: JSON.stringify(entry),
    });
    return payload.reports || [];
  } catch (error) {
    if (!isNetworkError(error)) throw error;
    const userId = await getCurrentUserId();
    const reportMap = loadLocalReports();
    const existing = reportMap[userId] || [];
    const next = [entry, ...existing.filter((report) => report.id !== entry.id)];
    reportMap[userId] = next;
    saveLocalReports(reportMap);
    return next;
  }
}

export async function removeReport(reportId: string): Promise<SavedEntry[]> {
  try {
    const payload = await request<{ reports: SavedEntry[] }>(`/reports/${reportId}`, {
      method: 'DELETE',
    });
    return payload.reports || [];
  } catch (error) {
    if (!isNetworkError(error)) throw error;
    const userId = await getCurrentUserId();
    const reportMap = loadLocalReports();
    const next = (reportMap[userId] || []).filter((report) => report.id !== reportId);
    reportMap[userId] = next;
    saveLocalReports(reportMap);
    return next;
  }
}
