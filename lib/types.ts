export interface Parameter {
  name: string;
  value: string;
  numericValue: number;
  unit: string;
  referenceRange: string;
  refLow: number;
  refHigh: number;
  status: 'normal' | 'high' | 'low' | 'borderline';
  barPercent: number;
  insight: string;
}

export interface RecommendationCard {
  title: string;
  meaning: string;
  possibleCauses: string[];
  foodTips: string[];
  lifestyleTips: string[];
  repeatAfter: string;
  doctorAdvice: string;
}

export interface KeyTakeaway {
  title: string;
  body: string;
  tone: 'success' | 'warning' | 'critical' | 'info';
}

export interface FollowUpReminder {
  id: string;
  title: string;
  body: string;
  dueDate: string;
  tone: 'success' | 'warning' | 'critical' | 'info';
}

export interface ComparisonPoint {
  key: string;
  name: string;
  currentValue: string;
  previousValue: string;
  delta: number | null;
  direction: 'up' | 'down' | 'flat';
  summary: string;
}

export interface ReportMeta {
  analyzedAt: string;
  sourceType?: 'image' | 'pdf' | 'csv' | 'manual' | 'retina';
  sourceName?: string;
  detectedParameterCount?: number;
  extractionMethod?: 'ocr' | 'pdf-text' | 'csv' | 'local-fallback';
  extractionConfidence?: number;
  extractionThresholdPassed?: boolean;
  extractionTemplate?: string;
  pageCount?: number;
  backendMode?: 'backend' | 'browser-fallback';
}

export interface RetinaOverlayRegion {
  id: string;
  label: string;
  severity: 'mild' | 'moderate' | 'high';
  color: string;
  confidence: number;
  x: number;
  y: number;
  width: number;
  height: number;
  note?: string;
}

export interface Insight {
  type: 'positive' | 'warning' | 'tip' | 'info';
  title: string;
  body: string;
}

export interface AnalysisResult {
  testName: string;
  overallStatus: 'Normal' | 'Needs Attention' | 'Concern';
  healthScore: number;
  summary: string;
  parameters: Parameter[];
  insights: Insight[];
  modality?: 'labs' | 'retina';
  urgentAttention?: boolean;
  keyTakeaways?: KeyTakeaway[];
  reminders?: FollowUpReminder[];
  comparison?: ComparisonPoint[];
  reportMeta?: ReportMeta;
  retinaOverlays?: RetinaOverlayRegion[];
}

export type AppStep = 'hero' | 'select' | 'upload' | 'loading' | 'results' | 'error';
