export type MinistryId =
  | 'ekonomi'
  | 'disisleri'
  | 'savunma'
  | 'icisleri'
  | 'saglik'
  | 'egitim'
  | 'sanayi'
  | 'tarim'
  | 'calisma'
  | 'ulastirma';

export type QualityId = 'saglik' | 'egitim' | 'guvenlik' | 'altyapi' | 'sosyal' | 'tarim' | 'diplomasi' | 'sanayi' | 'savunma';

export type GroupId = 'isciler' | 'emekliler' | 'gencler' | 'isDunyasi' | 'ciftciler' | 'kamu' | 'ortaSinif';

export type ProjectType = 'fabrika' | 'enerji' | 'otoyol' | 'hastane' | 'okul' | 'savunmaSanayi' | 'eDevlet';

export type RegimeType = 'baskanlik' | 'parlamenter' | 'yariBaskanlik' | 'otoriter';

export type ShockTarget = 'inflation' | 'growth' | 'unemployment' | 'approval' | 'confidence';

export interface Taxes {
  /** Ortalama efektif gelir vergisi (%) */
  income: number;
  /** Kurumlar vergisi (%) */
  corporate: number;
  /** KDV (%) */
  vat: number;
}

/** Ülkenin başlangıç verisi (yaklaşık, 2025). */
export interface CountrySeed {
  id: string;
  name: string;
  flag: string;
  regime: RegimeType;
  /** milyon */
  population: number;
  /** milyar USD */
  gdp: number;
  growth: number;
  inflation: number;
  unemployment: number;
  policyRate: number;
  debtPct: number;
  deficitPct: number;
  /** Faiz hariç kamu harcaması, GSYH'ye oran (%) */
  spendingPct: number;
  defensePct: number;
  potentialGrowth: number;
  naturalUnemployment: number;
  inflationAnchor: number;
  taxes: Taxes;
  /** Asgari ücret / ortalama ücret */
  minWageRatio: number;
  electionYears: number;
  /** 'YYYY-MM' */
  nextElection: string;
  govSeatShare: number;
  approval: number;
  bureaucracy: number;
  cbIndependent: boolean;
  rivals: string[];
  names: 'tr' | 'genel';
}

export interface Minister {
  id: string;
  name: string;
  /** 0-1 */
  competence: number;
  loyalty: number;
  honesty: number;
  popularity: number;
  appointedDay?: number;
}

export interface Project {
  id: string;
  type: ProjectType;
  startDay: number;
  endDay: number;
  /** Toplam maliyet, GSYH'ye oran (%) */
  costPct: number;
}

export interface Contribution {
  label: string;
  value: number;
}

export interface Shock {
  label: string;
  target: ShockTarget;
  value: number;
  endDay: number;
}

export interface EventOptionView {
  label: string;
  desc: string;
}

export interface PendingEvent {
  id: string;
  defId: string;
  title: string;
  text: string;
  day: number;
  deadlineDay: number;
  options: EventOptionView[];
  defaultOption: number;
}

export interface NewsItem {
  day: number;
  text: string;
  kind: 'iyi' | 'kotu' | 'notr';
}

export interface HistoryPoint {
  day: number;
  gdp: number;
  growth: number;
  inflation: number;
  unemployment: number;
  approval: number;
  debtPct: number;
  deficitPct: number;
  policyRate: number;
}

export interface ReportCardEntry {
  ministry: MinistryId;
  ministerName: string | null;
  grade: 'A' | 'B' | 'C' | 'D' | 'F' | '-';
  note: string;
}

export interface ReportCard {
  day: number;
  entries: ReportCardEntry[];
}

export interface ElectionPartyResult {
  partyId: string;
  vote: number;
  seats: number;
}

export interface ElectionResult {
  day: number;
  /** Hükümetin (seçim öncesi iktidar partisinin) oy oranı */
  vote: number;
  /** İktidar partisi seçimi kazandı mı */
  won: boolean;
  results: ElectionPartyResult[];
  winnerPartyId: string;
  /** Başkanlık sistemlerinde ikinci tur yapıldıysa */
  runoff?: { a: string; b: string; aVote: number };
  coalition: string[];
}

export type BackgroundId = 'ekonomist' | 'asker' | 'isInsani' | 'sendikaci' | 'akademisyen' | 'hukukcu';

/** -1 (sol / özgürlükçü) … +1 (sağ / muhafazakâr) */
export interface Ideology {
  economic: number;
  social: number;
}

export interface Avatar {
  skin: number;
  hair: number;
  hairColor: number;
  suit: number;
  tie: number;
}

export interface Character {
  name: string;
  age: number;
  background: BackgroundId;
  ideology: Ideology;
  avatar: Avatar;
  /** 0-1, geçmişe ve yaşa göre hesaplanır */
  charisma: number;
}

export type PromiseId =
  | 'enflasyon'
  | 'asgariUcret'
  | 'vergiIndirimi'
  | 'issizlik'
  | 'saglik'
  | 'egitim'
  | 'savunma'
  | 'kurumlar'
  | 'tarim'
  | 'borc';

export interface ActivePromise {
  id: PromiseId;
  /** İktidara gelindiğinde ölçülen başlangıç değeri */
  baseline: number;
  kept?: boolean;
}

export interface Party {
  id: string;
  name: string;
  short: string;
  color: string;
  ideology: Ideology;
  /** Anket desteği (%) */
  support: number;
  /** Kalıcı çekim gücü (başlangıç desteğinden türetilir) */
  appeal: number;
  /** Kampanya ivmesi, zamanla söner */
  momentum: number;
  /** Teşkilat gücü 0-100 */
  org: number;
  /** Parti kasası (milyon $) */
  funds: number;
  /** Meclisteki sandalye payı (%) */
  seats: number;
  inGovernment: boolean;
  leaderName: string;
  playerId: string | null;
  leader: Character | null;
  promises: PromiseId[];
  shadowCabinet: Partial<Record<MinistryId, Minister>>;
  /** Eylem anahtarı -> tekrar yapılabileceği gün */
  cooldowns: Record<string, number>;
  founded: boolean;
  /** Aylık anket geçmişi (son 48 ay) */
  trend: number[];
}

export interface Region {
  id: string;
  name: string;
  /** Nüfus payı (toplam 1) */
  weight: number;
  lean: Ideology;
  /** Haritada şematik konum (0-1) */
  x: number;
  y: number;
}

export interface CountryState {
  id: string;
  name: string;
  flag: string;
  regime: RegimeType;
  ownerId: string | null;
  ownerName: string | null;

  population: number;
  gdp: number;
  growth: number;
  inflation: number;
  expectedInflation: number;
  unemployment: number;
  policyRate: number;
  debtPct: number;
  deficitPct: number;
  revenuePct: number;
  spendingPct: number;
  interestPct: number;
  debtRate: number;
  confidence: number;

  potentialGrowth: number;
  naturalUnemployment: number;
  inflationAnchor: number;
  baseRevenuePct: number;
  baseSpendingPct: number;
  otherRevenuePct: number;
  initialMinWageRatio: number;
  baseTaxes: Taxes;

  taxes: Taxes;
  minWageRatio: number;
  budget: Record<MinistryId, number>;
  cbIndependent: boolean;

  quality: Record<QualityId, number>;
  military: number;
  threat: number;
  tension: Record<string, number>;
  bureaucracy: number;

  groups: Record<GroupId, number>;
  approval: number;
  govSeatShare: number;

  ministers: Record<MinistryId, Minister | null>;
  candidates: Record<MinistryId, Minister[]>;

  projects: Project[];
  completed: Record<ProjectType, number>;
  shocks: Shock[];
  /** Başlangıçta modeli gerçek veriye oturtan, zamanla sönen yapısal farklar */
  residual: { inflation: number; growth: number; unemployment: number; approval: number };

  pendingEvents: PendingEvent[];
  news: NewsItem[];
  history: HistoryPoint[];
  reportCards: ReportCard[];
  /** Karnede kıyas için çeyrek başı değerler */
  quarterStart: Record<string, number>;
  explain: {
    inflation: Contribution[];
    growth: Contribution[];
    unemployment: Contribution[];
    approval: Contribution[];
  };

  electionYears: number;
  nextElectionDay: number;
  campaignRallies: number;
  handoutUsed: boolean;
  lastElection: ElectionResult | null;
  parties: Party[];
  rulingPartyId: string;
  regions: Region[];
  electionThreshold: number;
  /** Hükümeti yöneten oyuncunun karakteri (yapay zekâ hükümetinde null) */
  leader: Character | null;
  leaderName: string;
  activePromises: ActivePromise[];
  /** Hükümet payı kalibrasyonu (seçimden sonra sönümlenir) */
  govCalib: number;
  rivals: string[];
  playable: boolean;
  names: 'tr' | 'genel';
}

export interface CountrySummary {
  id: string;
  name: string;
  flag: string;
  regime: RegimeType;
  ownerName: string | null;
  playable: boolean;
  gdp: number;
  growth: number;
  inflation: number;
  unemployment: number;
  approval: number;
  military: number;
  rulingParty: { name: string; short: string; color: string } | null;
  leaderName: string;
  nextElectionDay: number;
}

export interface PlayerView {
  id: string;
  name: string;
  character: Character | null;
  countryId: string | null;
  partyId: string | null;
}

/** İstemciden sunucuya giden mesajlar */
export type ClientMessage =
  | { type: 'hello'; token?: string; name?: string }
  | { type: 'createCharacter'; character: Omit<Character, 'charisma'> }
  | { type: 'joinParty'; countryId: string; partyId: string }
  | {
      type: 'foundParty';
      countryId: string;
      name: string;
      short: string;
      color: string;
      ideology: Ideology;
    }
  | { type: 'leaveCountry' }
  | { type: 'partyAction'; action: 'miting'; regionId: string }
  | { type: 'partyAction'; action: 'teskilat' | 'bagis' | 'aciklama' | 'erkenSecim' }
  | { type: 'setPromises'; promises: PromiseId[] }
  | { type: 'setShadow'; ministry: MinistryId; candidateId: string | null }
  | { type: 'setEconomy'; taxes?: Partial<Taxes>; policyRate?: number; minWageRaise?: number; cbIndependent?: boolean }
  | { type: 'setBudget'; budget: Partial<Record<MinistryId, number>> }
  | { type: 'startProject'; projectType: ProjectType }
  | { type: 'appointMinister'; ministry: MinistryId; candidateId: string }
  | { type: 'dismissMinister'; ministry: MinistryId }
  | { type: 'resolveEvent'; eventId: string; option: number }
  | { type: 'campaign'; action: 'miting' | 'secimEkonomisi' };

/** Sunucudan istemciye giden mesajlar */
export type ServerMessage =
  | { type: 'welcome'; token: string; playerName: string; countryId: string | null }
  | {
      type: 'state';
      day: number;
      dayMs: number;
      world: CountrySummary[];
      country: CountryState | null;
      player: PlayerView | null;
    }
  | { type: 'error'; message: string }
  | { type: 'notice'; message: string }
  | { type: 'electionNight'; countryId: string; countryName: string; result: ElectionResult };
