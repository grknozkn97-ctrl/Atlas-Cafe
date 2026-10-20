import { useState } from 'react';
import { describeSwap, ministerSwapEstimate } from '../../shared/advisor';
import { MINISTRIES, MINISTRY_LABELS, formatGameDate } from '../../shared/constants';
import { DIRECTIVES } from '../../shared/sim';
import type { Directive, Minister, MinistryId } from '../../shared/types';
import type { PanelProps } from '../App';
import { MinisterProfile, PersonCard } from '../ui/MinisterProfile';

export function MinistersPanel({ c, send }: PanelProps) {
  const [open, setOpen] = useState<MinistryId | null>(null);
  const [profile, setProfile] = useState<{ m: Minister; ministry: MinistryId; current: boolean } | null>(null);
  const card = c.reportCards[0];
  const rulingColor = c.parties.find((p) => p.id === c.rulingPartyId)?.color;
  return (
    <div className="stack">
      <p className="muted small">
        Her bakan farklı bir karakter: geçmişi, uzmanlığı ve özellikleri işini nasıl yapacağını belirler. Bir isme dokun; danışmanın,
        onu atarsan ne değişeceğini tahmin etsin. Bakanlara çalışma talimatı da verebilirsin. Karneler her çeyrek yenilenir
        {card ? ` (son karne: ${formatGameDate(card.day)})` : ''}.
      </p>
      <div className="minister-grid">
        {MINISTRIES.map((m) => {
          const min = c.ministers[m];
          const grade = card?.entries.find((e) => e.ministry === m);
          const dir = c.directives?.[m] ?? 'dengeli';
          return (
            <section className="card minister" key={m}>
              <div className="minister-head">
                <h3>{MINISTRY_LABELS[m]}</h3>
                {grade && <span className={`grade g${grade.grade}`}>{grade.grade}</span>}
              </div>
              {min ? (
                <>
                  <PersonCard m={min} ring={rulingColor} onClick={() => setProfile({ m: min, ministry: m, current: true })} />
                  {grade && <p className="small muted">{grade.note}</p>}
                  <div className="small muted">Talimat: {DIRECTIVES[dir].label}</div>
                  <div className="actions">
                    <button className="ghost small" onClick={() => setOpen(open === m ? null : m)}>
                      Adaylar ({c.candidates[m].length})
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="bad">Bakanlık boş: hizmetler verimsiz yürüyor.</p>
                  <button className="primary small" onClick={() => setOpen(m)}>
                    Bakan seç
                  </button>
                </>
              )}
              {open === m && (
                <div className="pool">
                  {c.candidates[m].length === 0 && <p className="muted small">Şu an aday yok. Her çeyrekte yeni adaylar çıkar.</p>}
                  {c.candidates[m].map((cand) => {
                    const est = ministerSwapEstimate(c, m, cand);
                    return (
                      <PersonCard
                        key={cand.id}
                        m={cand}
                        compare={min}
                        sub={
                          <>
                            {cand.profession} ·{' '}
                            <span className={est.approval >= 0 ? 'good' : 'bad'}>
                              onay {est.approval >= 0 ? '+' : ''}
                              {est.approval.toFixed(1)}
                            </span>
                          </>
                        }
                        onClick={() => setProfile({ m: cand, ministry: m, current: false })}
                      />
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>
      {profile && (
        <MinisterProfile
          m={profile.m}
          role={`${MINISTRY_LABELS[profile.ministry]} ${profile.current ? 'Bakanı' : 'Bakanlığı adayı'}`}
          compare={profile.current ? null : c.ministers[profile.ministry]}
          estimate={
            profile.current
              ? `Görevden alırsan bakanlık boş kalır: uzun vadede ${describeSwap(ministerSwapEstimate(c, profile.ministry, null))}.${profile.m.loyalty < 0.4 ? ' Sadakati düşük; görevden alınırsa seni açıkça eleştirir.' : ''}`
              : `Atarsan uzun vadede ${describeSwap(ministerSwapEstimate(c, profile.ministry, profile.m))}. Kabine değişikliği piyasa güvenini kısa süre 1 puan düşürür.`
          }
          onClose={() => setProfile(null)}
        >
          {profile.current ? (
            <>
              <div className="directives">
                <div className="small muted">Çalışma talimatı</div>
                {(Object.keys(DIRECTIVES) as Directive[]).map((d) => (
                  <button
                    key={d}
                    className={`directive ${(c.directives?.[profile.ministry] ?? 'dengeli') === d ? 'on' : ''}`}
                    onClick={() => send({ type: 'ministerDirective', ministry: profile.ministry, directive: d })}
                  >
                    <b>{DIRECTIVES[d].label}</b>
                    <span className="small muted">{DIRECTIVES[d].desc}</span>
                  </button>
                ))}
              </div>
              <button
                className="danger small"
                onClick={() => {
                  send({ type: 'dismissMinister', ministry: profile.ministry });
                  setProfile(null);
                }}
              >
                Görevden al
              </button>
            </>
          ) : (
            <button
              className="primary"
              onClick={() => {
                send({ type: 'appointMinister', ministry: profile.ministry, candidateId: profile.m.id });
                setProfile(null);
                setOpen(null);
              }}
            >
              Bakan olarak ata
            </button>
          )}
        </MinisterProfile>
      )}
    </div>
  );
}
