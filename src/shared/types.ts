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

export interface ElectionResult {
  day: number;
  vote: number;
  won: boolean;
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
}

/** İstemciden sunucuya giden mesajlar */
export type ClientMessage =
  | { type: 'hello'; token?: string; name?: string }
  | { type: 'chooseCountry'; countryId: string }
  | { type: 'leaveCountry' }
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
  | { type: 'state'; day: number; dayMs: number; world: CountrySummary[]; country: CountryState | null }
  | { type: 'error'; message: string }
  | { type: 'gameOver'; countryName: string; reason: string };
