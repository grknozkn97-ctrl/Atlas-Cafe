import type { Ideology } from './types';

export interface PartySeed {
  name: string;
  short: string;
  color: string;
  ideology: Ideology;
  /** Anket desteği (%), yaklaşık 2025 */
  support: number;
  ruling?: boolean;
  /** Koalisyon ortağı */
  partner?: boolean;
}

const i = (economic: number, social: number): Ideology => ({ economic, social });

/**
 * Ülkelerin başlıca partileri. Destek oranları 2025 civarı kamuoyu yoklamalarından
 * yuvarlanmış yaklaşık değerlerdir; oyun içinde zamanla değişir.
 */
export const PARTY_SEEDS: Record<string, PartySeed[]> = {
  tr: [
    { name: 'Adalet ve Kalkınma Partisi', short: 'AK Parti', color: '#f2a20c', ideology: i(0.3, 0.7), support: 32, ruling: true },
    { name: 'Cumhuriyet Halk Partisi', short: 'CHP', color: '#e3242b', ideology: i(-0.35, -0.5), support: 31 },
    { name: 'Milliyetçi Hareket Partisi', short: 'MHP', color: '#9b1d20', ideology: i(0.2, 0.8), support: 9, partner: true },
    { name: 'Halkların Eşitlik ve Demokrasi Partisi', short: 'DEM', color: '#8e44ad', ideology: i(-0.7, -0.6), support: 9 },
    { name: 'İYİ Parti', short: 'İYİ', color: '#2fb4e6', ideology: i(0.3, 0.2), support: 6 },
    { name: 'Yeniden Refah Partisi', short: 'YRP', color: '#5d8a3a', ideology: i(0, 0.9), support: 5 },
    { name: 'Zafer Partisi', short: 'Zafer', color: '#3949ab', ideology: i(0.2, 0.6), support: 4 },
  ],
  us: [
    { name: 'Cumhuriyetçi Parti', short: 'GOP', color: '#e5383b', ideology: i(0.6, 0.6), support: 46, ruling: true },
    { name: 'Demokrat Parti', short: 'DEM', color: '#3a6fd8', ideology: i(-0.3, -0.5), support: 45 },
    { name: 'Liberter Parti', short: 'LP', color: '#f4c430', ideology: i(0.9, -0.6), support: 5 },
    { name: 'Yeşiller Partisi', short: 'GP', color: '#2bb673', ideology: i(-0.8, -0.7), support: 4 },
  ],
  de: [
    { name: 'CDU/CSU Birliği', short: 'Union', color: '#7a7f8a', ideology: i(0.4, 0.4), support: 26, ruling: true },
    { name: 'Almanya için Alternatif', short: 'AfD', color: '#18a0e0', ideology: i(0.4, 0.9), support: 25 },
    { name: 'Sosyal Demokrat Parti', short: 'SPD', color: '#e3000f', ideology: i(-0.4, -0.3), support: 15, partner: true },
    { name: 'Yeşiller', short: 'Grüne', color: '#46962b', ideology: i(-0.4, -0.8), support: 11 },
    { name: 'Sol Parti', short: 'Linke', color: '#be3075', ideology: i(-0.8, -0.6), support: 10 },
    { name: 'Sahra Wagenknecht İttifakı', short: 'BSW', color: '#a0577a', ideology: i(-0.6, 0.4), support: 4 },
    { name: 'Hür Demokrat Parti', short: 'FDP', color: '#f2d500', ideology: i(0.8, -0.4), support: 4 },
  ],
  fr: [
    { name: 'Ulusal Birlik', short: 'RN', color: '#2c4fa3', ideology: i(0.1, 0.8), support: 33 },
    { name: 'Rönesans / Ensemble', short: 'ENS', color: '#f7c600', ideology: i(0.4, -0.3), support: 16, ruling: true },
    { name: 'Boyun Eğmeyen Fransa', short: 'LFI', color: '#cc2443', ideology: i(-0.9, -0.6), support: 13 },
    { name: 'Cumhuriyetçiler', short: 'LR', color: '#2a7fd4', ideology: i(0.5, 0.5), support: 11, partner: true },
    { name: 'Sosyalist Parti', short: 'PS', color: '#ff6f91', ideology: i(-0.4, -0.5), support: 10 },
    { name: 'Ekolojistler', short: 'EELV', color: '#3fb950', ideology: i(-0.5, -0.8), support: 6 },
  ],
  gb: [
    { name: 'Reform UK', short: 'Reform', color: '#12b6cf', ideology: i(0.5, 0.8), support: 29 },
    { name: 'İşçi Partisi', short: 'Labour', color: '#e4003b', ideology: i(-0.3, -0.3), support: 21, ruling: true },
    { name: 'Muhafazakâr Parti', short: 'Tory', color: '#2f80d1', ideology: i(0.5, 0.5), support: 17 },
    { name: 'Liberal Demokratlar', short: 'LibDem', color: '#faa61a', ideology: i(0, -0.6), support: 14 },
    { name: 'Yeşiller', short: 'Green', color: '#02a95b', ideology: i(-0.7, -0.8), support: 12 },
    { name: 'İskoç Ulusal Partisi', short: 'SNP', color: '#e8d55a', ideology: i(-0.3, -0.4), support: 3 },
  ],
  it: [
    { name: "İtalya'nın Kardeşleri", short: 'FdI', color: '#2f5bb7', ideology: i(0.4, 0.8), support: 30, ruling: true },
    { name: 'Demokrat Parti', short: 'PD', color: '#ef1c27', ideology: i(-0.3, -0.5), support: 22 },
    { name: 'Beş Yıldız Hareketi', short: 'M5S', color: '#f2d21b', ideology: i(-0.3, -0.1), support: 12 },
    { name: "İleri İtalya", short: 'FI', color: '#3ea4ff', ideology: i(0.6, 0.3), support: 9, partner: true },
    { name: 'Lig', short: 'Lega', color: '#2e9e44', ideology: i(0.4, 0.8), support: 8, partner: true },
    { name: 'Yeşiller ve Sol İttifak', short: 'AVS', color: '#8bc34a', ideology: i(-0.8, -0.8), support: 6 },
  ],
  es: [
    { name: 'Halk Partisi', short: 'PP', color: '#1d84ce', ideology: i(0.5, 0.5), support: 33 },
    { name: 'İspanyol Sosyalist İşçi Partisi', short: 'PSOE', color: '#ef1c27', ideology: i(-0.3, -0.5), support: 28, ruling: true },
    { name: 'Vox', short: 'Vox', color: '#63be21', ideology: i(0.5, 0.9), support: 17 },
    { name: 'Sumar', short: 'Sumar', color: '#e51c55', ideology: i(-0.7, -0.7), support: 7, partner: true },
    { name: 'Podemos', short: 'Podemos', color: '#7b3e8f', ideology: i(-0.9, -0.7), support: 4 },
  ],
  pl: [
    { name: 'Yurttaş Koalisyonu', short: 'KO', color: '#f68f2d', ideology: i(0.2, -0.4), support: 31, ruling: true },
    { name: 'Hukuk ve Adalet', short: 'PiS', color: '#3d5bb8', ideology: i(-0.2, 0.8), support: 30 },
    { name: 'Konfederasyon', short: 'Konf', color: '#6d7fb3', ideology: i(0.8, 0.8), support: 14 },
    { name: 'Sol', short: 'Lewica', color: '#d7262c', ideology: i(-0.6, -0.7), support: 7, partner: true },
    { name: 'Üçüncü Yol', short: 'TD', color: '#1bb100', ideology: i(0.2, 0.2), support: 6, partner: true },
    { name: 'Razem', short: 'Razem', color: '#a3195b', ideology: i(-0.9, -0.6), support: 4 },
  ],
  gr: [
    { name: 'Yeni Demokrasi', short: 'ND', color: '#2f6bd1', ideology: i(0.5, 0.4), support: 30, ruling: true },
    { name: 'PASOK', short: 'PASOK', color: '#2db34a', ideology: i(-0.3, -0.3), support: 13 },
    { name: 'Yunan Çözümü', short: 'EL', color: '#4fb6e6', ideology: i(0.3, 0.9), support: 9 },
    { name: 'Yunanistan Komünist Partisi', short: 'KKE', color: '#c80000', ideology: i(-1, 0.1), support: 8 },
    { name: 'SYRIZA', short: 'SYRIZA', color: '#e4007c', ideology: i(-0.6, -0.6), support: 6 },
    { name: 'Özgürlüğe Doğru', short: 'PE', color: '#a2477d', ideology: i(-0.6, -0.4), support: 5 },
  ],
  az: [
    { name: 'Yeni Azerbaycan Partisi', short: 'YAP', color: '#2f8fe0', ideology: i(0.2, 0.4), support: 70, ruling: true },
    { name: 'Müsavat Partisi', short: 'Müsavat', color: '#2e9d57', ideology: i(0.3, 0.1), support: 10 },
    { name: 'Azerbaycan Halk Cephesi Partisi', short: 'AXCP', color: '#d84343', ideology: i(0.1, 0.2), support: 10 },
    { name: 'Ümid Partisi', short: 'Ümid', color: '#9c5bd1', ideology: i(-0.3, 0.2), support: 5 },
  ],
  il: [
    { name: 'Likud', short: 'Likud', color: '#2f6bd1', ideology: i(0.5, 0.6), support: 25, ruling: true },
    { name: 'Yeş Atid', short: 'YA', color: '#46a8f0', ideology: i(0.2, -0.5), support: 12 },
    { name: 'Ulusal Birlik', short: 'NU', color: '#3aa17e', ideology: i(0.2, 0.1), support: 11 },
    { name: 'Demokratlar', short: 'Dem', color: '#e53935', ideology: i(-0.5, -0.7), support: 10 },
    { name: 'Yisrael Beytenu', short: 'YB', color: '#7986cb', ideology: i(0.5, 0.1), support: 9 },
    { name: 'Şas', short: 'Shas', color: '#9575cd', ideology: i(-0.1, 1), support: 8, partner: true },
    { name: 'Arap partileri', short: 'Arap', color: '#43a047', ideology: i(-0.4, 0.2), support: 9 },
  ],
  in: [
    { name: 'Bharatiya Janata Partisi', short: 'BJP', color: '#ff9933', ideology: i(0.4, 0.8), support: 37, ruling: true },
    { name: 'Hindistan Ulusal Kongresi', short: 'INC', color: '#19aaed', ideology: i(-0.2, -0.4), support: 22 },
    { name: 'Samajwadi Partisi', short: 'SP', color: '#e53935', ideology: i(-0.4, -0.2), support: 5 },
    { name: 'Tüm Hindistan Trinamool Kongresi', short: 'AITC', color: '#20c646', ideology: i(-0.3, -0.2), support: 4 },
    { name: 'Telugu Desam Partisi', short: 'TDP', color: '#f2d500', ideology: i(0.2, 0.1), support: 3, partner: true },
  ],
  jp: [
    { name: 'Liberal Demokrat Parti', short: 'LDP', color: '#3ca324', ideology: i(0.4, 0.5), support: 30, ruling: true },
    { name: 'Anayasal Demokrat Parti', short: 'CDP', color: '#3c6fd6', ideology: i(-0.3, -0.4), support: 14 },
    { name: 'Halk için Demokrat Parti', short: 'DPFP', color: '#f8bc00', ideology: i(0.1, 0), support: 11 },
    { name: 'Japonya Yenilik Partisi', short: 'Ishin', color: '#b8d200', ideology: i(0.6, 0.2), support: 9, partner: true },
    { name: 'Sanseito', short: 'Sanseito', color: '#ff6a00', ideology: i(0.2, 0.9), support: 8 },
    { name: 'Komeito', short: 'Komeito', color: '#e9579b', ideology: i(-0.1, 0.2), support: 6 },
    { name: 'Japonya Komünist Partisi', short: 'JCP', color: '#db001c', ideology: i(-0.9, -0.5), support: 5 },
  ],
  kr: [
    { name: 'Demokrat Parti', short: 'DPK', color: '#2d55d6', ideology: i(-0.3, -0.3), support: 45, ruling: true },
    { name: 'Halkın Gücü Partisi', short: 'PPP', color: '#e61e2b', ideology: i(0.5, 0.5), support: 36 },
    { name: 'Kore’yi Yeniden İnşa Partisi', short: 'RKP', color: '#2fa6e0', ideology: i(-0.5, -0.4), support: 8 },
    { name: 'Reform Partisi', short: 'Reform', color: '#ff7210', ideology: i(0.5, -0.2), support: 6 },
  ],
  ca: [
    { name: 'Liberal Parti', short: 'LPC', color: '#d71920', ideology: i(0, -0.5), support: 42, ruling: true },
    { name: 'Muhafazakâr Parti', short: 'CPC', color: '#2f6cd1', ideology: i(0.6, 0.4), support: 39 },
    { name: 'Yeni Demokrat Parti', short: 'NDP', color: '#f37021', ideology: i(-0.6, -0.6), support: 9 },
    { name: 'Québec Bloğu', short: 'BQ', color: '#33b2cc', ideology: i(-0.2, 0), support: 7 },
    { name: 'Yeşiller', short: 'GPC', color: '#3d9b35', ideology: i(-0.6, -0.8), support: 3 },
  ],
  mx: [
    { name: 'Morena', short: 'Morena', color: '#b5122e', ideology: i(-0.5, 0), support: 55, ruling: true },
    { name: 'Ulusal Eylem Partisi', short: 'PAN', color: '#2f6bd1', ideology: i(0.5, 0.6), support: 17 },
    { name: 'Kurumsal Devrimci Parti', short: 'PRI', color: '#00923f', ideology: i(0.1, 0.3), support: 10 },
    { name: 'Yurttaş Hareketi', short: 'MC', color: '#ff8300', ideology: i(-0.1, -0.5), support: 10 },
    { name: 'Yeşil Ekolojist Parti', short: 'PVEM', color: '#7cc243', ideology: i(0, 0), support: 5, partner: true },
  ],
  br: [
    { name: 'İşçi Partisi', short: 'PT', color: '#c4122d', ideology: i(-0.5, -0.3), support: 32, ruling: true },
    { name: 'Liberal Parti', short: 'PL', color: '#2f62d0', ideology: i(0.5, 0.8), support: 27 },
    { name: 'Brezilya Birliği', short: 'UNIÃO', color: '#1cb0e8', ideology: i(0.4, 0.3), support: 9 },
    { name: 'Brezilya Demokratik Hareketi', short: 'MDB', color: '#30914d', ideology: i(0.2, 0.2), support: 9, partner: true },
    { name: 'Sosyal Demokrat Parti', short: 'PSD', color: '#f7a52b', ideology: i(0.2, 0.1), support: 8, partner: true },
    { name: 'Sosyalizm ve Özgürlük Partisi', short: 'PSOL', color: '#f2c800', ideology: i(-0.9, -0.8), support: 5 },
  ],
  ar: [
    { name: 'Özgürlük İlerliyor', short: 'LLA', color: '#8b5cf6', ideology: i(1, 0.3), support: 40, ruling: true },
    { name: 'Vatan için Birlik (Peronistler)', short: 'UxP', color: '#4aa3df', ideology: i(-0.5, 0), support: 33 },
    { name: 'Cumhuriyetçi Öneri', short: 'PRO', color: '#f4c430', ideology: i(0.6, 0), support: 8, partner: true },
    { name: 'Radikal Sivil Birlik', short: 'UCR', color: '#e10019', ideology: i(0, -0.2), support: 7 },
    { name: 'Sol ve İşçi Cephesi', short: 'FIT', color: '#ff6b6b', ideology: i(-1, -0.6), support: 5 },
  ],
  cn: [{ name: 'Çin Komünist Partisi', short: 'ÇKP', color: '#de2910', ideology: i(-0.2, 0.6), support: 100, ruling: true }],
  ru: [
    { name: 'Birleşik Rusya', short: 'BR', color: '#2f6bd1', ideology: i(0.2, 0.8), support: 70, ruling: true },
    { name: 'Rusya Federasyonu Komünist Partisi', short: 'KPRF', color: '#c80000', ideology: i(-0.8, 0.6), support: 15 },
    { name: 'Liberal Demokrat Parti', short: 'LDPR', color: '#f4c430', ideology: i(0.2, 0.9), support: 9 },
    { name: 'Yeni İnsanlar', short: 'YI', color: '#26c6da', ideology: i(0.5, -0.3), support: 6 },
  ],
  ir: [
    { name: 'İlkeciler', short: 'İlkeci', color: '#2e7d32', ideology: i(-0.1, 1), support: 60, ruling: true },
    { name: 'Reformcular', short: 'Reform', color: '#7cb342', ideology: i(0, 0.3), support: 40 },
  ],
  sa: [{ name: 'Kraliyet Hükümeti', short: 'Saray', color: '#1b8a3a', ideology: i(0.3, 1), support: 100, ruling: true }],
  eg: [
    { name: 'Vatan Geleceği Partisi', short: 'MW', color: '#1565c0', ideology: i(0.2, 0.5), support: 70, ruling: true },
    { name: 'Bağımsızlar', short: 'Bağımsız', color: '#8d99ae', ideology: i(0, 0.4), support: 30 },
  ],
};

export const ELECTION_THRESHOLD: Record<string, number> = { tr: 7, de: 5, pl: 5, il: 3.25, gr: 3, es: 3, it: 3, fr: 5 };

interface RegionSeed {
  id: string;
  name: string;
  weight: number;
  lean: Ideology;
  x: number;
  y: number;
}

/** Türkiye'nin coğrafi bölgeleri; diğer ülkeler için genel bölgeler kullanılır. */
export const REGION_SEEDS: Record<string, RegionSeed[]> = {
  tr: [
    { id: 'marmara', name: 'Marmara', weight: 0.31, lean: i(0.1, -0.2), x: 0.18, y: 0.3 },
    { id: 'ege', name: 'Ege', weight: 0.13, lean: i(0, -0.5), x: 0.12, y: 0.55 },
    { id: 'akdeniz', name: 'Akdeniz', weight: 0.13, lean: i(0.1, 0.2), x: 0.38, y: 0.75 },
    { id: 'icanadolu', name: 'İç Anadolu', weight: 0.15, lean: i(0.2, 0.5), x: 0.42, y: 0.48 },
    { id: 'karadeniz', name: 'Karadeniz', weight: 0.09, lean: i(0.2, 0.7), x: 0.55, y: 0.22 },
    { id: 'doguanadolu', name: 'Doğu Anadolu', weight: 0.07, lean: i(-0.2, 0.4), x: 0.78, y: 0.42 },
    { id: 'guneydogu', name: 'Güneydoğu Anadolu', weight: 0.12, lean: i(-0.4, 0.3), x: 0.72, y: 0.7 },
  ],
};

export function genericRegions(capitalLean: Ideology): RegionSeed[] {
  return [
    { id: 'baskent', name: 'Başkent ve çevresi', weight: 0.26, lean: i(capitalLean.economic, capitalLean.social - 0.3), x: 0.5, y: 0.45 },
    { id: 'kuzey', name: 'Kuzey', weight: 0.18, lean: i(0.2, 0.3), x: 0.5, y: 0.15 },
    { id: 'guney', name: 'Güney', weight: 0.2, lean: i(-0.1, 0.4), x: 0.5, y: 0.82 },
    { id: 'dogu', name: 'Doğu', weight: 0.17, lean: i(-0.3, 0.1), x: 0.84, y: 0.5 },
    { id: 'bati', name: 'Batı', weight: 0.19, lean: i(0.3, -0.3), x: 0.16, y: 0.5 },
  ];
}
