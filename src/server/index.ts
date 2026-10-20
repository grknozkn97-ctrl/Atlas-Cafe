import { randomBytes, randomUUID } from 'node:crypto';
import { createReadStream, existsSync, mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from 'node:fs';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { dirname, extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer, type WebSocket } from 'ws';
import { createRng } from '../shared/ministers';
import type { ClientMessage, ServerMessage } from '../shared/types';
import { claimCountry, createWorld, releaseCountry, summarize, tickWorld, type Player, type World } from '../shared/world';
import { handleAction } from './actions';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const PORT = Number(process.env.PORT ?? 3001);
/** Bir oyun gününün gerçek süresi. Varsayılan: 1 gerçek gün ≈ 2 oyun ayı (60 oyun günü) → 24 dakika. */
const DAY_MS = Number(process.env.GAME_DAY_MS ?? 24 * 60 * 1000);
const DATA_FILE = process.env.DATA_FILE ?? join(ROOT, 'data', 'world.json');
const STATIC_DIR = join(ROOT, 'dist');

const rng = createRng(Number(process.env.SEED ?? Date.now() % 2 ** 31));

function loadWorld(): World {
  if (existsSync(DATA_FILE)) {
    try {
      const w = JSON.parse(readFileSync(DATA_FILE, 'utf8')) as World;
      if (w.version === 1) {
        console.log(`Dünya yüklendi: gün ${w.day}, ${Object.keys(w.players).length} oyuncu`);
        return w;
      }
    } catch (err) {
      console.error('Kayıt okunamadı, yeni dünya oluşturuluyor:', err);
    }
  }
  console.log('Yeni dünya oluşturuldu.');
  return createWorld(rng);
}

function saveWorld() {
  mkdirSync(dirname(DATA_FILE), { recursive: true });
  const tmp = `${DATA_FILE}.tmp`;
  writeFileSync(tmp, JSON.stringify(world));
  renameSync(tmp, DATA_FILE);
}

const world = loadWorld();

// ---------------------------------------------------------------- bağlantılar

interface Session {
  ws: WebSocket;
  player: Player | null;
}

const sessions = new Set<Session>();

function send(ws: WebSocket, msg: ServerMessage) {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(msg));
}

function stateFor(s: Session): ServerMessage {
  const countryId = s.player?.countryId ?? null;
  return {
    type: 'state',
    day: world.day,
    dayMs: DAY_MS,
    world: summarize(world),
    country: countryId ? world.countries[countryId] : null,
  };
}

function broadcast() {
  for (const s of sessions) if (s.player) send(s.ws, stateFor(s));
}

function sendToPlayer(playerId: string, msg: ServerMessage) {
  for (const s of sessions) if (s.player?.id === playerId) send(s.ws, msg);
}

function handleMessage(s: Session, msg: ClientMessage) {
  if (msg.type === 'hello') {
    let player = msg.token ? Object.values(world.players).find((p) => p.token === msg.token) : undefined;
    if (!player) {
      const name = String(msg.name ?? '').trim().slice(0, 24);
      if (!name) throw new Error('Bir oyuncu adı gir.');
      player = { id: randomUUID(), token: randomBytes(24).toString('hex'), name, countryId: null };
      world.players[player.id] = player;
    }
    s.player = player;
    send(s.ws, { type: 'welcome', token: player.token, playerName: player.name, countryId: player.countryId });
    send(s.ws, stateFor(s));
    return;
  }
  const player = s.player;
  if (!player) throw new Error('Önce giriş yapmalısın.');

  if (msg.type === 'chooseCountry') {
    claimCountry(world, player, msg.countryId);
    broadcast();
    return;
  }
  if (msg.type === 'leaveCountry') {
    if (player.countryId) releaseCountry(world.countries[player.countryId]);
    player.countryId = null;
    broadcast();
    return;
  }
  const c = player.countryId ? world.countries[player.countryId] : null;
  if (!c || c.ownerId !== player.id) throw new Error('Yönettiğin bir ülke yok.');
  handleAction(c, world.day, msg, rng);
  send(s.ws, stateFor(s));
}

// ---------------------------------------------------------------- HTTP (derlenmiş istemci)

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
};

function serveStatic(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url ?? '/', 'http://localhost');
  if (url.pathname === '/health') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: true, day: world.day }));
    return;
  }
  let file = normalize(join(STATIC_DIR, decodeURIComponent(url.pathname)));
  if (!file.startsWith(STATIC_DIR)) {
    res.writeHead(403).end();
    return;
  }
  if (!existsSync(file) || statSync(file).isDirectory()) file = join(STATIC_DIR, 'index.html');
  if (!existsSync(file)) {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('İstemci derlenmemiş. Geliştirme için "npm run dev" kullan.');
    return;
  }
  res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' });
  createReadStream(file).pipe(res);
}

const server = createServer(serveStatic);
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws) => {
  const s: Session = { ws, player: null };
  sessions.add(s);
  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(String(raw)) as ClientMessage;
      handleMessage(s, msg);
    } catch (err) {
      send(ws, { type: 'error', message: err instanceof Error ? err.message : 'Bilinmeyen hata' });
    }
  });
  ws.on('close', () => sessions.delete(s));
});

// ---------------------------------------------------------------- oyun döngüsü

let ticks = 0;
setInterval(() => {
  const gameOvers = tickWorld(world, rng);
  for (const g of gameOvers) sendToPlayer(g.playerId, { type: 'gameOver', countryName: g.countryName, reason: g.reason });
  broadcast();
  ticks += 1;
  if (ticks % 5 === 0) saveWorld();
}, DAY_MS);

function shutdown() {
  saveWorld();
  console.log('Dünya kaydedildi.');
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

server.listen(PORT, () => {
  console.log(`Sunucu http://localhost:${PORT} adresinde. 1 oyun günü = ${(DAY_MS / 1000).toFixed(1)} sn.`);
});
