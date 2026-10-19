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
  ccf2: T('Ghost Mocha', 'Moka duh', 'Moka fantasma', 'Moka fantôme', 'Hayalet Mocha'),
};

// Shown first in the deals rail, in this order.
export const picks = ['fz4', 'ck1', 'p3', 'hd4', 'sn4', 's1', 'ck7', 'ccf2', 'c6'];

export const hui = {
  en: { bannerTitle: 'Halloween at Atlas', bannerText: 'Spooky nicknames on the menu until 1 November. Look for the pumpkin.', pickTag: 'Halloween pick', picksTitle: 'Halloween picks',
    mascotInsta: 'Boo! Our Halloween specials go up on Instagram first.', mascotGoogle: 'Survived the night? Thirty seconds on Google helps a small café a lot.' },
  me: { bannerTitle: 'Halloween u Atlasu', bannerText: 'Jeziva imena na meniju do 1. novembra. Tražite bundevu.', pickTag: 'Halloween izbor', picksTitle: 'Halloween izbor',
    mascotInsta: 'Bu! Halloween specijalitete prvo objavljujemo na Instagramu.', mascotGoogle: 'Preživjeli ste noć? Trideset sekundi na Googlu mnogo znači malom kafiću.' },
  it: { bannerTitle: 'Halloween all’Atlas', bannerText: 'Nomi da brivido nel menù fino al 1° novembre. Cerca la zucca.', pickTag: 'Scelta di Halloween', picksTitle: 'Scelte di Halloween',
    mascotInsta: 'Bu! Le specialità di Halloween escono prima su Instagram.', mascotGoogle: 'Sopravvissuti alla notte? Trenta secondi su Google aiutano tanto un piccolo caffè.' },
  fr: { bannerTitle: 'Halloween chez Atlas', bannerText: 'Des noms qui font frissonner sur la carte jusqu’au 1er novembre. Cherchez la citrouille.', pickTag: 'Choix d’Halloween', picksTitle: 'Les choix d’Halloween',
    mascotInsta: 'Bouh ! Nos spécialités d’Halloween paraissent d’abord sur Instagram.', mascotGoogle: 'Vous avez survécu à la nuit ? Trente secondes sur Google aident beaucoup un petit café.' },
  tr: { bannerTitle: 'Atlas’ta Halloween', bannerText: '1 Kasım’a kadar menüde ürperten isimler var. Balkabağı işaretine bak.', pickTag: 'Halloween seçkisi', picksTitle: 'Halloween seçkisi',
    mascotInsta: 'Bö! Halloween lezzetlerini önce Instagram’da paylaşıyoruz.', mascotGoogle: 'Geceyi atlattın mı? Google’da otuz saniye küçük bir kafeye çok şey katar.' },
};
