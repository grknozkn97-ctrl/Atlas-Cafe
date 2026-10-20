import { CHALLENGE_TRUST, MEDIA, challengeChance, mediaEffect } from './career';
import { MINISTRIES, MINISTRY_LABELS } from './constants';
import { attractiveness, housingRatio, isPlayerMunicipality, nominationCost, projectCost } from './local';
import { OFFICES, goalProgress, goalValue, officeTitle } from './offices';
import { ACTION_COOLDOWNS, ACTION_COSTS, regionFit, topIssue } from './politics';
import { approvalFromGroups, approvalTargets, clamp, confidenceTarget, inCampaign, qualityTargets } from './sim';
import type { ClientMessage, CountryState, MediaAction, Minister, MinistryId, Party, PlayerView, Province } from './types';

/** Danışmanın tek bir önerisi. */
export interface Advice {
  id: string;
  icon: string;
  title: string;
  /** Neden öneriliyor */
  why: string;
  /** Tahmini sonuç */
  estimate: string;
  /** Tek tıkla uygulanabilecek eylem */
  action?: ClientMessage;
  /** Eylem yerine gidilecek sekme */
  goto?: 'parti' | 'iller' | 'kabine' | 'ekonomi' | 'kampanya';
  /** 0-100; yüksek olan önce gösterilir */
  priority: number;
}

export interface AdvisorPersona {
  name: string;
  title: string;
  avatar: { skin: number; hair: number; hairColor: number; suit: number; tie: number };
}

const ADVISOR_NAMES = {
  tr: ['Selin Aydemir', 'Murat Kaplan', 'Defne Uçar', 'Kerem Taşkın', 'Elif Sarıgül'],
  genel: ['Clara Novak', 'Daniel Brooks', 'Mira Hansen', 'Victor Silva', 'Nadia Romano'],
};

export function advisorPersona(c: CountryState, playerId: string): AdvisorPersona {
  let h = 0;
  for (const ch of playerId + c.id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const list = ADVISOR_NAMES[c.names];
  return {
    name: list[h % list.length],
    title: 'Siyasi danışmanın',
    avatar: { skin: h % 4, hair: (h >> 3) % 5, hairColor: (h >> 5) % 4, suit: (h >> 7) % 4, tie: (h >> 9) % 5 },
  };
}

const pct = (x: number) => `%${Math.round(x * 100)}`;
const signed = (x: number, d = 1) => `${x >= 0 ? '+' : '−'}${Math.abs(x).toFixed(d)}`;

// ---------------------------------------------------------------- bakan tahmini

/** Uzun vadede (hedef değerlere oturduğunda) bir bakan değişikliğinin etkisi. */
export function ministerSwapEstimate(c: CountryState, ministry: MinistryId, candidate: Minister | null) {
  const settle = (x: CountryState) => {
    const q = qualityTargets(x);
    const y = { ...x, quality: q };
    y.confidence = confidenceTarget(y);
    return { q, approval: approvalFromGroups(approvalTargets(y).groups), confidence: y.confidence };
  };
  const before = settle(c);
  const after = settle({ ...c, ministers: { ...c.ministers, [ministry]: candidate } });
  const qid = Object.keys(before.q).find((k) => before.q[k as keyof typeof before.q] !== after.q[k as keyof typeof after.q]) as
    | keyof typeof before.q
    | undefined;
  return {
    approval: after.approval - before.approval,
    confidence: after.confidence - before.confidence,
    quality: qid ? after.q[qid] - before.q[qid] : 0,
  };
}

export function describeSwap(e: ReturnType<typeof ministerSwapEstimate>) {
  const parts = [`onay ${signed(e.approval)}`];
  if (Math.abs(e.quality) >= 0.5) parts.push(`hizmet kalitesi ${signed(e.quality, 0)}`);
  if (Math.abs(e.confidence) >= 0.5) parts.push(`piyasa güveni ${signed(e.confidence, 0)}`);
  return parts.join(', ');
}

// ---------------------------------------------------------------- öneriler

function mediaAdvice(c: CountryState, me: PlayerView, day: number, isLeader: boolean): Advice[] {
  const ch = me.character;
  if (!ch) return [];
  const trust = me.membership?.trust ?? 0;
  const needTrust = !isLeader && trust < CHALLENGE_TRUST;
  const out: Advice[] = [];
  for (const a of Object.keys(MEDIA) as MediaAction[]) {
    if ((me.cooldowns?.[a] ?? 0) > day) continue;
    const e = mediaEffect(a, ch.charisma, me.fame, isLeader);
    // Güven azsa güveni, liderse ivmeyi, değilse tanınırlığı öne çıkar.
    const value = isLeader ? e.momentum * 30 + e.fame * 2 : needTrust ? e.trust * 9 + e.fame * 2 : e.fame * 5 + e.trust * 2;
    const parts = [`tanınırlık +${e.fame.toFixed(1)}`];
    if (e.trust) parts.push(`partinin güveni +${e.trust}`);
    parts.push(`parti ivmesi +${e.momentum.toFixed(1)}`);
    if (e.risk) parts.push(`gaf riski ${pct(e.risk)}`);
    if (e.cost) parts.push(`maliyet ${e.cost} milyon $`);
    out.push({
      id: `media:${a}`,
      icon: MEDIA[a].icon,
      title: MEDIA[a].label,
      why: needTrust
        ? a === 'sahaCalismasi' || a === 'mitingKonusmasi'
          ? `Genel başkanlığa aday olmak için partinin güveni ${CHALLENGE_TRUST} olmalı, şu an ${Math.round(trust)}. Teşkilat seni sahada görmek istiyor.`
          : MEDIA[a].desc
        : MEDIA[a].desc,
      estimate: parts.join(', '),
      action: { type: 'media', action: a },
      priority: clamp(25 + value, 0, 90),
    });
  }
  return out;
}

function memberAdvice(c: CountryState, me: PlayerView, p: Party, day: number): Advice[] {
  // Medya önerilerinden en iyi ikisi yeter; tamamı Medya kartında.
  const out = mediaAdvice(c, me, day, false)
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 2);
  const trust = me.membership?.trust ?? 0;
  if (p.inGovernment) {
    out.push({
      id: 'iktidarUyesi',
      icon: '🏛️',
      title: 'İktidar partisinde sabırlı ol',
      why: 'İktidardaki partide genel başkanlık yarışı açılmaz. Tanınırlık ve güven topla; parti iktidarı kaybederse kurultay yolu açılır. Ya da güvenini taşıyabileceğin bir muhalefet partisine geç.',
      estimate: `Şu anki güven ${Math.round(trust)}, tanınırlık ${Math.round(me.fame)}.`,
      priority: 30,
    });
  } else if (trust >= CHALLENGE_TRUST && (me.cooldowns?.kurultay ?? 0) <= day) {
    const chance = challengeChance(c, p, me);
    out.push({
      id: 'kurultay',
      icon: '🗳️',
      title: 'Kurultaya git, genel başkanlığa aday ol',
      why:
        chance >= 0.45
          ? `Delegeler seni destekliyor. ${p.leaderName} karşısında şansın iyi.`
          : `Güven eşiğini geçtin ama ${p.leaderName} hâlâ güçlü. Biraz daha tanınırlık toplarsan şansın artar.`,
      estimate: `Kazanma şansı ${pct(chance)}. Kaybedersen partinin güveni −25.`,
      action: { type: 'challengeLeader' },
      priority: chance >= 0.45 ? 95 : 40,
    });
  } else if (!p.inGovernment) {
    out.push({
      id: 'kurultayYol',
      icon: '🧭',
      title: 'Genel başkanlık yolu',
      why: `Kurultaya gitmek için partinin güveni en az ${CHALLENGE_TRUST} olmalı.`,
      estimate: `Şu an ${Math.round(trust)}. Saha çalışması her seferinde +4 getirir; yaklaşık ${Math.max(1, Math.ceil((CHALLENGE_TRUST - trust) / 4))} saha turu gerekir.`,
      goto: 'parti',
      priority: 35,
    });
  }
  return out;
}

function oppositionLeaderAdvice(c: CountryState, me: PlayerView, p: Party, day: number): Advice[] {
  const out = mediaAdvice(c, me, day, true)
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 1);
  const charisma = p.leader?.charisma ?? 0.5;
  const mult = p.leader?.background === 'sendikaci' ? 1.25 : 1;
  // En verimli miting bölgesi
  const best = c.regions
    .filter((r) => (p.cooldowns[`miting:${r.id}`] ?? 0) <= day)
    .map((r) => ({ r, gain: (0.6 + r.weight * 4) * (0.6 + charisma) * regionFit(p, r.lean) * mult }))
    .sort((a, b) => b.gain - a.gain)[0];
  if (best && p.funds >= ACTION_COSTS.miting) {
    out.push({
      id: 'miting',
      icon: '📣',
      title: `${best.r.name} bölgesinde miting yap`,
      why: `Seçmen ağırlığı ve partinin çizgisine uyumu en yüksek bölge burası.`,
      estimate: `Destek ivmesi +${best.gain.toFixed(1)}, maliyet ${ACTION_COSTS.miting} milyon $. Bölge ${ACTION_COOLDOWNS.miting} gün sonra yeniden kullanılabilir.`,
      action: { type: 'partyAction', action: 'miting', regionId: best.r.id },
      priority: 55 + best.gain * 6,
    });
  }
  if ((p.cooldowns.aciklama ?? 0) <= day) {
    const issue = topIssue(c);
    const mult2 = p.leader?.background === 'akademisyen' ? 1.3 : 1;
    const gain = (0.5 + issue.severity * 2) * mult2 * (0.7 + charisma * 0.6);
    out.push({
      id: 'aciklama',
      icon: '🎙️',
      title: `Basın açıklaması: ${issue.label}`,
      why: 'Halkın en çok dert ettiği konu bu. Hükümeti burada sıkıştır.',
      estimate: `Destek ivmesi +${gain.toFixed(1)}, hükümet onayı −${(0.4 * gain).toFixed(1)}. Ücretsiz.`,
      action: { type: 'partyAction', action: 'aciklama' },
      priority: 45 + gain * 10,
    });
  }
  if (p.org < 70) {
    const cost = p.leader?.background === 'hukukcu' ? 8 : ACTION_COSTS.teskilat;
    out.push({
      id: 'teskilat',
      icon: '🏢',
      title: 'Teşkilatı büyüt',
      why: `Teşkilat gücü ${Math.round(p.org)}/100. Zayıf teşkilat sandıkta oy kaybettirir ve bağışları azaltır.`,
      estimate: p.funds >= cost ? `Teşkilat +8, maliyet ${cost} milyon $.` : `Kasada ${p.funds.toFixed(1)} milyon $ var, ${cost} gerekiyor. Önce bağış topla.`,
      action: p.funds >= cost ? { type: 'partyAction', action: 'teskilat' } : undefined,
      priority: 40 + (70 - p.org) * 0.5,
    });
  }
  if ((p.cooldowns.bagis ?? 0) <= day) {
    const amount = (4 + p.org * 0.12 + p.support * 0.2) * (p.leader?.background === 'isInsani' ? 1.5 : 1);
    out.push({
      id: 'bagis',
      icon: '💰',
      title: 'Bağış kampanyası başlat',
      why: p.funds < 10 ? 'Kasa neredeyse boş; miting ve aday göstermek için para lazım.' : 'Kasayı seçimlere hazırla.',
      estimate: `Yaklaşık ${amount.toFixed(1)} milyon $ toplanır.`,
      action: { type: 'partyAction', action: 'bagis' },
      priority: p.funds < 10 ? 80 : 30,
    });
  }
  if (!p.promises.length) {
    out.push({
      id: 'vaat',
      icon: '📜',
      title: 'Seçim vaatlerini belirle',
      why: 'Vaatsiz bir parti seçmene neden oy vereceğini anlatamaz. Gündemdeki sorunlara uygun vaatler destek getirir.',
      estimate: 'Her uygun vaat ilgili seçmen grubunda destek artırır.',
      goto: 'parti',
      priority: 60,
    });
  }
  const shadowMissing = MINISTRIES.filter((m) => !p.shadowCabinet[m]).length;
  if (shadowMissing >= 4) {
    out.push({
      id: 'golge',
      icon: '👥',
      title: 'Gölge kabineni kur',
      why: `${shadowMissing} bakanlık için adayın yok. Güçlü isimler partiye güven kazandırır.`,
      estimate: 'Yetkin gölge bakanlar desteği ve medyadaki görünürlüğü artırır.',
      goto: 'parti',
      priority: 35,
    });
  }
  out.push(...localElectionAdvice(c, p, day));
  if (c.approval < 38 && c.nextElectionDay - day > 200 && (p.cooldowns.erkenSecim ?? 0) <= day) {
    const chance = clamp((38 - c.approval) / 25 + (p.support - 15) / 60, 0, 0.8);
    if (chance > 0.2)
      out.push({
        id: 'erkenSecim',
        icon: '⏰',
        title: 'Erken seçim çağrısı yap',
        why: `Hükümetin onayı %${Math.round(c.approval)}'e düştü. Baskı kurmanın tam zamanı.`,
        estimate: `Kabul edilme şansı ${pct(chance)}. Kabul edilirse seçim 90 gün sonra.`,
        action: { type: 'partyAction', action: 'erkenSecim' },
        priority: 50 + chance * 40,
      });
  }
  return out;
}

function localElectionAdvice(c: CountryState, p: Party, day: number): Advice[] {
  if (!c.provinces.length || c.nextLocalElectionDay === Number.MAX_SAFE_INTEGER) return [];
  const left = c.nextLocalElectionDay - day;
  if (left > 365) return [];
  const missing = c.provinces.filter((pv) => !pv.nominees[p.id] && pv.mayor.partyId !== p.id).sort((a, b) => b.pop - a.pop);
  if (!missing.length) return [];
  const top = missing.slice(0, 5);
  const cost = top.reduce((s, pv) => s + nominationCost(pv), 0);
  return [
    {
      id: 'aday',
      icon: '🏙️',
      title: 'Belediye seçimleri için aday göster',
      why: `Yerel seçime ${Math.ceil(left / 30)} ay kaldı ve ${missing.length} ilde adayın yok. Aday göstermediğin ilde oy alamazsın.`,
      estimate: `En büyük 5 il (${top.map((x) => x.name).join(', ')}) yaklaşık ${cost.toFixed(1)} milyon $ tutar. Kazandığın iller sana yönetim ve ulusal destek getirir.`,
      action: { type: 'nominateAll' },
      goto: 'iller',
      priority: 70 + (365 - left) / 10,
    },
  ];
}

function governmentAdvice(c: CountryState, me: PlayerView, p: Party, day: number): Advice[] {
  const out: Advice[] = [];
  // En zayıf bakanı en iyi adayla değiştir
  let bestSwap: { m: MinistryId; cand: Minister; est: ReturnType<typeof ministerSwapEstimate> } | null = null;
  for (const m of MINISTRIES) {
    for (const cand of c.candidates[m] ?? []) {
      const est = ministerSwapEstimate(c, m, cand);
      if (!bestSwap || est.approval > bestSwap.est.approval) bestSwap = { m, cand, est };
    }
  }
  if (bestSwap && bestSwap.est.approval > 0.3) {
    const cur = c.ministers[bestSwap.m];
    out.push({
      id: 'bakan',
      icon: '🧑‍💼',
      title: `${MINISTRY_LABELS[bestSwap.m]} Bakanlığına ${bestSwap.cand.name}`,
      why: cur
        ? `${cur.name} bu bakanlıkta zayıf kalıyor. ${bestSwap.cand.name} (${bestSwap.cand.profession ?? 'aday'}) daha yetkin.`
        : 'Bakanlık boş; işler yürümüyor.',
      estimate: `Uzun vadede ${describeSwap(bestSwap.est)}. Değişiklik kısa süre piyasa güvenini 1 puan düşürür.`,
      action: { type: 'appointMinister', ministry: bestSwap.m, candidateId: bestSwap.cand.id },
      goto: 'kabine',
      priority: 50 + bestSwap.est.approval * 8,
    });
  }
  const real = c.policyRate - c.inflation;
  if (c.inflation > 8 && real < 1) {
    const target = Math.ceil(c.inflation + 2);
    out.push({
      id: 'faiz',
      icon: '🏦',
      title: `Politika faizini %${target}'e çıkar`,
      why: `Enflasyon %${c.inflation.toFixed(1)}, reel faiz ${real.toFixed(1)}. Para ucuz kaldıkça fiyatlar artmaya devam eder.`,
      estimate: 'Enflasyon birkaç ay içinde düşmeye başlar; büyüme bir süre yavaşlar ve konut yapımı azalır.',
      action: { type: 'setEconomy', policyRate: target },
      goto: 'ekonomi',
      priority: 55 + Math.min(30, c.inflation - 8),
    });
  }
  if (c.deficitPct > 5) {
    out.push({
      id: 'acik',
      icon: '📉',
      title: 'Bütçe açığını kapat',
      why: `Bütçe açığı GSYH'nin %${c.deficitPct.toFixed(1)}'i. Borç büyüyor, piyasa güveni düşüyor.`,
      estimate: 'Harcamaları kısmak ya da vergileri biraz artırmak güveni ve faiz yükünü iyileştirir, onayı kısa vadede düşürür.',
      goto: 'ekonomi',
      priority: 40 + c.deficitPct * 2,
    });
  }
  // En sorunlu büyük il
  const worst = c.provinces
    .filter((pv) => pv.pop > 0.4)
    .map((pv) => ({ pv, a: attractiveness(pv), h: housingRatio(pv) }))
    .sort((a, b) => a.a - b.a)[0];
  if (worst && worst.a < 0) {
    const type = worst.h < 1 ? 'topluKonut' : 'park';
    out.push({
      id: 'yatirim',
      icon: '🏗️',
      title: `${worst.pv.name} için devlet yatırımı`,
      why:
        worst.h < 1
          ? `${worst.pv.name}'de konut açığı var (hane başına ${worst.h.toFixed(2)} konut); insanlar ili terk ediyor.`
          : `${worst.pv.name}'de hizmetler yetersiz; ilden göç var.`,
      estimate: `${type === 'topluKonut' ? 'Toplu konut' : 'Park ve sosyal tesis'}: yaklaşık ${projectCost(c, worst.pv, type).toFixed(0)} milyon $, borç artar; tamamlanınca göç durur ve il büyümeye başlar.`,
      action: { type: 'stateInvest', provinceId: worst.pv.id, project: type },
      goto: 'iller',
      priority: 35 + -worst.a * 30,
    });
  }
  if (inCampaign(c, day)) {
    out.push({
      id: 'kampanya',
      icon: '🎪',
      title: 'Seçim kampanyasına ağırlık ver',
      why: `Genel seçime ${Math.ceil((c.nextElectionDay - day) / 30)} ay kaldı.`,
      estimate: 'Büyük mitingler seçim gününe kadar onayı artırır; seçim ekonomisi daha güçlüdür ama borcu büyütür.',
      goto: 'kampanya',
      priority: 70,
    });
  }
  out.push(...localElectionAdvice(c, p, day));
  out.push(
    ...mediaAdvice(c, me, day, true)
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 1)
      .map((a) => ({ ...a, priority: a.priority - 20 })),
  );
  return out;
}

function municipalityAdvice(c: CountryState, provinces: Province[]): Advice[] {
  const out: Advice[] = [];
  for (const pv of provinces) {
    const h = housingRatio(pv);
    if (h < 1 && pv.alloc.konut < 40) {
      out.push({
        id: `konut:${pv.id}`,
        icon: '🏘️',
        title: `${pv.name}: konuta daha çok bütçe ayır`,
        why: `Hane başına ${h.toFixed(2)} konut düşüyor; kiralar artıyor ve ilden göç başlıyor.`,
        estimate: 'Konut payını %40\'a çıkarırsan yıllık konut üretimi yaklaşık iki katına çıkar ve nüfus yeniden artar.',
        action: {
          type: 'municipal',
          provinceId: pv.id,
          alloc: { konut: 40, ulasim: Math.round(pv.alloc.ulasim * 0.8), sosyal: Math.round(pv.alloc.sosyal * 0.8), cevre: Math.round(pv.alloc.cevre * 0.8) },
        },
        goto: 'iller',
        priority: 60,
      });
    }
    if (!pv.projects.length) {
      const type = h < 1 ? 'topluKonut' : pv.jobs < 50 ? 'sanayi' : 'park';
      const cost = projectCost(c, pv, type);
      if (pv.funds >= cost)
        out.push({
          id: `proje:${pv.id}`,
          icon: '🏗️',
          title: `${pv.name}: ${type === 'topluKonut' ? 'toplu konut' : type === 'sanayi' ? 'sanayi bölgesi' : 'park'} projesi başlat`,
          why: `Belediye kasasında ${pv.funds.toFixed(0)} milyon $ birikti.`,
          estimate: `Maliyet ${cost.toFixed(0)} milyon $; bitince ${type === 'sanayi' ? 'iş imkânı' : type === 'park' ? 'hizmet kalitesi' : 'konut sayısı'} ve belediye başkanının onayı artar.`,
          action: { type: 'municipal', provinceId: pv.id, project: type },
          goto: 'iller',
          priority: 50,
        });
    }
  }
  return out;
}

function officeAdvice(c: CountryState, me: PlayerView, p: Party, day: number): Advice[] {
  const out: Advice[] = [];
  const bg = me.character?.background;
  for (const o of me.offers) {
    const spec = OFFICES[o.office];
    const fits = !!bg && spec.fits.includes(bg);
    out.push({
      id: `teklif:${o.id}`,
      icon: spec.icon,
      title: `Teklif: ${officeTitle({ id: o.office, provinceId: o.provinceId }, c)}`,
      why: o.why,
      estimate: `${spec.perks}${fits ? ' Karakterine çok uygun bir görev.' : ''} Teklif ${Math.max(0, o.expires - day)} gün geçerli.`,
      action: { type: 'acceptOffer', offerId: o.id },
      priority: 70 + (fits ? 15 : 0) - (me.office ? 20 : 0),
    });
  }
  const g = me.office?.goal;
  if (me.office && g) {
    const v = goalValue(c, g.kind, me.office, p.id, me.stats);
    const left = g.deadline - day;
    out.push({
      id: 'gorevHedefi',
      icon: '🎯',
      title: `Görev hedefi: ${g.label}`,
      why: `${officeTitle(me.office, c)} olarak genel merkez senden bunu bekliyor. ${left} gün kaldı.`,
      estimate: `İlerleme %${Math.round(goalProgress(g, v) * 100)}. Başarırsan partinin güveni +${g.reward}, başaramazsan −5.`,
      goto: me.office.id === 'belediyeBaskani' || me.office.id === 'ilBaskani' ? 'iller' : 'parti',
      priority: 50 + (left < 60 ? 25 : 0),
    });
  }
  return out;
}

/** Oyuncunun durumuna göre sıralı öneriler. */
export function advise(c: CountryState, me: PlayerView, day: number): Advice[] {
  const m = me.membership;
  if (!m) return [];
  const p = c.parties.find((x) => x.id === m.partyId);
  if (!p) return [];
  const isLeader = me.partyId === p.id;
  let list: Advice[];
  if (!isLeader) list = memberAdvice(c, me, p, day);
  else if (p.inGovernment) list = governmentAdvice(c, me, p, day);
  else list = oppositionLeaderAdvice(c, me, p, day);
  if (isLeader) list.push(...municipalityAdvice(c, c.provinces.filter((x) => isPlayerMunicipality(c, x) && x.mayor.partyId === p.id)));
  else {
    list.push(...municipalityAdvice(c, c.provinces.filter((x) => x.mayor.playerId === me.id)));
    list.push(...officeAdvice(c, me, p, day));
  }
  return list.sort((a, b) => b.priority - a.priority);
}
