import { AnalysisResult, Insight, Parameter } from './types';
import { PanelField } from './panelFields';
import { getRecommendationCard, getTestLabel } from './reportAnalytics';

export interface PanelInputValue {
  key: string;
  value: string;
}

const DEFAULT_LOCAL_ANALYZE_URL = 'http://127.0.0.1:8000';

function getApiBaseUrl() {
  return import.meta.env.VITE_LOCAL_ANALYZE_URL || DEFAULT_LOCAL_ANALYZE_URL;
}

function toNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
}

function getStatus(field: PanelField, rawValue: string): Parameter['status'] {
  if (field.type === 'select') return 'normal';
  const value = toNumber(rawValue);
  if (!Number.isFinite(value) || field.referenceLow === undefined || field.referenceHigh === undefined) {
    return 'normal';
  }

  const span = Math.max(field.referenceHigh - field.referenceLow, 1e-9);
  const borderBand = span * 0.08;

  if (value < field.referenceLow) {
    return field.referenceLow - value <= borderBand ? 'borderline' : 'low';
  }
  if (value > field.referenceHigh) {
    return value - field.referenceHigh <= borderBand ? 'borderline' : 'high';
  }
  if (value - field.referenceLow <= borderBand || field.referenceHigh - value <= borderBand) {
    return 'borderline';
  }
  return 'normal';
}

function getBarPercent(field: PanelField, rawValue: string) {
  const value = toNumber(rawValue);
  if (!Number.isFinite(value) || field.referenceLow === undefined || field.referenceHigh === undefined) {
    return 50;
  }
  const scaled = ((value - field.referenceLow) / Math.max(field.referenceHigh - field.referenceLow, 1e-9)) * 100;
  return Math.max(0, Math.min(100, Math.round(scaled)));
}

function getReferenceRange(field: PanelField) {
  if (field.referenceLow === undefined || field.referenceHigh === undefined) {
    return 'Not set';
  }
  return `${field.referenceLow}-${field.referenceHigh}`;
}

function getInsightLine(field: PanelField, status: Parameter['status']) {
  if (status === 'normal') return `${field.name} is within the expected reference range.`;
  if (status === 'borderline') return `${field.name} is near the edge of the reference range and may need monitoring.`;
  if (status === 'low') return `${field.name} is below the expected reference range and may need attention.`;
  return `${field.name} is above the expected reference range and may need attention.`;
}

function buildFallbackParameters(fields: PanelField[], values: Record<string, string>): Parameter[] {
  return fields
    .filter((field) => typeof values[field.key] === 'string' && values[field.key].trim() !== '')
    .map((field) => {
      const status = getStatus(field, values[field.key]);
      const numeric = toNumber(values[field.key]);
      return {
        name: field.name,
        value: values[field.key],
        numericValue: Number.isFinite(numeric) ? numeric : 0,
        unit: field.unit || '',
        referenceRange: getReferenceRange(field),
        refLow: field.referenceLow ?? 0,
        refHigh: field.referenceHigh ?? 0,
        status,
        barPercent: getBarPercent(field, values[field.key]),
        insight: getInsightLine(field, status),
      } satisfies Parameter;
    });
}

function buildFallbackInsights(testType: string, parameters: Parameter[], reason?: string): Insight[] {
  const abnormal = parameters.filter((parameter) => parameter.status !== 'normal');
  const insights: Insight[] = [];

  if (reason) {
    insights.push({
      type: 'info',
      title: 'Local browser fallback used',
      body: `${reason} The report was still analyzed in the browser using structured reference ranges and recommendation logic.`,
    });
  }

  if (abnormal.length === 0) {
    insights.push({
      type: 'positive',
      title: 'No major abnormalities detected',
      body: `The captured ${getTestLabel(testType)} markers are mostly within the expected ranges.`,
    });
    return insights;
  }

  abnormal.slice(0, 3).forEach((parameter) => {
    const card = getRecommendationCard(parameter.name, parameter.status);
    insights.push({
      type: parameter.status === 'borderline' ? 'tip' : 'warning',
      title: `${parameter.name} follow-up`,
      body: `${card.meaning} ${card.repeatAfter}`,
    });
  });

  return insights;
}

function buildFallbackSummary(testType: string, parameters: Parameter[], reason?: string) {
  const abnormal = parameters.filter((parameter) => parameter.status !== 'normal');
  if (abnormal.length === 0) {
    return `${getTestLabel(testType)} analysis completed successfully. All detected markers are within or near the expected range.${reason ? ` ${reason}` : ''}`;
  }

  const highlighted = abnormal
    .slice(0, 3)
    .map((parameter) => parameter.name)
    .join(', ');
  return `${getTestLabel(testType)} analysis completed with follow-up markers in ${highlighted}. ${abnormal.length > 3 ? 'Additional markers also need monitoring. ' : ''}${reason ? reason : ''}`.trim();
}

function buildFallbackResult(
  testType: string,
  fields: PanelField[],
  values: Record<string, string>,
  reason?: string
): AnalysisResult {
  const parameters = buildFallbackParameters(fields, values);
  const abnormal = parameters.filter((parameter) => parameter.status !== 'normal');
  const highRisk = parameters.some((parameter) => parameter.status === 'high' || parameter.status === 'low');
  const overallStatus: AnalysisResult['overallStatus'] =
    abnormal.length === 0 ? 'Normal' : highRisk ? 'Concern' : 'Needs Attention';
  const healthScore = Math.max(
    35,
    Math.min(98, Math.round(100 - abnormal.reduce((sum, parameter) => sum + (parameter.status === 'borderline' ? 6 : 12), 0)))
  );

  return {
    testName: getTestLabel(testType),
    overallStatus,
    healthScore,
    summary: buildFallbackSummary(testType, parameters, reason),
    parameters,
    insights: buildFallbackInsights(testType, parameters, reason),
    modality: 'labs',
  };
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return 'Local analysis request failed.';
}

export async function analyzeLocally(
  testType: string,
  fields: PanelField[],
  values: Record<string, string>
): Promise<AnalysisResult> {
  const parameters = fields
    .filter((field) => {
      const value = values[field.key];
      return typeof value === 'string' && value.trim() !== '';
    })
    .map((field) => ({
      key: field.key,
      name: field.name,
      value: values[field.key] || '',
      unit: field.unit || '',
      type: field.type,
      referenceLow: field.referenceLow,
      referenceHigh: field.referenceHigh,
      options: field.options,
    }));

  if (parameters.length === 0) {
    throw new Error('No blood parameters were detected from the uploaded report.');
  }

  const payload = {
    testType,
    parameters,
  };

  try {
    const response = await fetch(`${getApiBaseUrl()}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const fallbackMessage = `The local Python analyzer is not reachable right now, so HealthFirst used the built-in browser fallback instead.`;
      return buildFallbackResult(testType, fields, values, fallbackMessage);
    }

    return await response.json();
  } catch (error) {
    const fallbackMessage = `${getErrorMessage(error)} HealthFirst switched to the in-browser fallback analyzer.`;
    return buildFallbackResult(testType, fields, values, fallbackMessage);
  }
}

export async function analyzeRetinaImage(file: File): Promise<AnalysisResult> {
  const form = new FormData();
  form.append('file', file);

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch(`${getApiBaseUrl()}/analyze-retina`, {
        method: 'POST',
        body: form,
      });

      if (!response.ok) {
        throw new Error('Local retina screening service is not reachable. Start the Python backend first.');
      }

      return await response.json();
    } catch (error) {
      if (attempt === 1) {
        throw new Error(`${getErrorMessage(error)} HealthFirst could not complete retina screening locally because the Python vision backend is unavailable.`);
      }
      await new Promise((resolve) => setTimeout(resolve, 450));
    }
  }

  throw new Error('Retina analysis failed.');
}
