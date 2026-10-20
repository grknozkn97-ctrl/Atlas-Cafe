import { useCallback, useEffect, useRef, useState } from 'react';
import type { ClientMessage, CountryState, CountrySummary, ElectionResult, LocalElectionResult, PlayerView, ServerMessage } from '../shared/types';

const TOKEN_KEY = 'devlet.token';

function readToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function writeToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* tarayıcı depolaması kapalı olabilir */
  }
}

export interface GameState {
  connected: boolean;
  needsLogin: boolean;
  playerName: string | null;
  day: number;
  dayMs: number;
  lastTickAt: number;
  world: CountrySummary[];
  country: CountryState | null;
  player: PlayerView | null;
  error: string | null;
  notice: string | null;
  electionNight: { countryName: string; result: ElectionResult } | null;
  localNight: { countryName: string; result: LocalElectionResult } | null;
  /** Tek oyunculu deneme modu (tarayıcıda simülasyon) */
  offline?: boolean;
  /** Deneme modunda oyun hızı; 0 = durdurulmuş */
  speedMs?: number;
}

const initial: GameState = {
  connected: false,
  needsLogin: !readToken(),
  playerName: null,
  day: 0,
  dayMs: 1000,
  lastTickAt: Date.now(),
  world: [],
  country: null,
  player: null,
  error: null,
  notice: null,
  electionNight: null,
  localNight: null,
};

export function useGame() {
  const [state, setState] = useState<GameState>(initial);
  const wsRef = useRef<WebSocket | null>(null);
  const pendingName = useRef<string | null>(null);

  const rawSend = useCallback((msg: ClientMessage) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
  }, []);

  useEffect(() => {
    let closed = false;
    let retry: ReturnType<typeof setTimeout>;

    const connect = () => {
      const proto = location.protocol === 'https:' ? 'wss' : 'ws';
      const ws = new WebSocket(`${proto}://${location.host}/ws`);
      wsRef.current = ws;
      ws.onopen = () => {
        setState((s) => ({ ...s, connected: true }));
        const token = readToken();
        if (token) ws.send(JSON.stringify({ type: 'hello', token }));
        else if (pendingName.current) ws.send(JSON.stringify({ type: 'hello', name: pendingName.current }));
      };
      ws.onmessage = (ev) => {
        const msg = JSON.parse(ev.data) as ServerMessage;
        setState((s) => reduce(s, msg));
      };
      ws.onclose = () => {
        setState((s) => ({ ...s, connected: false }));
        if (!closed) retry = setTimeout(connect, 2000);
      };
    };
    connect();
    return () => {
      closed = true;
      clearTimeout(retry);
      wsRef.current?.close();
    };
  }, []);

  const login = useCallback(
    (name: string) => {
      pendingName.current = name;
      writeToken(null);
      rawSend({ type: 'hello', name });
    },
    [rawSend],
  );

  const send = useCallback(
    (msg: ClientMessage) => {
      setState((s) => ({ ...s, error: null }));
      rawSend(msg);
    },
    [rawSend],
  );

  const clearElection = useCallback(() => setState((s) => ({ ...s, electionNight: null, localNight: null })), []);
  const clearError = useCallback(() => setState((s) => ({ ...s, error: null, notice: null })), []);
  const logout = useCallback(() => {
    writeToken(null);
    setState((s) => ({ ...s, needsLogin: true, playerName: null, country: null, player: null }));
  }, []);

  return { state, send, login, logout, clearElection, clearError, setSpeed: undefined as ((ms: number) => void) | undefined };
}

function reduce(s: GameState, msg: ServerMessage): GameState {
  switch (msg.type) {
    case 'welcome':
      writeToken(msg.token);
      return { ...s, needsLogin: false, playerName: msg.playerName, error: null };
    case 'state':
      return {
        ...s,
        day: msg.day,
        dayMs: msg.dayMs,
        lastTickAt: msg.day !== s.day ? Date.now() : s.lastTickAt,
        world: msg.world,
        country: msg.country,
        player: msg.player,
        playerName: msg.player?.name ?? s.playerName,
      };
    case 'error':
      // Kayıtlı oturum sunucuda yoksa yeniden giriş iste.
      if (!s.playerName) {
        writeToken(null);
        return { ...s, needsLogin: true, error: msg.message };
      }
      return { ...s, error: msg.message };
    case 'notice':
      return { ...s, notice: msg.message };
    case 'electionNight':
      return { ...s, electionNight: { countryName: msg.countryName, result: msg.result } };
    case 'localElectionNight':
      return { ...s, localNight: { countryName: msg.countryName, result: msg.result } };
  }
}
