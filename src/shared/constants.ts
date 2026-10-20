import type { GroupId, MinistryId, ProjectType, QualityId, RegimeType } from './types';

export const START_DATE_UTC = Date.UTC(2026, 0, 1);
const DAY = 86_400_000;

/** Oyun günü -> takvim tarihi */
export function dayToDate(day: number): Date {
  return new Date(START_DATE_UTC + Math.floor(day) * DAY);
}

export function dateToDay(year: number, month: number, dayOfMonth = 1): number {
  return Math.round((Date.UTC(year, month - 1, dayOfMonth) - START_DATE_UTC) / DAY);
}

const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

export function formatGameDate(day: number, withDay = true): string {
  const d = dayToDate(day);
  const ay = AYLAR[d.getUTCMonth()];
  return withDay ? `${d.getUTCDate()} ${ay} ${d.getUTCFullYear()}` : `${ay} ${d.getUTCFullYear()}`;
}

export const MINISTRIES: MinistryId[] = [
  'ekonomi',
  'disisleri',
  'savunma',
  'icisleri',
  'saglik',
  'egitim',
  'sanayi',
  'tarim',
  'calisma',
  'ulastirma',
];

export const MINISTRY_LABELS: Record<MinistryId, string> = {
  ekonomi: 'Hazine ve Maliye',
  disisleri: 'Dışişleri',
  savunma: 'Milli Savunma',
  icisleri: 'İçişleri',
  saglik: 'Sağlık',
  egitim: 'Milli Eğitim',
  sanayi: 'Sanayi ve Teknoloji',
  tarim: 'Tarım',
  calisma: 'Çalışma ve Sosyal Güvenlik',
  ulastirma: 'Ulaştırma ve Altyapı',
};

/** Bakanlık bütçesinin beslediği hizmet kalitesi (Hazine bütçesi vergi tahsilatını etkiler) */
export const MINISTRY_QUALITY: Record<MinistryId, QualityId | null> = {
  ekonomi: null,
  disisleri: 'diplomasi',
  savunma: 'savunma',
  icisleri: 'guvenlik',
  saglik: 'saglik',
  egitim: 'egitim',
  sanayi: 'sanayi',
  tarim: 'tarim',
  calisma: 'sosyal',
  ulastirma: 'altyapi',
};

export const QUALITY_LABELS: Record<QualityId, string> = {
  saglik: 'Sağlık hizmetleri',
  egitim: 'Eğitim',
  guvenlik: 'İç güvenlik',
  altyapi: 'Altyapı',
  sosyal: 'Sosyal güvenlik',
  tarim: 'Tarım',
  diplomasi: 'Diplomasi',
  sanayi: 'Sanayi desteği',
  savunma: 'Ordu hazırlığı',
};

/**
 * Bakanlık bütçesinin "yeterli" sayıldığı referans düzeyi (GSYH %).
 * Bütçe şablonu da bu oranlarla dağıtılır.
 */
export const BUDGET_REFERENCE: Record<MinistryId, number> = {
  ekonomi: 0.6,
  disisleri: 0.3,
  savunma: 2.5,
  icisleri: 1.6,
  saglik: 5.5,
  egitim: 4.5,
  sanayi: 0.8,
  tarim: 1.0,
  calisma: 11,
  ulastirma: 2.2,
};

export interface ProjectDef {
  label: string;
  desc: string;
  costPct: number;
  days: number;
}

export const PROJECTS: Record<ProjectType, ProjectDef> = {
  fabrika: {
    label: 'Fabrika / sanayi bölgesi',
    desc: 'Yapım süresince inşaat istihdamı; bitince kalıcı olarak işsizliği düşürür, büyümeyi artırır.',
    costPct: 0.3,
    days: 540,
  },
  enerji: {
    label: 'Enerji santrali',
    desc: 'Enerji maliyetini düşürür: enflasyonu kalıcı olarak azaltır, büyümeye katkı yapar.',
    costPct: 0.5,
    days: 900,
  },
  otoyol: {
    label: 'Otoyol ve liman',
    desc: 'Altyapı kalitesini ve uzun vadeli büyümeyi artırır.',
    costPct: 0.4,
    days: 720,
  },
  hastane: {
    label: 'Şehir hastanesi',
    desc: 'Sağlık hizmet kalitesini artırır; emekliler ve orta sınıf memnun olur.',
    costPct: 0.15,
    days: 360,
  },
  okul: {
    label: 'Okul ve üniversite',
    desc: 'Eğitim kalitesini artırır; yıllar içinde verimlilik ve gençlerin memnuniyeti yükselir.',
    costPct: 0.1,
    days: 360,
  },
  savunmaSanayi: {
    label: 'Yerli savunma sanayii',
    desc: 'Ordu hazırlığını artırır, nitelikli istihdam yaratır.',
    costPct: 0.4,
    days: 720,
  },
  eDevlet: {
    label: 'Dijital devlet reformu',
    desc: 'Bürokrasiyi hızlandırır ve israfı azaltır; kısa vadede kamu çalışanları rahatsız olur.',
    costPct: 0.1,
    days: 360,
  },
};

export const PROJECT_TYPES = Object.keys(PROJECTS) as ProjectType[];

export const GROUPS: { id: GroupId; label: string; weight: number; cares: string }[] = [
  { id: 'isciler', label: 'İşçiler', weight: 0.28, cares: 'Asgari ücret, işsizlik, enflasyon, KDV' },
  { id: 'emekliler', label: 'Emekliler', weight: 0.15, cares: 'Enflasyon, sağlık, sosyal güvenlik' },
  { id: 'gencler', label: 'Gençler', weight: 0.15, cares: 'İşsizlik, eğitim, büyüme' },
  { id: 'ortaSinif', label: 'Orta sınıf', weight: 0.15, cares: 'Enflasyon, gelir vergisi, güvenlik, büyüme' },
  { id: 'ciftciler', label: 'Çiftçiler', weight: 0.1, cares: 'Tarım desteği, enflasyon' },
  { id: 'kamu', label: 'Kamu çalışanları', weight: 0.1, cares: 'Kamu harcaması, enflasyon' },
  { id: 'isDunyasi', label: 'İş dünyası', weight: 0.07, cares: 'Kurumlar vergisi, faiz, güven, büyüme' },
];

export const REGIME_LABELS: Record<RegimeType, string> = {
  baskanlik: 'Başkanlık sistemi',
  parlamenter: 'Parlamenter sistem',
  yariBaskanlik: 'Yarı başkanlık',
  otoriter: 'Otoriter yönetim',
};

/** Seçimi kazanmak için gereken oy oranı */
export const WIN_THRESHOLD: Record<RegimeType, number> = {
  baskanlik: 50,
  yariBaskanlik: 50,
  parlamenter: 42,
  otoriter: 0,
};

export const CAMPAIGN_DAYS = 180;
export const EVENT_DEADLINE_DAYS = 15;
export const MAX_RALLIES = 5;
