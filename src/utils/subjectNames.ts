export interface SubjectNamePair {
  code: string;
  en: string;
  ms: string;
}

export const SUBJECT_NAME_PAIRS: Record<string, { en: string; ms: string }> = {
  PNAP0113: { en: 'Biology I', ms: 'Biologi I' },
  PNAP0133: { en: 'Chemistry I', ms: 'Kimia I' },
  PNAP0123: { en: 'Physics I', ms: 'Fizik I' },
  PNAP0154: { en: 'Statistics', ms: 'Statistik' },
  PNAP0143: { en: 'Logical Reasoning', ms: 'Penaakulan Mantik' },
  PNAP0162: { en: 'Language and Literary Appreciation', ms: 'Apresiasi Bahasa dan Kesusasteraan' },
  PNAP0182: { en: 'Research Skills', ms: 'Kemahiran Penyelidikan' },
  PNAP0172: { en: 'Pembangunan Jati Diri Kebangsaan', ms: 'Pembangunan Jati Diri Kebangsaan' },
};

/**
 * Returns the standardized subject title based on the active language.
 * Default is Malay ('ms') or English ('en').
 */
export function getSubjectDisplayName(codeOrKey: string, lang: string = 'ms'): string {
  const upper = (codeOrKey || '').toUpperCase();
  const lower = (codeOrKey || '').toLowerCase();

  for (const [code, pair] of Object.entries(SUBJECT_NAME_PAIRS)) {
    if (
      upper.includes(code) ||
      (code === 'PNAP0113' && (lower.includes('bio') || lower.includes('hayat'))) ||
      (code === 'PNAP0133' && (lower.includes('chem') || lower.includes('kimia'))) ||
      (code === 'PNAP0123' && (lower.includes('phys') || lower.includes('fizik'))) ||
      (code === 'PNAP0154' && (lower.includes('stat') || lower.includes('statistik'))) ||
      (code === 'PNAP0143' && (lower.includes('logic') || lower.includes('mantik') || lower.includes('reason'))) ||
      (code === 'PNAP0162' && (lower.includes('literary') || lower.includes('apresiasi') || lower.includes('language') || lower.includes('lla'))) ||
      (code === 'PNAP0182' && (lower.includes('research') || lower.includes('penyelidikan'))) ||
      (code === 'PNAP0172' && (lower.includes('jati') || lower.includes('kebangsaan')))
    ) {
      return lang === 'en' ? pair.en : pair.ms;
    }
  }

  return codeOrKey;
}
