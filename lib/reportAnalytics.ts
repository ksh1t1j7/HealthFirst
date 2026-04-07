import { PANEL_FIELDS } from './panelFields';
import { TEST_TYPES } from './testTypes';
import { SavedEntry } from './reportEntries';
import { ComparisonPoint, FollowUpReminder, KeyTakeaway, RecommendationCard } from './types';

type ParameterStatus = 'normal' | 'high' | 'low' | 'borderline';

const parameterPlaybook: Array<{
  match: string[];
  title: string;
  meaning: string;
  causes: string[];
  foods: string[];
  lifestyle: string[];
  repeatAfter: string;
  doctorAdvice: string;
}> = [
  {
    match: ['hemoglobin', 'hb', 'hgb'],
    title: 'Support oxygen-carrying capacity',
    meaning: 'Hemoglobin helps carry oxygen through the body. Low values can align with anemia, fatigue, or low iron stores.',
    causes: ['Iron deficiency', 'Vitamin B12 or folate deficiency', 'Recent illness or blood loss'],
    foods: ['Beetroot', 'Spinach', 'Lentils and beans', 'Dates and raisins', 'Citrus fruit with meals'],
    lifestyle: ['Pair iron foods with vitamin C', 'Avoid tea or coffee right with iron-rich meals', 'Track fatigue and shortness of breath'],
    repeatAfter: 'Repeat CBC in 4 to 8 weeks if advised.',
    doctorAdvice: 'See a clinician sooner if you have severe fatigue, breathlessness, dizziness, or a rapid drop in value.',
  },
  {
    match: ['rbc count', 'red blood cell'],
    title: 'Keep red blood cell production steady',
    meaning: 'RBC count reflects how many red blood cells are circulating. Low values can contribute to tiredness, while high values can reflect dehydration or other triggers.',
    causes: ['Iron, B12, or folate deficiency', 'Dehydration', 'Smoking or altitude exposure'],
    foods: ['Leafy greens', 'Eggs', 'Lean meats', 'Beans and dals', 'Fortified cereals'],
    lifestyle: ['Stay well hydrated', 'Recheck values after recovery from illness', 'Review smoking and sleep quality'],
    repeatAfter: 'Repeat CBC in 4 to 8 weeks or with the next planned review.',
    doctorAdvice: 'Get medical review if high counts persist, especially with headaches, clotting history, or low oxygen symptoms.',
  },
  {
    match: ['platelet'],
    title: 'Protect clotting support',
    meaning: 'Platelets help with clotting. Low counts can increase bleeding risk, while high counts can be related to inflammation or recovery states.',
    causes: ['Recent infection', 'Inflammation', 'Iron deficiency', 'Medication effects'],
    foods: ['Folate-rich greens', 'B12-rich dairy or eggs', 'Iron-rich foods', 'Protein-rich balanced meals'],
    lifestyle: ['Avoid unnecessary NSAID use unless advised', 'Hydrate and sleep well', 'Monitor bruising or unusual bleeding'],
    repeatAfter: 'Repeat platelet count in 1 to 4 weeks if abnormal.',
    doctorAdvice: 'Seek prompt care for active bleeding, new bruising, chest pain, severe headache, or platelets far outside range.',
  },
  {
    match: ['wbc', 'white blood cell', 'neutrophil', 'lymphocyte', 'eosinophil', 'monocyte', 'basophil'],
    title: 'Monitor immune activity',
    meaning: 'White cell markers help reflect infection, inflammation, immune activation, or recovery from illness.',
    causes: ['Acute infection', 'Allergy or asthma flare', 'Stress response', 'Medication effects'],
    foods: ['Protein-rich foods', 'Vitamin C foods', 'Zinc-rich seeds and nuts', 'Hydrating fluids'],
    lifestyle: ['Prioritize rest and hydration', 'Track fever or infection symptoms', 'Review any recent medications'],
    repeatAfter: 'Repeat when infection settles or as your clinician advises.',
    doctorAdvice: 'Get medical review if values stay markedly high or low, or if you have fever, weight loss, or night sweats.',
  },
  {
    match: ['tsh', 't3', 't4', 'fti', 't4u'],
    title: 'Support thyroid balance',
    meaning: 'Thyroid markers regulate energy, weight, heart rate, and metabolism. Abnormal values usually need trend monitoring and clinical context.',
    causes: ['Hypothyroidism or hyperthyroidism', 'Missed thyroid medication', 'Autoimmune thyroid conditions'],
    foods: ['Adequate iodine foods', 'Selenium-rich nuts', 'Balanced protein intake', 'Regular meal timing'],
    lifestyle: ['Take thyroid medication consistently if prescribed', 'Keep sleep and stress stable', 'Review supplements that may affect thyroid tests'],
    repeatAfter: 'Repeat thyroid panel in 6 to 12 weeks after major changes unless advised otherwise.',
    doctorAdvice: 'See a clinician promptly for palpitations, weight loss, severe fatigue, neck swelling, or pregnancy-related thyroid concerns.',
  },
  {
    match: ['glucose', 'hba1c', 'insulin', 'bmi'],
    title: 'Improve metabolic control',
    meaning: 'Glucose-related markers show how well blood sugar is controlled over time and around meals.',
    causes: ['High refined carbohydrate intake', 'Insulin resistance', 'Low activity', 'Stress or steroid use'],
    foods: ['High-fiber meals', 'Protein with each meal', 'Vegetables before carbohydrates', 'Low-sugar snacks'],
    lifestyle: ['Walk after meals', 'Aim for regular sleep', 'Track fasting and post-meal trends', 'Limit sugary drinks'],
    repeatAfter: 'Repeat glucose or HbA1c in about 3 months unless advised earlier.',
    doctorAdvice: 'See a clinician if you have very high sugars, blurred vision, unexplained weight loss, or frequent urination.',
  },
  {
    match: ['creatinine', 'urea', 'bun', 'egfr', 'albumin', 'specific gravity'],
    title: 'Support kidney function',
    meaning: 'Kidney markers reflect filtration, hydration, and protein handling. Trends matter more than a single isolated value.',
    causes: ['Dehydration', 'Kidney stress', 'High blood pressure', 'Poor glucose control'],
    foods: ['Hydration as medically appropriate', 'Lower-salt meals', 'Balanced protein intake', 'Fresh fruits and vegetables'],
    lifestyle: ['Check blood pressure regularly', 'Review painkiller use', 'Stay consistent with diabetes control'],
    repeatAfter: 'Repeat kidney labs in 1 to 4 weeks if values are clearly abnormal.',
    doctorAdvice: 'Get medical review for swelling, reduced urine, persistent vomiting, or rapidly changing kidney markers.',
  },
  {
    match: ['alt', 'ast', 'alp', 'ggt', 'bilirubin', 'albumin', 'total protein'],
    title: 'Protect liver recovery',
    meaning: 'Liver markers can rise with fatty liver, medications, alcohol, infection, or inflammation.',
    causes: ['Fatty liver', 'Alcohol use', 'Medication effects', 'Viral illness'],
    foods: ['High-fiber meals', 'Lean protein', 'Fruit and vegetables', 'Lower saturated fat intake'],
    lifestyle: ['Avoid alcohol until reviewed', 'Review supplements and medicines', 'Aim for steady weight management'],
    repeatAfter: 'Repeat liver tests in 2 to 6 weeks if elevated.',
    doctorAdvice: 'See a clinician for jaundice, severe abdominal pain, vomiting, dark urine, or rapidly rising liver enzymes.',
  },
  {
    match: ['cholesterol', 'ldl', 'hdl', 'triglyceride'],
    title: 'Improve lipid profile',
    meaning: 'Lipid markers influence cardiovascular risk, especially when trends stay abnormal over time.',
    causes: ['Low activity', 'High saturated fat intake', 'Insulin resistance', 'Genetic lipid disorders'],
    foods: ['Oats', 'Nuts and seeds', 'Fatty fish', 'Olive oil', 'More vegetables and legumes'],
    lifestyle: ['Walk or exercise most days', 'Limit fried foods', 'Improve sleep quality'],
    repeatAfter: 'Repeat lipid panel in about 3 months after lifestyle changes.',
    doctorAdvice: 'Discuss treatment sooner if LDL or triglycerides are markedly elevated or if you have heart disease risk factors.',
  },
];

export function getTestLabel(testType: string) {
  return TEST_TYPES.find((entry) => entry.id === testType)?.name || testType.toUpperCase();
}

export function getSeverityScore(status: ParameterStatus) {
  switch (status) {
    case 'high':
      return 3;
    case 'low':
      return 2;
    case 'borderline':
      return 1;
    default:
      return 0;
  }
}

export function getParameterStatus(testType: string, key: string, rawValue: string): ParameterStatus {
  const field = PANEL_FIELDS[testType]?.find((entry) => entry.key === key);
  if (!field) return 'normal';

  if (field.type === 'select') return 'normal';
  const value = Number(rawValue);
  if (!Number.isFinite(value)) return 'normal';

  if (field.referenceLow !== undefined && field.referenceHigh !== undefined) {
    const range = field.referenceHigh - field.referenceLow;
    const borderlineBand = range > 0 ? range * 0.08 : 0;
    if (value < field.referenceLow) {
      return field.referenceLow - value <= borderlineBand ? 'borderline' : 'low';
    }
    if (value > field.referenceHigh) {
      return value - field.referenceHigh <= borderlineBand ? 'borderline' : 'high';
    }
    if (value - field.referenceLow <= borderlineBand || field.referenceHigh - value <= borderlineBand) {
      return 'borderline';
    }
  }

  return 'normal';
}

export function getRecommendationCard(name: string, status: ParameterStatus): RecommendationCard {
  const lowered = name.toLowerCase();
  const match = parameterPlaybook.find((entry) => entry.match.some((token) => lowered.includes(token)));

  const base = match || {
    title: `Care guidance for ${name}`,
    meaning: `${name} should be interpreted in clinical context and compared with your previous trends.`,
    causes: ['Recent illness', 'Medication changes', 'Hydration or nutrition changes'],
    foods: ['Balanced meals', 'Adequate hydration', 'Protein-rich foods'],
    lifestyle: ['Repeat the test if advised', 'Track symptoms', 'Review your recent routine changes'],
    repeatAfter: 'Repeat on the next planned review.',
    doctorAdvice: 'Seek care sooner if the value stays abnormal or you develop concerning symptoms.',
  };

  const titleSuffix =
    status === 'normal'
      ? 'Maintain this marker'
      : status === 'borderline'
        ? 'Watch this marker closely'
        : status === 'low'
          ? 'Support this low marker'
          : 'Bring this elevated marker back into range';

  return {
    title: `${base.title} · ${titleSuffix}`,
    meaning: base.meaning,
    possibleCauses: base.causes,
    foodTips: base.foods,
    lifestyleTips: base.lifestyle,
    repeatAfter: base.repeatAfter,
    doctorAdvice: base.doctorAdvice,
  };
}

export function buildTakeaways(parameters: Array<{ name: string; status: ParameterStatus }>): KeyTakeaway[] {
  const abnormal = parameters.filter((parameter) => parameter.status !== 'normal');
  if (abnormal.length === 0) {
    return [
      {
        title: 'Most markers are stable',
        body: 'This report is mostly within expected ranges. Keep your routine consistent and continue periodic follow-up.',
        tone: 'success',
      },
    ];
  }

  return abnormal.slice(0, 3).map((parameter) => ({
    title: `${parameter.name} needs follow-up`,
    body:
      parameter.status === 'borderline'
        ? `${parameter.name} is close to the edge of its expected range, so it is a good marker to watch over time.`
        : `${parameter.name} is outside the expected range and should be interpreted with symptoms, medical history, and previous reports.`,
    tone: getSeverityScore(parameter.status) >= 3 ? 'critical' : 'warning',
  }));
}

export function buildReminders(testType: string, parameters: Array<{ name: string; status: ParameterStatus }>): FollowUpReminder[] {
  const abnormal = parameters.filter((parameter) => parameter.status !== 'normal');
  const baseDate = new Date();

  const reminders = abnormal.slice(0, 3).map((parameter, index) => {
    const dueDays = parameter.status === 'high' || parameter.status === 'low' ? 7 + index * 7 : 21 + index * 7;
    const dueDate = new Date(baseDate.getTime() + dueDays * 24 * 60 * 60 * 1000);
    return {
      id: `${testType}-${parameter.name}-${index}`,
      title: `Review ${parameter.name}`,
      body:
        parameter.status === 'borderline'
          ? `Track ${parameter.name} and plan a repeat test if your clinician recommends it.`
          : `Recheck ${parameter.name} and review symptoms or medications before the next lab visit.`,
      dueDate: dueDate.toISOString(),
      tone: getSeverityScore(parameter.status) >= 3 ? 'critical' : 'warning',
    } satisfies FollowUpReminder;
  });

  if (reminders.length === 0) {
    const dueDate = new Date(baseDate.getTime() + 45 * 24 * 60 * 60 * 1000);
    reminders.push({
      id: `${testType}-routine-review`,
      title: 'Routine wellness follow-up',
      body: 'Schedule your next routine lab review to keep long-term trends visible.',
      dueDate: dueDate.toISOString(),
      tone: 'success',
    });
  }

  return reminders;
}

function toNumber(value: string | undefined) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function compareReportValues(testType: string, currentValues: Record<string, string>, previousEntry?: SavedEntry | null): ComparisonPoint[] {
  if (!previousEntry) return [];

  return (PANEL_FIELDS[testType] || [])
    .filter((field) => currentValues[field.key] && previousEntry.values[field.key])
    .slice(0, 6)
    .map((field) => {
      const current = currentValues[field.key];
      const previous = previousEntry.values[field.key];
      const currentNumber = toNumber(current);
      const previousNumber = toNumber(previous);
      const delta =
        currentNumber !== null && previousNumber !== null ? Number((currentNumber - previousNumber).toFixed(2)) : null;

      const direction =
        delta === null || delta === 0 ? 'flat' : delta > 0 ? 'up' : 'down';

      return {
        key: field.key,
        name: field.name,
        currentValue: current,
        previousValue: previous,
        delta,
        direction,
        summary:
          delta === null
            ? `${field.name} was captured in both reports.`
            : delta === 0
              ? `${field.name} is unchanged from the previous report.`
              : `${field.name} moved ${Math.abs(delta)} ${field.unit || ''} ${delta > 0 ? 'higher' : 'lower'} than the previous report.`,
      } satisfies ComparisonPoint;
    });
}

export function getLatestPreviousReport(reports: SavedEntry[], testType: string, currentId?: string) {
  return reports
    .filter((report) => report.testType === testType && report.id !== currentId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] || null;
}

export function summarizeAbnormalMarkers(entry: SavedEntry) {
  const fields = PANEL_FIELDS[entry.testType] || [];
  return fields
    .map((field) => ({
      field,
      value: entry.values[field.key],
    }))
    .filter((item) => item.value)
    .map((item) => ({
      key: item.field.key,
      name: item.field.name,
      value: item.value,
      status: getParameterStatus(entry.testType, item.field.key, item.value),
    }))
    .filter((item) => item.status !== 'normal')
    .sort((a, b) => getSeverityScore(b.status) - getSeverityScore(a.status));
}

export function buildTrendSeries(reports: SavedEntry[], testType: string, markerKeys: string[]) {
  return reports
    .filter((report) => report.testType === testType)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map((report) => {
      const row: Record<string, string | number> = {
        date: new Date(report.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      };

      markerKeys.forEach((markerKey) => {
        const numeric = toNumber(report.values[markerKey]);
        if (numeric !== null) {
          row[markerKey] = numeric;
        }
      });

      return row;
    });
}

export function buildTrendStory(testType: string, currentValues: Record<string, string>, previousEntry?: SavedEntry | null) {
  const comparison = compareReportValues(testType, currentValues, previousEntry);
  if (comparison.length === 0) {
    return [
      {
        title: 'First report in this timeline',
        body: 'Save this report to unlock richer trend stories, drift detection, and compare-with-previous analysis.',
        tone: 'info' as const,
      },
    ];
  }

  return comparison.slice(0, 3).map((point) => ({
    title:
      point.direction === 'flat'
        ? `${point.name} stayed stable`
        : point.direction === 'up'
          ? `${point.name} is trending upward`
          : `${point.name} is trending downward`,
    body: point.summary,
    tone:
      point.direction === 'flat'
        ? ('success' as const)
        : point.direction === 'up'
          ? ('warning' as const)
          : ('info' as const),
  }));
}

export function buildTimelineEvents(reports: SavedEntry[]) {
  return reports
    .slice()
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .slice(-8)
    .map((report) => {
      const abnormal = summarizeAbnormalMarkers(report);
      const tone = report.testType === 'retina' ? 'vision' : abnormal.length === 0 ? 'stable' : abnormal.length >= 3 ? 'critical' : 'attention';
      return {
        id: report.id,
        title: getTestLabel(report.testType),
        date: new Date(report.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        tone,
        note:
          report.testType === 'retina'
            ? 'Retina screening captured'
            : abnormal.length === 0
              ? 'No major flags'
              : `${abnormal.length} abnormal marker${abnormal.length === 1 ? '' : 's'}`,
      };
    });
}
