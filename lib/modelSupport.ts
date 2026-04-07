export type ModelSupportStrategy = 'model' | 'rules' | 'vision';

export interface ModelSupportInfo {
  strategy: ModelSupportStrategy;
  status: 'ready';
  bestModel?: string;
  note: string;
}

export const MODEL_SUPPORT: Record<string, ModelSupportInfo> = {
  cbc: {
    strategy: 'model',
    status: 'ready',
    bestModel: 'svm',
    note: 'Hybrid ML/DL pipeline ready with public anemia data',
  },
  hba1c: {
    strategy: 'model',
    status: 'ready',
    bestModel: 'ffnn',
    note: 'Hybrid ML/DL pipeline ready with public diabetes-risk data',
  },
  kft: {
    strategy: 'model',
    status: 'ready',
    bestModel: 'svm',
    note: 'Hybrid ML/DL pipeline ready with public CKD data',
  },
  urine: {
    strategy: 'model',
    status: 'ready',
    bestModel: 'svm',
    note: 'Shares kidney/renal hybrid ML/DL model family',
  },
  thyroid: {
    strategy: 'model',
    status: 'ready',
    bestModel: 'ffnn',
    note: 'Hybrid ML/DL pipeline ready with public thyroid data',
  },
  lft: {
    strategy: 'model',
    status: 'ready',
    bestModel: 'rf',
    note: 'Hybrid ML/DL pipeline ready with public liver/HCV data',
  },
  cardiac: {
    strategy: 'model',
    status: 'ready',
    bestModel: 'rf',
    note: 'Hybrid ML/DL pipeline ready with public cardiac-risk proxy data',
  },
  retina: {
    strategy: 'vision',
    status: 'ready',
    note: 'Local retina image screening backend for diabetic retinopathy risk signs',
  },
  bmp: {
    strategy: 'model',
    status: 'ready',
    bestModel: 'rf',
    note: 'Hybrid ML/DL pipeline ready with CKD-derived metabolic and renal risk data',
  },
  cmp: {
    strategy: 'model',
    status: 'ready',
    bestModel: 'ffnn',
    note: 'Hybrid ML/DL pipeline ready with liver/metabolic dysfunction data',
  },
  lipid: {
    strategy: 'model',
    status: 'ready',
    bestModel: 'svm',
    note: 'Hybrid ML/DL pipeline ready with panel-specific atherogenic lipid risk data',
  },
  iron: {
    strategy: 'model',
    status: 'ready',
    bestModel: 'rf',
    note: 'Hybrid ML/DL pipeline ready with panel-specific iron pattern risk data',
  },
  vitamins: {
    strategy: 'rules',
    status: 'ready',
    note: 'Reference-range rules and local health guidance',
  },
  electrolyte: {
    strategy: 'model',
    status: 'ready',
    bestModel: 'svm',
    note: 'Hybrid ML/DL pipeline ready with electrolyte imbalance risk data',
  },
  coag: {
    strategy: 'rules',
    status: 'ready',
    note: 'Reference-range rules and local health guidance',
  },
  hormones: {
    strategy: 'rules',
    status: 'ready',
    note: 'Reference-range rules and local health guidance',
  },
  inflammatory: {
    strategy: 'rules',
    status: 'ready',
    note: 'Reference-range rules and local health guidance',
  },
};
