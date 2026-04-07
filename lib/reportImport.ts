import { PanelField } from './panelFields';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

export interface ImportReviewItem {
  key: string;
  name: string;
  value: string;
  confidence: number;
  matchedLabel?: string;
  unit?: string;
  pageNumber?: number;
  strategy?: 'table' | 'line' | 'adjacent-line' | 'regex' | 'csv' | 'select';
  adjusted?: boolean;
  rawValue?: string;
  correctionReason?: string;
  sourceSnippet?: string;
}

export interface ImportResult {
  values: Record<string, string>;
  rawText: string;
  review: ImportReviewItem[];
  sourceType: 'image' | 'pdf' | 'csv';
  averageConfidence: number;
  confidenceThresholdPassed: boolean;
  pageCount: number;
  extractionMethod: 'ocr' | 'pdf-text' | 'csv';
  templateName: string;
}

interface PdfTextResult {
  text: string;
  pageTexts: string[];
  pageCount: number;
}

interface PdfPageImageResult {
  pageImages: string[];
  pageCount: number;
}

interface MatchResult {
  value: string;
  confidence: number;
  matchedLabel: string;
  pageNumber?: number;
  strategy: ImportReviewItem['strategy'];
  adjusted?: boolean;
  rawValue?: string;
  correctionReason?: string;
  sourceSnippet?: string;
}

function normalize(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9.%/+-]+/g, ' ').trim();
}

function compact(text: string) {
  return normalize(text).replace(/\s+/g, '');
}

function escapeRegex(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeNumericToken(raw: string) {
  return raw.replace(/,/g, '').replace(/[^0-9.+-]/g, '');
}

function formatNumericValue(value: number) {
  if (Math.abs(value) >= 1000) return value.toFixed(0);
  if (Math.abs(value) >= 100) return value.toFixed(1).replace(/\.0$/, '');
  if (Math.abs(value) >= 10) return value.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
  return value.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
}

function lineContainsLabel(line: string, labels: string[]) {
  const normalizedLine = normalize(line);
  const compactLine = compact(line);
  return labels.some((label) => {
    const normalizedLabel = normalize(label);
    const compactLabel = compact(label);
    return normalizedLine.includes(normalizedLabel) || compactLine.includes(compactLabel);
  });
}

function confidenceThresholdFor(sourceType: ImportResult['sourceType']) {
  if (sourceType === 'csv') return 0.98;
  if (sourceType === 'pdf') return 0.68;
  return 0.62;
}

function inferTemplateName(rawText: string, fields: PanelField[]) {
  const lowered = normalize(rawText);
  if (lowered.includes('complete blood count') || lowered.includes('cbc')) return 'CBC table template';
  if (lowered.includes('thyroid') || lowered.includes('tsh')) return 'Thyroid panel template';
  if (lowered.includes('glycated hemoglobin') || lowered.includes('hba1c')) return 'Diabetes panel template';
  if (lowered.includes('liver function') || lowered.includes('sgpt') || lowered.includes('sgot')) return 'Liver function template';
  if (lowered.includes('creatinine') || lowered.includes('urea') || lowered.includes('kidney')) return 'Renal function template';
  const detected = fields.filter((field) => lineContainsLabel(rawText, [field.name, field.key, ...(field.aliases || [])]));
  if (detected.length >= Math.max(3, Math.round(fields.length * 0.3))) return 'Panel-aware template';
  return 'Generic report template';
}

function scoreValueAgainstReference(field: PanelField, rawValue: string) {
  const normalizedRaw = normalizeNumericToken(rawValue);
  const parsed = Number(normalizedRaw);
  if (!Number.isFinite(parsed) || field.referenceLow === undefined || field.referenceHigh === undefined) {
    return { value: normalizedRaw || rawValue, confidencePenalty: 0, adjusted: false, correctionReason: undefined };
  }

  const span = Math.max(field.referenceHigh - field.referenceLow, 1e-9);
  const generousLow = field.referenceLow - span * 1.2;
  const generousHigh = field.referenceHigh + span * 1.2;

  if (parsed >= generousLow && parsed <= generousHigh) {
    return { value: formatNumericValue(parsed), confidencePenalty: 0, adjusted: false, correctionReason: undefined };
  }

  const decimalCandidates = [parsed / 10, parsed / 100];
  for (const candidate of decimalCandidates) {
    if (candidate >= generousLow && candidate <= generousHigh) {
      return {
        value: formatNumericValue(candidate),
        confidencePenalty: 0.05,
        adjusted: true,
        correctionReason: `Corrected OCR read "${normalizedRaw}" to "${formatNumericValue(candidate)}" because it fits the expected clinical range much better.`,
      };
    }
  }

  return {
    value: formatNumericValue(parsed),
    confidencePenalty: 0.04,
    adjusted: false,
    correctionReason: undefined,
  };
}

function buildTableCandidate(line: string, field: PanelField): MatchResult | null {
  const labels = [field.name, field.key, ...(field.aliases || [])];
  if (!lineContainsLabel(line, labels)) return null;

  const label = labels.find((entry) => lineContainsLabel(line, [entry])) || labels[0];
  const labelIndex = compact(line).indexOf(compact(label));
  const numericTokens = [...line.matchAll(/-?\d[\d,]*(?:\.\d+)?/g)].map((match) => ({
    raw: match[0],
    index: match.index ?? 0,
  }));

  if (numericTokens.length === 0) return null;

  const token = numericTokens.find((entry) => entry.index >= Math.max(0, labelIndex - 4)) || numericTokens[0];
  const corrected = scoreValueAgainstReference(field, token.raw);
  return {
    value: corrected.value,
    confidence: Math.max(0.88, 0.985 - corrected.confidencePenalty),
    matchedLabel: label,
    strategy: 'table',
    adjusted: corrected.adjusted,
    rawValue: normalizeNumericToken(token.raw),
    correctionReason: corrected.correctionReason,
    sourceSnippet: line.slice(0, 160),
  };
}

function detectSelectValue(rawText: string, field: PanelField): MatchResult | null {
  const lowered = rawText.toLowerCase();
  const labels = [field.name, field.key, ...(field.aliases || [])];
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    if (!lineContainsLabel(line, labels)) continue;
    const loweredLine = line.toLowerCase();

    for (const option of field.options || []) {
      if (loweredLine.includes(option.toLowerCase())) {
        return { value: option, confidence: 0.95, matchedLabel: field.name, strategy: 'select' };
      }
    }
  }

  if ((field.key === 'gender' || field.key === 'sex') && lowered.includes('sex') && lowered.includes('male')) {
    return { value: 'male', confidence: 0.92, matchedLabel: 'sex', strategy: 'select', sourceSnippet: 'Sex: Male' };
  }

  if ((field.key === 'gender' || field.key === 'sex') && lowered.includes('sex') && lowered.includes('female')) {
    return { value: 'female', confidence: 0.92, matchedLabel: 'sex', strategy: 'select', sourceSnippet: 'Sex: Female' };
  }

  return null;
}

function findValue(rawText: string, labels: string[], field: PanelField, pageTexts?: string[]) {
  const pages = pageTexts && pageTexts.length > 0 ? pageTexts : [rawText];

  for (let pageIndex = 0; pageIndex < pages.length; pageIndex += 1) {
    const lines = pages[pageIndex]
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    for (const line of lines) {
      const tableCandidate = buildTableCandidate(line, field);
      if (tableCandidate) {
        return { ...tableCandidate, pageNumber: pageIndex + 1 };
      }
    }

    for (const line of lines) {
      if (!lineContainsLabel(line, labels)) continue;
      const directMatch = line.match(/(-?\d[\d,]*(?:\.\d+)?)/);
      if (directMatch?.[1]) {
        const corrected = scoreValueAgainstReference(field, directMatch[1]);
        return {
          value: corrected.value,
          confidence: Math.max(0.82, 0.94 - corrected.confidencePenalty),
          matchedLabel: labels[0],
          pageNumber: pageIndex + 1,
          strategy: 'line',
          adjusted: corrected.adjusted,
          rawValue: normalizeNumericToken(directMatch[1]),
          correctionReason: corrected.correctionReason,
          sourceSnippet: line.slice(0, 160),
        };
      }
    }

    for (let index = 0; index < lines.length - 1; index += 1) {
      const current = lines[index];
      const next = lines[index + 1];
      if (!lineContainsLabel(current, labels)) continue;
      const nextMatch = next.match(/(-?\d[\d,]*(?:\.\d+)?)/);
      if (nextMatch?.[1]) {
        const corrected = scoreValueAgainstReference(field, nextMatch[1]);
        return {
          value: corrected.value,
          confidence: Math.max(0.76, 0.88 - corrected.confidencePenalty),
          matchedLabel: labels[0],
          pageNumber: pageIndex + 1,
          strategy: 'adjacent-line',
          adjusted: corrected.adjusted,
          rawValue: normalizeNumericToken(nextMatch[1]),
          correctionReason: corrected.correctionReason,
          sourceSnippet: `${current.slice(0, 80)} / ${next.slice(0, 80)}`,
        };
      }
    }
  }

  const normalized = normalize(rawText);
  const compactText = compact(rawText);

  for (const label of labels) {
    const normalizedLabel = normalize(label);
    const compactLabel = compact(label);
    const escaped = escapeRegex(normalizedLabel);

    const exactMatch = normalized.match(new RegExp(`${escaped}[^\\d]{0,24}(-?\\d[\\d,]*(?:\\.\\d+)?)`, 'i'));
    if (exactMatch?.[1]) {
      const corrected = scoreValueAgainstReference(field, exactMatch[1]);
      return {
        value: corrected.value,
        confidence: Math.max(0.68, 0.82 - corrected.confidencePenalty),
        matchedLabel: label,
        strategy: 'regex',
        adjusted: corrected.adjusted,
        rawValue: normalizeNumericToken(exactMatch[1]),
        correctionReason: corrected.correctionReason,
        sourceSnippet: normalizedLabel,
      };
    }

    const compactMatch = compactText.match(new RegExp(`${escapeRegex(compactLabel)}[^\\d]{0,16}(-?\\d[\\d,]*(?:\\.\\d+)?)`, 'i'));
    if (compactMatch?.[1]) {
      const corrected = scoreValueAgainstReference(field, compactMatch[1]);
      return {
        value: corrected.value,
        confidence: Math.max(0.62, 0.76 - corrected.confidencePenalty),
        matchedLabel: label,
        strategy: 'regex',
        adjusted: corrected.adjusted,
        rawValue: normalizeNumericToken(compactMatch[1]),
        correctionReason: corrected.correctionReason,
        sourceSnippet: compactLabel,
      };
    }
  }

  return null;
}

async function preprocessImage(file: File) {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read this image file.'));
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const maxWidth = 2000;
        const scale = image.width > maxWidth ? maxWidth / image.width : 1;
        const width = Math.round(image.width * scale);
        const height = Math.round(image.height * scale);

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');
        if (!context) {
          reject(new Error('Canvas preprocessing is not available in this browser.'));
          return;
        }

        context.filter = 'grayscale(1) contrast(1.22) brightness(1.06)';
        context.drawImage(image, 0, 0, width, height);

        const imageData = context.getImageData(0, 0, width, height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
          const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
          const boosted = Math.max(0, Math.min(255, (gray - 118) * 1.38 + 146));
          data[i] = boosted;
          data[i + 1] = boosted;
          data[i + 2] = boosted;
        }

        context.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      image.onerror = () => reject(new Error('Could not decode this image file.'));
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

function summarizeConfidence(review: ImportReviewItem[], sourceType: ImportResult['sourceType']) {
  if (review.length === 0) {
    return {
      averageConfidence: 0,
      confidenceThresholdPassed: false,
    };
  }

  const weightedScores = review.map((item) => {
    if (item.strategy === 'table') return Math.min(0.99, item.confidence + 0.03);
    if (item.strategy === 'select') return Math.min(0.99, item.confidence + 0.02);
    return item.confidence;
  });
  const averageConfidence = weightedScores.reduce((sum, item) => sum + item, 0) / weightedScores.length;
  const threshold = confidenceThresholdFor(sourceType);
  const strongMatches = review.filter((item) => item.confidence >= threshold).length;

  return {
    averageConfidence,
    confidenceThresholdPassed: averageConfidence >= threshold || strongMatches >= Math.max(2, Math.ceil(review.length * 0.45)),
  };
}

function buildImportResult(
  rawText: string,
  fields: PanelField[],
  sourceType: 'image' | 'pdf' | 'csv',
  extractionMethod: ImportResult['extractionMethod'],
  pageTexts?: string[],
  ocrConfidenceBoost = 1
): ImportResult {
  const values: Record<string, string> = {};
  const review: ImportReviewItem[] = [];

  for (const field of fields) {
    if (field.type === 'select') {
      const selectValue = detectSelectValue(rawText, field);
      if (selectValue?.value) {
        values[field.key] = selectValue.value;
        review.push({
          key: field.key,
          name: field.name,
          value: selectValue.value,
          confidence: Math.min(0.99, selectValue.confidence * ocrConfidenceBoost),
          matchedLabel: selectValue.matchedLabel,
          unit: field.unit,
          pageNumber: selectValue.pageNumber,
          strategy: selectValue.strategy,
          adjusted: selectValue.adjusted,
          rawValue: selectValue.rawValue,
          correctionReason: selectValue.correctionReason,
          sourceSnippet: selectValue.sourceSnippet,
        });
      }
      continue;
    }

    const labels = [field.name, field.key, ...(field.aliases || [])];
    const match = findValue(rawText, labels, field, pageTexts);
    if (match?.value) {
      values[field.key] = match.value;
      review.push({
        key: field.key,
        name: field.name,
        value: match.value,
        confidence: Math.min(0.99, match.confidence * ocrConfidenceBoost),
        matchedLabel: match.matchedLabel,
        unit: field.unit,
        pageNumber: match.pageNumber,
        strategy: match.strategy,
        adjusted: match.adjusted,
        rawValue: match.rawValue,
        correctionReason: match.correctionReason,
        sourceSnippet: match.sourceSnippet,
      });
    }
  }

  const sortedReview = review.sort((a, b) => b.confidence - a.confidence);
  const confidenceSummary = summarizeConfidence(sortedReview, sourceType);

  return {
    values,
    rawText,
    review: sortedReview,
    sourceType,
    averageConfidence: confidenceSummary.averageConfidence,
    confidenceThresholdPassed: confidenceSummary.confidenceThresholdPassed,
    pageCount: pageTexts?.length || 1,
    extractionMethod,
    templateName: inferTemplateName(rawText, fields),
  };
}

async function extractTextFromPdf(file: File): Promise<PdfTextResult> {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buffer }).promise;
  const pageTexts: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const items = content.items
      .map((item: any) => {
        if (!('str' in item) || !item.str) return null;
        return {
          text: String(item.str),
          x: Array.isArray(item.transform) ? Number(item.transform[4]) : 0,
          y: Array.isArray(item.transform) ? Number(item.transform[5]) : 0,
        };
      })
      .filter(Boolean) as Array<{ text: string; x: number; y: number }>;

    items.sort((a, b) => {
      if (Math.abs(a.y - b.y) > 3) return b.y - a.y;
      return a.x - b.x;
    });

    const lines: Array<{ y: number; text: string[] }> = [];
    for (const item of items) {
      const existing = lines.find((entry) => Math.abs(entry.y - item.y) <= 3);
      if (existing) {
        existing.text.push(item.text);
      } else {
        lines.push({ y: item.y, text: [item.text] });
      }
    }

    const pageText = lines
      .sort((a, b) => b.y - a.y)
      .map((line) => line.text.join(' ').replace(/\s+/g, ' ').trim())
      .filter(Boolean)
      .join('\n');
    pageTexts.push(pageText);
  }

  return {
    text: pageTexts.map((pageText, index) => `[[Page ${index + 1}]]\n${pageText}`).join('\n\n'),
    pageTexts,
    pageCount: pdf.numPages,
  };
}

async function renderPdfPagesToImages(file: File): Promise<PdfPageImageResult> {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buffer }).promise;
  const pageImages: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) continue;
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvasContext: context, viewport }).promise;

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      const boosted = Math.max(0, Math.min(255, (gray - 118) * 1.38 + 146));
      data[i] = boosted;
      data[i + 1] = boosted;
      data[i + 2] = boosted;
    }
    context.putImageData(imageData, 0, 0);
    pageImages.push(canvas.toDataURL('image/png'));
  }

  return {
    pageImages,
    pageCount: pdf.numPages,
  };
}

export async function importFromImage(file: File, fields: PanelField[]) {
  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker('eng');

  try {
    const processedImage = await preprocessImage(file);
    const {
      data: { text, confidence },
    } = await worker.recognize(processedImage);
    const normalizedConfidence = Math.max(0.72, Math.min(1, (confidence || 70) / 100));
    return buildImportResult(text, fields, 'image', 'ocr', undefined, normalizedConfidence);
  } finally {
    await worker.terminate();
  }
}

export async function importFromPdf(file: File, fields: PanelField[]) {
  const textResult = await extractTextFromPdf(file);
  const textDensity = textResult.pageTexts.map((pageText) => normalize(pageText).length);
  const shouldRunOcr = textDensity.some((count) => count < 180);

  if (!shouldRunOcr) {
    return buildImportResult(textResult.text, fields, 'pdf', 'pdf-text', textResult.pageTexts);
  }

  const [{ createWorker }, renderedPages] = await Promise.all([
    import('tesseract.js'),
    renderPdfPagesToImages(file),
  ]);
  const worker = await createWorker('eng');

  try {
    const ocrPageTexts: string[] = [];
    const confidenceScores: number[] = [];

    for (let index = 0; index < renderedPages.pageImages.length; index += 1) {
      const image = renderedPages.pageImages[index];
      const {
        data: { text, confidence },
      } = await worker.recognize(image);
      const mergedPageText = [textResult.pageTexts[index] || '', text || '']
        .filter(Boolean)
        .join('\n')
        .trim();
      ocrPageTexts.push(mergedPageText);
      confidenceScores.push(Math.max(0.7, Math.min(1, (confidence || 70) / 100)));
    }

    const averageBoost =
      confidenceScores.length > 0
        ? confidenceScores.reduce((sum, item) => sum + item, 0) / confidenceScores.length
        : 0.82;

    return buildImportResult(
      ocrPageTexts.map((pageText, index) => `[[Page ${index + 1}]]\n${pageText}`).join('\n\n'),
      fields,
      'pdf',
      'ocr',
      ocrPageTexts,
      averageBoost
    );
  } finally {
    await worker.terminate();
  }
}

export async function importFromCsv(file: File, fields: PanelField[]) {
  const csv = await file.text();
  const rows = csv
    .split(/\r?\n/)
    .map((line) => line.split(',').map((cell) => cell.trim()))
    .filter((row) => row.length >= 2);

  const fieldMap = new Map<string, string>();
  for (const field of fields) {
    [field.key, field.name, ...(field.aliases || [])].forEach((label) => fieldMap.set(normalize(label), field.key));
  }

  const values: Record<string, string> = {};
  const review: ImportReviewItem[] = [];

  for (const [name, value] of rows) {
    const key = fieldMap.get(normalize(name));
    if (!key || !value) continue;
    values[key] = value;
    const field = fields.find((entry) => entry.key === key);
    review.push({
      key,
      name: field?.name || name,
      value,
      confidence: 0.99,
      matchedLabel: name,
      unit: field?.unit,
      strategy: 'csv',
    });
  }

  return {
    values,
    rawText: csv,
    review,
    sourceType: 'csv',
    averageConfidence: review.length > 0 ? 0.99 : 0,
    confidenceThresholdPassed: review.length > 0,
    pageCount: 1,
    extractionMethod: 'csv',
    templateName: 'Structured CSV import',
  } satisfies ImportResult;
}

export async function importFromReport(file: File, fields: PanelField[]) {
  if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
    return importFromPdf(file, fields);
  }
  if (file.name.toLowerCase().endsWith('.csv')) {
    return importFromCsv(file, fields);
  }
  return importFromImage(file, fields);
}
