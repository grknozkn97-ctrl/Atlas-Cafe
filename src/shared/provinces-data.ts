/**
 * İl ve büyük şehir verileri. Türkiye için 81 il (2024 civarı nüfus, milyon) ve 2024 yerel seçimlerinde
 * belediyeyi kazanan partiye yakın bir başlangıç; diğer ülkeler için başlıca şehirler (metropol nüfusu).
 * Değerler yuvarlanmıştır, oyun içinde zamanla değişir.
 */

/** [ad, enlem, boylam, nüfus (milyon), bölge, 2024 belediye partisi kısa adı] */
export type TrRow = [string, number, number, number, string, string];

export const TR_PROVINCES: TrRow[] = [
  ['Adana', 37.0, 35.32, 2.27, 'akdeniz', 'CHP'],
  ['Adıyaman', 37.76, 38.28, 0.64, 'guneydogu', 'CHP'],
  ['Afyonkarahisar', 38.76, 30.54, 0.75, 'ege', 'CHP'],
  ['Ağrı', 39.72, 43.05, 0.51, 'doguanadolu', 'DEM'],
  ['Amasya', 40.65, 35.83, 0.34, 'karadeniz', 'CHP'],
  ['Ankara', 39.93, 32.86, 5.8, 'icanadolu', 'CHP'],
  ['Antalya', 36.89, 30.7, 2.7, 'akdeniz', 'CHP'],
  ['Artvin', 41.18, 41.82, 0.17, 'karadeniz', 'AK Parti'],
  ['Aydın', 37.85, 27.85, 1.16, 'ege', 'CHP'],
  ['Balıkesir', 39.65, 27.88, 1.27, 'marmara', 'CHP'],
  ['Bilecik', 40.14, 29.98, 0.23, 'marmara', 'CHP'],
  ['Bingöl', 38.88, 40.5, 0.28, 'doguanadolu', 'AK Parti'],
  ['Bitlis', 38.4, 42.11, 0.36, 'doguanadolu', 'AK Parti'],
  ['Bolu', 40.73, 31.61, 0.32, 'karadeniz', 'CHP'],
  ['Burdur', 37.72, 30.29, 0.27, 'akdeniz', 'CHP'],
  ['Bursa', 40.18, 29.06, 3.21, 'marmara', 'CHP'],
  ['Çanakkale', 40.15, 26.41, 0.56, 'marmara', 'CHP'],
  ['Çankırı', 40.6, 33.62, 0.2, 'icanadolu', 'MHP'],
  ['Çorum', 40.55, 34.95, 0.52, 'karadeniz', 'AK Parti'],
  ['Denizli', 37.78, 29.09, 1.06, 'ege', 'CHP'],
  ['Diyarbakır', 37.91, 40.22, 1.82, 'guneydogu', 'DEM'],
  ['Edirne', 41.68, 26.56, 0.42, 'marmara', 'CHP'],
  ['Elazığ', 38.68, 39.22, 0.59, 'doguanadolu', 'AK Parti'],
  ['Erzincan', 39.75, 39.49, 0.24, 'doguanadolu', 'MHP'],
  ['Erzurum', 39.9, 41.27, 0.75, 'doguanadolu', 'AK Parti'],
  ['Eskişehir', 39.78, 30.52, 0.92, 'icanadolu', 'CHP'],
  ['Gaziantep', 37.07, 37.38, 2.17, 'guneydogu', 'AK Parti'],
  ['Giresun', 40.91, 38.39, 0.45, 'karadeniz', 'CHP'],
  ['Gümüşhane', 40.46, 39.48, 0.14, 'karadeniz', 'AK Parti'],
  ['Hakkari', 37.58, 43.74, 0.28, 'doguanadolu', 'DEM'],
  ['Hatay', 36.2, 36.16, 1.56, 'akdeniz', 'AK Parti'],
  ['Isparta', 37.76, 30.55, 0.45, 'akdeniz', 'AK Parti'],
  ['Mersin', 36.81, 34.64, 1.94, 'akdeniz', 'CHP'],
  ['İstanbul', 41.01, 28.98, 15.7, 'marmara', 'CHP'],
  ['İzmir', 38.42, 27.14, 4.48, 'ege', 'CHP'],
  ['Kars', 40.6, 43.1, 0.27, 'doguanadolu', 'AK Parti'],
  ['Kastamonu', 41.38, 33.78, 0.39, 'karadeniz', 'CHP'],
  ['Kayseri', 38.73, 35.49, 1.45, 'icanadolu', 'AK Parti'],
  ['Kırklareli', 41.73, 27.22, 0.37, 'marmara', 'CHP'],
  ['Kırşehir', 39.15, 34.16, 0.24, 'icanadolu', 'CHP'],
  ['Kocaeli', 40.77, 29.94, 2.12, 'marmara', 'AK Parti'],
  ['Konya', 37.87, 32.49, 2.32, 'icanadolu', 'AK Parti'],
  ['Kütahya', 39.42, 29.98, 0.58, 'ege', 'CHP'],
  ['Malatya', 38.35, 38.31, 0.74, 'doguanadolu', 'AK Parti'],
  ['Manisa', 38.61, 27.43, 1.47, 'ege', 'CHP'],
  ['Kahramanmaraş', 37.58, 36.94, 1.12, 'akdeniz', 'AK Parti'],
  ['Mardin', 37.31, 40.73, 0.88, 'guneydogu', 'DEM'],
  ['Muğla', 37.22, 28.36, 1.07, 'ege', 'CHP'],
  ['Muş', 38.75, 41.51, 0.4, 'doguanadolu', 'DEM'],
  ['Nevşehir', 38.62, 34.71, 0.31, 'icanadolu', 'İYİ'],
  ['Niğde', 37.97, 34.68, 0.37, 'icanadolu', 'AK Parti'],
  ['Ordu', 40.98, 37.88, 0.77, 'karadeniz', 'AK Parti'],
  ['Rize', 41.02, 40.52, 0.35, 'karadeniz', 'AK Parti'],
  ['Sakarya', 40.69, 30.43, 1.1, 'marmara', 'AK Parti'],
  ['Samsun', 41.29, 36.33, 1.38, 'karadeniz', 'AK Parti'],
  ['Siirt', 37.93, 41.94, 0.33, 'guneydogu', 'DEM'],
  ['Sinop', 42.03, 35.15, 0.22, 'karadeniz', 'CHP'],
  ['Sivas', 39.75, 37.02, 0.63, 'icanadolu', 'MHP'],
  ['Tekirdağ', 40.98, 27.51, 1.17, 'marmara', 'CHP'],
  ['Tokat', 40.31, 36.55, 0.6, 'karadeniz', 'AK Parti'],
  ['Trabzon', 41.0, 39.72, 0.82, 'karadeniz', 'AK Parti'],
  ['Tunceli', 39.11, 39.55, 0.09, 'doguanadolu', 'DEM'],
  ['Şanlıurfa', 37.16, 38.8, 2.21, 'guneydogu', 'YRP'],
  ['Uşak', 38.68, 29.41, 0.38, 'ege', 'CHP'],
  ['Van', 38.5, 43.38, 1.13, 'doguanadolu', 'DEM'],
  ['Yozgat', 39.82, 34.81, 0.42, 'icanadolu', 'YRP'],
  ['Zonguldak', 41.45, 31.79, 0.59, 'karadeniz', 'CHP'],
  ['Aksaray', 38.37, 34.03, 0.44, 'icanadolu', 'AK Parti'],
  ['Bayburt', 40.26, 40.23, 0.09, 'karadeniz', 'MHP'],
  ['Karaman', 37.18, 33.22, 0.26, 'icanadolu', 'MHP'],
  ['Kırıkkale', 39.85, 33.51, 0.28, 'icanadolu', 'CHP'],
  ['Batman', 37.88, 41.13, 0.65, 'guneydogu', 'DEM'],
  ['Şırnak', 37.52, 42.46, 0.56, 'guneydogu', 'AK Parti'],
  ['Bartın', 41.63, 32.34, 0.21, 'karadeniz', 'CHP'],
  ['Ardahan', 41.11, 42.7, 0.09, 'doguanadolu', 'CHP'],
  ['Iğdır', 39.92, 44.05, 0.2, 'doguanadolu', 'DEM'],
  ['Yalova', 40.65, 29.27, 0.3, 'marmara', 'AK Parti'],
  ['Karabük', 41.2, 32.62, 0.25, 'karadeniz', 'AK Parti'],
  ['Kilis', 36.72, 37.12, 0.15, 'guneydogu', 'CHP'],
  ['Osmaniye', 37.07, 36.25, 0.56, 'akdeniz', 'MHP'],
  ['Düzce', 40.84, 31.16, 0.41, 'karadeniz', 'AK Parti'],
];

/** [ad, enlem, boylam, metropol nüfusu (milyon)] */
export type CityRow = [string, number, number, number];

export const CITY_SEEDS: Record<string, CityRow[]> = {
  us: [
    ['New York', 40.71, -74.01, 19.5], ['Los Angeles', 34.05, -118.24, 12.8], ['Chicago', 41.88, -87.63, 9.3],
    ['Dallas', 32.78, -96.8, 8.1], ['Houston', 29.76, -95.37, 7.5], ['Washington', 38.91, -77.04, 6.3],
    ['Miami', 25.76, -80.19, 6.2], ['Atlanta', 33.75, -84.39, 6.3], ['Phoenix', 33.45, -112.07, 5.1], ['Seattle', 47.61, -122.33, 4.0],
  ],
  de: [
    ['Berlin', 52.52, 13.4, 3.9], ['Hamburg', 53.55, 9.99, 1.9], ['Münih', 48.14, 11.58, 1.5], ['Köln', 50.94, 6.96, 1.1],
    ['Frankfurt', 50.11, 8.68, 0.77], ['Stuttgart', 48.78, 9.18, 0.63], ['Düsseldorf', 51.23, 6.78, 0.62], ['Leipzig', 51.34, 12.37, 0.62], ['Dortmund', 51.51, 7.47, 0.59],
  ],
  fr: [
    ['Paris', 48.86, 2.35, 11.3], ['Lyon', 45.76, 4.84, 2.3], ['Marsilya', 43.3, 5.37, 1.9], ['Toulouse', 43.6, 1.44, 1.5],
    ['Lille', 50.63, 3.06, 1.5], ['Bordeaux', 44.84, -0.58, 1.4], ['Nice', 43.7, 7.27, 1.0], ['Nantes', 47.22, -1.55, 1.0], ['Strazburg', 48.57, 7.75, 0.8],
  ],
  gb: [
    ['Londra', 51.51, -0.13, 9.6], ['Manchester', 53.48, -2.24, 2.9], ['Birmingham', 52.49, -1.89, 2.9], ['Glasgow', 55.86, -4.25, 1.7],
    ['Leeds', 53.8, -1.55, 1.9], ['Liverpool', 53.41, -2.98, 1.6], ['Newcastle', 54.98, -1.61, 1.1], ['Bristol', 51.45, -2.59, 0.7], ['Edinburgh', 55.95, -3.19, 0.55], ['Cardiff', 51.48, -3.18, 0.48],
  ],
  it: [
    ['Roma', 41.9, 12.5, 4.3], ['Milano', 45.46, 9.19, 3.2], ['Napoli', 40.85, 14.27, 3.0], ['Torino', 45.07, 7.69, 2.2],
    ['Palermo', 38.12, 13.36, 1.2], ['Bari', 41.12, 16.87, 1.2], ['Bologna', 44.49, 11.34, 1.0], ['Floransa', 43.77, 11.26, 1.0], ['Venedik', 45.44, 12.32, 0.85],
  ],
  es: [
    ['Madrid', 40.42, -3.7, 6.8], ['Barselona', 41.39, 2.17, 5.7], ['Valensiya', 39.47, -0.38, 2.6], ['Sevilla', 37.39, -5.98, 1.9],
    ['Málaga', 36.72, -4.42, 1.7], ['Bilbao', 43.26, -2.93, 1.0], ['Palma', 39.57, 2.65, 0.9], ['Zaragoza', 41.65, -0.89, 0.78],
  ],
  pl: [
    ['Varşova', 52.23, 21.01, 3.1], ['Katowice', 50.26, 19.02, 2.0], ['Krakov', 50.06, 19.94, 1.5], ['Gdańsk', 54.35, 18.65, 1.3],
    ['Wrocław', 51.11, 17.04, 1.2], ['Łódź', 51.76, 19.46, 1.0], ['Poznań', 52.41, 16.93, 1.0], ['Szczecin', 53.43, 14.55, 0.65], ['Lublin', 51.25, 22.57, 0.6],
  ],
  gr: [
    ['Atina', 37.98, 23.73, 3.7], ['Selanik', 40.64, 22.94, 1.1], ['Patras', 38.25, 21.73, 0.21], ['Kandiye', 35.34, 25.14, 0.21],
    ['Larisa', 39.64, 22.42, 0.16], ['Volos', 39.36, 22.94, 0.14], ['Yanya', 39.67, 20.85, 0.11],
  ],
  az: [
    ['Bakü', 40.41, 49.87, 2.3], ['Nahçıvan', 39.21, 45.41, 0.46], ['Sumgayıt', 40.59, 49.67, 0.35], ['Gence', 40.68, 46.36, 0.34],
    ['Lenkeran', 38.75, 48.85, 0.23], ['Şeki', 41.19, 47.17, 0.19], ['Mingeçevir', 40.76, 47.06, 0.11],
  ],
  il: [
    ['Tel Aviv', 32.09, 34.78, 4.2], ['Hayfa', 32.79, 34.99, 1.1], ['Kudüs', 31.77, 35.21, 1.0], ['Beerşeba', 31.25, 34.79, 0.8],
    ['Rişon LeZion', 31.97, 34.8, 0.26], ['Netanya', 32.33, 34.86, 0.23], ['Aşdod', 31.8, 34.65, 0.23],
  ],
  in: [
    ['Delhi', 28.61, 77.21, 33], ['Mumbai', 19.08, 72.88, 22], ['Kalküta', 22.57, 88.36, 15.5], ['Bangalore', 12.97, 77.59, 14],
    ['Chennai', 13.08, 80.27, 12], ['Haydarabad', 17.39, 78.49, 11], ['Ahmedabad', 23.02, 72.57, 8.7], ['Surat', 21.17, 72.83, 8],
    ['Pune', 18.52, 73.86, 7.2], ['Jaipur', 26.91, 75.79, 4.2], ['Lucknow', 26.85, 80.95, 4.0], ['Patna', 25.59, 85.14, 2.6],
  ],
  jp: [
    ['Tokyo', 35.68, 139.69, 37], ['Osaka', 34.69, 135.5, 19], ['Nagoya', 35.18, 136.91, 9.5], ['Fukuoka', 33.59, 130.4, 5.5],
    ['Sapporo', 43.06, 141.35, 2.6], ['Sendai', 38.27, 140.87, 2.2], ['Kyoto', 35.01, 135.77, 1.5], ['Hiroşima', 34.39, 132.46, 1.4],
  ],
  kr: [
    ['Seul', 37.57, 126.98, 9.4], ['Busan', 35.18, 129.08, 3.3], ['Incheon', 37.46, 126.71, 3.0], ['Daegu', 35.87, 128.6, 2.4],
    ['Daejeon', 36.35, 127.38, 1.5], ['Gwangju', 35.16, 126.85, 1.4], ['Suwon', 37.26, 127.03, 1.2], ['Ulsan', 35.54, 129.31, 1.1],
  ],
  ca: [
    ['Toronto', 43.65, -79.38, 6.7], ['Montreal', 45.5, -73.57, 4.4], ['Vancouver', 49.28, -123.12, 2.8], ['Calgary', 51.05, -114.07, 1.6],
    ['Edmonton', 53.55, -113.49, 1.5], ['Ottawa', 45.42, -75.7, 1.5], ['Winnipeg', 49.9, -97.14, 0.85], ['Quebec', 46.81, -71.21, 0.85], ['Halifax', 44.65, -63.58, 0.48],
  ],
  mx: [
    ['Meksiko', 19.43, -99.13, 22], ['Guadalajara', 20.66, -103.35, 5.3], ['Monterrey', 25.69, -100.32, 5.3], ['Puebla', 19.04, -98.21, 3.2],
    ['Tijuana', 32.51, -117.04, 2.2], ['León', 21.12, -101.68, 2.1], ['Mérida', 20.97, -89.62, 1.3], ['Cancún', 21.16, -86.85, 0.9],
  ],
  br: [
    ['São Paulo', -23.55, -46.63, 22.4], ['Rio de Janeiro', -22.91, -43.17, 13.6], ['Belo Horizonte', -19.92, -43.94, 6.0],
    ['Brasília', -15.79, -47.88, 4.8], ['Porto Alegre', -30.03, -51.23, 4.3], ['Fortaleza', -3.73, -38.53, 4.1], ['Recife', -8.05, -34.88, 4.1],
    ['Salvador', -12.97, -38.5, 3.9], ['Curitiba', -25.43, -49.27, 3.7], ['Manaus', -3.12, -60.02, 2.3],
  ],
  ar: [
    ['Buenos Aires', -34.6, -58.38, 15.5], ['Córdoba', -31.42, -64.18, 1.6], ['Rosario', -32.95, -60.65, 1.4], ['Mendoza', -32.89, -68.85, 1.2],
    ['Tucumán', -26.81, -65.22, 0.9], ['La Plata', -34.92, -57.95, 0.9], ['Mar del Plata', -38.0, -57.56, 0.65], ['Salta', -24.78, -65.41, 0.6], ['Neuquén', -38.95, -68.06, 0.4],
  ],
  cn: [
    ['Şanghay', 31.23, 121.47, 29], ['Pekin', 39.9, 116.4, 22], ['Guangzhou', 23.13, 113.26, 19], ['Shenzhen', 22.54, 114.06, 17.5],
    ['Chongqing', 29.56, 106.55, 17], ['Chengdu', 30.57, 104.07, 16], ['Wuhan', 30.59, 114.31, 11], ['Xi\'an', 34.34, 108.94, 9], ['Urumçi', 43.83, 87.62, 4],
  ],
  ru: [
    ['Moskova', 55.76, 37.62, 13], ['St. Petersburg', 59.93, 30.36, 5.6], ['Novosibirsk', 55.03, 82.92, 1.6], ['Yekaterinburg', 56.84, 60.61, 1.5],
    ['Kazan', 55.79, 49.12, 1.3], ['Nijni Novgorod', 56.33, 44.0, 1.2], ['Samara', 53.2, 50.15, 1.2], ['Rostov', 47.24, 39.71, 1.1], ['Vladivostok', 43.12, 131.89, 0.6],
  ],
  ir: [
    ['Tahran', 35.69, 51.39, 9.5], ['Meşhed', 36.3, 59.6, 3.4], ['İsfahan', 32.65, 51.67, 2.3], ['Kerec', 35.84, 50.94, 1.9],
    ['Şiraz', 29.59, 52.58, 1.8], ['Tebriz', 38.08, 46.29, 1.7], ['Kum', 34.64, 50.88, 1.4], ['Ahvaz', 31.32, 48.67, 1.3],
  ],
  sa: [
    ['Riyad', 24.71, 46.68, 7.7], ['Cidde', 21.49, 39.19, 4.7], ['Mekke', 21.39, 39.86, 2.4], ['Medine', 24.47, 39.61, 1.5],
    ['Dammam', 26.43, 50.1, 1.3], ['Tebük', 28.38, 36.57, 0.6], ['Ebha', 18.22, 42.51, 0.5],
  ],
  eg: [
    ['Kahire', 30.04, 31.24, 22], ['İskenderiye', 31.2, 29.92, 5.5], ['Port Said', 31.26, 32.3, 0.75], ['Süveyş', 29.97, 32.55, 0.75],
    ['Mansura', 31.04, 31.38, 0.6], ['Asyut', 27.18, 31.18, 0.6], ['Luksor', 25.69, 32.64, 0.5], ['Asvan', 24.09, 32.9, 0.4],
  ],
};

/** Yıllık doğal nüfus artışı (%) ve ortalama hane büyüklüğü */
export const DEMOGRAPHY: Record<string, { growth: number; hh: number }> = {
  tr: { growth: 0.5, hh: 3.1 }, us: { growth: 0.5, hh: 2.5 }, de: { growth: 0, hh: 2.0 }, fr: { growth: 0.2, hh: 2.2 },
  gb: { growth: 0.4, hh: 2.4 }, it: { growth: -0.3, hh: 2.3 }, es: { growth: 0.1, hh: 2.5 }, pl: { growth: -0.3, hh: 2.6 },
  gr: { growth: -0.4, hh: 2.5 }, az: { growth: 0.6, hh: 4.0 }, il: { growth: 1.6, hh: 3.1 }, in: { growth: 0.8, hh: 4.4 },
  jp: { growth: -0.5, hh: 2.2 }, kr: { growth: -0.1, hh: 2.3 }, ca: { growth: 1.0, hh: 2.4 }, mx: { growth: 0.8, hh: 3.4 },
  br: { growth: 0.5, hh: 2.9 }, ar: { growth: 0.6, hh: 3.1 }, cn: { growth: -0.1, hh: 2.6 }, ru: { growth: -0.3, hh: 2.5 },
  ir: { growth: 0.7, hh: 3.2 }, sa: { growth: 1.5, hh: 5.5 }, eg: { growth: 1.5, hh: 4.0 },
};

/** Türkiye'de bölgelere göre hane büyüklüğü farkı */
export const TR_HH: Record<string, number> = { guneydogu: 4.6, doguanadolu: 3.9, marmara: 2.9, ege: 2.8 };
