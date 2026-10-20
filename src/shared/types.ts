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

export type TraitId =
  | 'teknokrat'
  | 'populist'
  | 'reformcu'
  | 'sadik'
  | 'hirsli'
  | 'tecrubeli'
  | 'medyatik'
  | 'tasarrufcu'
  | 'golgeli';

export interface Minister {
  id: string;
  name: string;
  /** 0-1 */
  competence: number;
  loyalty: number;
  honesty: number;
  popularity: number;
  appointedDay?: number;
  age?: number;
  avatar?: Avatar;
  profession?: string;
  traits?: TraitId[];
  bio?: string;
  ideology?: Ideology;
}

export type MunicipalProjectType = 'topluKonut' | 'park' | 'sanayi' | 'metro' | 'kentselDonusum';

export interface Mayor extends Minister {
  partyId: string;
  /** Halkın belediyeye memnuniyeti 0-100 */
  approval: number;
  sinceDay: number;
  /** Otoriter rejimlerde atanmış vali */
  appointed: boolean;
  /** Belediye başkanı bir oyuncuysa */
  playerId?: string;
}

export interface Province {
  id: string;
  name: string;
  lat: number;
  lon: number;
  /** Nüfus (milyon) */
  pop: number;
  pop0: number;
  /** Konut sayısı */
  houses: number;
  /** Ortalama hane büyüklüğü */
  hh: number;
  /** Kentleşme oranı 0-100 */
  urban: number;
  lean: Ideology;
  mayor: Mayor;
  services: number;
  infra: number;
  jobs: number;
  /** Belediye kasası (milyon $) */
  funds: number;
  /** Belediye bütçe dağılımı (%) */
  alloc: { konut: number; ulasim: number; sosyal: number; cevre: number };
  propertyTax: 'dusuk' | 'orta' | 'yuksek';
  projects: { type: MunicipalProjectType; endDay: number; byState: boolean }[];
  built: Record<MunicipalProjectType, number>;
  /** Yerel seçimde aday gösterilebilecek isimler */
  pool: Minister[];
  /** Oyuncu partilerinin gösterdiği adaylar: partyId -> aday */
  nominees: Record<string, Minister>;
  popHistory: number[];
  houseHistory: number[];
  lastVote: { partyId: string; vote: number }[] | null;
  /** Yerel parti sadakati (kale iller): partyId -> oy çarpanı */
  bias?: Record<string, number>;
}

export interface LocalElectionResult {
  day: number;
  /** Partilerin kazandığı il sayısı ve yönettikleri nüfus */
  tally: { partyId: string; provinces: number; pop: number }[];
  flips: number;
}

// ---------------------------------------------------------------- şehir (belediye) oyunu

export type ServiceId =
  | 'belediye'
  | 'saglikOcagi'
  | 'hastane'
  | 'polis'
  | 'itfaiye'
  | 'okul'
  | 'universite'
  | 'park'
  | 'buyukPark'
  | 'komur'
  | 'gunes'
  | 'ruzgar'
  | 'suPompasi'
  | 'meydan'
  | 'basin'
  | 'parti';

/** Kapsama alanı olan hizmet türleri */
export type CoverKind = 'saglik' | 'polis' | 'itfaiye' | 'egitim' | 'park';

export interface CityService {
  id: string;
  type: ServiceId;
  /** Sol üst karo */
  x: number;
  y: number;
}

/** Izgara şehir: her dizi n*n uzunluğunda */
export interface City {
  n: number;
  seed: number;
  /** 0 kara, 1 su */
  terrain: number[];
  road: number[];
  /** 0 imarsız, 1 konut, 2 ticaret, 3 sanayi, 4 ofis */
  zone: number[];
  /** Bölgedeki binanın seviyesi 0-4 */
  lvl: number[];
  /** Hizmet binası sırası + 1 */
  occ: number[];
  services: CityService[];
  budget: {
    /** Konut, ticaret, sanayi, ofis vergisi (%) */
    tax: [number, number, number, number];
    /** Elektrik ve su fiyat çarpanı (1 = normal) */
    power: number;
    water: number;
    /** Hizmet bütçesi çarpanı (0.5-1.5) */
    svc: Record<CoverKind, number>;
  };
  stats: {
    pop: number;
    jobs: number;
    workers: number;
    powerProd: number;
    powerUse: number;
    waterProd: number;
    waterUse: number;
    /** Konut, ticaret, sanayi, ofis talebi (-1…1) */
    demand: [number, number, number, number];
    income: { label: string; value: number }[];
    expense: { label: string; value: number }[];
    net: number;
    happiness: number;
    buildings: number;
    roads: number;
  };
}

/** Çevre: oyuncunun tanıdıklarının geldiği kesimler */
export type NetworkId = 'isDunyasi' | 'esnaf' | 'sendika' | 'akademi' | 'medya' | 'burokrasi' | 'parti';

/** Kariyer basamakları */
export type RankId = 'ilce' | 'il' | 'mv' | 'genelBaskan' | 'hukumet';


export interface Contact {
  id: string;
  name: string;
  title: string;
  group: NetworkId;
  avatar: Avatar;
  /** 0-100; iyilik istedikçe azalır, zamanla yenilenir */
  loyalty: number;
  /** Bir sonraki iyiliğin istenebileceği gün */
  readyDay: number;
  sinceDay: number;
}

export interface TownEvent {
  id: string;
  defId: string;
  title: string;
  text: string;
  icon: string;
  options: { label: string; desc: string }[];
  day: number;
  deadline: number;
}

export interface Town {
  id: string;
  name: string;
  countryId: string;
  provinceId: string;
  foundedDay: number;
  /** 3B ızgara şehir */
  city: City;
  /** Belediye kasası (bin ₺) */
  money: number;
  pop: number;
  /** Halkın memnuniyeti 0-100 */
  happiness: number;
  /** Siyasi nüfuz: eylemlerde ve adaylıkta harcanır */
  influence: number;
  /** Her kesimde biriken ilişki puanı; eşikleri geçtikçe yeni tanıdıklar gelir */
  network: Record<NetworkId, number>;
  contacts: Contact[];
  rank: RankId;
  campaign: { rank: RankId; startDay: number; endDay: number; chance: number; boost: number } | null;
  cooldowns: Record<string, number>;
  event: TownEvent | null;
  nextEventDay: number;
  /** Gecikmeli sonuçlar (ör. rüşvet skandalı) */
  later: { day: number; id: string }[];
  log: { day: number; text: string; kind: 'iyi' | 'kotu' | 'notr' }[];
  popHistory: number[];
}

export type MediaAction = 'tv' | 'radyo' | 'sosyalMedya' | 'sahaCalismasi' | 'mitingKonusmasi';

export type PartyRole = 'uye' | 'ilBaskani' | 'myk' | 'genelBaskanYardimcisi' | 'genelBaskan';

/** Partinin oyuncuya verebileceği görevler */
export type OfficeId = 'belediyeBaskani' | 'ilBaskani' | 'sozcu' | 'ekonomiMasasi' | 'teskilatBaskani' | 'finansSorumlusu' | 'guvenlikMasasi';

export type GoalKind = 'media' | 'org' | 'funds' | 'support' | 'approval' | 'localVote';

export interface OfficeGoal {
  kind: GoalKind;
  label: string;
  /** Başlangıç değeri (ilerleme bundan ölçülür) */
  start: number;
  /** Ulaşılması gereken değer */
  target: number;
  deadline: number;
  /** Başarılırsa güven ödülü */
  reward: number;
}

export interface Office {
  id: OfficeId;
  provinceId?: string;
  sinceDay: number;
  goal: OfficeGoal | null;
  /** Tamamlanan hedef sayısı */
  done: number;
}

export interface OfficeOffer {
  id: string;
  office: OfficeId;
  provinceId?: string;
  /** Teklifin gerekçesi (karaktere göre) */
  why: string;
  expires: number;
}

export interface Membership {
  partyId: string;
  /** Partinin oyuncuya güveni 0-100 */
  trust: number;
  joinedDay: number;
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
  directives: Partial<Record<MinistryId, Directive>>;
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
  provinces: Province[];
  nextLocalElectionDay: number;
  lastLocalElection: LocalElectionResult | null;
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
  population: number;
  debtPct: number;
  electionThreshold: number;
  parties: PartySummary[];
}

export type PartySummary = Pick<
  Party,
  'id' | 'name' | 'short' | 'color' | 'ideology' | 'support' | 'seats' | 'inGovernment' | 'leaderName' | 'playerId' | 'founded'
>;

export interface PlayerView {
  id: string;
  name: string;
  character: Character | null;
  countryId: string | null;
  /** Genel başkanı olduğu parti */
  partyId: string | null;
  /** Üyesi olduğu parti ve partinin güveni */
  membership: Membership | null;
  role: PartyRole | null;
  /** Kamuoyunda tanınırlık 0-100 */
  fame: number;
  cooldowns: Record<string, number>;
  /** Kaç kez parti değiştirdi (güveni düşürür) */
  hops: number;
  office: Office | null;
  offers: OfficeOffer[];
  /** Görev hedefleri için sayaçlar */
  stats: { media: number };
  /** Yönettiği belediye (şehir oyunu) */
  town: Town | null;
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
  | { type: 'leaveParty' }
  | { type: 'media'; action: MediaAction; regionId?: string }
  | { type: 'challengeLeader' }
  | { type: 'foundTown'; provinceId: string; name: string }
  | { type: 'cityPaint'; tool: 'road' | 'zone' | 'bulldoze'; zone?: number; cells: number[] }
  | { type: 'cityPlace'; service: ServiceId; x: number; y: number }
  | { type: 'cityBudget'; tax?: [number, number, number, number]; power?: number; water?: number; svc?: Partial<Record<CoverKind, number>> }
  | { type: 'townAction'; building: ServiceId; action: string }
  | { type: 'townFavor'; contactId: string }
  | { type: 'townEvent'; option: number }
  | { type: 'runForOffice' }
  | { type: 'acceptOffer'; offerId: string }
  | { type: 'declineOffer'; offerId: string }
  | { type: 'resignOffice' }
  | { type: 'nominateMayor'; provinceId: string; candidateId: string | null }
  | { type: 'nominateAll' }
  | {
      type: 'municipal';
      provinceId: string;
      alloc?: Province['alloc'];
      propertyTax?: Province['propertyTax'];
      project?: MunicipalProjectType;
    }
  | { type: 'stateInvest'; provinceId: string; project: MunicipalProjectType }
  | { type: 'ministerDirective'; ministry: MinistryId; directive: Directive }
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
  | { type: 'electionNight'; countryId: string; countryName: string; result: ElectionResult }
  | { type: 'localElectionNight'; countryId: string; countryName: string; result: LocalElectionResult };

/** Bakana verilen çalışma talimatı */
export type Directive = 'dengeli' | 'tasarruf' | 'atilim' | 'reform';
