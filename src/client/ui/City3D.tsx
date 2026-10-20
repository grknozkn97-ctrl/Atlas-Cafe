import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { development, housingRatio } from '../../shared/local';
import type { CountryState, Province } from '../../shared/types';
import { eraOf } from './ProvinceMap';
import { Skyline } from './Skyline';

type Era = 'eski' | 'beton' | 'modern';

function seeded(seed: string) {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

export function isNight() {
  const t = document.documentElement.dataset.theme;
  if (t) return t === 'dark';
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
}

function webglOk() {
  try {
    const cv = document.createElement('canvas');
    return !!(cv.getContext('webgl2') || cv.getContext('webgl'));
  } catch {
    return false;
  }
}

/** Pencere dokusu: 2 sütun × 2 kat. Gece için ayrı ışık dokusu (yalnızca bazı pencereler yanar). */
function windowTextures(era: Era, night: boolean, seed: number) {
  const make = (lit: boolean) => {
    const cv = document.createElement('canvas');
    cv.width = 64;
    cv.height = 64;
    const g = cv.getContext('2d')!;
    const wall = { eski: '#b98a5e', beton: '#cfc8b8', modern: '#7fa6c4' }[era];
    g.fillStyle = lit ? '#000' : wall;
    g.fillRect(0, 0, 64, 64);
    for (let cx = 0; cx < 2; cx++) {
      for (let cy = 0; cy < 2; cy++) {
        const on = ((seed * 7 + cx * 3 + cy * 5) % 5) < 2;
        const x = cx * 32;
        const y = cy * 32;
        if (era === 'modern') {
          g.fillStyle = lit ? (on ? '#ffe0a0' : '#000') : '#a9d3ef';
          g.fillRect(x + 2, y + 6, 28, 18);
          if (!lit) {
            g.fillStyle = 'rgba(255,255,255,0.28)';
            g.fillRect(x + 2, y + 6, 28, 4);
          }
        } else {
          g.fillStyle = lit ? (on ? '#ffcf6b' : '#000') : era === 'eski' ? '#4b3a2c' : '#4f5a66';
          g.fillRect(x + 5, y + 9, 8, 12);
          g.fillRect(x + 19, y + 9, 8, 12);
        }
      }
    }
    const tex = new THREE.CanvasTexture(cv);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.magFilter = THREE.NearestFilter;
    return tex;
  };
  return { map: make(false), glow: night ? make(true) : null };
}

interface Built {
  scene: THREE.Scene;
  update: (dt: number) => void;
  dispose: () => void;
  radius: number;
}

/** Şehri prosedürel olarak kurar: bloklar, yollar, binalar, ağaçlar, trafik, metro, fabrika dumanı, vinçler. */
function buildCity(c: CountryState, pv: Province, night: boolean): Built {
  const rnd = seeded(pv.id + ':3d');
  const dev = development(c, pv);
  const ratio = housingRatio(pv);
  const t = Math.min(1, Math.max(0, (Math.log10(pv.pop * 1e6) - 4.6) / 2.6));
  const scene = new THREE.Scene();
  const disposables: { dispose: () => void }[] = [];
  const keep = <T extends { dispose: () => void }>(x: T) => (disposables.push(x), x);

  const sky = night ? new THREE.Color('#0b1428') : new THREE.Color(dev > 0.3 ? '#b9d8ee' : '#d9cfb5');
  scene.background = sky;
  scene.fog = new THREE.Fog(sky, 60, 240);

  // Işık
  scene.add(new THREE.HemisphereLight(night ? 0x6a7fae : 0xffffff, night ? 0x2a2a30 : 0x8a7a5a, night ? 0.9 : 1.1));
  const sun = new THREE.DirectionalLight(night ? 0x9fb0e0 : 0xfff1d6, night ? 0.7 : 1.6);
  sun.position.set(60, 90, 40);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  const sc = sun.shadow.camera as THREE.OrthographicCamera;
  sc.left = sc.bottom = -90;
  sc.right = sc.top = 90;
  sc.far = 300;
  scene.add(sun);

  // Izgara
  const target = Math.round(Math.min(420, Math.max(26, 18 + Math.sqrt(pv.houses) / 12)));
  const N = Math.max(3, Math.ceil(Math.sqrt(target / 4)));
  const BLOCK = 10;
  const ROAD = 3.2;
  const STEP = BLOCK + ROAD;
  const half = (N * STEP) / 2;
  const radius = half + 10;

  const groundColor = dev > 0.55 ? '#5f7d4e' : dev > 0.3 ? '#8c8a6a' : '#a89270';
  const ground = new THREE.Mesh(keep(new THREE.PlaneGeometry(radius * 6, radius * 6)), keep(new THREE.MeshStandardMaterial({ color: groundColor, roughness: 1 })));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const asphalt = keep(new THREE.MeshStandardMaterial({ color: dev > 0.3 ? '#3a3d42' : '#7b6c58', roughness: 0.95 }));
  const roadGeo = keep(new THREE.PlaneGeometry(1, 1));
  for (let i = 0; i <= N; i++) {
    const p = -half + i * STEP - ROAD / 2;
    for (const horizontal of [true, false]) {
      const m = new THREE.Mesh(roadGeo, asphalt);
      m.rotation.x = -Math.PI / 2;
      if (horizontal) {
        m.scale.set(N * STEP + ROAD, ROAD, 1);
        m.position.set(0, 0.02, p + ROAD / 2);
      } else {
        m.scale.set(ROAD, N * STEP + ROAD, 1);
        m.position.set(p + ROAD / 2, 0.021, 0);
      }
      m.receiveShadow = true;
      scene.add(m);
    }
  }
  // Şerit çizgileri (gelişmiş şehirlerde)
  if (dev > 0.3) {
    const lineMat = keep(new THREE.MeshBasicMaterial({ color: night ? '#a08a4a' : '#e9e2c8' }));
    for (let i = 0; i <= N; i++) {
      const p = -half + i * STEP;
      for (const horizontal of [true, false]) {
        const m = new THREE.Mesh(roadGeo, lineMat);
        m.rotation.x = -Math.PI / 2;
        if (horizontal) {
          m.scale.set(N * STEP, 0.15, 1);
          m.position.set(0, 0.03, p);
        } else {
          m.scale.set(0.15, N * STEP, 1);
          m.position.set(p, 0.031, 0);
        }
        scene.add(m);
      }
    }
  }

  // Binalar
  const box = keep(new THREE.BoxGeometry(1, 1, 1));
  box.translate(0, 0.5, 0);
  const texCache = new Map<string, THREE.MeshStandardMaterial[]>();
  const materialFor = (era: Era, floors: number, width: number) => {
    const fy = Math.max(1, Math.round(floors));
    const fx = Math.max(1, Math.round(width / 1.6));
    const key = `${era}:${fy}:${fx}`;
    let mats = texCache.get(key);
    if (!mats) {
      const { map: side, glow } = windowTextures(era, night, fy * 13 + fx);
      side.repeat.set(fx / 2, fy / 2);
      glow?.repeat.set(fx / 2, fy / 2);
      keep(side);
      if (glow) keep(glow);
      const sideMat = keep(
        new THREE.MeshStandardMaterial({
          map: side,
          roughness: era === 'modern' ? 0.25 : 0.9,
          metalness: era === 'modern' ? 0.45 : 0,
          emissive: new THREE.Color(glow ? '#ffffff' : '#000000'),
          emissiveMap: glow,
          emissiveIntensity: glow ? 1.1 : 0,
        }),
      );
      const roof = keep(new THREE.MeshStandardMaterial({ color: era === 'eski' ? '#8a5a3c' : era === 'beton' ? '#9a958a' : '#5d6d7c', roughness: 0.9 }));
      mats = [sideMat, sideMat, roof, roof, sideMat, sideMat];
      texCache.set(key, mats);
    }
    return mats;
  };
  const roofGeo = keep(new THREE.ConeGeometry(0.75, 0.6, 4));
  roofGeo.rotateY(Math.PI / 4);
  const roofMat = keep(new THREE.MeshStandardMaterial({ color: '#a8432c', roughness: 0.8 }));
  const tankMat = keep(new THREE.MeshStandardMaterial({ color: '#d9d9d9', roughness: 0.6 }));
  const tankGeo = keep(new THREE.CylinderGeometry(0.4, 0.4, 0.8, 8));
  const FLOOR = 0.9;
  const parkBlocks = new Set<number>();
  const parks = Math.min(N * N - 1, pv.built.park + (dev > 0.5 ? 2 : 0));
  while (parkBlocks.size < parks) parkBlocks.add(Math.floor(rnd() * N * N));

  let count = 0;
  const fill = Math.min(1, (target * 1.1) / (N * N * 7));
  for (let bx = 0; bx < N; bx++) {
    for (let bz = 0; bz < N; bz++) {
      const id = bx * N + bz;
      const cx = -half + bx * STEP + BLOCK / 2;
      const cz = -half + bz * STEP + BLOCK / 2;
      if (parkBlocks.has(id)) {
        const g = new THREE.Mesh(roadGeo, keep(new THREE.MeshStandardMaterial({ color: '#4f8f45', roughness: 1 })));
        g.rotation.x = -Math.PI / 2;
        g.scale.set(BLOCK, BLOCK, 1);
        g.position.set(cx, 0.04, cz);
        g.receiveShadow = true;
        scene.add(g);
        continue;
      }
      const dist = Math.hypot(cx, cz) / half;
      const central = Math.max(0, 1 - dist);
      const lots = central > 0.5 && t > 0.5 ? 2 : 3;
      const lot = BLOCK / lots;
      for (let lx = 0; lx < lots; lx++) {
        for (let lz = 0; lz < lots; lz++) {
          // Hedef bina sayısına göre doluluk: merkez dolu, çeper seyrek.
          if (rnd() > fill * (1.25 - dist * 0.5)) continue;
          const v = dev + (central - 0.5) * 0.3 + (rnd() - 0.5) * 0.35;
          const era = eraOf(v);
          const w = lot * (0.55 + rnd() * 0.35);
          const d = lot * (0.55 + rnd() * 0.35);
          const maxF = era === 'modern' ? 6 + 40 * t * t * (pv.urban / 100) : era === 'beton' ? 4 + 10 * t : 2;
          const floors = Math.max(1, Math.round((era === 'eski' ? 1 + rnd() * 2.5 : maxF * (0.25 + Math.pow(central, 1.6) * 0.75) * (0.5 + rnd() * 0.7))));
          const m = new THREE.Mesh(box, materialFor(era, floors, w));
          m.scale.set(w, floors * FLOOR, d);
          m.position.set(-half + bx * STEP + (lx + 0.5) * lot, 0, -half + bz * STEP + (lz + 0.5) * lot);
          m.castShadow = floors > 2;
          m.receiveShadow = true;
          scene.add(m);
          if (era === 'eski' && floors <= 3) {
            const r = new THREE.Mesh(roofGeo, roofMat);
            r.scale.set(w * 0.95, 1, d * 0.95);
            r.position.set(m.position.x, floors * FLOOR + 0.3, m.position.z);
            r.castShadow = true;
            scene.add(r);
          } else if (era === 'beton' && rnd() < 0.5) {
            const tk = new THREE.Mesh(tankGeo, tankMat);
            tk.position.set(m.position.x + w * 0.2, floors * FLOOR + 0.4, m.position.z);
            scene.add(tk);
          }
          count++;
        }
      }
    }
  }

  // Gecekondular: konut açığı varsa şehrin çeperinde
  if (ratio < 1) {
    const shackMat = keep(new THREE.MeshStandardMaterial({ color: '#8c7a66', roughness: 1 }));
    const tin = keep(new THREE.MeshStandardMaterial({ color: '#9aa1a6', roughness: 0.5, metalness: 0.4 }));
    const n = Math.round((1 - ratio) * 240);
    for (let i = 0; i < n; i++) {
      const a = rnd() * Math.PI * 2;
      const r = half + 3 + rnd() * 16;
      const s = new THREE.Mesh(box, shackMat);
      s.scale.set(1.2 + rnd(), 0.9 + rnd() * 0.5, 1.2 + rnd());
      s.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
      s.rotation.y = rnd() * Math.PI;
      s.castShadow = true;
      scene.add(s);
      const roof = new THREE.Mesh(box, tin);
      roof.scale.set(s.scale.x * 1.1, 0.08, s.scale.z * 1.1);
      roof.position.set(s.position.x, s.scale.y, s.position.z);
      roof.rotation.copy(s.rotation);
      scene.add(roof);
    }
  }

  // Ağaçlar (instanced)
  const treeCount = Math.round(40 + dev * 160 + pv.built.park * 50);
  const trunk = new THREE.InstancedMesh(keep(new THREE.CylinderGeometry(0.12, 0.15, 1, 5)), keep(new THREE.MeshStandardMaterial({ color: '#6b4e2e' })), treeCount);
  const crown = new THREE.InstancedMesh(keep(new THREE.IcosahedronGeometry(0.8, 0)), keep(new THREE.MeshStandardMaterial({ color: dev > 0.3 ? '#3f8f4f' : '#7a8a45', flatShading: true })), treeCount);
  const mtx = new THREE.Matrix4();
  for (let i = 0; i < treeCount; i++) {
    let x: number;
    let z: number;
    if (parkBlocks.size && i < pv.built.park * 50 + 30) {
      const ids = [...parkBlocks];
      const id = ids[i % ids.length];
      x = -half + Math.floor(id / N) * STEP + 1 + rnd() * (BLOCK - 2);
      z = -half + (id % N) * STEP + 1 + rnd() * (BLOCK - 2);
    } else {
      const a = rnd() * Math.PI * 2;
      const r = half + 2 + rnd() * 30;
      x = Math.cos(a) * r;
      z = Math.sin(a) * r;
    }
    const s = 0.8 + rnd() * 0.7;
    mtx.compose(new THREE.Vector3(x, 0.5 * s, z), new THREE.Quaternion(), new THREE.Vector3(s, s, s));
    trunk.setMatrixAt(i, mtx);
    mtx.compose(new THREE.Vector3(x, 1.4 * s, z), new THREE.Quaternion(), new THREE.Vector3(s, s, s));
    crown.setMatrixAt(i, mtx);
  }
  crown.castShadow = true;
  scene.add(trunk, crown);

  const updaters: ((dt: number, time: number) => void)[] = [];

  // Trafik: her araç bir yolda ilerler, öndeki araca yaklaşınca yavaşlar (basit takip modeli).
  const carCount = Math.round(Math.min(220, 12 + pv.pop * 14 + dev * 60));
  const carGeo = keep(new THREE.BoxGeometry(1.1, 0.5, 0.55));
  carGeo.translate(0, 0.3, 0);
  const cars = new THREE.InstancedMesh(carGeo, keep(new THREE.MeshStandardMaterial({ roughness: 0.4, metalness: 0.3 })), carCount);
  const palette = ['#c92a2a', '#f2f2f2', '#1c7ed6', '#2b2b2e', '#f59f00', '#868e96'];
  const lanes: { horizontal: boolean; p: number; dir: number }[] = [];
  for (let i = 0; i <= N; i++) {
    const p = -half + i * STEP;
    lanes.push({ horizontal: true, p: p - 0.8, dir: 1 }, { horizontal: true, p: p + 0.8, dir: -1 });
    lanes.push({ horizontal: false, p: p - 0.8, dir: -1 }, { horizontal: false, p: p + 0.8, dir: 1 });
  }
  const span = N * STEP;
  const carState = Array.from({ length: carCount }, (_, i) => {
    const lane = lanes[i % lanes.length];
    return { lane, s: rnd() * span, v: 4 + rnd() * 4, vmax: (dev > 0.3 ? 8 : 5) + rnd() * 4 };
  });
  carState.forEach((_, i) => cars.setColorAt(i, new THREE.Color(palette[i % palette.length])));
  const quatH = new THREE.Quaternion();
  const quatV = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);
  updaters.push((dt) => {
    // Şeritteki araçları sırala ve takip mesafesine göre hızlandır/yavaşlat.
    const byLane = new Map<(typeof lanes)[number], typeof carState>();
    for (const car of carState) {
      const l = byLane.get(car.lane) ?? [];
      l.push(car);
      byLane.set(car.lane, l);
    }
    for (const list of byLane.values()) {
      list.sort((a, b) => a.s - b.s);
      for (let i = 0; i < list.length; i++) {
        const car = list[i];
        const ahead = list[(i + 1) % list.length];
        let gap = ahead.s - car.s;
        if (gap <= 0) gap += span;
        const desired = Math.min(car.vmax, Math.max(0, (gap - 1.8) * 1.6));
        car.v += Math.max(-12, Math.min(4, (desired - car.v) * 2)) * dt;
        car.v = Math.max(0, car.v);
      }
    }
    carState.forEach((car, i) => {
      car.s = (car.s + car.v * dt) % span;
      const along = -half + (car.lane.dir > 0 ? car.s : span - car.s);
      const pos = car.lane.horizontal ? new THREE.Vector3(along, 0, car.lane.p) : new THREE.Vector3(car.lane.p, 0, along);
      const q = (car.lane.horizontal ? quatH : quatV).clone();
      if (car.lane.dir < 0) q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI));
      mtx.compose(pos, q, new THREE.Vector3(1, 1, 1));
      cars.setMatrixAt(i, mtx);
    });
    cars.instanceMatrix.needsUpdate = true;
  });
  cars.castShadow = true;
  scene.add(cars);

  // Metro: yükseltilmiş hat ve giden tren
  if (pv.built.metro > 0) {
    const railMat = keep(new THREE.MeshStandardMaterial({ color: '#7d8590' }));
    const rail = new THREE.Mesh(box, railMat);
    rail.scale.set(span + 30, 0.4, 1.6);
    rail.position.set(0, 5, -half + STEP * Math.floor(N / 2) - ROAD / 2);
    scene.add(rail);
    for (let i = -span / 2 - 10; i < span / 2 + 15; i += 12) {
      const pil = new THREE.Mesh(box, railMat);
      pil.scale.set(0.6, 5, 0.6);
      pil.position.set(i, 0, rail.position.z);
      scene.add(pil);
    }
    const train = new THREE.Mesh(box, keep(new THREE.MeshStandardMaterial({ color: '#c92a2a', emissive: night ? '#ff8866' : '#000', emissiveIntensity: 0.4 })));
    train.scale.set(9, 1.3, 1.3);
    train.castShadow = true;
    scene.add(train);
    updaters.push((_, time) => {
      train.position.set(((time * 9) % (span + 40)) - (span + 40) / 2, 5.4, rail.position.z);
    });
  }

  // Sanayi: fabrikalar ve yükselen duman parçacıkları
  if (pv.built.sanayi > 0 || pv.jobs > 60) {
    const fx = half + 14;
    const factoryMat = keep(new THREE.MeshStandardMaterial({ color: '#6b6f76', roughness: 0.8 }));
    const stackMat = keep(new THREE.MeshStandardMaterial({ color: '#8a4a3a' }));
    const smokeGeo = keep(new THREE.SphereGeometry(1, 8, 6));
    const smokeMat = keep(new THREE.MeshStandardMaterial({ color: '#d0d0d0', transparent: true, opacity: 0.5, depthWrite: false }));
    const smoke: { m: THREE.Mesh; life: number; ox: number }[] = [];
    for (let f = 0; f < Math.max(1, pv.built.sanayi); f++) {
      const hall = new THREE.Mesh(box, factoryMat);
      hall.scale.set(10, 4, 7);
      hall.position.set(fx + f * 12, 0, -half / 2);
      hall.castShadow = true;
      scene.add(hall);
      const stack = new THREE.Mesh(keep(new THREE.CylinderGeometry(0.5, 0.7, 9, 8)), stackMat);
      stack.position.set(hall.position.x + 3, 4.5, hall.position.z);
      scene.add(stack);
      for (let i = 0; i < 10; i++) {
        const m = new THREE.Mesh(smokeGeo, smokeMat);
        scene.add(m);
        smoke.push({ m, life: i / 10, ox: stack.position.x });
      }
    }
    updaters.push((dt) => {
      for (const p of smoke) {
        p.life = (p.life + dt * 0.18) % 1;
        const s = 0.6 + p.life * 2.2;
        p.m.scale.set(s, s, s);
        p.m.position.set(p.ox + p.life * 6, 9 + p.life * 14, -half / 2 + Math.sin(p.life * 6) * 0.8);
      }
      smokeMat.opacity = 0.45;
    });
  }

  // Süren projeler: dönen kule vinçler
  pv.projects.forEach((_, i) => {
    const crane = new THREE.Group();
    const yellow = keep(new THREE.MeshStandardMaterial({ color: '#e8a317' }));
    const mast = new THREE.Mesh(box, yellow);
    mast.scale.set(0.6, 22, 0.6);
    crane.add(mast);
    const jib = new THREE.Group();
    const arm = new THREE.Mesh(box, yellow);
    arm.scale.set(16, 0.5, 0.5);
    arm.position.set(5, 21.5, 0);
    jib.add(arm);
    crane.add(jib);
    crane.position.set(-half / 2 + i * 14, 0, half / 3);
    scene.add(crane);
    updaters.push((_, time) => (jib.rotation.y = time * 0.25 + i));
  });

  // Gece sokak lambaları
  if (night && dev > 0.25) {
    const lamp = new THREE.PointLight('#ffd27a', 1.4, 40, 1.5);
    lamp.position.set(0, 12, 0);
    scene.add(lamp);
  }

  let time = 0;
  return {
    scene,
    radius,
    update: (dt) => {
      time += dt;
      for (const u of updaters) u(dt, time);
    },
    dispose: () => {
      for (const d of disposables) d.dispose();
      for (const mats of texCache.values()) mats.forEach((m) => m.dispose());
    },
  };
}

/** Etkileşimli 3B şehir görünümü. WebGL yoksa 2B siluete düşer. */
export function City3D({ c, pv }: { c: CountryState; pv: Province }) {
  const host = useRef<HTMLDivElement>(null);
  const [ok] = useState(webglOk);
  const key = [
    pv.id,
    Math.round(Math.sqrt(pv.houses)),
    eraOf(development(c, pv)),
    pv.built.park,
    pv.built.metro,
    pv.built.sanayi,
    pv.projects.length,
    Math.round(housingRatio(pv) * 20),
  ].join(':');
  const pvRef = useRef(pv);
  pvRef.current = pv;

  useEffect(() => {
    if (!ok || !host.current) return;
    const el = host.current;
    const night = isNight();
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.shadowMap.enabled = window.innerWidth > 700;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    el.appendChild(renderer.domElement);
    const city = buildCity(c, pvRef.current, night);
    const camera = new THREE.PerspectiveCamera(45, 1, 0.5, 800);
    const r = city.radius;
    camera.position.set(r * 1.1, r * 0.9, r * 1.1);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.6;
    controls.maxPolarAngle = Math.PI * 0.46;
    controls.minDistance = 15;
    controls.maxDistance = r * 3.2;
    controls.target.set(0, 4, 0);
    controls.addEventListener('start', () => (controls.autoRotate = false));

    const resize = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      renderer.setSize(w, h, false);
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      camera.aspect = w / Math.max(1, h);
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(el);
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!visible || document.hidden) return;
      city.update(dt);
      controls.update();
      renderer.render(city.scene, camera);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      controls.dispose();
      city.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [ok, key]);

  if (!ok) return <Skyline pv={pv} />;
  return (
    <div className="city3d" ref={host} aria-label={`${pv.name} 3B şehir görünümü`}>
      <div className="city3d-hint small">Döndürmek için sürükle, yakınlaşmak için kaydır</div>
    </div>
  );
}
