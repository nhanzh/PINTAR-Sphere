// UKM ASASIpintar Kokurikulum & Jati Diri Assessment Structure (10% Total)

export interface KokoLevelOption {
  id: string;
  name: string;
  pusat: number;
  universiti: number;
  kebangsaan: number;
  antarabangsa: number;
}

// KATEGORI A: PENYERTAAN / PENGLIBATAN (Max 1.0)
export const KOKO_PARTICIPATION_LEVELS = [
  { id: 'pusat', label: 'Peringkat Pusat (Pusat PERMATApintar™)', score: 0.1 },
  { id: 'universiti', label: 'Peringkat Universiti (UKM)', score: 0.2 },
  { id: 'kebangsaan', label: 'Peringkat Kebangsaan', score: 0.3 },
  { id: 'antarabangsa', label: 'Peringkat Antarabangsa', score: 0.4 },
];

// KATEGORI B: PENCAPAIAN (Max 1.0)
export const KOKO_ACHIEVEMENT_OPTIONS: KokoLevelOption[] = [
  {
    id: 'emas',
    name: 'Johan / Pingat Emas',
    pusat: 0.26,
    universiti: 0.36,
    kebangsaan: 0.5,
    antarabangsa: 0.7,
  },
  {
    id: 'perak',
    name: 'Naib Johan / Pingat Perak',
    pusat: 0.19,
    universiti: 0.26,
    kebangsaan: 0.36,
    antarabangsa: 0.5,
  },
  {
    id: 'gangsa',
    name: 'Ketiga / Pingat Gangsa',
    pusat: 0.11,
    universiti: 0.15,
    kebangsaan: 0.21,
    antarabangsa: 0.3,
  },
  {
    id: 'khas',
    name: 'Anugerah Khas / Lain-lain',
    pusat: 0.07,
    universiti: 0.1,
    kebangsaan: 0.14,
    antarabangsa: 0.2,
  },
  {
    id: 'penyertaan',
    name: 'Sijil Penyertaan Rasmi',
    pusat: 0.055,
    universiti: 0.075,
    kebangsaan: 0.105,
    antarabangsa: 0.15,
  },
];

// KATEGORI C: PERJAWATAN (Max 1.0)
export const KOKO_POSITION_OPTIONS: KokoLevelOption[] = [
  {
    id: 'presiden',
    name: 'Presiden / Pengerusi / Yang di-Pertua',
    pusat: 0.3,
    universiti: 0.5,
    kebangsaan: 0.75,
    antarabangsa: 1.0,
  },
  {
    id: 'naib_presiden',
    name: 'Naib Presiden / Timbalan Pengerusi',
    pusat: 0.24,
    universiti: 0.4,
    kebangsaan: 0.6,
    antarabangsa: 0.8,
  },
  {
    id: 'setiausaha',
    name: 'Setiausaha',
    pusat: 0.18,
    universiti: 0.3,
    kebangsaan: 0.45,
    antarabangsa: 0.6,
  },
  {
    id: 'penolong_setiausaha',
    name: 'Penolong Setiausaha',
    pusat: 0.15,
    universiti: 0.25,
    kebangsaan: 0.375,
    antarabangsa: 0.5,
  },
  {
    id: 'bendahari',
    name: 'Bendahari',
    pusat: 0.18,
    universiti: 0.3,
    kebangsaan: 0.45,
    antarabangsa: 0.6,
  },
  {
    id: 'ketua_ajk',
    name: 'Ketua AJK / Penyelaras Biro',
    pusat: 0.12,
    universiti: 0.2,
    kebangsaan: 0.3,
    antarabangsa: 0.4,
  },
  {
    id: 'ajk',
    name: 'Ahli Jawatankuasa (AJK)',
    pusat: 0.09,
    universiti: 0.15,
    kebangsaan: 0.225,
    antarabangsa: 0.3,
  },
];

// Class Representative (CR) per semester bonus: 0.2
export const CLASS_REPRESENTATIVE_SCORE = 0.2;

// Calculate Total Koko 10%
export function calculateKoko10Total(params: {
  jatiDiri: number;
  participation: number;
  achievement: number;
  position: number;
}): {
  jatiDiriScore: number;
  kokoParticipation: number;
  kokoAchievement: number;
  kokoPosition: number;
  kokoActivitiesTotal: number;
  totalKoko10: number;
} {
  const jatiDiriScore = Math.min(7.0, Math.max(0, Number(params.jatiDiri || 0)));
  const kokoParticipation = Math.min(1.0, Math.max(0, Number(params.participation || 0)));
  const kokoAchievement = Math.min(1.0, Math.max(0, Number(params.achievement || 0)));
  const kokoPosition = Math.min(1.0, Math.max(0, Number(params.position || 0)));

  const kokoActivitiesTotal = Math.min(
    3.0,
    Number((kokoParticipation + kokoAchievement + kokoPosition).toFixed(3))
  );

  const totalKoko10 = Math.min(
    10.0,
    Number((jatiDiriScore + kokoActivitiesTotal).toFixed(2))
  );

  return {
    jatiDiriScore,
    kokoParticipation,
    kokoAchievement,
    kokoPosition,
    kokoActivitiesTotal,
    totalKoko10,
  };
}
