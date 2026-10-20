/**
 * Tek oyunculu deneme modu: simülasyon sunucu yerine tarayıcıda çalışır.
 * `useGame` ile aynı arayüzü sunar; ek olarak oyun hızı ayarlanabilir.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { createRng } from '../shared/ministers';
import type { ClientMessage } from '../shared/types';
import { claimCountry, createWorld, releaseCountry, summarize, tickWorld, type World } from '../shared/world';
import { handleAction } from '../server/actions';
import type { GameState } from './useGame';

const SAVE_KEY = 'devlet.demo.v1';

export const SPEEDS = [
  { label: 'Durdur', ms: 0 },
  { label: 'Normal', ms: 2000 },
  { label: 'Hızlı', ms: 500 },
  { label: 'Çok hızlı', ms: 120 },
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
    return s.world?.version === 1 ? s : null;
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
  const [speedMs, setSpeedMs] = useState(SPEEDS[1].ms);

  const snapshot = useCallback(
    (extra: Partial<GameState> = {}): Partial<GameState> => {
      const p = world.players[PLAYER_ID];
      const c = p?.countryId ? world.countries[p.countryId] : null;
      return {
        day: world.day,
        world: summarize(world),
        country: c ? structuredClone(c) : null,
        ...extra,
      };
    },
    [world],
  );

  const [state, setState] = useState<GameState>(() => ({
    connected: true,
    needsLogin: !saved.current!.playerName,
    playerName: saved.current!.playerName,
    day: world.day,
    dayMs: SPEEDS[1].ms,
    lastTickAt: Date.now(),
    world: summarize(world),
    country: null,
    error: null,
    gameOver: null,
    offline: true,
    ...snapshot(),
  }));

  useEffect(() => {
    if (!speedMs) return;
    let ticks = 0;
    const t = setInterval(() => {
      const overs = tickWorld(world, rng.current);
      const over = overs.find((o) => o.playerId === PLAYER_ID);
      ticks += 1;
      if (ticks % 10 === 0) save(saved.current!);
      setState((s) => ({
        ...s,
        ...snapshot(),
        lastTickAt: Date.now(),
        gameOver: over ? { countryName: over.countryName, reason: over.reason } : s.gameOver,
      }));
    }, speedMs);
    return () => clearInterval(t);
  }, [speedMs, world, snapshot]);

  const send = useCallback(
    (msg: ClientMessage) => {
      const player = world.players[PLAYER_ID];
      try {
        if (msg.type === 'chooseCountry') claimCountry(world, player, msg.countryId);
        else if (msg.type === 'leaveCountry') {
          if (player.countryId) releaseCountry(world.countries[player.countryId]);
          player.countryId = null;
        } else {
          const c = player.countryId ? world.countries[player.countryId] : null;
          if (!c) throw new Error('Yönettiğin bir ülke yok.');
          handleAction(c, world.day, msg, rng.current);
        }
        save(saved.current!);
        setState((s) => ({ ...s, ...snapshot(), error: null }));
      } catch (err) {
        setState((s) => ({ ...s, error: err instanceof Error ? err.message : 'Bilinmeyen hata' }));
      }
    },
    [world, snapshot],
  );

  const login = useCallback(
    (name: string) => {
      world.players[PLAYER_ID] = { id: PLAYER_ID, token: PLAYER_ID, name, countryId: null };
      saved.current!.playerName = name;
      save(saved.current!);
      setState((s) => ({ ...s, needsLogin: false, playerName: name, ...snapshot() }));
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
    setState((s) => ({ ...s, dayMs: ms || s.dayMs, speedMs: ms, lastTickAt: Date.now() }));
  }, []);

  const clearGameOver = useCallback(() => setState((s) => ({ ...s, gameOver: null })), []);
  const clearError = useCallback(() => setState((s) => ({ ...s, error: null })), []);

  return { state: { ...state, speedMs }, send, login, logout, clearGameOver, clearError, setSpeed };
}
