import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ModelSupportInfo } from '@/lib/modelSupport';

interface RetinaUploadWorkspaceProps {
  testName: string;
  isLoading: boolean;
  supportInfo?: ModelSupportInfo | null;
  onAnalyzeFile: (file: File) => Promise<void>;
}

export default function RetinaUploadWorkspace({
  testName,
  isLoading,
  supportInfo,
  onAnalyzeFile,
}: RetinaUploadWorkspaceProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleFilePick = (file: File) => {
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setMessage('Retina image selected. Click Analyze Retina Image to screen for diabetic retinopathy signs.');
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      setMessage('Upload a retina fundus image first.');
      return;
    }

    setMessage(null);
    await onAnalyzeFile(selectedFile);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="mb-6 rounded-[32px] border border-border/70 bg-card/90 p-6 shadow-[0_30px_80px_rgba(111,76,255,0.08)] md:p-9"
    >
      <div className="mb-5 text-xs font-bold uppercase tracking-[0.24em] text-primary">Step 02 — Upload Retina Image</div>
      <h2 className="mb-2 text-2xl font-bold">{testName} Screening</h2>
      <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
        Upload a clear retinal fundus image. The local vision backend will screen the image for diabetic retinopathy risk signs and return a result dashboard.
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
                supportInfo.strategy === 'vision'
                  ? 'border-primary/30 bg-primary/10 text-primary'
                  : 'border-success/30 bg-success/10 text-success'
              )}
            >
              Vision Screening
            </span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{supportInfo.note}</p>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[28px] border border-dashed border-primary/30 bg-[linear-gradient(135deg,rgba(111,76,255,0.08),rgba(116,232,211,0.08))] p-6">
          <div className="mb-2 text-lg font-semibold">Upload retina scan</div>
          <p className="mb-4 text-sm text-muted-foreground">
            Best results come from a centered fundus photograph with good lighting and minimal blur.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_10px_30px_rgba(111,76,255,0.22)]"
            >
              {isLoading ? 'Processing...' : 'Upload Retina Image'}
            </button>
            <button
              type="button"
              onClick={() => void handleAnalyze()}
              disabled={isLoading || !selectedFile}
              className={cn(
                'rounded-full border border-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground',
                (isLoading || !selectedFile) && 'cursor-not-allowed opacity-60'
              )}
            >
              {isLoading ? 'Analyzing...' : 'Analyze Retina Image'}
            </button>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFilePick(file);
              e.currentTarget.value = '';
            }}
          />
          {message && (
            <div className="mt-4 rounded-2xl bg-white/65 p-4 text-sm text-muted-foreground">
              {message}
            </div>
          )}
        </div>

        <div className="rounded-[28px] border border-border/70 bg-secondary/70 p-6">
          <div className="mb-3 text-lg font-semibold">Image preview</div>
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Retina preview"
              className="h-[260px] w-full rounded-[24px] object-cover shadow-[0_12px_24px_rgba(111,76,255,0.08)]"
            />
          ) : (
            <div className="flex h-[260px] items-center justify-center rounded-[24px] border border-border/70 bg-white/70 text-sm text-muted-foreground">
              Your uploaded retina image will appear here.
            </div>
          )}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-border/70 bg-white/75 p-4">
              <div className="text-xs font-semibold uppercase tracking-widest text-primary">Input</div>
              <div className="mt-2 text-sm font-semibold">{selectedFile?.name || 'No file yet'}</div>
            </div>
            <div className="rounded-2xl border border-border/70 bg-white/75 p-4">
              <div className="text-xs font-semibold uppercase tracking-widest text-primary">Use Case</div>
              <div className="mt-2 text-sm font-semibold">DR screening</div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
