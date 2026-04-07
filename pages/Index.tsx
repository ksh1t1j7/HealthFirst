import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import HomeDashboardSection from '@/components/HomeDashboardSection';
import LandingSections from '@/components/LandingSections';
import Stepper from '@/components/Stepper';
import TestSelector from '@/components/TestSelector';
import LoadingState from '@/components/LoadingState';
import { AppStep, AnalysisResult } from '@/lib/types';
import { TEST_TYPES } from '@/lib/testTypes';
import { MODEL_SUPPORT } from '@/lib/modelSupport';
import { PANEL_FIELDS } from '@/lib/panelFields';
import { analyzeLocally, analyzeRetinaImage } from '@/lib/localAnalyze';
import { AnimatePresence, motion } from 'framer-motion';
import { buildReminders, buildTakeaways } from '@/lib/reportAnalytics';
import { HF_SELECT_PANEL_EVENT, HF_START_ANALYSIS_EVENT } from '@/lib/interactionEvents';
import { useAuth } from '@/contexts/AuthContext';
import { saveReport } from '@/lib/reportEntries';

const ReportUploadWorkspace = lazy(() => import('@/components/ReportUploadWorkspace'));
const RetinaUploadWorkspace = lazy(() => import('@/components/RetinaUploadWorkspace'));
const AnalysisResults = lazy(() => import('@/components/AnalysisResults'));

export default function Index() {
  const { isAuthenticated } = useAuth();
  const [step, setStep] = useState<AppStep>('hero');
  const [selectedTest, setSelectedTest] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sourcePreviewUrl, setSourcePreviewUrl] = useState<string | null>(null);
  const [extractionMeta, setExtractionMeta] = useState<{
    averageConfidence: number;
    confidenceThresholdPassed: boolean;
    pageCount: number;
    extractionMethod: 'ocr' | 'pdf-text' | 'csv';
    templateName: string;
  } | null>(null);

  const handleStart = () => setStep('select');

  const handleSelectTest = (id: string) => {
    setSelectedTest(id);
    setFormValues({});
    setResult(null);
    setError(null);
    setSourcePreviewUrl(null);
    setExtractionMeta(null);
    setStep('upload');
  };

  const selectedTestInfo = TEST_TYPES.find((t) => t.id === selectedTest) || null;
  const selectedSupportInfo = selectedTest ? MODEL_SUPPORT[selectedTest] || null : null;
  const isRetinaWorkflow = selectedTest === 'retina';
  const selectedFields = useMemo(
    () => (selectedTest ? PANEL_FIELDS[selectedTest] || [] : []),
    [selectedTest]
  );

  useEffect(() => {
    return () => {
      if (sourcePreviewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(sourcePreviewUrl);
      }
    };
  }, [sourcePreviewUrl]);

  useEffect(() => {
    const onStart = () => setStep('select');
    const onSelect = (event: Event) => {
      const panelId = (event as CustomEvent<{ panelId?: string }>).detail?.panelId;
      if (!panelId) return;
      setSelectedTest(panelId);
      setFormValues({});
      setResult(null);
      setError(null);
      setSourcePreviewUrl(null);
      setExtractionMeta(null);
      setStep('upload');
    };
    window.addEventListener(HF_START_ANALYSIS_EVENT, onStart);
    window.addEventListener(HF_SELECT_PANEL_EVENT, onSelect as EventListener);
    return () => {
      window.removeEventListener(HF_START_ANALYSIS_EVENT, onStart);
      window.removeEventListener(HF_SELECT_PANEL_EVENT, onSelect as EventListener);
    };
  }, []);
  const handleDetectedValues = (nextValues: Record<string, string>) => {
    setFormValues(nextValues);
  };

  const handleAnalyzeValues = async (nextValues: Record<string, string>) => {
    if (!selectedTest) return;

    const populatedValues = Object.values(nextValues).filter((value) => value?.trim()).length;
    if (populatedValues === 0) {
      setError('No blood parameters were detected from the uploaded report.');
      setStep('error');
      return;
    }

    setFormValues(nextValues);
    setStep('loading');
    setIsLoading(true);
    setError(null);

    try {
      const res = await analyzeLocally(selectedTest, selectedFields, nextValues);
      const enriched = {
        ...res,
        keyTakeaways: buildTakeaways(res.parameters.map((parameter) => ({ name: parameter.name, status: parameter.status }))),
        reminders: buildReminders(selectedTest, res.parameters.map((parameter) => ({ name: parameter.name, status: parameter.status }))),
        urgentAttention: res.parameters.some((parameter) => parameter.status === 'high' || parameter.status === 'low'),
        reportMeta: {
          analyzedAt: new Date().toISOString(),
          detectedParameterCount: Object.keys(nextValues).filter((key) => nextValues[key]?.trim()).length,
          extractionMethod: extractionMeta?.extractionMethod,
          extractionConfidence: extractionMeta?.averageConfidence,
          extractionThresholdPassed: extractionMeta?.confidenceThresholdPassed,
          extractionTemplate: extractionMeta?.templateName,
          pageCount: extractionMeta?.pageCount,
          backendMode: res.reportMeta?.backendMode || 'browser-fallback',
        },
      };
      setResult(enriched);
      if (isAuthenticated && selectedTestInfo) {
        void saveReport({
          id: `${selectedTest}-${Date.now()}`,
          title: `${selectedTestInfo.name} Analysis`,
          testType: selectedTest,
          createdAt: enriched.reportMeta.analyzedAt,
          values: nextValues,
          sourceType:
            extractionMeta?.extractionMethod === 'pdf-text'
              ? 'pdf'
              : extractionMeta?.extractionMethod === 'csv'
                ? 'csv'
                : 'image',
          analysis: {
            overallStatus: enriched.overallStatus,
            healthScore: enriched.healthScore,
            summary: enriched.summary,
            parameters: enriched.parameters,
            keyTakeaways: enriched.keyTakeaways,
            reminders: enriched.reminders,
            urgentAttention: enriched.urgentAttention,
          },
        }).catch(() => undefined);
      }
      setStep('results');
    } catch (err: any) {
      setError(err.message || 'Analysis failed. Please try again.');
      setStep('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyzeRetina = async (file: File) => {
    setSourcePreviewUrl(URL.createObjectURL(file));
    setStep('loading');
    setIsLoading(true);
    setError(null);

    try {
      const res = await analyzeRetinaImage(file);
      setResult(res);
      if (isAuthenticated) {
        void saveReport({
          id: `retina-${Date.now()}`,
          title: 'Retina Screening Analysis',
          testType: 'retina',
          createdAt: res.reportMeta?.analyzedAt || new Date().toISOString(),
          values: {},
          sourceType: 'retina',
          analysis: {
            overallStatus: res.overallStatus,
            healthScore: res.healthScore,
            summary: res.summary,
            parameters: res.parameters,
            keyTakeaways: res.keyTakeaways,
            reminders: res.reminders,
            urgentAttention: res.urgentAttention,
          },
        }).catch(() => undefined);
      }
      setStep('results');
    } catch (err: any) {
      setError(err.message || 'Retina analysis failed. Please try again.');
      setStep('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedTest(null);
    setFormValues({});
    setResult(null);
    setError(null);
    setSourcePreviewUrl(null);
    setExtractionMeta(null);
    setStep('select');
  };

  return (
    <div className="min-h-screen relative">
      <Navbar />

      <AnimatePresence mode="wait">
        {step === 'hero' && (
          <motion.div key="hero" exit={{ opacity: 0, y: -20 }}>
            <Hero onStart={handleStart} />
            <HomeDashboardSection />
            <LandingSections />
          </motion.div>
        )}

        {step !== 'hero' && (
          <motion.div
            key="app"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative z-[1] max-w-[1180px] mx-auto px-6 pb-20"
          >
            <Stepper currentStep={step === 'results' || step === 'error' ? 3 : step === 'loading' || step === 'upload' ? 2 : 1} />

            <TestSelector selectedTest={selectedTest} onSelect={handleSelectTest} />
            <Suspense fallback={<LoadingState />}>
              {selectedTestInfo && isRetinaWorkflow && (
                <RetinaUploadWorkspace
                  testName={selectedTestInfo.name}
                  isLoading={isLoading}
                  supportInfo={selectedSupportInfo}
                  onAnalyzeFile={handleAnalyzeRetina}
                />
              )}
              {selectedTestInfo && !isRetinaWorkflow && selectedFields.length > 0 && (
                <ReportUploadWorkspace
                  testType={selectedTest}
                  testName={selectedTestInfo.name}
                  fields={selectedFields}
                  values={formValues}
                  isLoading={isLoading}
                latestAnalysis={result}
                supportInfo={selectedSupportInfo}
                onDetected={handleDetectedValues}
                onImportMeta={setExtractionMeta}
                onAnalyzeValues={handleAnalyzeValues}
              />
              )}
            </Suspense>

            {step === 'loading' && <LoadingState />}

            {step === 'results' && result && (
              <Suspense fallback={<LoadingState />}>
                <AnalysisResults
                  data={result}
                  testType={selectedTest || ''}
                  currentValues={formValues}
                  onReset={handleReset}
                  supportInfo={selectedSupportInfo}
                  sourcePreviewUrl={sourcePreviewUrl}
                />
              </Suspense>
            )}

            {step === 'error' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-destructive/7 border border-destructive/20 rounded-[20px] p-10 text-center"
              >
                <div className="text-4xl mb-3">⚠️</div>
                <h3 className="text-lg font-bold text-destructive mb-2">Analysis Failed</h3>
                <p className="text-sm text-muted-foreground mb-5">{error}</p>
                <button onClick={handleReset} className="gradient-primary border-none rounded-lg px-7 py-3 text-primary-foreground font-bold cursor-pointer hover:-translate-y-0.5 transition-transform">
                  🔄 Try Again
                </button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
