import { KokoCategory, KokoLevel } from '../types.ts';

export interface JatiDiriGradeOption {
  grade: string;
  score: number;
}

// Bahagian 1: Pembangunan Jati Diri dan Kebangsaan (7%)
export const JATI_DIRI_SCALE: JatiDiriGradeOption[] = [
  { grade: 'A', score: 7.00 },
  { grade: 'A-', score: 6.80 },
  { grade: 'B+', score: 6.60 },
  { grade: 'B', score: 6.40 },
  { grade: 'B-', score: 6.20 },
  { grade: 'C+', score: 6.00 },
  { grade: 'C', score: 5.80 },
  { grade: 'C-', score: 5.60 },
  { grade: 'D+', score: 5.40 },
  { grade: 'E', score: 0.00 },
];

// Bahagian 2: Kategori A: Penyertaan / Penglibatan (Maksimum: 1.0)
export const KOKO_CATEGORY_A_SCORES: Record<KokoLevel, number> = {
  pusat: 0.10,
  universiti: 0.20,
  kebangsaan: 0.30,
  antarabangsa: 0.40,
};

// Bahagian 2: Kategori B: Pencapaian (Maksimum: 1.0)
export type KokoAchievementLevel = 'emas' | 'perak' | 'gangsa' | 'khas' | 'penyertaan';

export const KOKO_ACHIEVEMENT_OPTIONS: { id: KokoAchievementLevel; label: string; short: string }[] = [
  { id: 'emas', label: 'Emas (Gold / Juara / Johan / Tempat Pertama)', short: 'Emas' },
  { id: 'perak', label: 'Perak (Silver / Naib Johan / Tempat Ke-2)', short: 'Perak' },
  { id: 'gangsa', label: 'Gangsa (Bronze / Tempat Ke-3)', short: 'Gangsa' },
  { id: 'khas', label: 'Khas / Saguhati / Lain-lain', short: 'Khas / Lain-lain' },
  { id: 'penyertaan', label: 'Penyertaan (Participation)', short: 'Penyertaan' },
];

export const KOKO_CATEGORY_B_SCORES: Record<KokoLevel, Record<KokoAchievementLevel, number>> = {
  pusat: {
    emas: 0.26,
    perak: 0.19,
    gangsa: 0.11,
    khas: 0.07,
    penyertaan: 0.055,
  },
  universiti: {
    emas: 0.36,
    perak: 0.26,
    gangsa: 0.15,
    khas: 0.10,
    penyertaan: 0.075,
  },
  kebangsaan: {
    emas: 0.50,
    perak: 0.36,
    gangsa: 0.21,
    khas: 0.14,
    penyertaan: 0.105,
  },
  antarabangsa: {
    emas: 0.70,
    perak: 0.50,
    gangsa: 0.30,
    khas: 0.20,
    penyertaan: 0.150,
  },
};

// Bahagian 2: Kategori C: Perjawatan (Maksimum: 1.0)
export type KokoPositionRole =
  | 'presiden'
  | 'naib_presiden'
  | 'setiausaha'
  | 'penolong_setiausaha'
  | 'bendahari'
  | 'ketua_ajk'
  | 'ajk'
  | 'class_rep';

export const KOKO_POSITION_OPTIONS: { id: KokoPositionRole; label: string; short: string }[] = [
  { id: 'presiden', label: 'Presiden / Yang Dipertua (YDP) / Pengerusi', short: 'Presiden / YDP' },
  { id: 'naib_presiden', label: 'Naib Presiden / Timbalan YDP / Naib Pengerusi', short: 'Naib Presiden / Timbalan' },
  { id: 'setiausaha', label: 'Setiausaha (SU)', short: 'Setiausaha' },
  { id: 'penolong_setiausaha', label: 'Penolong Setiausaha (PSU)', short: 'Penolong Setiausaha' },
  { id: 'bendahari', label: 'Bendahari / Bendahari Kehormat', short: 'Bendahari' },
  { id: 'ketua_ajk', label: 'Ketua AJK / Penyelaras Program / Ketua Biro', short: 'Ketua AJK / Penyelaras' },
  { id: 'ajk', label: 'Ahli Jawatankuasa (AJK)', short: 'AJK' },
  { id: 'class_rep', label: 'Wakil Kelas / Class Representative (CR)', short: 'Class Rep (CR)' },
];

export const KOKO_CATEGORY_C_SCORES: Record<KokoPositionRole, Record<KokoLevel, number>> = {
  presiden: {
    pusat: 0.30,
    universiti: 0.50,
    kebangsaan: 0.75,
    antarabangsa: 1.00,
  },
  naib_presiden: {
    pusat: 0.24,
    universiti: 0.40,
    kebangsaan: 0.60,
    antarabangsa: 0.80,
  },
  setiausaha: {
    pusat: 0.18,
    universiti: 0.30,
    kebangsaan: 0.45,
    antarabangsa: 0.60,
  },
  penolong_setiausaha: {
    pusat: 0.15,
    universiti: 0.25,
    kebangsaan: 0.375,
    antarabangsa: 0.50,
  },
  bendahari: {
    pusat: 0.18,
    universiti: 0.30,
    kebangsaan: 0.45,
    antarabangsa: 0.60,
  },
  ketua_ajk: {
    pusat: 0.12,
    universiti: 0.20,
    kebangsaan: 0.30,
    antarabangsa: 0.40,
  },
  ajk: {
    pusat: 0.09,
    universiti: 0.15,
    kebangsaan: 0.225,
    antarabangsa: 0.30,
  },
  class_rep: {
    pusat: 0.20,
    universiti: 0.20,
    kebangsaan: 0.20,
    antarabangsa: 0.20,
  },
};

export function calculateSuggestedKokoScore(
  category: KokoCategory,
  level: KokoLevel,
  subCategory?: string
): number {
  if (category === 'A') {
    return KOKO_CATEGORY_A_SCORES[level] ?? 0.10;
  }
  if (category === 'B') {
    const ach = (subCategory as KokoAchievementLevel) || 'emas';
    return KOKO_CATEGORY_B_SCORES[level]?.[ach] ?? 0.26;
  }
  if (category === 'C') {
    const pos = (subCategory as KokoPositionRole) || 'presiden';
    return KOKO_CATEGORY_C_SCORES[pos]?.[level] ?? 0.30;
  }
  return 0.10;
}
