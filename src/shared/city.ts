/**
 * Şehir simülasyonu (Cities: Skylines tarzı): ızgara üzerinde yollar, imar bölgeleri,
 * hizmet binaları, elektrik ve su şebekesi, kapsama alanları, kirlilik, arazi değeri ve talep.
 * Fizik yok; her şey ızgara üzerinde hesaplanır. Saf fonksiyonlar: sunucu ve istemci aynı kodu kullanır.
 */
import type { City, CityService, CoverKind, ServiceId, Town } from './types';

export const CITY_N = 44;

export const ZONES = [
  { id: 0, label: 'İmarsız', short: '', color: '#000000' },
  { id: 1, label: 'Konut', short: 'K', color: '#4caf50' },
  { id: 2, label: 'Ticaret', short: 'T', color: '#2f80ed' },
  { id: 3, label: 'Sanayi', short: 'S', color: '#f2b705' },
  { id: 4, label: 'Ofis', short: 'O', color: '#26c6da' },
] as const;

export const COVER_LABELS: Record<CoverKind, string> = {
  saglik: 'Sağlık',
  polis: 'Güvenlik',
  itfaiye: 'İtfaiye',
  egitim: 'Eğitim',
  park: 'Park ve yeşil alan',
};

export interface ServiceSpec {
  label: string;
  icon: string;
  desc: string;
  size: number;
  /** bin ₺ */
  cost: number;
  /** günlük bakım (bin ₺), bütçe oranıyla çarpılır */
  upkeep: number;
  cover?: CoverKind;
  radius?: number;
  power?: number;
  water?: number;
  pollution?: { r: number; s: number };
  /** Günlük nüfuz katkısı */
  influence?: number;
  /** Suya bitişik olmalı */
  nearWater?: boolean;
  /** Oyuncu kuramaz (başlangıçta gelir) */
  fixed?: boolean;
  category: 'hizmet' | 'altyapi' | 'siyaset';
}

export const SERVICES: Record<ServiceId, ServiceSpec> = {
  belediye: { label: 'Belediye binası', icon: '🏛️', desc: 'Şehrin yönetim merkezi.', size: 3, cost: 0, upkeep: 8, influence: 0.3, fixed: true, category: 'siyaset' },
  saglikOcagi: { label: 'Sağlık ocağı', icon: '🩺', desc: 'Küçük ama ucuz sağlık hizmeti.', size: 2, cost: 1800, upkeep: 10, cover: 'saglik', radius: 7, category: 'hizmet' },
  hastane: { label: 'Devlet hastanesi', icon: '🏥', desc: 'Geniş alana sağlık hizmeti; mahallelerin değerini artırır.', size: 3, cost: 6000, upkeep: 30, cover: 'saglik', radius: 14, category: 'hizmet' },
  polis: { label: 'Karakol', icon: '🚓', desc: 'Suçu azaltır, güvenlik memnuniyeti getirir.', size: 2, cost: 2000, upkeep: 12, cover: 'polis', radius: 9, category: 'hizmet' },
  itfaiye: { label: 'İtfaiye', icon: '🚒', desc: 'Yangınları söndürür; kapsama dışındaki binalar yanabilir.', size: 2, cost: 2000, upkeep: 12, cover: 'itfaiye', radius: 9, category: 'hizmet' },
  okul: { label: 'Okul', icon: '🏫', desc: 'Eğitim, aileleri çeker ve ofis talebini artırır.', size: 2, cost: 2500, upkeep: 14, cover: 'egitim', radius: 8, category: 'hizmet' },
  universite: { label: 'Üniversite', icon: '🎓', desc: 'Geniş eğitim kapsamı; ofis bölgeleri için şart.', size: 3, cost: 9000, upkeep: 40, cover: 'egitim', radius: 16, category: 'hizmet' },
  park: { label: 'Mahalle parkı', icon: '🌳', desc: 'Çevresindeki evlerin değerini artırır.', size: 1, cost: 150, upkeep: 1, cover: 'park', radius: 3, category: 'hizmet' },
  buyukPark: { label: 'Şehir parkı', icon: '🏞️', desc: 'Büyük yeşil alan, geniş etki.', size: 3, cost: 1500, upkeep: 6, cover: 'park', radius: 7, category: 'hizmet' },
  komur: { label: 'Kömür santrali', icon: '🏭', desc: 'Ucuz ve güçlü elektrik, ama çevresini kirletir.', size: 3, cost: 5000, upkeep: 25, power: 400, pollution: { r: 8, s: 0.9 }, category: 'altyapi' },
  gunes: { label: 'Güneş santrali', icon: '☀️', desc: 'Temiz elektrik, pahalı kurulum.', size: 3, cost: 9000, upkeep: 15, power: 260, category: 'altyapi' },
  ruzgar: { label: 'Rüzgâr türbini', icon: '🌬️', desc: 'Küçük ve temiz elektrik.', size: 1, cost: 800, upkeep: 3, power: 40, category: 'altyapi' },
  suPompasi: { label: 'Su pompası', icon: '💧', desc: 'Su kenarına kurulur; şehre su verir.', size: 1, cost: 1200, upkeep: 6, water: 300, nearWater: true, category: 'altyapi' },
  meydan: { label: 'Kent meydanı', icon: '🎪', desc: 'Miting ve halk buluşmaları. Nüfuz kazandırır.', size: 2, cost: 2000, upkeep: 6, influence: 0.3, cover: 'park', radius: 4, category: 'siyaset' },
  basin: { label: 'Basın merkezi', icon: '📡', desc: 'Yerel medya: tanınırlık ve nüfuz.', size: 2, cost: 3000, upkeep: 10, influence: 0.25, category: 'siyaset' },
  parti: { label: 'Parti binası', icon: '🚩', desc: 'Partinin ilçe teşkilatı: nüfuz ve parti içinde yükselme.', size: 2, cost: 2500, upkeep: 8, influence: 0.45, category: 'siyaset' },
};

export const SERVICE_IDS = Object.keys(SERVICES) as ServiceId[];

export const ROAD_COST = 20;
export const BRIDGE_COST = 90;
/** Bölgelerin yola en fazla uzaklığı (Cities: Skylines'taki gibi yol boyunca derinlik) */
export const ZONE_DEPTH = 3;

const POP = [0, 12, 36, 80, 150];
const JOBS: Record<number, number[]> = { 2: [0, 6, 15, 30, 55], 3: [0, 10, 22, 38, 55], 4: [0, 12, 30, 60, 110] };
const POWER_USE = [0, 2, 3, 5, 3];
const WATER_USE = [0, 2, 1.5, 3, 1.5];

export const idx = (c: City, x: number, y: number) => y * c.n + x;
export const inside = (c: City, x: number, y: number) => x >= 0 && y >= 0 && x < c.n && y < c.n;

function hash(i: number, salt = 0) {
  let h = (i * 374761393 + salt * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

// ---------------------------------------------------------------- oluşturma

export function createCity(seed: number): City {
  const n = CITY_N;
  const total = n * n;
  const terrain = new Array<number>(total).fill(0);
  // Haritanın doğusunda kıvrılan bir nehir ve küçük bir göl.
  const phase = (seed % 100) / 16;
  for (let y = 0; y < n; y++) {
    const cx = Math.round(n * 0.74 + Math.sin(y / 6 + phase) * 3.2);
    const w = 2 + (y % 11 < 3 ? 1 : 0);
    for (let x = cx; x < cx + w && x < n; x++) terrain[y * n + x] = 1;
  }
  const lx = Math.round(n * 0.22);
  const ly = Math.round(n * 0.2);
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) if (((x - lx) / 4.2) ** 2 + ((y - ly) / 3) ** 2 < 1) terrain[y * n + x] = 1;
  const city: City = {
    n,
    seed,
    terrain,
    road: new Array<number>(total).fill(0),
    zone: new Array<number>(total).fill(0),
    lvl: new Array<number>(total).fill(0),
    occ: new Array<number>(total).fill(0),
    services: [],
    budget: { tax: [10, 10, 10, 10], power: 1, water: 1, svc: { saglik: 1, polis: 1, itfaiye: 1, egitim: 1, park: 1 } },
    stats: emptyStats(),
  };
  // Otoyol bağlantısı: batı kenarından şehre giren yol.
  const ry = Math.floor(n / 2);
  for (let x = 0; x <= 14; x++) city.road[ry * n + x] = 1;
  for (let y = ry - 4; y <= ry + 4; y++) city.road[y * n + 14] = 1;
  placeService(city, 'belediye', 11, ry + 1, 'belediye-0');
  return city;
}

export function emptyStats(): City['stats'] {
  return {
    pop: 0,
    jobs: 0,
    workers: 0,
    powerProd: 0,
    powerUse: 0,
    waterProd: 0,
    waterUse: 0,
    demand: [0.4, 0.1, 0.25, 0],
    income: [],
    expense: [],
    net: 0,
    happiness: 60,
    buildings: 0,
    roads: 0,
  };
}

// ---------------------------------------------------------------- düzenleme

export function footprint(type: ServiceId, x: number, y: number) {
  const s = SERVICES[type].size;
  const cells: [number, number][] = [];
  for (let dy = 0; dy < s; dy++) for (let dx = 0; dx < s; dx++) cells.push([x + dx, y + dy]);
  return cells;
}

/** Hizmet binası buraya kurulabilir mi? Hata mesajı ya da null. */
export function canPlace(c: City, type: ServiceId, x: number, y: number): string | null {
  const spec = SERVICES[type];
  if (!spec) return 'Bilinmeyen bina.';
  const cells = footprint(type, x, y);
  for (const [cx, cy] of cells) {
    if (!inside(c, cx, cy)) return 'Harita dışına taşıyor.';
    const i = idx(c, cx, cy);
    if (c.terrain[i]) return 'Suyun üstüne bina kurulamaz.';
    if (c.road[i]) return 'Yolun üstüne kurulamaz.';
    if (c.occ[i]) return 'Burada başka bir bina var.';
  }
  let road = false;
  let water = false;
  for (const [cx, cy] of perimeter(cells)) {
    if (!inside(c, cx, cy)) continue;
    const i = idx(c, cx, cy);
    if (c.road[i]) road = true;
    if (c.terrain[i]) water = true;
  }
  if (!road) return 'Binanın yola bitişik olması gerekir.';
  if (spec.nearWater && !water) return 'Su pompası nehir ya da göl kenarına kurulmalı.';
  return null;
}

function perimeter(cells: [number, number][]) {
  const set = new Set(cells.map(([x, y]) => `${x},${y}`));
  const out: [number, number][] = [];
  for (const [x, y] of cells)
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const k = `${x + dx},${y + dy}`;
      if (!set.has(k)) out.push([x + dx, y + dy]);
    }
  return out;
}

export function placeService(c: City, type: ServiceId, x: number, y: number, id: string) {
  const s: CityService = { id, type, x, y };
  c.services.push(s);
  const k = c.services.length;
  for (const [cx, cy] of footprint(type, x, y)) {
    const i = idx(c, cx, cy);
    c.occ[i] = k;
    c.zone[i] = 0;
    c.lvl[i] = 0;
  }
  return s;
}

function reindexOcc(c: City) {
  c.occ.fill(0);
  c.services.forEach((s, k) => {
    for (const [cx, cy] of footprint(s.type, s.x, s.y)) c.occ[idx(c, cx, cy)] = k + 1;
  });
}

/** Yola en fazla ZONE_DEPTH karo uzaklıkta mı? */
export function nearRoad(c: City, x: number, y: number) {
  for (let dy = -ZONE_DEPTH; dy <= ZONE_DEPTH; dy++)
    for (let dx = -ZONE_DEPTH; dx <= ZONE_DEPTH; dx++) {
      if (Math.abs(dx) + Math.abs(dy) > ZONE_DEPTH + 1) continue;
      const nx = x + dx;
      const ny = y + dy;
      if (inside(c, nx, ny) && c.road[idx(c, nx, ny)]) return true;
    }
  return false;
}

export function roadCost(c: City, cells: number[]) {
  return cells.reduce((s, i) => s + (c.road[i] || c.occ[i] ? 0 : c.terrain[i] ? BRIDGE_COST : ROAD_COST), 0);
}

export function paintRoad(c: City, cells: number[]) {
  let built = 0;
  for (const i of cells) {
    if (i < 0 || i >= c.n * c.n || c.road[i] || c.occ[i]) continue;
    c.road[i] = 1;
    c.zone[i] = 0;
    c.lvl[i] = 0;
    built++;
  }
  return built;
}

export function paintZone(c: City, cells: number[], z: number) {
  let n = 0;
  for (const i of cells) {
    if (i < 0 || i >= c.n * c.n) continue;
    const x = i % c.n;
    const y = Math.floor(i / c.n);
    if (c.terrain[i] || c.road[i] || c.occ[i]) continue;
    if (z && !nearRoad(c, x, y)) continue;
    if (c.zone[i] === z) continue;
    c.zone[i] = z;
    c.lvl[i] = 0;
    n++;
  }
  return n;
}

/** Yıkım: yol, bina ya da hizmet. Belediye binası yıkılamaz. Geri dönen para (bin ₺). */
export function bulldoze(c: City, cells: number[]) {
  let refund = 0;
  const kill = new Set<number>();
  for (const i of cells) {
    if (i < 0 || i >= c.n * c.n) continue;
    if (c.occ[i]) {
      const s = c.services[c.occ[i] - 1];
      if (!SERVICES[s.type].fixed) kill.add(c.occ[i] - 1);
      continue;
    }
    if (c.road[i]) {
      // Otoyol girişi korunur.
      if (i % c.n === 0) continue;
      c.road[i] = 0;
      continue;
    }
    c.zone[i] = 0;
    c.lvl[i] = 0;
  }
  if (kill.size) {
    for (const k of kill) refund += SERVICES[c.services[k].type].cost * 0.5;
    c.services = c.services.filter((_, k) => !kill.has(k));
    reindexOcc(c);
  }
  // Yolu kalmayan bölgeler sönümlenir.
  return refund;
}

// ---------------------------------------------------------------- analiz

export interface Analysis {
  /** Yol ağı otoyola bağlı mı (yol karoları) */
  connected: Uint8Array;
  /** Hücre bağlı bir yola bitişik ya da yakın mı */
  access: Uint8Array;
  power: Uint8Array;
  water: Uint8Array;
  cover: Record<CoverKind, Float32Array>;
  pollution: Float32Array;
  /** 0-100 */
  value: Float32Array;
  happy: Float32Array;
}

function bfsRoads(c: City) {
  const n = c.n;
  const seen = new Uint8Array(n * n);
  const q: number[] = [];
  for (let y = 0; y < n; y++) {
    const i = y * n;
    if (c.road[i]) {
      seen[i] = 1;
      q.push(i);
    }
  }
  while (q.length) {
    const i = q.pop()!;
    const x = i % n;
    const y = (i / n) | 0;
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= n || ny >= n) continue;
      const j = ny * n + nx;
      if (c.road[j] && !seen[j]) {
        seen[j] = 1;
        q.push(j);
      }
    }
  }
  return seen;
}

function svcAccess(c: City, s: CityService, connected: Uint8Array) {
  for (const [x, y] of perimeter(footprint(s.type, s.x, s.y))) if (inside(c, x, y) && connected[idx(c, x, y)]) return true;
  return false;
}

export function analyze(c: City): Analysis {
  const n = c.n;
  const N = n * n;
  const connected = bfsRoads(c);
  const access = new Uint8Array(N);
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const i = y * n + x;
      if (!c.zone[i]) continue;
      // En yakın yol 3 karo içinde ve bağlı olmalı.
      let ok = false;
      for (let dy = -ZONE_DEPTH; dy <= ZONE_DEPTH && !ok; dy++)
        for (let dx = -ZONE_DEPTH; dx <= ZONE_DEPTH && !ok; dx++) {
          if (Math.abs(dx) + Math.abs(dy) > ZONE_DEPTH + 1) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && ny >= 0 && nx < n && ny < n && connected[ny * n + nx]) ok = true;
        }
      access[i] = ok ? 1 : 0;
    }
  const live = c.services.filter((s) => svcAccess(c, s, connected));
  const cover = { saglik: new Float32Array(N), polis: new Float32Array(N), itfaiye: new Float32Array(N), egitim: new Float32Array(N), park: new Float32Array(N) };
  const pollution = new Float32Array(N);
  for (const s of live) {
    const spec = SERVICES[s.type];
    const half = (spec.size - 1) / 2;
    const cx = s.x + half;
    const cy = s.y + half;
    if (spec.cover && spec.radius) {
      const b = c.budget.svc[spec.cover] ?? 1;
      const r = spec.radius * Math.sqrt(b);
      const arr = cover[spec.cover];
      for (let y = Math.max(0, Math.floor(cy - r)); y <= Math.min(n - 1, Math.ceil(cy + r)); y++)
        for (let x = Math.max(0, Math.floor(cx - r)); x <= Math.min(n - 1, Math.ceil(cx + r)); x++) {
          const d = Math.hypot(x - cx, y - cy);
          if (d > r) continue;
          const v = Math.min(1, (1 - (d / r) * 0.6) * Math.min(1.2, b));
          const i = y * n + x;
          if (v > arr[i]) arr[i] = v;
        }
    }
    if (spec.pollution) addPollution(pollution, n, cx, cy, spec.pollution.r, spec.pollution.s);
  }
  for (let i = 0; i < N; i++) {
    if (c.zone[i] === 3 && c.lvl[i]) addPollution(pollution, n, i % n, (i / n) | 0, 3, 0.07 * c.lvl[i]);
  }
  for (let i = 0; i < N; i++) pollution[i] = Math.min(1, pollution[i]);

  // Elektrik ve su: üretim yetmezse karolar sırayla karanlıkta kalır.
  const prodPower = live.reduce((s, x) => s + (SERVICES[x.type].power ?? 0), 0);
  const prodWater = live.reduce((s, x) => s + (SERVICES[x.type].water ?? 0), 0);
  const elastic = (p: number) => 1.15 - p * 0.15; // pahalı elektrik tüketimi biraz azaltır
  let usePower = 0;
  let useWater = 0;
  for (let i = 0; i < N; i++) {
    if (!c.zone[i] || !access[i]) continue;
    const L = Math.max(1, c.lvl[i]);
    usePower += POWER_USE[c.zone[i]] * L * elastic(c.budget.power);
    useWater += WATER_USE[c.zone[i]] * L * elastic(c.budget.water);
  }
  const fp = usePower ? Math.min(1, prodPower / usePower) : prodPower > 0 ? 1 : 0;
  const fw = useWater ? Math.min(1, prodWater / useWater) : prodWater > 0 ? 1 : 0;
  const power = new Uint8Array(N);
  const water = new Uint8Array(N);
  for (let i = 0; i < N; i++) {
    if (!c.zone[i] || !access[i]) continue;
    power[i] = hash(i, 1) < fp ? 1 : 0;
    water[i] = hash(i, 2) < fw ? 1 : 0;
  }
  // Arazi değeri ve mutluluk
  const value = new Float32Array(N);
  const happy = new Float32Array(N);
  const [tR, tC, tI, tO] = c.budget.tax;
  const price = (c.budget.power - 1) * 12 + (c.budget.water - 1) * 12;
  for (let i = 0; i < N; i++) {
    if (!c.zone[i]) continue;
    const v =
      38 + cover.saglik[i] * 14 + cover.polis[i] * 10 + cover.egitim[i] * 12 + cover.park[i] * 14 + cover.itfaiye[i] * 6 - pollution[i] * 45 + (c.terrain[i - 1] || c.terrain[i + 1] ? 6 : 0);
    value[i] = Math.max(0, Math.min(100, v));
    const tax = [0, tR, tC, tI, tO][c.zone[i]];
    const h = v + 10 - (tax - 10) * 1.6 - price - (power[i] ? 0 : 22) - (water[i] ? 0 : 22) - (access[i] ? 0 : 30);
    happy[i] = Math.max(0, Math.min(100, h));
  }
  return { connected, access, power, water, cover, pollution, value, happy };
}

function addPollution(arr: Float32Array, n: number, cx: number, cy: number, r: number, s: number) {
  for (let y = Math.max(0, Math.floor(cy - r)); y <= Math.min(n - 1, Math.ceil(cy + r)); y++)
    for (let x = Math.max(0, Math.floor(cx - r)); x <= Math.min(n - 1, Math.ceil(cx + r)); x++) {
      const d = Math.hypot(x - cx, y - cy);
      if (d <= r) arr[y * n + x] += s * (1 - d / r);
    }
}

/** Arazi değerine göre çıkabileceği en yüksek seviye. */
export function levelCap(zone: number, value: number, edu: number) {
  const base = 1 + Math.floor(Math.max(0, value - 30) / 16);
  if (zone === 3) return Math.min(4, Math.max(1, base));
  if (zone === 4) return Math.min(4, Math.max(1, Math.floor(base * (0.5 + edu))));
  return Math.min(4, Math.max(1, base));
}

// ---------------------------------------------------------------- günlük simülasyon

export function simulate(c: City, rng: () => number) {
  const a = analyze(c);
  const n = c.n;
  const N = n * n;
  // Nüfus, işler
  let pop = 0;
  let jobsC = 0;
  let jobsI = 0;
  let jobsO = 0;
  let happySum = 0;
  let eduSum = 0;
  let buildings = 0;
  let roads = 0;
  for (let i = 0; i < N; i++) {
    if (c.road[i]) roads++;
    const z = c.zone[i];
    const L = c.lvl[i];
    if (!z || !L) continue;
    buildings++;
    if (z === 1) {
      pop += POP[L];
      happySum += a.happy[i] * POP[L];
      eduSum += a.cover.egitim[i] * POP[L];
    } else if (z === 2) jobsC += JOBS[2][L];
    else if (z === 3) jobsI += JOBS[3][L];
    else jobsO += JOBS[4][L];
  }
  const jobs = jobsC + jobsI + jobsO;
  const workers = pop * 0.55;
  const edu = pop ? eduSum / pop : 0;
  const [tR, tC, tI, tO] = c.budget.tax;
  const util = (c.budget.power - 1) * 0.25 + (c.budget.water - 1) * 0.25;
  const clampD = (x: number) => Math.max(-1, Math.min(1, x));
  const demand: [number, number, number, number] = [
    clampD(0.35 + (jobs - workers * 0.8) / (workers + 300) - (tR - 10) * 0.04 - util),
    clampD(0.1 + (pop * 0.15 - jobsC) / (pop * 0.15 + 60) - (tC - 10) * 0.04),
    clampD(0.25 + (workers - jobs) / (workers + 300) - (tI - 10) * 0.04),
    clampD(edu * 1.2 * ((pop * 0.1 - jobsO) / (pop * 0.1 + 80)) - (tO - 10) * 0.04 - (edu < 0.25 ? 0.3 : 0)),
  ];
  // Büyüme ve terk
  for (let i = 0; i < N; i++) {
    const z = c.zone[i];
    if (!z) continue;
    const L = c.lvl[i];
    const d = demand[z - 1];
    if (!a.access[i]) {
      if (L && rng() < 0.02) c.lvl[i] = L - 1;
      continue;
    }
    // Elektrik ya da su yoksa ilk evler yine kurulur ama büyümez, zamanla terk edilir.
    if (!a.power[i] || !a.water[i]) {
      if (L === 0 && d > 0 && rng() < 0.03 * d) c.lvl[i] = 1;
      else if (L && rng() < 0.006) c.lvl[i] = L - 1;
      continue;
    }
    const cap = levelCap(z, a.value[i], a.cover.egitim[i]);
    if (L === 0) {
      if (d > 0 && rng() < 0.08 * d) c.lvl[i] = 1;
    } else if (L < cap) {
      if (d > -0.2 && rng() < 0.012 * (1 + d)) c.lvl[i] = L + 1;
    } else if (L > cap || (z === 1 && a.happy[i] < 25) || d < -0.6) {
      if (rng() < 0.01) c.lvl[i] = L - 1;
    }
  }
  // Ekonomi (bin ₺ / gün)
  const usePower = sumUse(c, a, POWER_USE, c.budget.power);
  const useWater = sumUse(c, a, WATER_USE, c.budget.water);
  const live = c.services.filter((s) => svcAccess(c, s, a.connected));
  const powerProd = live.reduce((s, x) => s + (SERVICES[x.type].power ?? 0), 0);
  const waterProd = live.reduce((s, x) => s + (SERVICES[x.type].water ?? 0), 0);
  const income = [
    { label: 'Konut vergisi', value: pop * tR * 0.006 },
    { label: 'Ticaret vergisi', value: jobsC * tC * 0.009 },
    { label: 'Sanayi vergisi', value: jobsI * tI * 0.009 },
    { label: 'Ofis vergisi', value: jobsO * tO * 0.011 },
    { label: 'Elektrik satışı', value: Math.min(usePower, powerProd) * c.budget.power * 0.05 },
    { label: 'Su satışı', value: Math.min(useWater, waterProd) * c.budget.water * 0.04 },
  ];
  const svcCost: Record<string, number> = {};
  for (const s of c.services) {
    const spec = SERVICES[s.type];
    const b = spec.cover ? c.budget.svc[spec.cover] ?? 1 : 1;
    const key = spec.cover ? COVER_LABELS[spec.cover] : spec.power ? 'Elektrik' : spec.water ? 'Su' : 'Yönetim ve siyaset';
    svcCost[key] = (svcCost[key] ?? 0) + spec.upkeep * b;
  }
  const expense = [...Object.entries(svcCost).map(([label, value]) => ({ label, value })), { label: 'Yol bakımı', value: roads * 0.12 }];
  const net = income.reduce((s, x) => s + x.value, 0) - expense.reduce((s, x) => s + x.value, 0);
  c.stats = {
    pop,
    jobs,
    workers,
    powerProd,
    powerUse: usePower,
    waterProd,
    waterUse: useWater,
    demand,
    income,
    expense,
    net,
    happiness: pop ? happySum / pop : 60,
    buildings,
    roads,
  };
  return a;
}

function sumUse(c: City, a: Analysis, table: number[], price: number) {
  let s = 0;
  for (let i = 0; i < c.n * c.n; i++) if (c.zone[i] && a.access[i]) s += table[c.zone[i]] * Math.max(1, c.lvl[i]) * (1.15 - price * 0.15);
  return s;
}

export function countServices(c: City, type: ServiceId) {
  return c.services.filter((s) => s.type === type).length;
}

export function zoneCount(c: City, z: number, minLevel = 1) {
  let k = 0;
  for (let i = 0; i < c.zone.length; i++) if (c.zone[i] === z && c.lvl[i] >= minLevel) k++;
  return k;
}

/** Kapsama dışındaki bir binayı seçer (yangın ve suç olayları için). */
export function uncoveredBuilding(c: City, a: Analysis, kind: CoverKind, rng: () => number) {
  const list: number[] = [];
  for (let i = 0; i < c.zone.length; i++) if (c.lvl[i] >= 1 && a.cover[kind][i] < 0.2) list.push(i);
  return list.length ? list[Math.floor(rng() * list.length)] : -1;
}

/** Yol ağında BFS ile en kısa yol (karo dizisi). */
export function roadPath(c: City, from: number, to: number): number[] | null {
  const n = c.n;
  const prev = new Int32Array(n * n).fill(-1);
  prev[from] = from;
  const q = [from];
  for (let h = 0; h < q.length; h++) {
    const i = q[h];
    if (i === to) break;
    const x = i % n;
    const y = (i / n) | 0;
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= n || ny >= n) continue;
      const j = ny * n + nx;
      if (c.road[j] && prev[j] < 0) {
        prev[j] = i;
        q.push(j);
      }
    }
  }
  if (prev[to] < 0) return null;
  const path = [to];
  while (path[path.length - 1] !== from) path.push(prev[path[path.length - 1]]);
  return path.reverse();
}

/** Bir bölge karosuna en yakın yol karosu. */
export function nearestRoad(c: City, i: number) {
  const n = c.n;
  const x = i % n;
  const y = (i / n) | 0;
  for (let r = 1; r <= ZONE_DEPTH + 1; r++)
    for (let dy = -r; dy <= r; dy++)
      for (let dx = -r; dx <= r; dx++) {
        if (Math.abs(dx) + Math.abs(dy) !== r) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (inside(c, nx, ny) && c.road[ny * n + nx]) return ny * n + nx;
      }
  return -1;
}

/** Eski (arsalı) kayıtları yeni ızgara şehre taşır. */
export function ensureCity(t: Town) {
  if (t.city) return;
  const legacy = t as Town & { slots?: unknown; construction?: unknown; materials?: number; tax?: unknown };
  delete legacy.slots;
  delete legacy.construction;
  delete legacy.materials;
  delete legacy.tax;
  let seed = 0;
  for (const ch of t.provinceId) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  t.city = createCity(seed);
  t.money = Math.max(t.money, 20000);
  t.pop = 0;
}
