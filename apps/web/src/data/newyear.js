// New Year costume for the menu: winter nicknames on real dishes (the real
// name stays, so ordering never gets confusing), a banner that counts down to
// midnight on 31 December, and the mascot's seasonal lines. Prices and
// recipes are unchanged. Dates live in theme.js.
const T = (en, me, it, fr, tr) => ({ en, me, it, fr, tr });

export const YEAR = 2027;

export const nicknames = {
  hd4: T('Snowfall Cocoa', 'Kakao pod snijegom', 'Cioccolata sotto la neve', 'Chocolat sous la neige', 'Kar Altında Kakao'),
  hd5: T('Snowman’s Chocolate', 'Čokolada Sniješka', 'Cioccolata del pupazzo di neve', 'Chocolat du bonhomme de neige', 'Kardan Adam Çikolatası'),
  hd3: T('Fireside Salep', 'Salep uz kamin', 'Salep davanti al camino', 'Salep au coin du feu', 'Şömine Başı Salep'),
  s3: T('New Year’s Eve Cake', 'Novogodišnja torta', 'Torta di Capodanno', 'Gâteau du Nouvel An', 'Yılbaşı Pastası'),
  sn4: T('Midnight Party Mix', 'Ponoćni žurka miks', 'Mix della festa di mezzanotte', 'Mix de la fête de minuit', 'Gece Yarısı Parti Tabağı'),
  wn4: T('Midnight Toast', 'Ponoćna zdravica', 'Brindisi di mezzanotte', 'Toast de minuit', 'Gece Yarısı Kadehi'),
  cf3: T('Reindeer Mocha', 'Moka od irvasa', 'Moka della renna', 'Moka du renne', 'Ren Geyiği Mocha'),
  ms1: T('Snowball Shake', 'Šejk snježna gruda', 'Shake palla di neve', 'Shake boule de neige', 'Kartopu Shake'),
};

// Winter specials: moved to the top of their own group and framed in gold
// with a short line of story.
export const featured = ['sn4', 'hd4', 'hd5', 'hd3', 's3'];

export const tales = {
  sn4: T('One big plate for the whole table while the countdown runs.', 'Jedan veliki tanjir za cijeli sto dok traje odbrojavanje.', 'Un grande piatto per tutto il tavolo durante il conto alla rovescia.', 'Une grande assiette pour toute la table pendant le compte à rebours.', 'Geri sayım sürerken bütün masaya tek büyük tabak.'),
  hd4: T('Thick, dark and warm. Made for cold Podgorica evenings.', 'Gusta, tamna i topla. Za hladne podgoričke večeri.', 'Densa, scura e calda. Per le sere fredde di Podgorica.', 'Épais, noir et chaud. Pour les soirées froides de Podgorica.', 'Koyu, yoğun ve sıcacık. Soğuk Podgorica akşamları için.'),
  hd5: T('Soft and white as the first snow on Lovćen.', 'Mekana i bijela kao prvi snijeg na Lovćenu.', 'Morbida e bianca come la prima neve sul Lovćen.', 'Douce et blanche comme la première neige sur le Lovćen.', 'Lovćen’e düşen ilk kar gibi yumuşak ve bembeyaz.'),
  hd3: T('Milk, salep and cinnamon: a Turkish winter classic.', 'Mlijeko, salep i cimet: turski zimski klasik.', 'Latte, salep e cannella: un classico invernale turco.', 'Lait, salep et cannelle : un classique de l’hiver turc.', 'Süt, salep ve tarçın: Türk kışının klasiği.'),
  s3: T('Spiced sponge, walnuts and cream cheese. A slice for the new year.', 'Začinjeni biskvit, orasi i krem sir. Parče za novu godinu.', 'Pan di spagna speziato, noci e formaggio cremoso. Una fetta per l’anno nuovo.', 'Génoise épicée, noix et cream cheese. Une part pour la nouvelle année.', 'Baharatlı kek, ceviz ve krem peynir. Yeni yıla bir dilim.'),
};

// Move the featured dishes to the top of their groups.
export function featureFirst(sections) {
  return sections.map((s) => ({
    ...s,
    groups: s.groups.map((g) => {
      const top = g.items.filter((it) => featured.includes(it.id));
      if (!top.length) return g;
      return { ...g, items: [...top, ...g.items.filter((it) => !featured.includes(it.id))] };
    }),
  }));
}

// Whole days from today (Podgorica) to 1 January.
function daysToNewYear() {
  let today;
  try {
    today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Podgorica' }).format(new Date());
  } catch {
    today = new Date().toISOString().slice(0, 10);
  }
  const [y, m, d] = today.split('-').map(Number);
  return Math.round((Date.UTC(YEAR, 0, 1) - Date.UTC(y, m - 1, d)) / 86400000);
}
export const DAYS_LEFT = daysToNewYear();

// Banner: a countdown in December, a toast on the night, good wishes after.
function banner(days, w) {
  if (days > 1) return { title: w.countTitle(days), text: w.text };
  if (days === 1) return { title: w.eveTitle, text: w.text };
  return { title: w.happyTitle, text: w.afterText };
}

const words = {
  en: {
    countTitle: (n) => `${n} days to ${YEAR}`, eveTitle: `Tonight we welcome ${YEAR}!`, happyTitle: `Happy ${YEAR}!`,
    text: 'Our winter specials wear a gold ribbon. Look for the stars.', afterText: 'Thank you for a wonderful year. The winter specials stay until 14 January.',
  },
  me: {
    countTitle: (n) => `Do ${YEAR}. još ${n} dana`, eveTitle: `Večeras dočekujemo ${YEAR}!`, happyTitle: `Srećna ${YEAR}!`,
    text: 'Naši zimski specijaliteti nose zlatnu mašnu. Tražite zvjezdice.', afterText: 'Hvala vam na divnoj godini. Zimski specijaliteti ostaju do 14. januara.',
  },
  it: {
    countTitle: (n) => `${n} giorni al ${YEAR}`, eveTitle: `Stasera accogliamo il ${YEAR}!`, happyTitle: `Buon ${YEAR}!`,
    text: 'Le nostre specialità invernali hanno un fiocco d’oro. Cerca le stelle.', afterText: 'Grazie per un anno meraviglioso. Le specialità invernali restano fino al 14 gennaio.',
  },
  fr: {
    countTitle: (n) => `Plus que ${n} jours avant ${YEAR}`, eveTitle: `Ce soir, nous accueillons ${YEAR} !`, happyTitle: `Bonne année ${YEAR} !`,
    text: 'Nos spécialités d’hiver portent un ruban doré. Cherchez les étoiles.', afterText: 'Merci pour cette belle année. Les spécialités d’hiver restent jusqu’au 14 janvier.',
  },
  tr: {
    countTitle: (n) => `${YEAR}’ye ${n} gün kaldı`, eveTitle: `Bu gece ${YEAR}’yi karşılıyoruz!`, happyTitle: `Mutlu yıllar, ${YEAR}!`,
    text: 'Kış lezzetlerimiz altın kurdeleli. Yıldızları takip et.', afterText: 'Güzel bir yıl için teşekkürler. Kış lezzetleri 14 Ocak’a kadar menüde.',
  },
};

const ui = {
  en: { featuredTag: 'Winter special', mascotInsta: 'Ho ho! Our winter specials go up on Instagram first.', mascotGoogle: 'Warmed up? Thirty seconds on Google is the best New Year gift for a small café.' },
  me: { featuredTag: 'Zimski specijal', mascotInsta: 'Ho-ho! Zimske specijalitete prvo objavljujemo na Instagramu.', mascotGoogle: 'Ugrijali ste se? Trideset sekundi na Googlu najljepši je novogodišnji poklon malom kafiću.' },
  it: { featuredTag: 'Speciale d’inverno', mascotInsta: 'Oh oh! Le specialità d’inverno escono prima su Instagram.', mascotGoogle: 'Ti sei scaldato? Trenta secondi su Google sono il regalo di Capodanno più bello per un piccolo caffè.' },
  fr: { featuredTag: 'Spécial hiver', mascotInsta: 'Oh oh ! Nos spécialités d’hiver paraissent d’abord sur Instagram.', mascotGoogle: 'Bien réchauffé ? Trente secondes sur Google, c’est le plus beau cadeau du Nouvel An pour un petit café.' },
  tr: { featuredTag: 'Kış özel', mascotInsta: 'Ho ho! Kış lezzetlerini önce Instagram’da paylaşıyoruz.', mascotGoogle: 'Isındın mı? Google’da otuz saniye, küçük bir kafeye en güzel yılbaşı hediyesi.' },
};

export const hui = Object.fromEntries(Object.keys(ui).map((l) => {
  const b = banner(DAYS_LEFT, words[l]);
  return [l, { ...ui[l], bannerTitle: b.title, bannerText: b.text }];
}));
