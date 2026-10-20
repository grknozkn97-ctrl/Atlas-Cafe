/**
 * Tek oyunculu deneme modu: simülasyon sunucu yerine tarayıcıda çalışır.
 * `useGame` ile aynı arayüzü sunar; ek olarak oyun hızı ayarlanabilir.
 * Oyuncu bir partiye girene kadar zaman akmaz.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { dispatch, playerView } from '../shared/dispatch';
import { createRng } from '../shared/ministers';
import type { ClientMessage } from '../shared/types';
import { createWorld, summarize, tickWorld, type World } from '../shared/world';
import type { GameState } from './useGame';

const SAVE_KEY = 'devlet.demo.v3';

export const SPEEDS = [
  { label: 'Durdur', icon: '⏸', ms: 0 },
  { label: 'Normal', icon: '▶', ms: 2000 },
  { label: 'Hızlı', icon: '⏩', ms: 500 },
  { label: 'Çok hızlı', icon: '⏭', ms: 120 },
];

interface Saved {
  world: World;
  playerName: string | null;
}

function load(): Saved | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Saved;
    return s.world?.version === 3 ? s : null;
  } catch {
    return null;
  }
}

function save(s: Saved) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(s));
  } catch {
    /* depolama kapalıysa oyun yine de çalışır, sadece kaydedilmez */
  }
}

const PLAYER_ID = 'yerel-oyuncu';

export function useLocalGame() {
  const saved = useRef<Saved | null>(null);
  if (saved.current === null) saved.current = load() ?? { world: createWorld(createRng(Date.now() % 2 ** 31)), playerName: null };
  const world = saved.current.world;
  const rng = useRef(createRng((Date.now() + 7) % 2 ** 31));
  // Her açılışta oyun duraklatılmış başlar; oyuncu hazır olunca başlatır.
  const [speedMs, setSpeedMs] = useState(0);

  const snapshot = useCallback((): Partial<GameState> => {
    const p = world.players[PLAYER_ID];
    const c = p?.countryId ? world.countries[p.countryId] : null;
    return {
      day: world.day,
      world: summarize(world),
      country: c ? structuredClone(c) : null,
      player: playerView(p),
      playerName: p?.name ?? null,
    };
  }, [world]);

  const [state, setState] = useState<GameState>(() => ({
    connected: true,
    needsLogin: !world.players[PLAYER_ID],
    playerName: null,
    day: world.day,
    dayMs: SPEEDS[1].ms,
    lastTickAt: Date.now(),
    world: summarize(world),
    country: null,
    player: null,
    error: null,
    notice: null,
    electionNight: null,
    localNight: null,
    offline: true,
    ...snapshot(),
  }));

  const ready = !!world.players[PLAYER_ID]?.membership;
  const effective = ready ? speedMs : 0;

  useEffect(() => {
    if (!effective) return;
    let ticks = 0;
    const t = setInterval(() => {
      const nights = tickWorld(world, rng.current);
      const mine = nights.find((n) => n.playerIds.includes(PLAYER_ID));
      ticks += 1;
      if (ticks % 10 === 0 || mine) save(saved.current!);
      // Seçim gecesi sonuçları ekrandayken zaman durur.
      if (mine) setSpeedMs(0);
      setState((s) => ({
        ...s,
        ...snapshot(),
        lastTickAt: Date.now(),
        electionNight: mine?.result ? { countryName: mine.countryName, result: mine.result } : s.electionNight,
        localNight: mine?.local ? { countryName: mine.countryName, result: mine.local } : s.localNight,
      }));
    }, effective);
    return () => clearInterval(t);
  }, [effective, world, snapshot]);

  const send = useCallback(
    (msg: ClientMessage) => {
      const player = world.players[PLAYER_ID];
      try {
        if (!player) throw new Error('Önce oyuna başla.');
        const note = dispatch(world, player, msg, rng.current);
        save(saved.current!);
        setState((s) => ({ ...s, ...snapshot(), error: null, notice: note || null }));
      } catch (err) {
        setState((s) => ({ ...s, notice: null, error: err instanceof Error ? err.message : 'Bilinmeyen hata' }));
      }
    },
    [world, snapshot],
  );

  const login = useCallback(
    (name: string) => {
      if (!world.players[PLAYER_ID]) {
        world.players[PLAYER_ID] = { id: PLAYER_ID, token: PLAYER_ID, name, countryId: null, partyId: null, character: null };
      }
      saved.current!.playerName = name;
      save(saved.current!);
      setState((s) => ({ ...s, needsLogin: false, ...snapshot() }));
    },
    [world, snapshot],
  );

  const logout = useCallback(() => {
    // Deneme modunda çıkış, kaydı silip yeni bir dünya başlatır.
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch {
      /* yok say */
    }
    location.reload();
  }, []);

  const setSpeed = useCallback((ms: number) => {
    setSpeedMs(ms);
    setState((s) => ({ ...s, dayMs: ms || s.dayMs, lastTickAt: Date.now() }));
  }, []);

  const clearElection = useCallback(() => setState((s) => ({ ...s, electionNight: null, localNight: null })), []);
  const clearError = useCallback(() => setState((s) => ({ ...s, error: null, notice: null })), []);

  return { state: { ...state, speedMs: effective }, send, login, logout, clearElection, clearError, setSpeed };
}
