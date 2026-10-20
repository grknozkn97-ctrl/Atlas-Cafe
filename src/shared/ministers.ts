import type { Minister } from './types';

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

export function generateMinister(rng: Rng, names: 'tr' | 'genel', quality = 0): Minister {
  const first = names === 'tr' ? TR_FIRST : GEN_FIRST;
  const last = names === 'tr' ? TR_LAST : GEN_LAST;
  // Yetkin adaylar her zaman sadık değildir: yetkinlik ile sadakat arasında hafif ters ilişki var.
  const competence = clamp01(0.25 + rng() * 0.6 + quality);
  const loyalty = clamp01(0.85 - competence * 0.35 + (rng() - 0.5) * 0.5);
  const honesty = clamp01(0.3 + rng() * 0.65);
  const popularity = clamp01(0.2 + rng() * 0.7);
  counter += 1;
  return {
    id: `m${Date.now().toString(36)}${counter.toString(36)}${Math.floor(rng() * 1e6).toString(36)}`,
    name: `${pick(rng, first)} ${pick(rng, last)}`,
    competence: round2(competence),
    loyalty: round2(loyalty),
    honesty: round2(honesty),
    popularity: round2(popularity),
  };
}

function round2(x: number): number {
  return Math.round(x * 100) / 100;
}

/** Bakanın genel puanı (aday karşılaştırma için) */
export function ministerScore(m: Minister): number {
  return m.competence * 0.55 + m.honesty * 0.25 + m.popularity * 0.1 + m.loyalty * 0.1;
}
