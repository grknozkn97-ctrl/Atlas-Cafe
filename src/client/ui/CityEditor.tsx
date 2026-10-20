/**
 * Cities: Skylines tarzı 3B şehir editörü: three.js sahnesi, kamera, karo seçme,
 * yol çizme, bölge boyama, bina yerleştirme, katmanlar ve yol bulan trafik.
 * Simülasyon `shared/city.ts` içinde; bu dosya yalnızca çizer ve oyuncu girdisini toplar.
 */
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { MapControls } from 'three/addons/controls/MapControls.js';
import { SERVICES, ZONES, ZONE_DEPTH, canPlace, footprint, idx, inside, nearRoad, roadCost, roadPath, type Analysis } from '../../shared/city';
import type { City, CoverKind, ServiceId } from '../../shared/types';

export type Tool = { kind: 'inspect' } | { kind: 'road' } | { kind: 'zone'; zone: number } | { kind: 'bulldoze' } | { kind: 'place'; service: ServiceId };
export type Overlay = null | 'power' | 'water' | 'pollution' | 'value' | 'happy' | CoverKind;

export interface EditorEvents {
  paint: (tool: 'road' | 'zone' | 'bulldoze', cells: number[], zone?: number) => void;
  place: (s: ServiceId, x: number, y: number) => void;
  inspect: (cell: number | null) => void;
  hint: (text: string | null, bad?: boolean) => void;
}

const PX = 32; // zemin dokusunda karo başına piksel

function hash(i: number, salt = 0) {
  let h = (i * 374761393 + salt * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

// ---------------------------------------------------------------- dokular

function windowTexture(kind: number, lit: boolean) {
  const cv = document.createElement('canvas');
  cv.width = 64;
  cv.height = 64;
  const g = cv.getContext('2d')!;
  g.fillStyle = lit ? '#000' : '#fff';
  g.fillRect(0, 0, 64, 64);
  const glass = kind === 2 || kind === 4;
  for (let y = 0; y < 2; y++)
    for (let x = 0; x < 2; x++) {
      if (lit) g.fillStyle = (x + y * 3 + kind) % 3 === 0 ? '#000' : '#ffd27a';
      else g.fillStyle = glass ? '#5a7fa8' : '#3d4b5c';
      if (glass) g.fillRect(x * 32 + 2, y * 32 + 6, 28, 22);
      else g.fillRect(x * 32 + 8, y * 32 + 8, 16, 18);
    }
  const t = new THREE.CanvasTexture(cv);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function glowTexture(color: string) {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 64;
  const g = cv.getContext('2d')!;
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, color);
  gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(cv);
}

function iconTexture(emoji: string, bg: string) {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 64;
  const g = cv.getContext('2d')!;
  g.fillStyle = bg;
  g.beginPath();
  g.arc(32, 32, 28, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = '#fff';
  g.lineWidth = 4;
  g.stroke();
  g.font = '34px sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(emoji, 32, 35);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// ---------------------------------------------------------------- bina ölçüleri

/** [genişlik, yükseklik] bölge ve seviyeye göre */
const SHAPES: Record<number, [number, number][]> = {
  1: [[0, 0], [0.62, 0.42], [0.74, 0.62], [0.82, 1.5], [0.8, 3.1]],
  2: [[0, 0], [0.82, 0.45], [0.86, 0.85], [0.88, 1.8], [0.86, 3]],
  3: [[0, 0], [0.86, 0.5], [0.92, 0.75], [0.92, 0.95], [0.94, 1.25]],
  4: [[0, 0], [0.74, 1.2], [0.78, 2.2], [0.8, 3.6], [0.78, 5.2]],
};

const PALETTE: Record<number, string[]> = {
  1: ['#f4e3c1', '#e9c9a0', '#f1d9d0', '#dfe6d3', '#f6efe2', '#e8d2b0'],
  2: ['#cfe3ff', '#d9edf7', '#e3e7f3', '#c7d8ef', '#f2f5fb'],
  3: ['#d8cbb3', '#c9c2b2', '#bfb6a5', '#d6d0c0', '#c4b49a'],
  4: ['#bfe7f2', '#a8d6e6', '#d0eef5', '#b3dde8', '#9fcfe0'],
};

// ---------------------------------------------------------------- hizmet binaları

const mat = (color: string, extra: THREE.MeshStandardMaterialParameters = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.75, ...extra });

function box(w: number, h: number, d: number, m: THREE.Material, x = 0, y = 0, z = 0) {
  const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  o.position.set(x, y + h / 2, z);
  o.castShadow = o.receiveShadow = true;
  return o;
}

function cyl(rt: number, rb: number, h: number, m: THREE.Material, x = 0, y = 0, z = 0, seg = 14) {
  const o = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m);
  o.position.set(x, y + h / 2, z);
  o.castShadow = o.receiveShadow = true;
  return o;
}

function tree(x: number, z: number, s = 1) {
  const g = new THREE.Group();
  g.add(cyl(0.04 * s, 0.05 * s, 0.25 * s, mat('#6d4c2f'), x, 0, z, 6));
  const top = new THREE.Mesh(new THREE.IcosahedronGeometry(0.22 * s, 0), mat('#3f8f3a', { flatShading: true }));
  top.position.set(x, 0.38 * s, z);
  top.castShadow = true;
  g.add(top);
  return g;
}

function flag(color: string, x: number, z: number, h = 1.4) {
  const g = new THREE.Group();
  g.add(cyl(0.02, 0.02, h, mat('#ddd'), x, 0, z, 6));
  const f = box(0.36, 0.22, 0.01, mat(color, { side: THREE.DoubleSide }), x + 0.19, h - 0.25, z);
  f.userData.wave = true;
  g.add(f);
  return g;
}

interface Anim {
  o: THREE.Object3D;
  kind: 'spin' | 'smoke' | 'blink' | 'wave';
  phase: number;
}

function serviceModel(type: ServiceId, party: string, anims: Anim[]): THREE.Group {
  const s = SERVICES[type].size;
  const g = new THREE.Group();
  const pad = box(s - 0.08, 0.04, s - 0.08, mat(type === 'park' || type === 'buyukPark' ? '#7cc36a' : '#c9c4b8'));
  g.add(pad);
  const white = mat('#f3f3ef');
  const glass = mat('#7fa6c9', { roughness: 0.2, metalness: 0.3 });
  switch (type) {
    case 'belediye': {
      g.add(box(2.3, 0.9, 1.5, mat('#efe6d2'), 0, 0.04, -0.2));
      for (let k = -2; k <= 2; k++) g.add(cyl(0.06, 0.06, 0.7, white, k * 0.4, 0.04, 0.62, 8));
      g.add(box(2.1, 0.12, 0.4, mat('#e3d8bf'), 0, 0.74, 0.62));
      const dome = new THREE.Mesh(new THREE.SphereGeometry(0.42, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat('#8fb7c9', { metalness: 0.4, roughness: 0.4 }));
      dome.position.set(0, 0.94, -0.2);
      dome.castShadow = true;
      g.add(dome);
      g.add(flag('#e30a17', 1.0, 1.05, 1.6));
      break;
    }
    case 'saglikOcagi':
    case 'hastane': {
      const big = type === 'hastane';
      g.add(box(big ? 2.4 : 1.5, big ? 1.5 : 0.6, big ? 1.4 : 1.2, white, 0, 0.04, big ? -0.4 : 0));
      if (big) g.add(box(1.1, 0.8, 1.0, white, -0.6, 0.04, 0.7));
      const red = mat('#e53935');
      const y = big ? 1.56 : 0.66;
      const z = big ? -0.4 : 0;
      g.add(box(0.5, 0.05, 0.14, red, 0, y, z));
      g.add(box(0.14, 0.05, 0.5, red, 0, y, z));
      if (big) {
        g.add(cyl(0.34, 0.34, 0.03, mat('#4caf50'), 0.65, 0.04, 0.75, 20));
        g.add(box(0.06, 0.02, 0.3, white, 0.55, 0.08, 0.75));
        g.add(box(0.06, 0.02, 0.3, white, 0.75, 0.08, 0.75));
        g.add(box(0.2, 0.02, 0.06, white, 0.65, 0.08, 0.75));
      }
      break;
    }
    case 'polis': {
      g.add(box(1.5, 0.7, 1.0, mat('#e8edf3'), 0, 0.04, -0.2));
      g.add(box(1.52, 0.12, 1.02, mat('#1e4fa3'), 0, 0.42, -0.2));
      g.add(box(0.4, 0.14, 0.22, mat('#f5f5f5'), 0.3, 0.04, 0.55));
      const bar = box(0.12, 0.04, 0.05, mat('#2962ff', { emissive: '#2962ff', emissiveIntensity: 1 }), 0.3, 0.18, 0.55);
      g.add(bar);
      anims.push({ o: bar, kind: 'blink', phase: 0 });
      break;
    }
    case 'itfaiye': {
      g.add(box(1.5, 0.75, 1.1, mat('#c62828'), 0, 0.04, -0.15));
      for (let k = -1; k <= 1; k++) g.add(box(0.36, 0.42, 0.02, mat('#37474f'), k * 0.45, 0.04, 0.41));
      g.add(box(0.3, 1.4, 0.3, mat('#b71c1c'), -0.55, 0.04, -0.5));
      break;
    }
    case 'okul': {
      g.add(box(1.5, 0.7, 0.8, mat('#f6c26b'), 0, 0.04, -0.4));
      g.add(box(1.4, 0.03, 0.75, mat('#5fae4f'), 0, 0.04, 0.42));
      g.add(box(1.0, 0.035, 0.03, white, 0, 0.04, 0.42));
      g.add(flag('#e30a17', 0.7, 0.2, 1.2));
      break;
    }
    case 'universite': {
      const brick = mat('#b5653c');
      g.add(box(2.4, 0.9, 0.8, brick, 0, 0.04, -0.75));
      g.add(box(0.8, 0.9, 1.6, brick, -0.8, 0.04, 0.4));
      g.add(box(0.5, 2.1, 0.5, mat('#a65a33'), 0.5, 0.04, -0.75));
      g.add(cyl(0.001, 0.38, 0.5, mat('#4e342e'), 0.5, 2.14, -0.75, 4));
      g.add(box(1.2, 0.03, 1.2, mat('#5fae4f'), 0.55, 0.04, 0.5));
      g.add(tree(0.3, 0.3), tree(0.8, 0.7));
      break;
    }
    case 'park':
      g.add(tree(-0.2, -0.15), tree(0.22, 0.2, 0.8));
      g.add(box(0.3, 0.06, 0.08, mat('#795548'), 0.1, 0.04, -0.3));
      break;
    case 'buyukPark': {
      const pond = cyl(0.6, 0.6, 0.03, mat('#4fa3d8', { roughness: 0.1 }), 0.3, 0.04, 0.2, 24);
      g.add(pond);
      for (let k = 0; k < 9; k++) {
        const a = (k / 9) * Math.PI * 2;
        g.add(tree(Math.cos(a) * 1.15, Math.sin(a) * 1.15, 0.9 + (k % 3) * 0.2));
      }
      g.add(box(2.8, 0.045, 0.16, mat('#d9c9a3'), 0, 0.04, -0.6));
      break;
    }
    case 'komur': {
      const dark = mat('#5b5f63');
      g.add(box(1.6, 0.8, 1.0, dark, -0.5, 0.04, 0.6));
      for (const [x, z] of [
        [0.6, -0.6],
        [0.6, 0.55],
      ]) {
        g.add(cyl(0.38, 0.5, 1.2, mat('#b0aea8'), x, 0.04, z, 20));
        const smoke = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 6), new THREE.MeshStandardMaterial({ color: '#d7d7d7', transparent: true, opacity: 0.6 }));
        smoke.position.set(x, 1.4, z);
        g.add(smoke);
        anims.push({ o: smoke, kind: 'smoke', phase: Math.random() });
      }
      g.add(cyl(0.08, 0.12, 2.3, mat('#8d4a3b'), -0.9, 0.04, -0.7, 10));
      const smoke = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), new THREE.MeshStandardMaterial({ color: '#555', transparent: true, opacity: 0.55 }));
      smoke.position.set(-0.9, 2.4, -0.7);
      g.add(smoke);
      anims.push({ o: smoke, kind: 'smoke', phase: 0.5 });
      break;
    }
    case 'gunes': {
      const panel = mat('#1d3b6e', { roughness: 0.25, metalness: 0.5 });
      for (let r = 0; r < 4; r++)
        for (let k = 0; k < 3; k++) {
          const p = box(0.75, 0.03, 0.42, panel, -0.95 + k * 0.95, 0.15, -1.05 + r * 0.7);
          p.rotation.x = -0.45;
          g.add(p);
        }
      break;
    }
    case 'ruzgar': {
      g.add(cyl(0.03, 0.06, 2.0, white, 0, 0.04, 0, 8));
      const hub = new THREE.Group();
      hub.position.set(0, 2.05, 0.06);
      for (let k = 0; k < 3; k++) {
        const b = box(0.06, 0.8, 0.02, white, 0, 0, 0);
        b.position.set(0, 0, 0);
        b.geometry.translate(0, 0.4, 0);
        b.rotation.z = (k * Math.PI * 2) / 3;
        hub.add(b);
      }
      g.add(hub);
      anims.push({ o: hub, kind: 'spin', phase: Math.random() * 6 });
      break;
    }
    case 'suPompasi':
      g.add(box(0.5, 0.4, 0.45, mat('#dfe9f2'), -0.12, 0.04, 0));
      g.add(cyl(0.18, 0.18, 0.55, mat('#2f80ed'), 0.22, 0.04, 0, 12));
      break;
    case 'meydan': {
      g.add(box(1.8, 0.05, 1.8, mat('#e6dccb'), 0, 0.03, 0));
      g.add(cyl(0.05, 0.12, 1.1, mat('#cfc6b5'), 0, 0.08, 0, 4));
      g.add(flag('#e30a17', -0.7, -0.7), flag(party, 0.7, -0.7));
      g.add(tree(-0.7, 0.7, 0.7), tree(0.7, 0.7, 0.7));
      break;
    }
    case 'basin': {
      g.add(box(1.2, 1.1, 1.0, glass, -0.15, 0.04, 0.1));
      g.add(cyl(0.02, 0.06, 2.2, mat('#9e9e9e'), 0.55, 0.04, -0.55, 6));
      const l = box(0.08, 0.08, 0.08, mat('#ff1744', { emissive: '#ff1744', emissiveIntensity: 1 }), 0.55, 2.24, -0.55);
      g.add(l);
      anims.push({ o: l, kind: 'blink', phase: 1 });
      break;
    }
    case 'parti': {
      g.add(box(1.5, 0.95, 1.1, mat('#f2efe8'), 0, 0.04, -0.15));
      g.add(box(1.52, 0.22, 1.12, mat(party), 0, 0.6, -0.15));
      g.add(flag(party, 0.6, 0.6, 1.8));
      break;
    }
  }
  g.traverse((o) => {
    if (o instanceof THREE.Mesh && o.userData.wave) anims.push({ o, kind: 'wave', phase: Math.random() * 6 });
  });
  return g;
}

// ---------------------------------------------------------------- sahne

interface Car {
  path: number[];
  t: number;
  speed: number;
  color: THREE.Color;
  truck: boolean;
}

class CityScene {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  camera: THREE.PerspectiveCamera;
  controls: MapControls;
  city: City;
  a: Analysis;
  n: number;
  night: boolean;
  party: string;
  ev: EditorEvents;
  tool: Tool = { kind: 'inspect' };
  overlay: Overlay = null;
  selected: number | null = null;

  groundCv = document.createElement('canvas');
  groundTex: THREE.CanvasTexture;
  grassCv = document.createElement('canvas');
  zoneData: Uint8Array<ArrayBuffer>;
  zoneTex: THREE.DataTexture;
  prevData: Uint8Array<ArrayBuffer>;
  prevTex: THREE.DataTexture;
  zonePlane: THREE.Mesh;
  bmeshes: THREE.InstancedMesh[] = [];
  bkey: { z: number; l: number }[] = [];
  roofs!: THREE.InstancedMesh;
  chimneys!: THREE.InstancedMesh;
  trees!: THREE.InstancedMesh;
  trunks!: THREE.InstancedMesh;
  carMesh!: THREE.InstancedMesh;
  lights!: THREE.Points;
  warnPower!: THREE.Points;
  warnWater!: THREE.Points;
  svcGroup = new THREE.Group();
  svcKey = '';
  anims: Anim[] = [];
  selBox: THREE.LineSegments;
  ring: THREE.Mesh;
  cars: Car[] = [];
  homes: number[] = [];
  works: number[] = [];
  edge: number[] = [];
  sun: THREE.DirectionalLight;
  hemi: THREE.HemisphereLight;
  raf = 0;
  last = performance.now();
  drag: { start: number; cur: number } | null = null;
  down: { x: number; y: number } | null = null;
  pointers = new Set<number>();
  hover = -1;
  sig = { road: '', zone: '', lvl: '', occ: '' };
  disposables: { dispose: () => void }[] = [];

  constructor(host: HTMLElement, city: City, a: Analysis, night: boolean, party: string, ev: EditorEvents) {
    this.city = city;
    this.a = a;
    this.n = city.n;
    this.night = night;
    this.party = party;
    this.ev = ev;
    const n = this.n;
    const r = (this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' }));
    r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFSoftShadowMap;
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = night ? 0.9 : 1.05;
    host.appendChild(r.domElement);
    r.domElement.className = 'city-canvas';

    const sky = night ? '#0d1730' : '#a9d3f0';
    this.scene.background = new THREE.Color(sky);
    this.scene.fog = new THREE.Fog(sky, 60, 140);
    this.camera = new THREE.PerspectiveCamera(42, 1, 0.3, 400);
    this.camera.position.set(-4, 24, 22);
    const c = (this.controls = new MapControls(this.camera, r.domElement));
    c.target.set(-4, 0, 1);
    c.enableDamping = true;
    c.dampingFactor = 0.12;
    c.minDistance = 6;
    c.maxDistance = 80;
    c.maxPolarAngle = 1.32;
    c.screenSpacePanning = false;
    c.addEventListener('change', () => {
      const h = n / 2 + 4;
      c.target.x = Math.max(-h, Math.min(h, c.target.x));
      c.target.z = Math.max(-h, Math.min(h, c.target.z));
    });

    // Işıklar
    this.hemi = new THREE.HemisphereLight(night ? '#6f82c0' : '#ffffff', night ? '#202840' : '#7a8c6a', night ? 1.1 : 1.1);
    this.scene.add(this.hemi);
    const sun = (this.sun = new THREE.DirectionalLight(night ? '#9fb0ff' : '#fff4dd', night ? 0.7 : 2.2));
    sun.position.set(-25, 40, 18);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const sc = sun.shadow.camera;
    sc.left = sc.bottom = -n * 0.75;
    sc.right = sc.top = n * 0.75;
    sc.far = 120;
    sun.shadow.bias = -0.0008;
    this.scene.add(sun);

    // Şehrin dışı: geniş çayır ve batıdan gelen otoyol
    const outer = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), mat(night ? '#1d2b1d' : '#6f9e55'));
    outer.rotation.x = -Math.PI / 2;
    outer.position.y = -0.03;
    outer.receiveShadow = true;
    this.scene.add(outer);
    const hw = new THREE.Mesh(new THREE.PlaneGeometry(200, 1), mat('#4a4d52'));
    hw.rotation.x = -Math.PI / 2;
    hw.position.set(-n / 2 - 100, -0.02, Math.floor(n / 2) - n / 2 + 0.5);
    this.scene.add(hw);
    // Uzak tepeler
    for (let k = 0; k < 26; k++) {
      const ang = (k / 26) * Math.PI * 2;
      const d = 70 + hash(k, 3) * 30;
      const m = new THREE.Mesh(new THREE.ConeGeometry(10 + hash(k, 4) * 12, 6 + hash(k, 5) * 10, 7), mat(night ? '#1a2a22' : '#7fa073', { flatShading: true }));
      m.position.set(Math.cos(ang) * d, 0, Math.sin(ang) * d);
      this.scene.add(m);
    }

    // Zemin: çimen + su + yollar tek bir tuval dokusunda
    this.groundCv.width = this.groundCv.height = n * PX;
    this.grassCv.width = this.grassCv.height = n * PX;
    this.paintGrass();
    this.groundTex = new THREE.CanvasTexture(this.groundCv);
    this.groundTex.colorSpace = THREE.SRGBColorSpace;
    this.groundTex.anisotropy = 8;
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(n, n), new THREE.MeshStandardMaterial({ map: this.groundTex, roughness: 0.95 }));
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Bölge ve önizleme katmanları (karo başına bir piksel)
    this.zoneData = new Uint8Array(n * n * 4);
    this.zoneTex = new THREE.DataTexture(this.zoneData, n, n);
    this.zoneTex.magFilter = THREE.NearestFilter;
    this.zoneTex.flipY = false;
    this.zonePlane = this.layer(this.zoneTex, 0.012);
    this.prevData = new Uint8Array(n * n * 4);
    this.prevTex = new THREE.DataTexture(this.prevData, n, n);
    this.prevTex.magFilter = THREE.NearestFilter;
    this.layer(this.prevTex, 0.02);

    // Izgara çizgileri (araç seçiliyken)
    const grid = new THREE.GridHelper(n, n, '#ffffff', '#ffffff');
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.12;
    grid.position.y = 0.015;
    grid.name = 'grid';
    grid.visible = false;
    this.scene.add(grid);

    // Binalar: bölge × seviye başına bir örnekli ağ
    const roofMat = mat('#8f9aa3');
    for (const z of [1, 2, 3, 4])
      for (let l = 1; l <= 4; l++) {
        const [w, h] = SHAPES[z][l];
        const floors = Math.max(1, Math.round(h / 0.32));
        const tex = windowTexture(z, false);
        tex.repeat.set(2, floors / 2);
        const em = windowTexture(z, true);
        em.repeat.set(2, floors / 2);
        const side = new THREE.MeshStandardMaterial({ map: tex, emissiveMap: em, emissive: new THREE.Color(night ? '#ffcf7a' : '#000000'), emissiveIntensity: night ? 0.9 : 0, roughness: z === 2 || z === 4 ? 0.35 : 0.8, metalness: z === 4 ? 0.25 : 0 });
        const geo = new THREE.BoxGeometry(w, h, w);
        geo.translate(0, h / 2, 0);
        const m = new THREE.InstancedMesh(geo, [side, side, roofMat, roofMat, side, side], n * n);
        m.count = 0;
        m.castShadow = m.receiveShadow = true;
        m.frustumCulled = false;
        this.scene.add(m);
        this.bmeshes.push(m);
        this.bkey.push({ z, l });
        this.disposables.push(geo, side, tex, em);
      }
    const roofGeo = new THREE.ConeGeometry(0.56, 0.32, 4);
    roofGeo.rotateY(Math.PI / 4);
    this.roofs = new THREE.InstancedMesh(roofGeo, mat('#b5523b', { flatShading: true }), n * n);
    this.chimneys = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.06, 0.09, 0.9, 8), mat('#8d6e63'), n * n);
    const treeGeo = new THREE.IcosahedronGeometry(0.22, 0);
    this.trees = new THREE.InstancedMesh(treeGeo, mat('#3e8a3a', { flatShading: true }), n * n * 2);
    this.trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.035, 0.05, 0.26, 5), mat('#6d4c2f'), n * n * 2);
    for (const m of [this.roofs, this.chimneys, this.trees, this.trunks]) {
      m.count = 0;
      m.castShadow = true;
      m.frustumCulled = false;
      this.scene.add(m);
    }
    // Araçlar
    const carGeo = new THREE.BoxGeometry(0.26, 0.12, 0.14);
    carGeo.translate(0, 0.08, 0);
    this.carMesh = new THREE.InstancedMesh(carGeo, new THREE.MeshStandardMaterial({ roughness: 0.4, metalness: 0.3 }), 220);
    this.carMesh.count = 0;
    this.carMesh.castShadow = true;
    this.carMesh.frustumCulled = false;
    this.scene.add(this.carMesh);
    // Sokak lambaları ve uyarı simgeleri
    this.lights = this.points(glowTexture('rgba(255,214,140,0.9)'), 0.9, false);
    this.warnPower = this.points(iconTexture('⚡', '#e53935'), 0.7, true);
    this.warnWater = this.points(iconTexture('💧', '#1e63c6'), 0.7, true);

    this.scene.add(this.svcGroup);
    // Seçim kutusu ve kapsama halkası
    this.selBox = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)), new THREE.LineBasicMaterial({ color: '#ffd400' }));
    this.selBox.visible = false;
    this.scene.add(this.selBox);
    this.ring = new THREE.Mesh(new THREE.RingGeometry(0.96, 1, 64), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.8, side: THREE.DoubleSide }));
    this.ring.rotation.x = -Math.PI / 2;
    this.ring.position.y = 0.05;
    this.ring.visible = false;
    this.scene.add(this.ring);

    // Otomatik testler için: karonun ekrandaki yeri
    Object.assign(r.domElement, {
      cellToScreen: (x: number, y: number) => {
        const v = new THREE.Vector3(x - n / 2 + 0.5, 0, y - n / 2 + 0.5).project(this.camera);
        const rect = r.domElement.getBoundingClientRect();
        return { x: rect.left + ((v.x + 1) / 2) * rect.width, y: rect.top + ((1 - v.y) / 2) * rect.height };
      },
    });
    this.update(city, a, true);
    this.bindInput();
    this.loop();
  }

  layer(tex: THREE.Texture, y: number) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(this.n, this.n), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
    m.rotation.x = -Math.PI / 2;
    m.position.y = y;
    // DataTexture satırları y=0 altta; düzlemi karo düzenine çevir
    m.scale.y = -1;
    m.renderOrder = 2;
    this.scene.add(m);
    return m;
  }

  points(tex: THREE.Texture, size: number, onTop: boolean) {
    const p = new THREE.Points(new THREE.BufferGeometry(), new THREE.PointsMaterial({ map: tex, size, transparent: true, depthWrite: false, depthTest: !onTop, sizeAttenuation: true, blending: onTop ? THREE.NormalBlending : THREE.AdditiveBlending }));
    p.renderOrder = onTop ? 5 : 3;
    p.frustumCulled = false;
    this.scene.add(p);
    return p;
  }

  pos(i: number) {
    const n = this.n;
    return new THREE.Vector3((i % n) - n / 2 + 0.5, 0, Math.floor(i / n) - n / 2 + 0.5);
  }

  // ------------------------------------------------------------ zemin

  paintGrass() {
    const g = this.grassCv.getContext('2d')!;
    const n = this.n;
    g.fillStyle = this.night ? '#3e6339' : '#7db35f';
    g.fillRect(0, 0, n * PX, n * PX);
    for (let k = 0; k < n * n * 3; k++) {
      const x = hash(k, 7) * n * PX;
      const y = hash(k, 8) * n * PX;
      g.fillStyle = hash(k, 9) < 0.5 ? (this.night ? 'rgba(20,40,20,0.35)' : 'rgba(90,150,70,0.45)') : this.night ? 'rgba(60,90,60,0.25)' : 'rgba(150,200,110,0.35)';
      g.beginPath();
      g.arc(x, y, 3 + hash(k, 10) * 9, 0, Math.PI * 2);
      g.fill();
    }
    const c = this.city;
    // Kıyıları yumuşatmak için her su karosuna daire çiz
    const blob = (color: string, r: number) => {
      g.fillStyle = color;
      for (let i = 0; i < n * n; i++) {
        if (!c.terrain[i]) continue;
        g.beginPath();
        g.arc((i % n) * PX + PX / 2, Math.floor(i / n) * PX + PX / 2, r, 0, Math.PI * 2);
        g.fill();
      }
    };
    blob(this.night ? '#4d4a35' : '#e2d39a', PX * 1.05);
    blob(this.night ? '#173a5c' : '#3d8fd1', PX * 0.8);
    blob(this.night ? '#1d4670' : '#4a9cdc', PX * 0.55);
  }

  paintGround() {
    const g = this.groundCv.getContext('2d')!;
    const c = this.city;
    const n = this.n;
    g.drawImage(this.grassCv, 0, 0);
    const road = (x: number, y: number) => x >= 0 && y >= 0 && x < n && y < n && c.road[y * n + x];
    for (let i = 0; i < n * n; i++) {
      if (!c.road[i]) continue;
      const x = i % n;
      const y = Math.floor(i / n);
      const px = x * PX;
      const py = y * PX;
      const bridge = c.terrain[i];
      g.fillStyle = bridge ? '#8a8f96' : '#b9b4aa';
      g.fillRect(px, py, PX, PX);
      g.fillStyle = this.a.connected[i] ? '#4b4f55' : '#6b5050';
      g.fillRect(px + 3, py + 3, PX - 6, PX - 6);
      // Komşulara doğru asfaltı uzat ve şerit çiz
      const nb: [number, number][] = [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ];
      for (const [dx, dy] of nb) {
        if (!road(x + dx, y + dy) && !(x === 0 && dx === -1)) continue;
        g.fillStyle = this.a.connected[i] ? '#4b4f55' : '#6b5050';
        if (dx) g.fillRect(dx > 0 ? px + PX - 3 : px, py + 3, 3, PX - 6);
        else g.fillRect(px + 3, dy > 0 ? py + PX - 3 : py, PX - 6, 3);
        g.fillStyle = '#f2d14b';
        const cx = px + PX / 2;
        const cy = py + PX / 2;
        if (dx) g.fillRect(dx > 0 ? cx + 2 : px + 2, cy - 1, PX / 2 - 6, 2);
        else g.fillRect(cx - 1, dy > 0 ? cy + 2 : py + 2, 2, PX / 2 - 6);
      }
    }
    this.groundTex.needsUpdate = true;
  }

  // ------------------------------------------------------------ güncelleme

  update(city: City, a: Analysis, force = false) {
    this.city = city;
    this.a = a;
    const sig = { road: city.road.join(''), zone: city.zone.join(''), lvl: city.lvl.join(''), occ: city.services.map((s) => s.id).join(',') };
    const roadCh = force || sig.road !== this.sig.road;
    const zoneCh = force || sig.zone !== this.sig.zone;
    const lvlCh = force || sig.lvl !== this.sig.lvl;
    const svcCh = force || sig.occ !== this.sig.occ;
    this.sig = sig;
    if (roadCh) this.paintGround();
    this.paintZones();
    if (lvlCh || zoneCh || roadCh || svcCh) {
      this.buildBuildings();
      this.buildTrees();
      this.buildTrips();
    }
    if (roadCh) this.buildLights();
    if (svcCh) this.buildServices();
    this.buildWarnings();
    this.syncSelection();
  }

  setOverlay(o: Overlay) {
    this.overlay = o;
    this.roofs.visible = !o;
    this.paintZones();
    this.buildBuildings();
  }

  setTool(t: Tool) {
    this.tool = t;
    const grid = this.scene.getObjectByName('grid');
    if (grid) grid.visible = t.kind !== 'inspect';
    const c = this.controls;
    const NONE = -1 as unknown as THREE.MOUSE;
    if (t.kind === 'inspect') {
      c.mouseButtons = { LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE };
      c.touches = { ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_ROTATE };
    } else {
      c.mouseButtons = { LEFT: NONE, MIDDLE: THREE.MOUSE.PAN, RIGHT: THREE.MOUSE.ROTATE };
      c.touches = { ONE: -1 as unknown as THREE.TOUCH, TWO: THREE.TOUCH.DOLLY_PAN };
    }
    this.drag = null;
    this.paintZones();
    this.preview();
  }

  setSelected(cell: number | null) {
    this.selected = cell;
    this.syncSelection();
  }

  syncSelection() {
    const i = this.selected;
    if (i === null || i < 0) {
      this.selBox.visible = false;
      if (this.tool.kind !== 'place') this.ring.visible = false;
      return;
    }
    const c = this.city;
    const occ = c.occ[i];
    let x0 = i % this.n;
    let y0 = Math.floor(i / this.n);
    let size = 1;
    let h = 0.4;
    if (occ) {
      const s = c.services[occ - 1];
      if (s) {
        x0 = s.x;
        y0 = s.y;
        size = SERVICES[s.type].size;
        h = 1.2;
        const spec = SERVICES[s.type];
        if (spec.radius && spec.cover) this.showRing(x0 + size / 2, y0 + size / 2, spec.radius * Math.sqrt(c.budget.svc[spec.cover] ?? 1));
        else this.ring.visible = false;
      }
    } else {
      this.ring.visible = false;
      if (c.zone[i] && c.lvl[i]) h = SHAPES[c.zone[i]][c.lvl[i]][1] + 0.05;
    }
    this.selBox.visible = true;
    this.selBox.scale.set(size + 0.04, h, size + 0.04);
    this.selBox.position.set(x0 + size / 2 - this.n / 2, h / 2, y0 + size / 2 - this.n / 2);
  }

  showRing(cx: number, cy: number, r: number) {
    this.ring.visible = true;
    this.ring.scale.set(r, r, 1);
    this.ring.position.x = cx - this.n / 2;
    this.ring.position.z = cy - this.n / 2;
  }

  overlayColor(i: number): [number, number, number, number] | null {
    const o = this.overlay;
    const c = this.city;
    const a = this.a;
    if (!o || c.terrain[i]) return null;
    const ramp = (v: number): [number, number, number, number] => {
      const t = Math.max(0, Math.min(1, v));
      return [Math.round(230 - 170 * t), Math.round(70 + 150 * t), 60, 200];
    };
    if (o === 'power' || o === 'water') {
      if (!c.zone[i]) return null;
      const ok = (o === 'power' ? a.power : a.water)[i];
      return ok ? (o === 'power' ? [250, 210, 60, 200] : [60, 150, 240, 200]) : [220, 50, 50, 210];
    }
    if (o === 'pollution') {
      const p = a.pollution[i];
      return p > 0.03 ? [120, 80, 30, Math.round(60 + 190 * p)] : null;
    }
    if (o === 'value') return c.zone[i] ? ramp(a.value[i] / 100) : null;
    if (o === 'happy') return c.zone[i] && c.lvl[i] ? ramp(a.happy[i] / 100) : null;
    const v = a.cover[o][i];
    if (!c.zone[i] && v < 0.05) return null;
    return ramp(v);
  }

  paintZones() {
    const c = this.city;
    const d = this.zoneData;
    const n = this.n;
    const zoning = this.tool.kind === 'zone';
    for (let i = 0; i < n * n; i++) {
      let rgba: [number, number, number, number] = [0, 0, 0, 0];
      const ov = this.overlayColor(i);
      if (this.overlay) rgba = ov ?? [0, 0, 0, 0];
      else if (c.zone[i]) {
        const col = new THREE.Color(ZONES[c.zone[i]].color);
        rgba = [col.r * 255, col.g * 255, col.b * 255, c.lvl[i] ? 70 : 150];
      } else if (zoning && !c.terrain[i] && !c.road[i] && !c.occ[i] && nearRoad(c, i % n, Math.floor(i / n))) rgba = [255, 255, 255, 45];
      d.set(rgba, i * 4);
    }
    this.zoneTex.needsUpdate = true;
  }

  buildBuildings() {
    const c = this.city;
    const n = this.n;
    const counts = this.bmeshes.map(() => 0);
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const col = new THREE.Color();
    let roofs = 0;
    let chim = 0;
    for (let i = 0; i < n * n; i++) {
      const z = c.zone[i];
      const l = c.lvl[i];
      if (!z || !l) continue;
      const k = (z - 1) * 4 + (l - 1);
      const p = this.pos(i);
      const hv = 0.85 + hash(i, 11) * 0.4;
      const rot = Math.floor(hash(i, 12) * 4) * (Math.PI / 2);
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rot);
      m4.compose(p, q, new THREE.Vector3(1, hv, 1));
      const mesh = this.bmeshes[k];
      mesh.setMatrixAt(counts[k], m4);
      const ov = this.overlayColor(i);
      if (this.overlay && ov) col.setRGB(ov[0] / 255, ov[1] / 255, ov[2] / 255, THREE.SRGBColorSpace);
      else if (this.overlay) col.set('#9e9e9e');
      else {
        const pal = PALETTE[z];
        col.set(pal[Math.floor(hash(i, 13) * pal.length)]);
        // Elektriği olmayan bina gece karanlıkta kalır, gündüz grileşir
        if (!this.a.power[i]) col.multiplyScalar(0.6);
      }
      mesh.setColorAt(counts[k], col);
      counts[k]++;
      const [, h] = SHAPES[z][l];
      if (z === 1 && l <= 2) {
        m4.compose(new THREE.Vector3(p.x, h * hv + 0.16, p.z), q, new THREE.Vector3(SHAPES[z][l][0] / 0.78, 1, SHAPES[z][l][0] / 0.78));
        this.roofs.setMatrixAt(roofs++, m4);
      }
      if (z === 3 && l >= 2) {
        m4.compose(new THREE.Vector3(p.x + 0.28, h * hv, p.z + 0.28), q, new THREE.Vector3(1, 0.6 + l * 0.25, 1));
        this.chimneys.setMatrixAt(chim++, m4);
      }
    }
    this.bmeshes.forEach((m, k) => {
      m.count = counts[k];
      m.instanceMatrix.needsUpdate = true;
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
    });
    this.roofs.count = roofs;
    this.roofs.instanceMatrix.needsUpdate = true;
    this.chimneys.count = chim;
    this.chimneys.instanceMatrix.needsUpdate = true;
  }

  buildTrees() {
    const c = this.city;
    const n = this.n;
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    let k = 0;
    for (let i = 0; i < n * n; i++) {
      if (c.terrain[i] || c.road[i] || c.occ[i] || (c.zone[i] && c.lvl[i])) continue;
      const dense = c.zone[i] ? 0.04 : 0.3;
      for (let j = 0; j < 2; j++) {
        if (hash(i, 20 + j) > dense) continue;
        const p = this.pos(i);
        p.x += (hash(i, 30 + j) - 0.5) * 0.7;
        p.z += (hash(i, 40 + j) - 0.5) * 0.7;
        const s = 0.7 + hash(i, 50 + j) * 0.8;
        m4.compose(new THREE.Vector3(p.x, 0.13 * s, p.z), q, new THREE.Vector3(s, s, s));
        this.trunks.setMatrixAt(k, m4);
        m4.compose(new THREE.Vector3(p.x, 0.36 * s, p.z), q, new THREE.Vector3(s, s * 1.2, s));
        this.trees.setMatrixAt(k, m4);
        k++;
      }
    }
    this.trees.count = this.trunks.count = k;
    this.trees.instanceMatrix.needsUpdate = true;
    this.trunks.instanceMatrix.needsUpdate = true;
  }

  buildLights() {
    const pts: number[] = [];
    const c = this.city;
    for (let i = 0; i < c.road.length; i++) {
      if (!c.road[i] || hash(i, 60) > 0.5) continue;
      const p = this.pos(i);
      pts.push(p.x + 0.38, 0.35, p.z + 0.38);
    }
    this.lights.geometry.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    this.lights.visible = this.night;
  }

  buildWarnings() {
    const c = this.city;
    const a = this.a;
    const pw: number[] = [];
    const wt: number[] = [];
    for (let i = 0; i < c.zone.length; i++) {
      if (!c.zone[i] || !a.access[i]) continue;
      const h = c.lvl[i] ? SHAPES[c.zone[i]][c.lvl[i]][1] + 0.5 : 0.5;
      const p = this.pos(i);
      if (!a.power[i] && hash(i, 70) < 0.5) pw.push(p.x, h, p.z);
      else if (!a.water[i] && hash(i, 71) < 0.5) wt.push(p.x, h, p.z);
    }
    this.warnPower.geometry.setAttribute('position', new THREE.Float32BufferAttribute(pw, 3));
    this.warnWater.geometry.setAttribute('position', new THREE.Float32BufferAttribute(wt, 3));
  }

  buildServices() {
    for (const ch of [...this.svcGroup.children]) {
      this.svcGroup.remove(ch);
      ch.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          (o.material as THREE.Material).dispose();
        }
      });
    }
    this.anims = [];
    for (const s of this.city.services) {
      const g = serviceModel(s.type, this.party, this.anims);
      const size = SERVICES[s.type].size;
      g.position.set(s.x + size / 2 - this.n / 2, 0, s.y + size / 2 - this.n / 2);
      // Binanın önü en yakın yola baksın
      g.rotation.y = this.facing(s.x, s.y, size);
      g.userData.cell = idx(this.city, s.x, s.y);
      this.svcGroup.add(g);
    }
  }

  facing(x: number, y: number, size: number) {
    const c = this.city;
    const sides: [number, number[]][] = [
      [0, Array.from({ length: size }, (_, k) => idx(c, x + k, y + size))],
      [Math.PI, Array.from({ length: size }, (_, k) => idx(c, x + k, y - 1))],
      [Math.PI / 2, Array.from({ length: size }, (_, k) => idx(c, x + size, y + k))],
      [-Math.PI / 2, Array.from({ length: size }, (_, k) => idx(c, x - 1, y + k))],
    ];
    for (const [rot, cells] of sides) if (cells.some((i) => i >= 0 && i < c.road.length && c.road[i])) return rot;
    return 0;
  }

  // ------------------------------------------------------------ trafik

  buildTrips() {
    const c = this.city;
    const n = this.n;
    const roadNear = (i: number) => {
      const x = i % n;
      const y = Math.floor(i / n);
      for (let r = 1; r <= ZONE_DEPTH + 1; r++)
        for (const [dx, dy] of [
          [r, 0],
          [-r, 0],
          [0, r],
          [0, -r],
        ]) {
          const j = (y + dy) * n + x + dx;
          if (inside(c, x + dx, y + dy) && c.road[j] && this.a.connected[j]) return j;
        }
      return -1;
    };
    this.homes = [];
    this.works = [];
    for (let i = 0; i < n * n; i++) {
      if (!c.zone[i] || !c.lvl[i] || hash(i, 80) > 0.5) continue;
      const r = roadNear(i);
      if (r < 0) continue;
      (c.zone[i] === 1 ? this.homes : this.works).push(r);
    }
    this.edge = [];
    for (let y = 0; y < n; y++) if (c.road[y * n]) this.edge.push(y * n);
    // Yolu yıkılmış araçları sil
    this.cars = this.cars.filter((car) => car.path.every((i) => c.road[i]));
  }

  spawnCar(): Car | null {
    const homes = this.homes;
    if (!homes.length) return null;
    const pick = (a: number[]) => a[Math.floor(Math.random() * a.length)];
    const truck = Math.random() < 0.15;
    let from = pick(homes);
    let to = this.works.length && Math.random() < 0.7 ? pick(this.works) : this.edge.length ? pick(this.edge) : pick(homes);
    if (Math.random() < 0.5) [from, to] = [to, from];
    if (from === to) return null;
    const path = roadPath(this.city, from, to);
    if (!path || path.length < 2) return null;
    const palette = ['#e53935', '#fafafa', '#212121', '#1e88e5', '#fdd835', '#90a4ae', '#43a047', '#8e24aa'];
    return { path, t: 0, speed: 1.6 + Math.random() * 1.2, color: new THREE.Color(truck ? '#ff8f00' : palette[Math.floor(Math.random() * palette.length)]), truck };
  }

  stepCars(dt: number) {
    const want = Math.min(200, Math.round(this.city.stats.pop / 45));
    if (this.cars.length < want && Math.random() < 0.5) {
      const car = this.spawnCar();
      if (car) this.cars.push(car);
    }
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    const s = new THREE.Vector3(1, 1, 1);
    const st = new THREE.Vector3(1.25, 1.5, 1.1);
    let k = 0;
    this.cars = this.cars.filter((car) => {
      car.t += car.speed * dt;
      if (car.t >= car.path.length - 1) return false;
      return true;
    });
    if (this.cars.length > want + 10) this.cars.length = want;
    for (const car of this.cars) {
      const j = Math.floor(car.t);
      const f = car.t - j;
      const a = this.pos(car.path[j]);
      const b = this.pos(car.path[j + 1]);
      const dx = b.x - a.x;
      const dz = b.z - a.z;
      // Sağ şeritten git
      const p = new THREE.Vector3(a.x + dx * f - dz * 0.17, 0, a.z + dz * f + dx * 0.17);
      q.setFromAxisAngle(up, Math.atan2(-dz, dx));
      m4.compose(p, q, car.truck ? st : s);
      this.carMesh.setMatrixAt(k, m4);
      this.carMesh.setColorAt(k, car.color);
      k++;
    }
    this.carMesh.count = k;
    this.carMesh.instanceMatrix.needsUpdate = true;
    if (this.carMesh.instanceColor) this.carMesh.instanceColor.needsUpdate = true;
  }

  // ------------------------------------------------------------ girdi

  cellAt(ev: PointerEvent): number {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const v = new THREE.Vector2(((ev.clientX - rect.left) / rect.width) * 2 - 1, -((ev.clientY - rect.top) / rect.height) * 2 + 1);
    const ray = new THREE.Raycaster();
    ray.setFromCamera(v, this.camera);
    const hit = new THREE.Vector3();
    if (!ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit)) return -1;
    const x = Math.floor(hit.x + this.n / 2);
    const y = Math.floor(hit.z + this.n / 2);
    return inside(this.city, x, y) ? y * this.n + x : -1;
  }

  /** Sürüklenen alandaki karolar */
  dragCells(): number[] {
    if (!this.drag) return [];
    const n = this.n;
    const { start, cur } = this.drag;
    const x0 = start % n;
    const y0 = Math.floor(start / n);
    const x1 = cur % n;
    const y1 = Math.floor(cur / n);
    const out: number[] = [];
    if (this.tool.kind === 'road') {
      // L biçimli yol: önce uzun eksen
      const horizFirst = Math.abs(x1 - x0) >= Math.abs(y1 - y0);
      const sx = Math.sign(x1 - x0);
      const sy = Math.sign(y1 - y0);
      let x = x0;
      let y = y0;
      out.push(y * n + x);
      if (horizFirst) {
        while (x !== x1) out.push(y * n + (x += sx));
        while (y !== y1) out.push((y += sy) * n + x);
      } else {
        while (y !== y1) out.push((y += sy) * n + x);
        while (x !== x1) out.push(y * n + (x += sx));
      }
      return out;
    }
    for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) out.push(y * n + x);
    return out;
  }

  placeOrigin(cell: number, type: ServiceId) {
    const size = SERVICES[type].size;
    const off = Math.floor((size - 1) / 2);
    return [(cell % this.n) - off, Math.floor(cell / this.n) - off] as const;
  }

  preview() {
    const d = this.prevData;
    d.fill(0);
    const t = this.tool;
    const c = this.city;
    const n = this.n;
    const set = (i: number, rgba: number[]) => i >= 0 && i < n * n && d.set(rgba, i * 4);
    if (t.kind === 'place' && this.hover >= 0) {
      const [x, y] = this.placeOrigin(this.hover, t.service);
      const err = canPlace(c, t.service, x, y);
      for (const [cx, cy] of footprint(t.service, x, y)) if (inside(c, cx, cy)) set(cy * n + cx, err ? [230, 60, 60, 190] : [80, 220, 120, 190]);
      const spec = SERVICES[t.service];
      if (spec.radius) this.showRing(x + spec.size / 2, y + spec.size / 2, spec.radius * Math.sqrt(spec.cover ? c.budget.svc[spec.cover] ?? 1 : 1));
      else this.ring.visible = false;
      this.ev.hint(err ? err : `${spec.icon} ${spec.label} · ${spec.cost.toLocaleString('tr-TR')} bin ₺ · bakım ${spec.upkeep}/gün`, !!err);
    } else if (this.drag) {
      const cells = this.dragCells();
      if (t.kind === 'road') {
        for (const i of cells) set(i, c.road[i] ? [255, 255, 255, 60] : c.occ[i] ? [230, 60, 60, 170] : [255, 255, 255, 200]);
        const fresh = cells.filter((i) => !c.road[i] && !c.occ[i]);
        this.ev.hint(`${fresh.length} karo yol · ${roadCost(c, cells).toLocaleString('tr-TR')} bin ₺`);
      } else if (t.kind === 'zone') {
        const col = new THREE.Color(t.zone ? ZONES[t.zone].color : '#ffffff');
        let k = 0;
        for (const i of cells) {
          const ok = !c.terrain[i] && !c.road[i] && !c.occ[i] && (!t.zone || nearRoad(c, i % n, Math.floor(i / n)));
          if (ok) k++;
          set(i, ok ? [col.r * 255, col.g * 255, col.b * 255, 210] : [0, 0, 0, 40]);
        }
        this.ev.hint(t.zone ? `${k} karo ${ZONES[t.zone].label.toLocaleLowerCase('tr')} bölgesi` : `${k} karonun imarı kaldırılacak`);
      } else if (t.kind === 'bulldoze') {
        for (const i of cells) set(i, [230, 50, 50, 170]);
        this.ev.hint(`${cells.length} karo yıkılacak`, true);
      }
    } else if (this.hover >= 0 && t.kind !== 'inspect') {
      const col = t.kind === 'bulldoze' ? [230, 50, 50, 170] : t.kind === 'zone' && t.zone ? [...new THREE.Color(ZONES[t.zone].color).toArray().map((v) => v * 255), 200] : [255, 255, 255, 170];
      set(this.hover, col);
    }
    if (t.kind !== 'place') {
      if (!this.drag) this.ev.hint(null);
      if (this.selected === null) this.ring.visible = false;
    }
    this.prevTex.needsUpdate = true;
  }

  bindInput() {
    const el = this.renderer.domElement;
    el.addEventListener('contextmenu', (e) => e.preventDefault());
    el.addEventListener('pointerdown', (e) => {
      this.pointers.add(e.pointerId);
      if (this.pointers.size > 1) {
        this.drag = null;
        this.preview();
        return;
      }
      this.down = { x: e.clientX, y: e.clientY };
      if (e.button !== 0 || this.tool.kind === 'inspect' || this.tool.kind === 'place') return;
      const cell = this.cellAt(e);
      if (cell < 0) return;
      this.drag = { start: cell, cur: cell };
      el.setPointerCapture(e.pointerId);
      this.preview();
    });
    el.addEventListener('pointermove', (e) => {
      const cell = this.cellAt(e);
      if (this.drag && cell >= 0) this.drag.cur = cell;
      if (cell !== this.hover || this.drag) {
        this.hover = cell;
        this.preview();
      }
    });
    el.addEventListener('pointerleave', () => {
      this.hover = -1;
      if (!this.drag) this.preview();
    });
    const end = (e: PointerEvent) => {
      this.pointers.delete(e.pointerId);
      const moved = this.down ? Math.hypot(e.clientX - this.down.x, e.clientY - this.down.y) : 99;
      this.down = null;
      const t = this.tool;
      if (this.drag) {
        const cells = this.dragCells();
        this.drag = null;
        if (t.kind === 'road') this.ev.paint('road', cells);
        else if (t.kind === 'zone') this.ev.paint('zone', cells, t.zone);
        else if (t.kind === 'bulldoze') this.ev.paint('bulldoze', cells);
        this.preview();
        return;
      }
      if (e.type === 'pointercancel' || moved > 6 || e.button !== 0) return;
      const cell = this.cellAt(e);
      if (t.kind === 'place' && cell >= 0) {
        const [x, y] = this.placeOrigin(cell, t.service);
        this.ev.place(t.service, x, y);
      } else if (t.kind === 'inspect') this.ev.inspect(cell >= 0 ? cell : null);
    };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
  }

  // ------------------------------------------------------------ döngü

  fitted = false;

  resize(w: number, h: number) {
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / Math.max(1, h);
    // Dar ekranda (telefon) kamerayı geri çek ki şehir sığsın
    if (!this.fitted && w > 0) {
      this.fitted = true;
      if (this.camera.aspect < 1) {
        const d = this.camera.position.clone().sub(this.controls.target);
        this.camera.position.copy(this.controls.target).add(d.multiplyScalar(Math.min(2, 1 / Math.pow(this.camera.aspect, 0.7))));
      }
    }
    this.camera.updateProjectionMatrix();
  }

  loop = () => {
    this.raf = requestAnimationFrame(this.loop);
    const now = performance.now();
    const dt = Math.min(0.1, (now - this.last) / 1000);
    this.last = now;
    if (document.hidden) return;
    this.controls.update();
    this.stepCars(dt);
    const time = now / 1000;
    for (const a of this.anims) {
      if (a.kind === 'spin') a.o.rotation.z = time * 2 + a.phase;
      else if (a.kind === 'blink') a.o.visible = Math.sin(time * 6 + a.phase) > 0;
      else if (a.kind === 'wave') a.o.rotation.y = Math.sin(time * 3 + a.phase) * 0.25;
      else {
        const k = (time * 0.35 + a.phase) % 1;
        if (!a.o.userData.y0) a.o.userData.y0 = a.o.position.y;
        a.o.position.y = a.o.userData.y0 + k * 1.6;
        a.o.scale.setScalar(0.6 + k * 1.6);
        ((a.o as THREE.Mesh).material as THREE.MeshStandardMaterial).opacity = 0.6 * (1 - k);
      }
    }
    this.renderer.render(this.scene, this.camera);
  };

  /** Kamerayı bir karoya götürür */
  focus(cell: number) {
    const p = this.pos(cell);
    const d = this.camera.position.clone().sub(this.controls.target);
    this.controls.target.copy(p);
    this.camera.position.copy(p.clone().add(d));
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    this.controls.dispose();
    this.scene.traverse((o) => {
      if (o instanceof THREE.Mesh || o instanceof THREE.Points || o instanceof THREE.LineSegments) {
        o.geometry.dispose();
        const m = o.material as THREE.Material | THREE.Material[];
        (Array.isArray(m) ? m : [m]).forEach((x) => x.dispose());
      }
    });
    for (const d of this.disposables) d.dispose();
    this.groundTex.dispose();
    this.zoneTex.dispose();
    this.prevTex.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}

// ---------------------------------------------------------------- React sarmalayıcı

export interface CityEditorHandle {
  focus: (cell: number) => void;
}

export function CityEditor({
  city,
  analysis,
  tool,
  overlay,
  selected,
  night,
  partyColor,
  events,
  handle,
}: {
  city: City;
  analysis: Analysis;
  tool: Tool;
  overlay: Overlay;
  selected: number | null;
  night: boolean;
  partyColor: string;
  events: EditorEvents;
  handle?: React.MutableRefObject<CityEditorHandle | null>;
}) {
  const host = useRef<HTMLDivElement>(null);
  const sc = useRef<CityScene | null>(null);
  const evRef = useRef(events);
  evRef.current = events;

  useEffect(() => {
    const el = host.current!;
    const proxy: EditorEvents = {
      paint: (...a) => evRef.current.paint(...a),
      place: (...a) => evRef.current.place(...a),
      inspect: (...a) => evRef.current.inspect(...a),
      hint: (...a) => evRef.current.hint(...a),
    };
    let s: CityScene;
    try {
      s = new CityScene(el, city, analysis, night, partyColor, proxy);
    } catch {
      el.textContent = 'Bu cihaz 3B grafiği desteklemiyor.';
      return;
    }
    sc.current = s;
    if (handle) handle.current = { focus: (c) => s.focus(c) };
    const resize = () => s.resize(el.clientWidth, el.clientHeight);
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    return () => {
      ro.disconnect();
      s.dispose();
      sc.current = null;
    };
    // Sahne yalnızca gece/gündüz ve parti rengi değişince yeniden kurulur.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [night, partyColor]);

  useEffect(() => sc.current?.update(city, analysis), [city, analysis]);
  useEffect(() => sc.current?.setTool(tool), [tool]);
  useEffect(() => sc.current?.setOverlay(overlay), [overlay]);
  useEffect(() => sc.current?.setSelected(selected), [selected]);

  return <div ref={host} className="city-host" />;
}
