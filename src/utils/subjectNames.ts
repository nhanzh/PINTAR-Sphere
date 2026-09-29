export interface SubjectNamePair {
  code: string;
  en: string;
  ms: string;
  zh: string;
  ta: string;
}

export const SUBJECT_NAME_PAIRS: Record<string, SubjectNamePair> = {
  PNAP0113: {
    code: 'PNAP0113',
    en: 'Biology I',
    ms: 'Biologi I',
    zh: '生物学 I',
    ta: 'உயிரியல் I',
  },
  PNAP0133: {
    code: 'PNAP0133',
    en: 'Chemistry I',
    ms: 'Kimia I',
    zh: '化学 I',
    ta: 'வேதியியல் I',
  },
  PNAP0123: {
    code: 'PNAP0123',
    en: 'Physics I',
    ms: 'Fizik I',
    zh: '物理学 I',
    ta: 'இயற்பியல் I',
  },
  PNAP0154: {
    code: 'PNAP0154',
    en: 'Statistics',
    ms: 'Statistik',
    zh: '统计学',
    ta: 'புள்ளியியல்',
  },
  PNAP0143: {
    code: 'PNAP0143',
    en: 'Logical Reasoning',
    ms: 'Penaakulan Mantik',
    zh: '逻辑与推理',
    ta: 'தருக்க ரீதியான பகுத்தறிவு',
  },
  PNAP0162: {
    code: 'PNAP0162',
    en: 'Language and Literary Appreciation',
    ms: 'Apresiasi Bahasa dan Kesusasteraan',
    zh: '语言与文学赏析',
    ta: 'மொழி மற்றும் இலக்கிய பாராட்டு',
  },
  PNAP0182: {
    code: 'PNAP0182',
    en: 'Research Skills',
    ms: 'Kemahiran Penyelidikan',
    zh: '学术研究技能',
    ta: 'ஆராய்ச்சி திறன்கள்',
  },
  PNAP0172: {
    code: 'PNAP0172',
    en: 'Pembangunan Jati Diri Kebangsaan',
    ms: 'Pembangunan Jati Diri Kebangsaan',
    zh: '国家认同与品格塑造',
    ta: 'தேசிய அடையாள வளர்ச்சி',
  },
};

/**
 * Returns the standardized subject title based on the active language.
 * Supported languages: 'ms' (Malay), 'en' (English), 'zh' (Chinese), 'ta' (Tamil).
 */
export function getSubjectDisplayName(codeOrKey: string, lang: string = 'ms'): string {
  const upper = (codeOrKey || '').toUpperCase();
  const lower = (codeOrKey || '').toLowerCase();

  for (const [code, pair] of Object.entries(SUBJECT_NAME_PAIRS)) {
    if (
      upper.includes(code) ||
      (code === 'PNAP0113' && (lower.includes('bio') || lower.includes('hayat') || lower.includes('生物') || lower.includes('உயிரியல்'))) ||
      (code === 'PNAP0133' && (lower.includes('chem') || lower.includes('kimia') || lower.includes('化学') || lower.includes('வேதியியல்'))) ||
      (code === 'PNAP0123' && (lower.includes('phys') || lower.includes('fizik') || lower.includes('物理') || lower.includes('இயற்பியல்'))) ||
      (code === 'PNAP0154' && (lower.includes('stat') || lower.includes('statistik') || lower.includes('统计') || lower.includes('புள்ளியியல்'))) ||
      (code === 'PNAP0143' && (lower.includes('logic') || lower.includes('mantik') || lower.includes('reason') || lower.includes('逻辑') || lower.includes('பகுத்தறிவு'))) ||
      (code === 'PNAP0162' && (lower.includes('literary') || lower.includes('apresiasi') || lower.includes('language') || lower.includes('lla') || lower.includes('文学') || lower.includes('இலக்கிய'))) ||
      (code === 'PNAP0182' && (lower.includes('research') || lower.includes('penyelidikan') || lower.includes('研究') || lower.includes('ஆராய்ச்சி'))) ||
      (code === 'PNAP0172' && (lower.includes('jati') || lower.includes('kebangsaan') || lower.includes('品格') || lower.includes('தேசிய')))
    ) {
      if (lang === 'en') return pair.en;
      if (lang === 'zh') return pair.zh;
      if (lang === 'ta') return pair.ta;
      return pair.ms;
    }
  }

  return codeOrKey;
}
