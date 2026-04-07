import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { PanelField } from '@/lib/panelFields';
import { ModelSupportInfo } from '@/lib/modelSupport';
import { ImportResult, ImportReviewItem, importFromReport } from '@/lib/reportImport';
import { fetchSavedReports, removeReport, saveReport, SavedEntry } from '@/lib/reportEntries';
import { useAuth } from '@/contexts/AuthContext';
import { AnalysisResult } from '@/lib/types';
import { toast } from '@/components/ui/sonner';

interface ReportUploadWorkspaceProps {
  testType: string;
  testName: string;
  fields: PanelField[];
  values: Record<string, string>;
  isLoading: boolean;
  latestAnalysis?: AnalysisResult | null;
  supportInfo?: ModelSupportInfo | null;
  onDetected: (nextValues: Record<string, string>) => void;
  onAnalyzeValues: (nextValues: Record<string, string>) => Promise<void>;
  onImportMeta?: (meta: Pick<ImportResult, 'averageConfidence' | 'confidenceThresholdPassed' | 'pageCount' | 'extractionMethod' | 'templateName'> | null) => void;
}

export default function ReportUploadWorkspace({
  testType,
  testName,
  fields,
  values,
  isLoading,
  latestAnalysis,
  supportInfo,
  onDetected,
  onAnalyzeValues,
  onImportMeta,
}: ReportUploadWorkspaceProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const { isAuthenticated } = useAuth();
  const [importing, setImporting] = useState<'image' | 'csv' | 'analyze' | null>(null);
  const [saveTitle, setSaveTitle] = useState('');
  const [savedEntries, setSavedEntries] = useState<SavedEntry[]>([]);
  const [ocrPreview, setOcrPreview] = useState('');
  const [lastFileName, setLastFileName] = useState('');
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [analyzeMessage, setAnalyzeMessage] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [reviewItems, setReviewItems] = useState<ImportReviewItem[]>([]);
  const [sourceType, setSourceType] = useState<'image' | 'pdf' | 'csv' | null>(null);
  const [importMeta, setImportMeta] = useState<Pick<ImportResult, 'averageConfidence' | 'confidenceThresholdPassed' | 'pageCount' | 'extractionMethod' | 'templateName'> | null>(null);
  const [selectedReviewKey, setSelectedReviewKey] = useState<string | null>(null);
  const [acceptedKeys, setAcceptedKeys] = useState<string[]>([]);

  useEffect(() => {
    setOcrPreview('');
    setLastFileName('');
    setImportMessage(null);
    setAnalyzeMessage(null);
    setPendingFile(null);
    setPreviewUrl(null);
    setReviewItems([]);
    setSourceType(null);
    setImportMeta(null);
    setSelectedReviewKey(null);
    setAcceptedKeys([]);
    onImportMeta?.(null);
  }, [testType]);

  useEffect(() => {
    if (!isAuthenticated) {
      setSavedEntries([]);
      return;
    }

    fetchSavedReports()
      .then(setSavedEntries)
      .catch(() => setSavedEntries([]));
  }, [isAuthenticated, testType]);

  const filteredSaved = useMemo(
    () => savedEntries.filter((entry) => entry.testType === testType),
    [savedEntries, testType]
  );

  const detectedFields = useMemo(
    () => fields.filter((field) => {
      const value = values[field.key];
      return typeof value === 'string' && value.trim() !== '';
    }),
    [fields, values]
  );

  const detectedCount = detectedFields.length;

  const handleImageImport = async (file: File) => {
    setImportMessage(null);
    setAnalyzeMessage(null);
    setLastFileName(file.name);
    setPendingFile(file);
    setSourceType(file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image');
    setPreviewUrl(file.type.startsWith('image/') ? URL.createObjectURL(file) : null);
    setOcrPreview('');
    setReviewItems([]);
    setImportMeta(null);
    setSelectedReviewKey(null);
    setAcceptedKeys([]);
    onImportMeta?.(null);
    onDetected({});
    setImportMessage(
      file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
        ? 'PDF report selected. Click Review Extraction to detect parameters before analysis.'
        : 'Report image selected. Click Review Extraction to detect parameters before analysis.'
    );
  };

  const handleDroppedFile = async (file: File) => {
    if (file.type.startsWith('image/') || file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      await handleImageImport(file);
      return;
    }

    if (file.name.toLowerCase().endsWith('.csv')) {
      await handleCsvImport(file);
      return;
    }

    setImportMessage('Please upload an image of the report or a CSV file.');
  };

  const handleCsvImport = async (file: File) => {
    setImportMessage(null);
    setAnalyzeMessage(null);
    setLastFileName(file.name);
    setPendingFile(file);
    setSourceType('csv');
    setPreviewUrl(null);
    setOcrPreview('');
    setReviewItems([]);
    setImportMeta(null);
    setSelectedReviewKey(null);
    setAcceptedKeys([]);
    onImportMeta?.(null);
    onDetected({});
    setImportMessage('CSV file selected. Click Review Extraction to import parameters before analysis.');
  };

  const handleReviewExtraction = async () => {
    if (!pendingFile) {
      setImportMessage('Upload a report first so the system can detect parameters.');
      return;
    }

    setAnalyzeMessage(null);
    setImporting('analyze');

    try {
      const imported = await importFromReport(pendingFile, fields);
      onDetected(imported.values);
      setReviewItems(imported.review);
      setSelectedReviewKey(imported.review.find((item) => item.adjusted || item.confidence < 0.9)?.key || imported.review[0]?.key || null);
      setAcceptedKeys([]);
      setSourceType(imported.sourceType);
      const nextMeta = {
        averageConfidence: imported.averageConfidence,
        confidenceThresholdPassed: imported.confidenceThresholdPassed,
        pageCount: imported.pageCount,
        extractionMethod: imported.extractionMethod,
        templateName: imported.templateName,
      };
      setImportMeta(nextMeta);
      onImportMeta?.(nextMeta);
      setOcrPreview(imported.rawText.slice(0, 900));

      const count = Object.values(imported.values).filter((value) => value?.trim()).length;
      if (count === 0) {
        setImportMessage('No matching parameters were detected. Please upload a clearer report or correct the values after upload.');
        toast.error('No parameters detected from this report.');
        return;
      }

      setImportMessage(
        imported.confidenceThresholdPassed
          ? `Detected ${count} parameter${count === 1 ? '' : 's'} from the uploaded ${imported.sourceType.toUpperCase()} file. Review values below, then click Analyze Report.`
          : `Detected ${count} parameter${count === 1 ? '' : 's'}, but extraction confidence is low. Review the highlighted values carefully before analysis.`
      );
      toast.success('Extraction complete. Review the detected values and continue.');
    } catch (error: any) {
      setImportMessage(error?.message || 'Could not process this report. Please try another file.');
      toast.error(error?.message || 'Could not process this report.');
    } finally {
      setImporting(null);
    }
  };

  const handleAnalyzeClick = async () => {
    if (!pendingFile && detectedCount === 0) {
      setAnalyzeMessage('Upload a report first so the system can detect parameters to analyze.');
      return;
    }

    setAnalyzeMessage(null);
    setImporting('analyze');

    try {
      let nextValues = values;

      if (Object.values(nextValues).filter((value) => value?.trim()).length === 0 && pendingFile) {
        const imported = await importFromReport(pendingFile, fields);
        nextValues = imported.values;
        onDetected(imported.values);
        setReviewItems(imported.review);
        setSelectedReviewKey(imported.review.find((item) => item.adjusted || item.confidence < 0.9)?.key || imported.review[0]?.key || null);
        setAcceptedKeys([]);
        setSourceType(imported.sourceType);
        const nextMeta = {
          averageConfidence: imported.averageConfidence,
          confidenceThresholdPassed: imported.confidenceThresholdPassed,
          pageCount: imported.pageCount,
          extractionMethod: imported.extractionMethod,
          templateName: imported.templateName,
        };
        setImportMeta(nextMeta);
        onImportMeta?.(nextMeta);
        setOcrPreview(imported.rawText.slice(0, 900));
        setImportMessage(`Detected ${Object.keys(imported.values).length} parameter${Object.keys(imported.values).length === 1 ? '' : 's'} from the uploaded ${imported.sourceType.toUpperCase()} file.`);
      }

      if (Object.values(nextValues).filter((value) => value?.trim()).length === 0) {
        setAnalyzeMessage('No extracted values are available yet. Review extraction or upload a clearer report first.');
        return;
      }

      await onAnalyzeValues(nextValues);
      toast.success('Analysis completed successfully.');
    } catch (error: any) {
      setImportMessage(error?.message || 'Could not process this report. Please try another file.');
      toast.error(error?.message || 'Analysis failed.');
    } finally {
      setImporting(null);
    }
  };

  const handleSave = () => {
    if (!isAuthenticated) {
      setImportMessage('Sign in first to save reports to your account.');
      return;
    }

    if (detectedFields.length === 0) {
      setImportMessage('Upload a report first before saving an entry.');
      return;
    }

    const title = saveTitle.trim() || `${testName} Report`;
    void saveReport({
      id: `${testType}-${Date.now()}`,
      title,
      testType,
      createdAt: new Date().toISOString(),
      values,
      sourceType: sourceType || undefined,
      sourceName: lastFileName || undefined,
      analysis: latestAnalysis
        ? {
            overallStatus: latestAnalysis.overallStatus,
            healthScore: latestAnalysis.healthScore,
            summary: latestAnalysis.summary,
            parameters: latestAnalysis.parameters,
            keyTakeaways: latestAnalysis.keyTakeaways,
            reminders: latestAnalysis.reminders,
            urgentAttention: latestAnalysis.urgentAttention,
          }
        : undefined,
    })
      .then((reports) => {
        setSavedEntries(reports);
        setSaveTitle('');
        setImportMessage('Saved to your account.');
        toast.success('Report saved to your account.');
      })
      .catch((error: any) => {
        setImportMessage(error?.message || 'Could not save this report.');
        toast.error(error?.message || 'Could not save this report.');
      });
  };

  const reviewMap = useMemo(() => new Map(reviewItems.map((item) => [item.key, item])), [reviewItems]);
  const fieldsWithReview = useMemo(
    () =>
      detectedFields.map((field) => {
        const review = reviewMap.get(field.key);
        const accepted = acceptedKeys.includes(field.key);
        const needsReview = Boolean(review && !accepted && (review.adjusted || review.confidence < 0.9));
        const trustTone = accepted || (review && review.confidence >= 0.93 && !review.adjusted) ? 'trusted' : needsReview ? (review?.confidence ?? 0) < 0.8 ? 'uncertain' : 'review' : 'trusted';
        return { field, review, accepted, needsReview, trustTone };
      }),
    [detectedFields, reviewMap, acceptedKeys]
  );

  const needsReviewItems = fieldsWithReview.filter((item) => item.needsReview);
  const readyItems = fieldsWithReview.filter((item) => !item.needsReview);
  const averageConfidence = importMeta ? Math.round(importMeta.averageConfidence * 100) : 0;
  const mappedAnchors = useMemo(
    () =>
      reviewItems.map((item, index) => ({
        ...item,
        top: 10 + (index % 10) * 7.4,
      })),
    [reviewItems]
  );
  const checklist = [
    {
      label: 'Image quality acceptable',
      ok: Boolean(pendingFile && (sourceType === 'pdf' || averageConfidence >= 75)),
      detail: pendingFile ? (sourceType === 'pdf' ? 'Embedded PDF text detected' : `${averageConfidence}% extraction confidence`) : 'No file selected',
    },
    {
      label: 'Template matched',
      ok: Boolean(importMeta?.templateName),
      detail: importMeta?.templateName || 'Waiting for detection',
    },
    {
      label: 'Multi-page detected',
      ok: Boolean(importMeta && importMeta.pageCount >= 1),
      detail: importMeta ? (importMeta.pageCount > 1 ? `Yes · ${importMeta.pageCount} pages` : 'No · single page') : 'Unknown',
    },
    {
      label: 'Fields needing review',
      ok: needsReviewItems.length === 0,
      detail: needsReviewItems.length === 0 ? 'None' : `${needsReviewItems.length} field${needsReviewItems.length === 1 ? '' : 's'} need review`,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="mb-6 rounded-[32px] border border-border/70 bg-card/90 p-6 shadow-[0_30px_80px_rgba(111,76,255,0.08)] md:p-9"
    >
      <div className="mb-5 text-xs font-bold uppercase tracking-[0.24em] text-primary">Step 02 — Upload Report</div>
      <h2 className="mb-2 text-2xl font-bold">{testName} Upload Workspace</h2>
      <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
        Upload your report image, PDF, or CSV and the system will detect the matching parameters for this panel before running analysis.
      </p>

      {supportInfo && (
        <div className="mb-6 rounded-[24px] border border-border/80 bg-secondary/70 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="mb-1 text-xs font-bold uppercase tracking-widest text-primary">Selected Engine</div>
              <div className="text-sm font-semibold">{testName}</div>
            </div>
            <span
              className={cn(
                'rounded-full border px-3 py-1 text-[0.68rem] font-bold uppercase tracking-wider',
                supportInfo.strategy === 'model'
                  ? 'border-success/30 bg-success/10 text-success'
                  : supportInfo.strategy === 'vision'
                    ? 'border-primary/30 bg-primary/10 text-primary'
                  : 'border-warning/30 bg-warning/10 text-warning'
              )}
            >
              {supportInfo.strategy === 'model'
                ? `ML/DL-backed${supportInfo.bestModel ? ` · ${supportInfo.bestModel.toUpperCase()}` : ''}`
                : supportInfo.strategy === 'vision'
                  ? 'Vision Screening'
                : 'Rule-based'}
            </span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{supportInfo.note}</p>
        </div>
      )}

      <div className="mb-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[28px] border border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(246,242,255,0.88))] p-6">
          <div className="mb-2 text-center text-[clamp(2rem,5vw,3.6rem)] font-extrabold leading-none tracking-tight">
            Understand Your <span className="text-gradient">Blood</span>
          </div>
          <p className="mx-auto mb-6 max-w-[620px] text-center text-sm text-muted-foreground">
            Upload your blood work results and receive instant local analysis, helping you take control of your health journey.
          </p>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file) void handleDroppedFile(file);
            }}
            className={cn(
              'rounded-[28px] border border-dashed bg-white/70 px-6 py-10 text-center transition-all',
              isDragging ? 'border-primary bg-primary/5' : 'border-border/80'
            )}
          >
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary text-4xl">
              📄
            </div>
            <div className="mb-2 text-xl font-semibold">Drop your blood test file here</div>
            <p className="mb-5 text-sm text-muted-foreground">
              Supports screenshots, lab PDFs, and CSV exports from your blood report.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_10px_30px_rgba(111,76,255,0.22)]"
              >
                {importing === 'analyze' || isLoading ? 'Processing...' : 'Select File'}
              </button>
              <button
                type="button"
                onClick={() => csvInputRef.current?.click()}
                className="rounded-full border border-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground"
              >
                {importing === 'analyze' ? 'Processing...' : 'Upload CSV'}
              </button>
            </div>
          </div>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*,.pdf,application/pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleImageImport(file);
              e.currentTarget.value = '';
            }}
          />
          <input
            ref={csvInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleCsvImport(file);
              e.currentTarget.value = '';
            }}
          />
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-border/70 bg-white/70 p-4">
              <div className="text-xs font-semibold uppercase tracking-widest text-primary">Detected</div>
              <div className="mt-2 text-3xl font-bold">{detectedFields.length}</div>
              <div className="mt-1 text-xs text-muted-foreground">Matched parameters after analysis</div>
            </div>
            <div className="rounded-2xl border border-border/70 bg-white/70 p-4">
              <div className="text-xs font-semibold uppercase tracking-widest text-primary">Source</div>
              <div className="mt-2 truncate text-sm font-semibold">{lastFileName || 'No file yet'}</div>
              <div className="mt-1 text-xs text-muted-foreground">Latest uploaded report</div>
            </div>
            <div className="rounded-2xl border border-border/70 bg-white/70 p-4">
              <div className="text-xs font-semibold uppercase tracking-widest text-primary">Mode</div>
              <div className="mt-2 text-sm font-semibold">OCR review and analysis</div>
              <div className="mt-1 text-xs text-muted-foreground">No manual typing required</div>
            </div>
          </div>
          {importMeta && (
            <div className="mt-4 rounded-[24px] border border-primary/15 bg-[linear-gradient(135deg,rgba(111,76,255,0.08),rgba(116,232,211,0.08))] p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-primary">Extraction Summary</div>
                  <div className="mt-1 text-sm text-muted-foreground">Review the parsed values before running the panel analysis.</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className="rounded-full border border-success/25 bg-success/10 px-3 py-1 text-xs font-bold text-success">
                    {detectedFields.length}/{fields.length} detected
                  </div>
                  <div className={cn(
                    'rounded-full border px-3 py-1 text-xs font-bold',
                    averageConfidence >= 90 ? 'border-success/25 bg-success/10 text-success' : averageConfidence >= 80 ? 'border-warning/25 bg-warning/10 text-warning' : 'border-destructive/25 bg-destructive/10 text-destructive'
                  )}>
                    {averageConfidence}% average confidence
                  </div>
                  <div className={cn(
                    'rounded-full border px-3 py-1 text-xs font-bold',
                    needsReviewItems.length === 0 ? 'border-success/25 bg-success/10 text-success' : 'border-warning/25 bg-warning/10 text-warning'
                  )}>
                    {needsReviewItems.length} need review
                  </div>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-4">
                {checklist.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-border/70 bg-white/75 p-3">
                    <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                      <span className={cn('inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold', item.ok ? 'bg-success/12 text-success' : 'bg-warning/12 text-warning')}>
                        {item.ok ? '✓' : '!'}
                      </span>
                      {item.label}
                    </div>
                    <div className="text-sm font-semibold text-foreground">{item.detail}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {importMeta && (
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-border/70 bg-white/70 p-4">
                <div className="text-xs font-semibold uppercase tracking-widest text-primary">Template</div>
                <div className="mt-2 text-sm font-semibold">{importMeta.templateName}</div>
                <div className="mt-1 text-xs text-muted-foreground">Detected report format</div>
              </div>
              <div className="rounded-2xl border border-border/70 bg-white/70 p-4">
                <div className="text-xs font-semibold uppercase tracking-widest text-primary">Pages</div>
                <div className="mt-2 text-sm font-semibold">{importMeta.pageCount}</div>
                <div className="mt-1 text-xs text-muted-foreground">{importMeta.extractionMethod === 'pdf-text' ? 'Multi-page PDF aware' : 'Single capture flow'}</div>
              </div>
              <div className="rounded-2xl border border-border/70 bg-white/70 p-4">
                <div className="text-xs font-semibold uppercase tracking-widest text-primary">Confidence</div>
                <div className="mt-2 text-sm font-semibold">{Math.round(importMeta.averageConfidence * 100)}%</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {importMeta.confidenceThresholdPassed ? 'Ready for analysis' : 'Review values before analysis'}
                </div>
              </div>
            </div>
          )}
          {importMessage && (
            <div className="mt-4 rounded-2xl bg-white/65 p-4 text-sm text-muted-foreground">{importMessage}</div>
          )}
          {ocrPreview && (
            <div className="mt-4 rounded-2xl bg-white/60 p-4 text-xs leading-relaxed text-muted-foreground">
              <div className="mb-1 font-semibold text-foreground">OCR Preview</div>
              {ocrPreview}
            </div>
          )}
        </div>

        <div className="rounded-[28px] border border-border/70 bg-secondary/70 p-6">
          <div className="mb-3 text-lg font-semibold">Report preview</div>
          {previewUrl ? (
            <div className="relative overflow-hidden rounded-[24px] border border-border/70 bg-white/80">
              <img
                src={previewUrl}
                alt="Blood report preview"
                className="h-[320px] w-full object-contain bg-white shadow-[0_12px_24px_rgba(111,76,255,0.08)]"
              />
              <div className="pointer-events-none absolute inset-y-2 right-2 flex flex-col gap-1">
                {mappedAnchors.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setSelectedReviewKey(item.key)}
                    title={item.name}
                    className={`pointer-events-auto flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-bold shadow-[0_8px_20px_rgba(15,23,42,0.12)] ${
                      selectedReviewKey === item.key
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-white/80 bg-white/92 text-primary'
                    }`}
                  >
                    {Math.max(1, mappedAnchors.findIndex((entry) => entry.key === item.key) + 1)}
                  </button>
                ))}
              </div>
            </div>
          ) : sourceType === 'pdf' ? (
            <div className="flex h-[220px] items-center justify-center rounded-[24px] border border-border/70 bg-white/70 p-6 text-center text-sm text-muted-foreground">
              PDF file selected. Extraction review will use the embedded text from the uploaded report.
            </div>
          ) : (
            <div className="flex h-[220px] items-center justify-center rounded-[24px] border border-border/70 bg-white/70 text-sm text-muted-foreground">
              Your selected report image will appear here.
            </div>
          )}
          <div className="mt-4 rounded-[20px] border border-border/70 bg-white/80 p-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="text-xs font-bold uppercase tracking-widest text-primary">Source focus</div>
              <div className="text-xs text-muted-foreground">{selectedReviewKey ? 'Click a parameter card to inspect its source' : 'No field selected yet'}</div>
            </div>
            {selectedReviewKey && reviewMap.get(selectedReviewKey) ? (
              <div className="space-y-3">
                <div>
                  <div className="text-sm font-bold">{reviewMap.get(selectedReviewKey)?.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {reviewMap.get(selectedReviewKey)?.pageNumber ? `Page ${reviewMap.get(selectedReviewKey)?.pageNumber}` : 'Current page'}
                    {reviewMap.get(selectedReviewKey)?.strategy ? ` · ${reviewMap.get(selectedReviewKey)?.strategy} parser` : ''}
                  </div>
                </div>
                <div className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {Math.max(1, mappedAnchors.findIndex((entry) => entry.key === selectedReviewKey) + 1)}
                </div>
                <div className="rounded-2xl border border-border/70 bg-secondary/40 p-3 text-sm text-muted-foreground">
                  {reviewMap.get(selectedReviewKey)?.sourceSnippet || 'Source snippet not available for this field.'}
                </div>
                {reviewMap.get(selectedReviewKey)?.correctionReason && (
                  <div className="rounded-2xl border border-warning/25 bg-warning/10 p-3 text-sm text-muted-foreground">
                    {reviewMap.get(selectedReviewKey)?.correctionReason}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">Select a parameter card to inspect where the extracted value came from.</div>
            )}
          </div>
          <div className="mt-4 rounded-[20px] border border-border/70 bg-white/80 p-4">
            <div className="mb-2 text-xs font-bold uppercase tracking-widest text-primary">Confidence legend</div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-success" /> Trusted extraction</div>
              <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-warning" /> Review suggested</div>
              <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-destructive" /> Uncertain or corrected</div>
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <input
              value={saveTitle}
              onChange={(e) => setSaveTitle(e.target.value)}
              placeholder="Patient or report name"
              className="flex-1 rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none"
            />
            <button
              type="button"
              onClick={handleSave}
              className="rounded-2xl bg-foreground px-4 py-3 text-sm font-semibold text-background"
            >
              Save
            </button>
          </div>
          <div className="mt-4 space-y-3">
            {filteredSaved.slice(0, 4).map((entry) => (
              <div key={entry.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-background px-4 py-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{entry.title}</div>
                  <div className="text-xs text-muted-foreground">{new Date(entry.createdAt).toLocaleString()}</div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      onDetected(entry.values);
                      setReviewItems(
                        fields
                          .filter((field) => entry.values[field.key])
                          .map((field) => ({
                            key: field.key,
                            name: field.name,
                            value: entry.values[field.key],
                            confidence: 1,
                            matchedLabel: field.name,
                            unit: field.unit,
                          }))
                      );
                      await onAnalyzeValues(entry.values);
                    }}
                    className="rounded-xl bg-primary/12 px-3 py-2 text-xs font-semibold text-primary"
                  >
                    Load
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void removeReport(entry.id)
                        .then(setSavedEntries)
                        .catch((error: any) => setImportMessage(error?.message || 'Could not delete this report.'));
                    }}
                    className="rounded-xl bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {filteredSaved.length === 0 && (
              <div className="rounded-2xl border border-border bg-background px-4 py-3 text-xs text-muted-foreground">
                {isAuthenticated ? 'No saved reports for this panel yet.' : 'Sign in to save and reload reports from your account.'}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-primary">Detected Parameters</div>
          <div className="text-sm text-muted-foreground">These values were captured from your uploaded report and grouped by trust level.</div>
        </div>
      </div>

      {analyzeMessage && (
        <div className="mb-4 rounded-2xl border border-warning/25 bg-warning/10 p-4 text-sm text-muted-foreground">
          {analyzeMessage}
        </div>
      )}

      <div className="space-y-6">
        {needsReviewItems.length > 0 && (
          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-warning">Needs Review</div>
                <div className="text-sm text-muted-foreground">These fields were corrected or have lower extraction trust.</div>
              </div>
              <div className="rounded-full border border-warning/25 bg-warning/10 px-3 py-1 text-xs font-bold text-warning">
                {needsReviewItems.length} review field{needsReviewItems.length === 1 ? '' : 's'}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {needsReviewItems.map(({ field, review, accepted, trustTone }) => (
                <div
                  key={field.key}
                  onClick={() => setSelectedReviewKey(field.key)}
                  className={cn(
                    'cursor-pointer rounded-[24px] border p-5 shadow-[0_12px_24px_rgba(111,76,255,0.04)] transition-all',
                    trustTone === 'uncertain'
                      ? 'border-destructive/30 bg-destructive/5'
                      : 'border-warning/30 bg-warning/5',
                    selectedReviewKey === field.key && 'ring-2 ring-primary/30'
                  )}
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold">{field.name}</div>
                      <div className="mt-1 inline-flex rounded-full bg-white/85 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground">
                        {Math.round((review?.confidence || 0) * 100)}% confidence
                      </div>
                    </div>
                    {field.unit && <span className="rounded-full bg-white/80 px-2.5 py-1 text-xs text-muted-foreground">{field.unit}</span>}
                  </div>

                  <input
                    value={values[field.key]}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      const nextValues = { ...values, [field.key]: e.target.value };
                      onDetected(nextValues);
                      setAcceptedKeys((current) => [...new Set([...current, field.key])]);
                      setReviewItems((current) =>
                        current.map((item) =>
                          item.key === field.key
                            ? {
                                ...item,
                                value: e.target.value,
                                confidence: Math.max(item.confidence, 0.93),
                                adjusted: false,
                                correctionReason: 'Value confirmed manually during extraction review.',
                              }
                            : item
                        )
                      );
                    }}
                    className="w-full rounded-2xl border border-border bg-white px-4 py-3 font-mono text-[1.8rem] font-bold outline-none"
                  />

                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-white/80 px-2.5 py-1 text-muted-foreground">
                      Ref {field.referenceLow ?? '—'} to {field.referenceHigh ?? '—'}
                    </span>
                    {review?.matchedLabel && <span className="rounded-full bg-white/80 px-2.5 py-1 text-muted-foreground">Matched from {review.matchedLabel}</span>}
                    {review?.strategy && <span className="rounded-full bg-white/80 px-2.5 py-1 text-muted-foreground">{review.strategy} parser</span>}
                    {review?.pageNumber && <span className="rounded-full bg-white/80 px-2.5 py-1 text-muted-foreground">Page {review.pageNumber}</span>}
                  </div>

                  <div className="mt-4 rounded-2xl border border-border/70 bg-white/75 p-4">
                    <div className="mb-2 text-xs font-bold uppercase tracking-widest text-warning">Review details</div>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      {review?.rawValue && review.rawValue !== review.value && (
                        <div>Raw read: <span className="font-mono font-semibold text-foreground">{review.rawValue}</span></div>
                      )}
                      <div>Corrected read: <span className="font-mono font-semibold text-foreground">{values[field.key]}</span></div>
                      <div>{review?.correctionReason || 'This field was flagged because the extraction confidence was lower than the trusted threshold.'}</div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAcceptedKeys((current) => [...new Set([...current, field.key])]);
                          setReviewItems((current) =>
                            current.map((item) =>
                              item.key === field.key ? { ...item, confidence: Math.max(item.confidence, 0.94), adjusted: false } : item
                            )
                          );
                        }}
                        className="rounded-full bg-success px-4 py-2 text-xs font-bold text-white"
                      >
                        Accept value
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedReviewKey(field.key);
                        }}
                        className="rounded-full border border-border bg-white px-4 py-2 text-xs font-bold text-foreground"
                      >
                        Inspect source
                      </button>
                    </div>
                    {accepted && <div className="mt-3 text-xs font-semibold uppercase tracking-widest text-success">Accepted for analysis</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {readyItems.length > 0 ? (
          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-success">Ready To Analyze</div>
                <div className="text-sm text-muted-foreground">Trusted values with strong extraction quality.</div>
              </div>
              <div className="rounded-full border border-success/25 bg-success/10 px-3 py-1 text-xs font-bold text-success">
                {readyItems.length} ready
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {readyItems.map(({ field, review, trustTone }) => (
                <div
                  key={field.key}
                  onClick={() => setSelectedReviewKey(field.key)}
                  className={cn(
                    'cursor-pointer rounded-[24px] border p-5 shadow-[0_12px_24px_rgba(111,76,255,0.04)] transition-all',
                    trustTone === 'trusted' ? 'border-success/20 bg-white/80' : 'border-border/80 bg-white/75',
                    selectedReviewKey === field.key && 'ring-2 ring-primary/30'
                  )}
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold">{field.name}</div>
                      {review && (
                        <div className="mt-1 inline-flex rounded-full bg-success/10 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-success">
                          {Math.round(review.confidence * 100)}% trusted
                        </div>
                      )}
                    </div>
                    {field.unit && <span className="rounded-full bg-secondary/60 px-2.5 py-1 text-xs text-muted-foreground">{field.unit}</span>}
                  </div>
                  <input
                    value={values[field.key]}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      const nextValues = { ...values, [field.key]: e.target.value };
                      onDetected(nextValues);
                      setAcceptedKeys((current) => [...new Set([...current, field.key])]);
                      setReviewItems((current) =>
                        current.map((item) =>
                          item.key === field.key ? { ...item, value: e.target.value, confidence: Math.max(item.confidence, 0.94) } : item
                        )
                      );
                    }}
                    className="w-full rounded-2xl border border-border bg-background px-4 py-3 font-mono text-[1.8rem] font-bold outline-none"
                  />
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-secondary/50 px-2.5 py-1 text-muted-foreground">
                      Ref {field.referenceLow ?? '—'} to {field.referenceHigh ?? '—'}
                    </span>
                    {review?.matchedLabel && <span className="rounded-full bg-secondary/50 px-2.5 py-1 text-muted-foreground">Matched from {review.matchedLabel}</span>}
                    {review?.strategy && <span className="rounded-full bg-secondary/50 px-2.5 py-1 text-muted-foreground">{review.strategy}</span>}
                    {review?.pageNumber && <span className="rounded-full bg-secondary/50 px-2.5 py-1 text-muted-foreground">Page {review.pageNumber}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
        {detectedFields.length === 0 ? (
          <div className="rounded-[24px] border border-border/80 bg-white/75 p-5 text-sm text-muted-foreground md:col-span-2">
            Upload a report image, PDF, or CSV to start automatic extraction for the selected panel.
          </div>
        ) : (
          <></>
        )}
      </div>

      <div className="sticky bottom-4 z-20 mt-8 rounded-[24px] border border-border/80 bg-white/92 p-4 shadow-[0_18px_40px_rgba(111,76,255,0.16)] backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-bold">Ready to continue?</div>
            <div className="text-xs text-muted-foreground">
              {needsReviewItems.length === 0
                ? 'All extracted values are ready. You can run the panel analysis now.'
                : `${needsReviewItems.length} field${needsReviewItems.length === 1 ? '' : 's'} still need review before the most trustworthy analysis.`}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void handleReviewExtraction()}
              disabled={isLoading || importing === 'analyze' || !pendingFile}
              className={cn(
                'rounded-full border border-border bg-white/80 px-5 py-2.5 text-sm font-semibold text-foreground transition-all',
                (isLoading || importing === 'analyze' || !pendingFile) && 'cursor-not-allowed opacity-60'
              )}
            >
              {isLoading || importing === 'analyze' ? 'Detecting...' : 'Detect Values'}
            </button>
            <button
              type="button"
              onClick={() => void handleAnalyzeClick()}
              disabled={isLoading || importing === 'analyze' || (!pendingFile && detectedFields.length === 0)}
              className={cn(
                'rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_10px_30px_rgba(111,76,255,0.22)] transition-all',
                (isLoading || importing === 'analyze' || (!pendingFile && detectedFields.length === 0)) && 'cursor-not-allowed opacity-60'
              )}
            >
              {isLoading || importing === 'analyze' ? 'Running...' : 'Run Analysis'}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
