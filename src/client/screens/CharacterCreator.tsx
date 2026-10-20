import { useState } from 'react';
import { BACKGROUNDS, makeCharacter } from '../../shared/politics';
import type { Avatar as AvatarT, BackgroundId, ClientMessage, Ideology } from '../../shared/types';
import { Avatar, HAIR_COLORS, HAIR_LABELS, SKINS, SUITS, TIES } from '../ui/Avatar';
import { Compass, Meter, ideologyLabel } from '../ui/Widgets';

const BG_ICONS: Record<BackgroundId, string> = {
  ekonomist: '📈',
  asker: '🎖️',
  isInsani: '💼',
  sendikaci: '📣',
  akademisyen: '🎓',
  hukukcu: '⚖️',
};

export function CharacterCreator({ send }: { send: (m: ClientMessage) => void }) {
  const [name, setName] = useState('');
  const [age, setAge] = useState(45);
  const [background, setBackground] = useState<BackgroundId>('sendikaci');
  const [ideology, setIdeology] = useState<Ideology>({ economic: -0.2, social: -0.1 });
  const [avatar, setAvatar] = useState<AvatarT>({ skin: 1, hair: 2, hairColor: 0, suit: 0, tie: 0 });
  const preview = (() => {
    try {
      return makeCharacter({ name: name || 'Aday', age, background, ideology, avatar });
    } catch {
      return null;
    }
  })();
  const set = (k: keyof AvatarT, v: number) => setAvatar((a) => ({ ...a, [k]: v }));
  const swatches = (k: keyof AvatarT, list: string[]) => (
    <div className="swatches">
      {list.map((c, i) => (
        <button
          key={i}
          type="button"
          className={`swatch ${avatar[k] === i ? 'on' : ''}`}
          style={{ background: c === 'none' ? 'transparent' : c }}
          aria-label={`${k} ${i + 1}`}
          onClick={() => set(k, i)}
        >
          {c === 'none' ? '∅' : ''}
        </button>
      ))}
    </div>
  );
  return (
    <main className="creator">
      <header className="screen-head">
        <div className="step-pill">Adım 1 / 3</div>
        <h2>Liderini oluştur</h2>
        <p className="muted">Geçmişin hangi seçmeni etkileyeceğini, ideolojin hangi partiye yakın olduğunu belirler.</p>
      </header>
      <div className="creator-grid">
        <aside className="creator-preview card">
          <Avatar a={avatar} size={168} ring="var(--gold)" />
          <div className="creator-name">{name || 'İsimsiz aday'}</div>
          <div className="muted small">
            {age} yaşında · {BACKGROUNDS[background].label}
          </div>
          <div className="small">{ideologyLabel(ideology)}</div>
          <div className="creator-charisma">
            <span className="small">Karizma</span>
            <Meter value={(preview?.charisma ?? 0) * 100} color="var(--gold)" />
          </div>
          <ul className="perks">
            {BACKGROUNDS[background].perks.map((p) => (
              <li key={p}>✦ {p}</li>
            ))}
          </ul>
        </aside>
        <form
          className="creator-form"
          onSubmit={(e) => {
            e.preventDefault();
            send({ type: 'createCharacter', character: { name: name.trim(), age, background, ideology, avatar } });
          }}
        >
          <section className="card">
            <h3>Kimlik</h3>
            <div className="row2">
              <label>
                Ad soyad
                <input value={name} onChange={(e) => setName(e.target.value)} maxLength={32} placeholder="Örn. Gürkan Özkan" autoFocus />
              </label>
              <label>
                Yaş: <b>{age}</b>
                <input type="range" min={30} max={80} value={age} onChange={(e) => setAge(Number(e.target.value))} />
              </label>
            </div>
          </section>
          <section className="card">
            <h3>Geçmiş</h3>
            <div className="bg-grid">
              {(Object.keys(BACKGROUNDS) as BackgroundId[]).map((id) => (
                <button type="button" key={id} className={`bg-card ${background === id ? 'on' : ''}`} onClick={() => setBackground(id)}>
                  <span className="bg-icon">{BG_ICONS[id]}</span>
                  <b>{BACKGROUNDS[id].label}</b>
                  <span className="small muted">{BACKGROUNDS[id].desc}</span>
                </button>
              ))}
            </div>
          </section>
          <section className="card creator-ideo">
            <div>
              <h3>İdeoloji</h3>
              <p className="small muted">Pusulada bir noktaya dokun. Ekonomide sol–sağ, toplumsal konularda özgürlükçü–muhafazakâr.</p>
              <p>
                <b>{ideologyLabel(ideology)}</b>
              </p>
            </div>
            <Compass value={ideology} onChange={setIdeology} />
          </section>
          <section className="card">
            <h3>Görünüm</h3>
            <div className="look-grid">
              <div>
                <span className="small muted">Ten</span>
                {swatches('skin', SKINS)}
              </div>
              <div>
                <span className="small muted">Saç rengi</span>
                {swatches('hairColor', HAIR_COLORS)}
              </div>
              <div>
                <span className="small muted">Saç</span>
                <div className="chips">
                  {HAIR_LABELS.map((l, i) => (
                    <button type="button" key={l} className={`chip ${avatar.hair === i ? 'on' : ''}`} onClick={() => set('hair', i)}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <span className="small muted">Takım</span>
                {swatches('suit', SUITS)}
              </div>
              <div>
                <span className="small muted">Kravat</span>
                {swatches('tie', TIES)}
              </div>
            </div>
          </section>
          <div className="form-foot">
            <button className="primary big" disabled={name.trim().length < 2}>
              Siyasete atıl →
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
