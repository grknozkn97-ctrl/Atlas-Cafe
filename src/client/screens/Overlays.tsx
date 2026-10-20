import { useEffect, useState } from 'react';
import type { CountryState, ElectionResult, LocalElectionResult, PartySummary, PlayerView } from '../../shared/types';
import { pct } from '../format';
import { Avatar } from '../ui/Avatar';
import { Hemicycle } from '../ui/Hemicycle';
import { PartyBadge } from '../ui/Widgets';

/** Kurultay ya da kuruluş töreni. */
export function Ceremony({
  party,
  founded,
  notice,
  player,
  onDone,
}: {
  party: Pick<PartySummary, 'name' | 'short' | 'color'>;
  founded: boolean;
  notice: string | null;
  player: PlayerView | null;
  onDone: () => void;
}) {
  const target = Number(notice?.match(/%(\d+)/)?.[1] ?? 0);
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (founded || !target) return;
    let v = 0;
    const t = setInterval(() => {
      v = Math.min(target, v + 1);
      setShown(v);
      if (v >= target) clearInterval(t);
    }, 28);
    return () => clearInterval(t);
  }, [target, founded]);
  const done = founded || (target > 0 && shown >= target);
  return (
    <div className="modal-bg">
      <div className="modal ceremony" style={{ ['--party' as string]: party.color }}>
        <div className="confetti" aria-hidden />
        <PartyBadge p={party} size={72} />
        <div className="title-kicker">{founded ? 'Kuruluş bildirgesi' : 'Olağanüstü kurultay'}</div>
        <h2>{party.name}</h2>
        {player?.character && <Avatar a={player.character.avatar} size={110} ring={party.color} />}
        {!founded && (
          <div className="delegates">
            <div className="del-bar">
              <span style={{ width: `${shown}%`, background: party.color }} />
              <i style={{ left: '50%' }} />
            </div>
            <div className="small">
              Delegelerin oyu: <b>%{shown}</b>
            </div>
          </div>
        )}
        {done && (
          <>
            <p className="ceremony-line">
              {founded
                ? `${player?.character?.name ?? 'Sen'}, ${party.short} kurucu genel başkanı olarak yola çıktı.`
                : `${player?.character?.name ?? 'Sen'} artık ${party.short} genel başkanı!`}
            </p>
            <p className="small muted">Karargâhında mitingler düzenle, teşkilatını büyüt, vaatlerini belirle. Hazır olunca zamanı başlat.</p>
            <button className="primary big" onClick={onDone}>
              Karargâha geç →
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/** Seçim gecesi sonuçları. */
export function ElectionNight({
  countryName,
  result,
  c,
  player,
  onClose,
}: {
  countryName: string;
  result: ElectionResult;
  c: CountryState | null;
  player: PlayerView | null;
  onClose: () => void;
}) {
  const [go, setGo] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setGo(true), 80);
    return () => clearTimeout(t);
  }, []);
  const party = (id: string) => c?.parties.find((p) => p.id === id);
  const winner = party(result.winnerPartyId);
  const mine = player?.membership?.partyId ?? player?.partyId ?? null;
  const iWon = mine && result.coalition.includes(mine);
  const iLed = !!player?.partyId && player.partyId === result.winnerPartyId;
  const partyLed = mine === result.winnerPartyId;
  const myResult = result.results.find((r) => r.partyId === mine);
  const headline = iLed
    ? result.won
      ? 'Yeniden seçildin!'
      : 'Kazandın! Hükümeti sen kuruyorsun'
    : partyLed
      ? 'Partin iktidarda!'
      : iWon
      ? 'Partin koalisyonda yer aldı'
      : 'Muhalefette mücadele sürüyor';
  const max = Math.max(...result.results.map((r) => r.vote));
  return (
    <div className="modal-bg">
      <div className={`modal election ${iLed ? 'win' : ''}`}>
        <div className="title-kicker">🗳️ Seçim gecesi · {countryName}</div>
        <h2>{headline}</h2>
        <div className="results">
          {result.results.slice(0, 8).map((r) => {
            const p = party(r.partyId);
            if (!p) return null;
            return (
              <div key={r.partyId} className={`res-row ${r.partyId === mine ? 'me' : ''}`}>
                <PartyBadge p={p} size={30} />
                <span className="res-name">{p.short}</span>
                <span className="res-bar">
                  <span style={{ width: go ? `${(r.vote / max) * 100}%` : 0, background: p.color }} />
                </span>
                <span className="res-num">{pct(r.vote)}</span>
              </div>
            );
          })}
        </div>
        {result.runoff && (
          <p className="small">
            İkinci tur: <b>{party(result.runoff.a)?.short}</b> {pct(result.runoff.aVote)} – <b>{party(result.runoff.b)?.short}</b>{' '}
            {pct(100 - result.runoff.aVote)}
          </p>
        )}
        {c && <Hemicycle parties={c.parties} highlight={mine} size={300} />}
        <p className="small">
          Hükümet: <b>{result.coalition.map((id) => party(id)?.short).join(' + ')}</b>
          {winner && <> · Lider: {winner.leaderName}</>}
        </p>
        {myResult && !iLed && (
          <p className="small muted">
            Partin %{myResult.vote.toFixed(1)} oy aldı{myResult.seats ? ` ve meclise %${myResult.seats.toFixed(1)} sandalyeyle girdi` : ', barajın altında kaldı'}.
          </p>
        )}
        <button className="primary big" onClick={onClose}>
          Devam
        </button>
      </div>
    </div>
  );
}

/** Yerel seçim gecesi: hangi parti kaç il kazandı. */
export function LocalElectionNight({
  countryName,
  result,
  c,
  player,
  onClose,
}: {
  countryName: string;
  result: LocalElectionResult;
  c: CountryState | null;
  player: PlayerView | null;
  onClose: () => void;
}) {
  const [go, setGo] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setGo(true), 80);
    return () => clearTimeout(t);
  }, []);
  const party = (id: string) => c?.parties.find((p) => p.id === id);
  const mine = player?.membership?.partyId ?? null;
  const my = result.tally.find((t) => t.partyId === mine);
  const total = result.tally.reduce((s, t) => s + t.provinces, 0) || 1;
  const won = (c?.provinces ?? []).filter((pv) => pv.mayor.partyId === mine && pv.mayor.sinceDay === result.day).sort((a, b) => b.pop - a.pop);
  return (
    <div className="modal-bg">
      <div className={`modal election ${my && my.provinces > 0 ? 'win' : ''}`}>
        <div className="title-kicker">🏙️ Yerel seçim gecesi · {countryName}</div>
        <h2>{my?.provinces ? `Partin ${my.provinces} ilde belediye başkanlığını kazandı` : 'Partin bu seçimde il kazanamadı'}</h2>
        <div className="results">
          {result.tally.slice(0, 8).map((t) => {
            const p = party(t.partyId);
            if (!p) return null;
            return (
              <div key={t.partyId} className={`res-row ${t.partyId === mine ? 'me' : ''}`}>
                <PartyBadge p={p} size={30} />
                <span className="res-name">{p.short}</span>
                <span className="res-bar">
                  <span style={{ width: go ? `${(t.provinces / total) * 100}%` : 0, background: p.color }} />
                </span>
                <span className="res-num">{t.provinces} il</span>
              </div>
            );
          })}
        </div>
        <p className="small">{result.flips} belediye el değiştirdi.</p>
        {won.length > 0 && (
          <p className="small">
            Yeni belediyelerin: <b>{won.slice(0, 8).map((pv) => pv.name).join(', ')}</b>
            {won.length > 8 ? ` ve ${won.length - 8} il daha` : ''}. Genel başkansan bu illerin bütçesini ve projelerini İller sekmesinden yönetebilirsin.
          </p>
        )}
        <button className="primary big" onClick={onClose}>
          Devam
        </button>
      </div>
    </div>
  );
}
