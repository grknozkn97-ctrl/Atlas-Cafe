// Halloween costume for the menu: playful nicknames on real dishes (the real
// name stays, so ordering never gets confusing), a short banner, and the
// mascot's seasonal lines. Prices and recipes are unchanged.
const T = (en, me, it, fr, tr) => ({ en, me, it, fr, tr });

export const nicknames = {
  fz4: T('Vampire’s Kiss', 'Vampirov poljubac', 'Bacio del vampiro', 'Baiser du vampire', 'Vampir Öpücüğü'),
  ck1: T('Midnight Martini', 'Ponoćni martini', 'Martini di mezzanotte', 'Martini de minuit', 'Gece Yarısı Martinisi'),
  ck7: T('Witch’s Potion', 'Vještičji napitak', 'Pozione della strega', 'Potion de sorcière', 'Cadı İksiri'),
  p3: T('Devil’s Penne', 'Đavolje pene', 'Penne del diavolo', 'Penne du diable', 'Şeytan Makarnası'),
  hd4: T('Cauldron Cocoa', 'Kakao iz kazana', 'Cioccolata del calderone', 'Chocolat du chaudron', 'Kazan Kakaosu'),
  s1: T('Graveyard Cake', 'Torta sa groblja', 'Torta del cimitero', 'Gâteau du cimetière', 'Mezarlık Pastası'),
  sn4: T('Monster Mix', 'Čudovišni miks', 'Mix mostruoso', 'Mix monstre', 'Canavar Mix'),
  c6: T('Dragon’s Breath Chicken', 'Piletina „zmajev dah”', 'Pollo alito di drago', 'Poulet souffle du dragon', 'Ejderha Nefesi Tavuk'),
  t2: T('Mummy Toast', 'Mumija tost', 'Toast della mummia', 'Croque momie', 'Mumya Tost'),
  ccf2: T('Ghost Mocha', 'Moka duh', 'Moka fantasma', 'Moka fantôme', 'Hayalet Mocha'),
};

// The owner's Halloween specials: moved to the top of their own group and
// shown in an orange frame with a short line of story.
export const featured = ['sn4', 'p3', 's1', 'c6', 't2'];

export const tales = {
  sn4: T('A pile big enough to feed the whole monster crew.', 'Gomila dovoljna za cijelu ekipu čudovišta.', 'Una montagna che sfama tutta la banda dei mostri.', 'Une montagne pour nourrir toute la bande de monstres.', 'Bütün canavar ekibini doyuracak kadar büyük bir tabak.'),
  p3: T('Hot enough to wake the devil. Proceed with caution.', 'Dovoljno ljuto da probudi đavola. Oprezno.', 'Piccante da svegliare il diavolo. Con cautela.', 'Assez piquant pour réveiller le diable. Avec prudence.', 'Şeytanı uyandıracak kadar acı. Dikkatli ol.'),
  s1: T('Dark chocolate and biscuit, dug up fresh every morning.', 'Tamna čokolada i keks, svježe iskopani svako jutro.', 'Cioccolato fondente e biscotto, dissotterrati freschi ogni mattina.', 'Chocolat noir et biscuit, déterrés frais chaque matin.', 'Bitter çikolata ve bisküvi, her sabah taze taze mezardan çıkıyor.'),
  c6: T('Chili sauce with a fiery breath. Keep a drink close.', 'Čili sos s vatrenim dahom. Neka piće bude blizu.', 'Salsa piccante dal respiro di fuoco. Tieni una bibita vicina.', 'Une sauce pimentée au souffle de feu. Gardez une boisson à portée.', 'Ateş gibi nefesli acı sos. İçeceğini yanında tut.'),
  t2: T('Our house toast, wrapped up for Halloween.', 'Naš kućni tost, umotan za Halloween.', 'Il toast della casa, avvolto per Halloween.', 'Le croque de la maison, emmailloté pour Halloween.', 'Evimizin tostu, Halloween için sargılara sarıldı.'),
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

export const hui = {
  en: { featuredTag: 'Halloween special', bannerTitle: 'Halloween at Atlas', bannerText: 'Until 1 November our Halloween specials wear an orange frame. Look for the pumpkins.', pickTag: 'Halloween pick', picksTitle: 'Halloween picks',
    mascotInsta: 'Boo! Our Halloween specials go up on Instagram first.', mascotGoogle: 'Survived the night? Thirty seconds on Google helps a small café a lot.' },
  me: { featuredTag: 'Halloween specijal', bannerTitle: 'Halloween u Atlasu', bannerText: 'Do 1. novembra naši Halloween specijaliteti su u narandžastom okviru. Tražite bundeve.', pickTag: 'Halloween izbor', picksTitle: 'Halloween izbor',
    mascotInsta: 'Bu! Halloween specijalitete prvo objavljujemo na Instagramu.', mascotGoogle: 'Preživjeli ste noć? Trideset sekundi na Googlu mnogo znači malom kafiću.' },
  it: { featuredTag: 'Speciale Halloween', bannerTitle: 'Halloween all’Atlas', bannerText: 'Fino al 1° novembre le specialità di Halloween hanno la cornice arancione. Cerca le zucche.', pickTag: 'Scelta di Halloween', picksTitle: 'Scelte di Halloween',
    mascotInsta: 'Bu! Le specialità di Halloween escono prima su Instagram.', mascotGoogle: 'Sopravvissuti alla notte? Trenta secondi su Google aiutano tanto un piccolo caffè.' },
  fr: { featuredTag: 'Spécial Halloween', bannerTitle: 'Halloween chez Atlas', bannerText: 'Jusqu’au 1er novembre, nos spécialités d’Halloween ont un cadre orange. Cherchez les citrouilles.', pickTag: 'Choix d’Halloween', picksTitle: 'Les choix d’Halloween',
    mascotInsta: 'Bouh ! Nos spécialités d’Halloween paraissent d’abord sur Instagram.', mascotGoogle: 'Vous avez survécu à la nuit ? Trente secondes sur Google aident beaucoup un petit café.' },
  tr: { featuredTag: 'Halloween özel', bannerTitle: 'Atlas’ta Halloween', bannerText: '1 Kasım’a kadar Halloween özel lezzetlerimiz turuncu çerçevede. Balkabaklarını takip et.', pickTag: 'Halloween seçkisi', picksTitle: 'Halloween seçkisi',
    mascotInsta: 'Bö! Halloween lezzetlerini önce Instagram’da paylaşıyoruz.', mascotGoogle: 'Geceyi atlattın mı? Google’da otuz saniye küçük bir kafeye çok şey katar.' },
};
