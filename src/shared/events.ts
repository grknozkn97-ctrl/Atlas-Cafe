import { EVENT_DEADLINE_DAYS, MINISTRIES, MINISTRY_LABELS } from './constants';
import type { Rng } from './ministers';
import { addNews, addShock, clamp, dismissMinister } from './sim';
import type { CountryState, PendingEvent } from './types';

interface EventOption {
  label: string;
  desc: string;
  apply: (c: CountryState, day: number, rng: Rng) => void;
}

interface EventDef {
  id: string;
  title: string;
  text: (c: CountryState) => string;
  weight: number;
  when?: (c: CountryState) => boolean;
  options: EventOption[];
  /** Oyuncu süresinde karar vermezse ya da ülke yapay zekâdaysa uygulanan seçenek */
  defaultOption: number;
}

function topRival(c: CountryState): string | null {
  let best: string | null = null;
  let bestT = -1;
  for (const [r, t] of Object.entries(c.tension)) {
    if (t > bestT) {
      bestT = t;
      best = r;
    }
  }
  return best;
}

const EVENTS: EventDef[] = [
  {
    id: 'deprem',
    title: 'Büyük deprem',
    text: () => 'Şiddetli bir deprem birçok şehirde ağır hasara yol açtı. Halk devletin hızlı müdahalesini bekliyor.',
    weight: 1,
    options: [
      {
        label: 'Acil yeniden inşa',
        desc: "GSYH'nin %1'i kadar ek harcama; bölge hızla toparlanır.",
        apply: (c, d) => {
          c.debtPct += 1;
          addShock(c, d, 'Deprem sonrası yeniden inşa', 'approval', 3, 120);
          addShock(c, d, 'Deprem sonrası yeniden inşa', 'growth', 0.4, 365);
        },
      },
      {
        label: 'Sınırlı yardım',
        desc: 'Bütçe korunur ama halk tepkili, ekonomi zarar görür.',
        apply: (c, d) => {
          addShock(c, d, 'Depreme yetersiz müdahale', 'approval', -6, 180);
          addShock(c, d, 'Deprem hasarı', 'growth', -0.6, 365);
        },
      },
    ],
    defaultOption: 0,
  },
  {
    id: 'salgin',
    title: 'Salgın hastalık',
    text: (c) =>
      `Hızla yayılan bir salgın hastaneleri zorluyor. Sağlık hizmeti kalitesi: ${c.quality.saglik.toFixed(0)}/100.`,
    weight: 0.6,
    options: [
      {
        label: 'Sıkı önlemler',
        desc: 'Salgın kontrol altına alınır, ekonomi bir süre yavaşlar.',
        apply: (c, d) => {
          addShock(c, d, 'Salgın önlemleri', 'growth', -1.8, 180);
          addShock(c, d, 'Salgın önlemleri', 'unemployment', 0.8, 180);
          addShock(c, d, 'Salgınla mücadele', 'approval', 2, 120);
        },
      },
      {
        label: 'Hayat devam etsin',
        desc: 'Ekonomi az etkilenir, ama hastalık yayılır ve halk tepki gösterir.',
        apply: (c, d) => {
          const hit = c.quality.saglik > 65 ? -2 : -6;
          addShock(c, d, 'Salgının yayılması', 'approval', hit, 180);
          addShock(c, d, 'Salgın', 'growth', -0.5, 180);
        },
      },
    ],
    defaultOption: 0,
  },
  {
    id: 'kuresel_kriz',
    title: 'Küresel finans krizi',
    text: () => 'Büyük bir küresel banka çöktü. Dış talep düşüyor, sermaye gelişmekte olan ülkelerden çıkıyor.',
    weight: 0.5,
    options: [
      {
        label: 'Teşvik paketi',
        desc: "GSYH'nin %1,5'i kadar destek; daralma hafifler, enflasyon artar.",
        apply: (c, d) => {
          c.debtPct += 1.5;
          addShock(c, d, 'Küresel kriz', 'growth', -0.6, 270);
          addShock(c, d, 'Teşvik paketi', 'inflation', 1, 270);
        },
      },
      {
        label: 'Mali disiplin',
        desc: 'Borç artmaz, piyasa güveni korunur ama daralma sert olur.',
        apply: (c, d) => {
          addShock(c, d, 'Küresel kriz', 'growth', -2, 270);
          addShock(c, d, 'Küresel kriz', 'unemployment', 1.5, 270);
          addShock(c, d, 'Mali disiplin', 'confidence', 4, 270);
        },
      },
    ],
    defaultOption: 0,
  },
  {
    id: 'enerji_soku',
    title: 'Petrol ve doğalgaz fiyatları fırladı',
    text: () => 'Bölgesel bir çatışma nedeniyle enerji fiyatları iki katına çıktı.',
    weight: 0.8,
    options: [
      {
        label: 'Sübvansiyon ver',
        desc: 'Fiyatlar devlet bütçesinden sabitlenir.',
        apply: (c, d) => {
          c.debtPct += 0.8;
          addShock(c, d, 'Enerji şoku', 'inflation', 1, 180);
        },
      },
      {
        label: 'Fiyatlara yansıt',
        desc: 'Bütçe korunur, enflasyon ve tepki artar.',
        apply: (c, d) => {
          addShock(c, d, 'Enerji şoku', 'inflation', 3, 180);
          addShock(c, d, 'Enerji zamları', 'approval', -3, 150);
        },
      },
    ],
    defaultOption: 0,
  },
  {
    id: 'grev',
    title: 'Genel grev',
    text: (c) =>
      `Sendikalar, enflasyon karşısında eriyen ücretler için genel grev ilan etti. İşçilerin memnuniyeti: ${c.groups.isciler.toFixed(0)}/100.`,
    weight: 1,
    when: (c) => c.groups.isciler < 45,
    options: [
      {
        label: 'Uzlaş',
        desc: 'Ücretlere ek artış; işçiler memnun, enflasyon biraz artar.',
        apply: (c, d) => {
          c.minWageRatio *= 1.04;
          addShock(c, d, 'Grev uzlaşması', 'inflation', 0.5, 120);
          addShock(c, d, 'Grev uzlaşması', 'approval', 1.5, 120);
        },
      },
      {
        label: 'Polisi gönder',
        desc: 'Grev dağıtılır; iş dünyası rahatlar, halk tepkili.',
        apply: (c, d) => {
          addShock(c, d, 'Grevin bastırılması', 'approval', -4, 180);
          addShock(c, d, 'Grevin bastırılması', 'confidence', 1, 90);
        },
      },
      {
        label: 'Görmezden gel',
        desc: 'Grev uzar, üretim aksar.',
        apply: (c, d) => {
          addShock(c, d, 'Uzayan grev', 'growth', -0.7, 90);
          addShock(c, d, 'Uzayan grev', 'approval', -2, 120);
        },
      },
    ],
    defaultOption: 2,
  },
  {
    id: 'skandal',
    title: 'Bakan hakkında yolsuzluk iddiası',
    text: (c) => {
      const m = leastHonestMinistry(c);
      return m
        ? `Muhalefet, ${MINISTRY_LABELS[m]} Bakanı ${c.ministers[m]!.name} hakkında yolsuzluk belgeleri yayımladı.`
        : 'Muhalefet, kabine hakkında yolsuzluk iddiaları ortaya attı.';
    },
    weight: 0.8,
    when: (c) => leastHonestMinistry(c) !== null,
    options: [
      {
        label: 'Bakanı görevden al',
        desc: 'Kabine sarsılır ama halk kararlılığı takdir eder.',
        apply: (c, d) => {
          const m = leastHonestMinistry(c);
          if (m) dismissMinister(c, d, m);
          addShock(c, d, 'Yolsuzluğa karşı kararlılık', 'approval', 1.5, 120);
        },
      },
      {
        label: 'Arkasında dur',
        desc: 'Kabine korunur, kamuoyu tepkili.',
        apply: (c, d) => {
          addShock(c, d, 'Yolsuzluk iddiası', 'approval', -4, 180);
        },
      },
    ],
    defaultOption: 1,
  },
  {
    id: 'sinir_gerginligi',
    title: 'Sınırda gerginlik',
    text: (c) => `Rakip bir ülkeyle sınırda askeri hareketlilik var. Dış tehdit seviyesi: ${c.threat.toFixed(0)}/100.`,
    weight: 1,
    when: (c) => c.rivals.length > 0,
    options: [
      {
        label: 'Asker sevk et',
        desc: 'Caydırıcılık gösterilir; ek savunma harcaması gerekir.',
        apply: (c, d) => {
          c.debtPct += 0.15;
          const r = topRival(c);
          if (r) c.tension[r] = Math.max(0.5, c.tension[r] - 0.3);
          addShock(c, d, 'Kararlı duruş', 'approval', 2, 90);
        },
      },
      {
        label: 'Diplomasi',
        desc: 'Başarı şansı diplomasi kalitesine bağlı.',
        apply: (c, d, rng) => {
          const r = topRival(c);
          if (rng() < c.quality.diplomasi / 100) {
            if (r) c.tension[r] = Math.max(0.4, c.tension[r] - 0.4);
            addNews(c, d, 'Diplomatik görüşmeler gerginliği azalttı.', 'iyi');
          } else {
            if (r) c.tension[r] += 0.5;
            addShock(c, d, 'Başarısız diplomasi', 'approval', -3, 120);
            addNews(c, d, 'Diplomatik girişim sonuçsuz kaldı, gerginlik tırmandı.', 'kotu');
          }
        },
      },
    ],
    defaultOption: 1,
  },
  {
    id: 'ihracat',
    title: 'İhracat rekoru',
    text: () => 'Yabancı talepteki artış sayesinde ihracat rekor kırdı.',
    weight: 0.7,
    options: [
      {
        label: 'Harika',
        desc: 'Büyüme bir yıl boyunca desteklenir.',
        apply: (c, d) => addShock(c, d, 'İhracat rekoru', 'growth', 0.8, 365),
      },
    ],
    defaultOption: 0,
  },
  {
    id: 'kuraklik',
    title: 'Kuraklık',
    text: () => 'Yağışların azlığı tarımsal üretimi düşürdü; gıda fiyatları yükseliyor.',
    weight: 0.8,
    options: [
      {
        label: 'Çiftçiye destek',
        desc: "GSYH'nin %0,3'ü kadar destek; gıda fiyatları dengelenir.",
        apply: (c, d) => {
          c.debtPct += 0.3;
          addShock(c, d, 'Kuraklık', 'inflation', 0.5, 180);
        },
      },
      {
        label: 'Müdahale etme',
        desc: 'Gıda enflasyonu artar, çiftçiler küser.',
        apply: (c, d) => {
          addShock(c, d, 'Kuraklık ve gıda fiyatları', 'inflation', 1.5, 180);
          addShock(c, d, 'Kuraklığa ilgisizlik', 'approval', -2, 150);
        },
      },
    ],
    defaultOption: 0,
  },
  {
    id: 'goc',
    title: 'Göç dalgası',
    text: () => 'Komşu bölgedeki çatışmadan kaçan yüz binlerce kişi sınıra dayandı.',
    weight: 0.6,
    options: [
      {
        label: 'Kapıları aç',
        desc: 'Uluslararası saygınlık artar, içeride tepki olur.',
        apply: (c, d) => {
          c.population *= 1.005;
          addShock(c, d, 'Göç tepkisi', 'approval', -3, 240);
          addShock(c, d, 'İş gücü artışı', 'growth', 0.2, 365);
        },
      },
      {
        label: 'Sınırı kapat',
        desc: 'Halk destekler, sınır güvenliği maliyetlidir.',
        apply: (c, d) => {
          c.debtPct += 0.1;
          addShock(c, d, 'Sınır güvenliği', 'approval', 1, 120);
        },
      },
    ],
    defaultOption: 1,
  },
  {
    id: 'yatirim_teklifi',
    title: 'Yabancı yatırım teklifi',
    text: () => 'Uluslararası bir otomotiv şirketi, vergi muafiyeti karşılığında büyük bir fabrika kurmayı teklif ediyor.',
    weight: 0.6,
    when: (c) => c.confidence > 40,
    options: [
      {
        label: 'Kabul et',
        desc: 'Ücretsiz bir fabrika projesi başlar; vergi geliri biraz düşer.',
        apply: (c, d) => {
          c.projects.push({ id: `p${d}-fdi`, type: 'fabrika', startDay: d, endDay: d + 450, costPct: 0 });
          c.otherRevenuePct -= 0.03;
          addShock(c, d, 'Yabancı yatırım', 'confidence', 3, 365);
        },
      },
      {
        label: 'Reddet',
        desc: 'Hiçbir şey değişmez.',
        apply: () => {},
      },
    ],
    defaultOption: 0,
  },
  {
    id: 'rusvet',
    title: 'Bürokraside rüşvet ağı',
    text: (c) => `Bir kamu kurumunda rüşvet ağı ortaya çıktı. Bürokrasi kalitesi: ${c.bureaucracy.toFixed(0)}/100.`,
    weight: 0.7,
    when: (c) => c.bureaucracy < 60,
    options: [
      {
        label: 'Soruşturma başlat',
        desc: 'Kısa vadede kurumlar sarsılır, bürokrasi temizlenir.',
        apply: (c, d) => {
          c.bureaucracy = clamp(c.bureaucracy + 3, 0, 100);
          addShock(c, d, 'Rüşvet soruşturması', 'approval', 2, 120);
          addShock(c, d, 'Rüşvet soruşturması', 'confidence', -1, 60);
        },
      },
      {
        label: 'Örtbas et',
        desc: 'Gürültü çıkmaz ama yolsuzluk kökleşir.',
        apply: (c, d) => {
          c.bureaucracy = clamp(c.bureaucracy - 3, 0, 100);
          addShock(c, d, 'Örtbas iddiaları', 'approval', -1, 120);
        },
      },
    ],
    defaultOption: 1,
  },
];

function leastHonestMinistry(c: CountryState) {
  let worst: (typeof MINISTRIES)[number] | null = null;
  let h = 0.45;
  for (const m of MINISTRIES) {
    const min = c.ministers[m];
    if (min && min.honesty < h) {
      h = min.honesty;
      worst = m;
    }
  }
  return worst;
}

const BY_ID = new Map(EVENTS.map((e) => [e.id, e]));

/** Günlük olay olasılığı: ortalama ~75 oyun gününde bir olay. */
const DAILY_CHANCE = 1 / 75;

export function rollEvent(c: CountryState, day: number, rng: Rng): PendingEvent | null {
  if (rng() >= DAILY_CHANCE) return null;
  const pool = EVENTS.filter((e) => !e.when || e.when(c));
  const total = pool.reduce((s, e) => s + e.weight, 0);
  let r = rng() * total;
  for (const e of pool) {
    r -= e.weight;
    if (r <= 0) {
      return {
        id: `e${day}-${e.id}-${Math.floor(rng() * 1e6)}`,
        defId: e.id,
        title: e.title,
        text: e.text(c),
        day,
        deadlineDay: day + EVENT_DEADLINE_DAYS,
        options: e.options.map((o) => ({ label: o.label, desc: o.desc })),
        defaultOption: e.defaultOption,
      };
    }
  }
  return null;
}

export function applyEventOption(c: CountryState, ev: PendingEvent, option: number, day: number, rng: Rng, auto = false) {
  const def = BY_ID.get(ev.defId);
  if (!def) return;
  const opt = def.options[option] ?? def.options[def.defaultOption];
  opt.apply(c, day, rng);
  addNews(c, day, `${ev.title}: "${opt.label}" kararı uygulandı${auto ? ' (otomatik pilot)' : ''}.`, 'notr');
}
