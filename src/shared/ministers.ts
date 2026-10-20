import type { Minister, MinistryId, TraitId } from './types';

export type Rng = () => number;

/** Tekrarlanabilir rastgele sayı üreteci (mulberry32). */
export function createRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TR_FIRST = [
  'Ahmet', 'Mehmet', 'Ayşe', 'Fatma', 'Mustafa', 'Zeynep', 'Ali', 'Elif', 'Hüseyin', 'Emine',
  'Murat', 'Selin', 'Kemal', 'Derya', 'Osman', 'Gül', 'Burak', 'Esra', 'Hakan', 'Nilüfer',
  'Serkan', 'Aslı', 'Cem', 'Ebru', 'Levent', 'Pınar', 'Tolga', 'Sevgi', 'Orhan', 'Melike',
];
const TR_LAST = [
  'Yılmaz', 'Kaya', 'Demir', 'Şahin', 'Çelik', 'Yıldız', 'Aydın', 'Öztürk', 'Arslan', 'Doğan',
  'Kılıç', 'Aslan', 'Çetin', 'Koç', 'Kurt', 'Özdemir', 'Erdem', 'Polat', 'Güneş', 'Aksoy',
  'Karaca', 'Tekin', 'Ünal', 'Bulut', 'Sarı', 'Özkan', 'Başaran', 'Ekinci', 'Uçar', 'Turan',
];
const GEN_FIRST = [
  'Anna', 'David', 'Maria', 'James', 'Sofia', 'Daniel', 'Elena', 'Michael', 'Laura', 'Thomas',
  'Clara', 'Lucas', 'Julia', 'Marco', 'Nadia', 'Peter', 'Irene', 'Victor', 'Hana', 'Oliver',
];
const GEN_LAST = [
  'Novak', 'Rossi', 'Schmidt', 'Martin', 'Garcia', 'Silva', 'Kowalski', 'Müller', 'Tanaka', 'Kim',
  'Dubois', 'Costa', 'Petrov', 'Nielsen', 'Moreau', 'Weber', 'Santos', 'Fischer', 'Laurent', 'Mori',
];

function pick<T>(rng: Rng, list: T[]): T {
  return list[Math.floor(rng() * list.length)];
}

function clamp01(x: number): number {
  return Math.max(0.05, Math.min(0.98, x));
}

let counter = 0;

export const TRAITS: Record<TraitId, { label: string; icon: string; desc: string }> = {
  teknokrat: { label: 'Teknokrat', icon: '🧮', desc: 'Bütçeyi çok verimli kullanır (+%10), ama halka uzak durur.' },
  populist: { label: 'Popülist', icon: '📢', desc: 'Halk onu sever (destek +), ama verim düşer (-%8).' },
  reformcu: { label: 'Reformcu', icon: '🛠️', desc: 'Bürokrasiyi her ay biraz iyileştirir; ilk aylarda tepki çeker.' },
  sadik: { label: 'Sadık', icon: '🤝', desc: 'Görevden alınsa bile seni eleştirmez.' },
  hirsli: { label: 'Hırslı', icon: '🔥', desc: 'Çok çalışır (+%5 verim) ama gözü koltuğunda; sadakati düşük.' },
  tecrubeli: { label: 'Tecrübeli', icon: '🎖️', desc: 'Yılların birikimi: verim +%8, krizlerde soğukkanlı.' },
  medyatik: { label: 'Medyatik', icon: '📺', desc: 'Kameralar onu sever; kabinenin popülerliğini artırır.' },
  tasarrufcu: { label: 'Tasarrufçu', icon: '💰', desc: 'Harcamayı kısar; hizmet kalitesini daha az bütçeyle korur (+%4).' },
  golgeli: { label: 'Gölgeli geçmiş', icon: '🕶️', desc: 'Eski dosyaları var: skandal riski yüksek.' },
};

const PROFESSIONS: Partial<Record<MinistryId, string[]>> = {
  ekonomi: ['Eski merkez bankası başkan yardımcısı', 'Yatırım bankacısı', 'İktisat profesörü'],
  disisleri: ['Kariyer diplomatı', 'Eski büyükelçi', 'Uluslararası ilişkiler profesörü'],
  savunma: ['Emekli korgeneral', 'Savunma sanayii yöneticisi', 'Güvenlik uzmanı'],
  icisleri: ['Eski vali', 'Emniyet müdürü', 'Hukukçu'],
  saglik: ['Kalp cerrahı', 'Halk sağlığı profesörü', 'Hastane başhekimi'],
  egitim: ['Eski rektör', 'Öğretmen sendikası başkanı', 'Eğitim bilimci'],
  sanayi: ['Fabrika sahibi', 'Mühendis', 'Sanayi odası başkanı'],
  tarim: ['Ziraat mühendisi', 'Kooperatif başkanı', 'Çiftçi birliği lideri'],
  calisma: ['Sendikacı', 'Sosyal politika uzmanı', 'Belediye başkanı'],
  ulastirma: ['İnşaat mühendisi', 'Havayolu yöneticisi', 'Altyapı müteahhidi'],
};
const GENERIC_PROF = ['Avukat', 'Akademisyen', 'İş insanı', 'Eski belediye başkanı', 'Gazeteci', 'Bürokrat'];

export function generateMinister(rng: Rng, names: 'tr' | 'genel', quality = 0, ministry?: MinistryId): Minister {
  const first = names === 'tr' ? TR_FIRST : GEN_FIRST;
  const last = names === 'tr' ? TR_LAST : GEN_LAST;
  // Yetkin adaylar her zaman sadık değildir: yetkinlik ile sadakat arasında hafif ters ilişki var.
  const competence = clamp01(0.25 + rng() * 0.6 + quality);
  const loyalty = clamp01(0.85 - competence * 0.35 + (rng() - 0.5) * 0.5);
  const honesty = clamp01(0.3 + rng() * 0.65);
  const popularity = clamp01(0.2 + rng() * 0.7);
  counter += 1;
  const traits: TraitId[] = [];
  if (competence > 0.68 && rng() < 0.6) traits.push('teknokrat');
  if (popularity > 0.72) traits.push(rng() < 0.5 ? 'medyatik' : 'populist');
  if (loyalty > 0.78) traits.push('sadik');
  else if (loyalty < 0.35) traits.push('hirsli');
  if (honesty < 0.4) traits.push('golgeli');
  const extra: TraitId[] = ['reformcu', 'tecrubeli', 'tasarrufcu', 'populist'];
  if (traits.length < 3 && rng() < 0.7) {
    const t = pick(rng, extra);
    if (!traits.includes(t)) traits.push(t);
  }
  const age = Math.round(36 + rng() * 32);
  const profession = pick(rng, (ministry && PROFESSIONS[ministry]) || GENERIC_PROF);
  const name = `${pick(rng, first)} ${pick(rng, last)}`;
  const known = traits.map((t) => TRAITS[t].label.toLocaleLowerCase('tr')).join(', ');
  const bio = `${profession}. ${known ? known.charAt(0).toLocaleUpperCase('tr') + known.slice(1) + ' biri olarak bilinir.' : 'Sessiz sedasız çalışan biri.'}`;
  return {
    id: `m${Date.now().toString(36)}${counter.toString(36)}${Math.floor(rng() * 1e6).toString(36)}`,
    name,
    competence: round2(competence),
    loyalty: round2(loyalty),
    honesty: round2(honesty),
    popularity: round2(popularity),
    age,
    profession,
    traits: traits.slice(0, 3),
    bio,
    avatar: {
      skin: Math.floor(rng() * (names === 'tr' ? 4 : 6)),
      hair: Math.floor(rng() * 6),
      hairColor: age > 58 ? 4 + Math.floor(rng() * 2) : Math.floor(rng() * 4),
      suit: Math.floor(rng() * 6),
      tie: Math.floor(rng() * 6),
    },
    ideology: { economic: round2(rng() * 2 - 1), social: round2(rng() * 2 - 1) },
  };
}

export function hasTrait(m: Minister | null | undefined, t: TraitId) {
  return !!m?.traits?.includes(t);
}

/** Özelliklere göre verim çarpanı */
export function traitEfficiency(m: Minister): number {
  let k = 1;
  if (hasTrait(m, 'teknokrat')) k *= 1.1;
  if (hasTrait(m, 'populist')) k *= 0.92;
  if (hasTrait(m, 'hirsli')) k *= 1.05;
  if (hasTrait(m, 'tecrubeli')) k *= 1.08;
  if (hasTrait(m, 'tasarrufcu')) k *= 1.04;
  if (hasTrait(m, 'reformcu')) k *= 1.03;
  return k;
}

function round2(x: number): number {
  return Math.round(x * 100) / 100;
}

/** Bakanın genel puanı (aday karşılaştırma için) */
export function ministerScore(m: Minister): number {
  return (m.competence * 0.55 + m.honesty * 0.25 + m.popularity * 0.1 + m.loyalty * 0.1) * (0.9 + traitEfficiency(m) / 10);
}
