export interface TestType {
  id: string;
  icon: string;
  name: string;
  desc: string;
}

export const TEST_TYPES: TestType[] = [
  { id: 'retina', icon: '👁️', name: 'Diabetic Retinopathy', desc: 'Retina fundus image screening for diabetic retinopathy risk signs' },
  { id: 'cbc', icon: '🔴', name: 'CBC', desc: 'Complete Blood Count — RBC, WBC, Hemoglobin, Hematocrit, Platelets' },
  { id: 'bmp', icon: '⚗️', name: 'BMP', desc: 'Basic Metabolic Panel — Glucose, Calcium, BUN, Creatinine, Electrolytes' },
  { id: 'cmp', icon: '🧪', name: 'CMP', desc: 'Comprehensive Metabolic Panel — BMP + Liver enzymes, Total Protein' },
  { id: 'thyroid', icon: '🦋', name: 'Thyroid Panel', desc: 'TSH, Free T3, Free T4, T3, T4, Anti-TPO' },
  { id: 'lipid', icon: '💛', name: 'Lipid Panel', desc: 'Total Cholesterol, LDL, HDL, Triglycerides, VLDL, Ratio' },
  { id: 'hba1c', icon: '🍬', name: 'HbA1c / Diabetes', desc: 'Glycated Hemoglobin, Fasting Glucose, Post-prandial Glucose' },
  { id: 'lft', icon: '🫀', name: 'Liver Function', desc: 'ALT, AST, ALP, GGT, Bilirubin, Albumin, Total Protein' },
  { id: 'kft', icon: '🫘', name: 'Kidney Function', desc: 'Creatinine, BUN, Uric Acid, eGFR, Electrolytes' },
  { id: 'iron', icon: '⚡', name: 'Iron Studies', desc: 'Serum Iron, Ferritin, TIBC, Transferrin Saturation' },
  { id: 'vitamins', icon: '💊', name: 'Vitamin Panel', desc: 'Vitamin D3, Vitamin B12, Folate, Vitamin C' },
  { id: 'electrolyte', icon: '🌊', name: 'Electrolytes', desc: 'Sodium, Potassium, Chloride, Bicarbonate, Magnesium' },
  { id: 'coag', icon: '🩹', name: 'Coagulation', desc: 'PT, INR, aPTT, Fibrinogen, D-Dimer' },
  { id: 'urine', icon: '💧', name: 'Urine Complete', desc: 'Colour, pH, Protein, Glucose, Ketones, RBC, WBC, Crystals' },
  { id: 'hormones', icon: '🔬', name: 'Hormone Panel', desc: 'Testosterone, Estrogen, FSH, LH, Prolactin, DHEA-S' },
  { id: 'cardiac', icon: '❤️', name: 'Cardiac Markers', desc: 'Troponin I/T, CK-MB, BNP, NT-proBNP, Myoglobin' },
  { id: 'inflammatory', icon: '🔥', name: 'Inflammatory', desc: 'CRP, ESR, Fibrinogen, Ferritin, IL-6, Procalcitonin' },
];
