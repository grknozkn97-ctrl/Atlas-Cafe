// Turkish (Türkçe). Kept in one file and merged into the menu data at start-up,
// so the other data files stay readable with their four original languages.
import { ingredients, allergens } from './ingredients.js';
import { sections, extras, itemsById } from './menu.js';
import { deals } from './deals.js';

const ing = {
  boiledEgg: 'haşlanmış yumurta', egg: 'yumurta', eggs: 'yumurta', borekRoll: 'peynirli börek rulosu',
  priganice: 'pişi', gouda: 'gouda peyniri', whiteCheese: 'beyaz peynir', cheese: 'peynir', cheddar: 'cheddar',
  mozzarella: 'mozzarella', parmesan: 'parmesan', olives: 'siyah ve yeşil zeytin', blackOlives: 'siyah zeytin',
  lettuce: 'marul', tomato: 'domates', cucumber: 'salatalık', greenPepper: 'yeşil biber', peppers: 'renkli biber',
  onion: 'soğan', caramelOnion: 'karamelize soğan', mushroom: 'mantar', sweetCorn: 'mısır', pickles: 'turşu',
  rocket: 'roka', sideSalad: 'garnitür salata', ajvar: 'ajvar', honey: 'bal', butter: 'tereyağı', jam: 'reçel',
  bread: 'ekmek', toastBread: 'tost ekmeği', tortilla: 'tortilla lavaş', sausage: 'sosis', ham: 'jambon',
  tuna: 'ton balığı', chicken: 'tavuk', chickenFillet: 'tavuk fileto', crispyChicken: 'çıtır tavuk',
  meatballs: 'köfte', beefPatty: 'dana burger köftesi', fries: 'patates kızartması', crispyPotato: 'çıtır çöp patates',
  onionRings: 'soğan halkası', rice: 'pilav', penne: 'penne makarna', pizzaDough: 'pizza hamuru', cream: 'krema',
  yogurt: 'yoğurt', ketchup: 'ketçap', mayo: 'mayonez', burgerSauce: 'burger sos', curry: 'köri', chiliSauce: 'acı sos',
  sweetChili: 'tatlı chili sos', pesto: 'pesto', tomatoSauce: 'domates sos', napoliSauce: 'napoliten sos',
  bbqSauce: 'barbekü sos', chickenSauce: 'özel tavuk sosu', spices: 'baharat', dressing: 'salata sosu',
  pancakes: '10 mini pankek', chocSpread: 'çikolatalı krema', fruit: 'mevsim meyvesi',
  blackTea: 'siyah çay', herbalTea: 'bitki çayı', salep: 'salep', hotChocolate: 'sıcak çikolata',
  whiteChocolate: 'beyaz çikolata', chocolate: 'çikolata', cinnamon: 'tarçın', espresso: 'espresso',
  doubleEspresso: 'double espresso', domesticCoffee: 'geleneksel pişirilmiş kahve', milkFoam: 'bir tutam süt köpüğü',
  hotWater: 'sıcak su', milk: 'süt', steamedMilk: 'buharla ısıtılmış süt ve köpük', microfoam: 'ipeksi süt köpüğü',
  ice: 'buz', chocSyrup: 'çikolata şurubu', whiteChocSyrup: 'beyaz çikolata şurubu', caramelSyrup: 'karamel şurubu',
  freshLemon: 'taze sıkılmış limon', sparkling: 'maden suyu', freshOrange: 'taze sıkılmış portakal',
  watermelon: 'karpuz', melon: 'kavun', strawberry: 'çilek', pineapple: 'ananas püresi', mulberry: 'karadut püresi',
  fruitSyrup: 'meyve şurubu', vanillaIce: 'vanilyalı dondurma', chocIce: 'çikolatalı dondurma', oreo: 'Oreo',
  chocCream: 'çikolata kreması', banana: 'muz', vodka: 'votka', coffeeLiqueur: 'kahve likörü', syrup: 'şeker şurubu',
  aperol: 'Aperol', campari: 'Campari', prosecco: 'prosecco', gin: 'cin', vermouth: 'kırmızı vermut', tonic: 'tonik',
  pearRakija: 'armut rakiyası', apricotRakija: 'kayısı rakiyası', orangeJuice: 'taze portakal suyu',
  pomegranate: 'nar suyu', blueCuracao: 'Blue Curaçao', pineappleJuice: 'ananas suyu', sprite: 'Sprite',
  tequila: 'tekila', whiteRum: 'beyaz rom', tripleSec: 'triple sec', lemonJuice: 'limon suyu',
  limeJuice: 'misket limonu suyu', cola: 'kola', coconutCream: 'hindistan cevizi kreması', whiskey: 'viski',
  mint: 'taze nane', gorkiList: 'Gorki List',
};

const al = {
  1: 'Gluten', 2: 'Kabuklu deniz ürünleri', 3: 'Yumurta', 4: 'Balık', 5: 'Yer fıstığı', 6: 'Soya', 7: 'Süt',
  8: 'Sert kabuklu yemişler', 9: 'Kereviz', 10: 'Hardal', 11: 'Susam', 12: 'Sülfit', 13: 'Acı bakla', 14: 'Yumuşakçalar',
};

const sectionTitles = { kitchen: 'Mutfak', drinks: 'İçecekler', bar: 'Bar', dessert: 'Tatlı' };
const groupTitles = {
  breakfast: 'Kahvaltı', toast: 'Tost', sandwich: 'Sandviçler', snacks: 'Atıştırmalıklar', pasta: 'Makarna',
  chicken: 'Tavuk', meat: 'Et', salad: 'Salatalar', burger: 'Burgerler', pizza: 'Pizza', wrap: 'Dürümler',
  'hot-coffee': 'Kahve', 'cold-coffee': 'Soğuk kahve', 'hot-drink': 'Çay ve sıcak içecekler',
  'soft-drinks': 'Soğuk içecekler', frozen: 'Frozen', milkshake: 'Milkshake', cocktail: 'Kokteyller',
  beer: 'Bira', wine: 'Şarap', spirits: 'Şişe içkiler', 'dessert-sub': 'Kek ve kurabiyeler',
};

const names = {
  b1: 'Hızlı Kahvaltı', b7: 'Peynirli Börek Rulosu', b9: 'Pişi Tabağı', b3: 'Sahanda Yumurta',
  b4: 'Sosisli Yumurta', b5: 'Sade Omlet', b6: 'Sosisli Omlet', b10: 'Pankek',
  t1: 'Kaşarlı Tost', t3: 'Yumurtalı Tost', snd1: 'Cheddar Sandviç', snd2: 'Ton Balıklı Sandviç',
  sn1: 'Patates Kızartması', sn5: 'Cheddarlı Patates', sn2: 'Sosisli Patates', sn3: 'Çıtır Tavuk',
  p2: 'Körili Makarna', p3: 'Acılı Makarna', p4: 'Pesto Soslu Makarna',
  c1: 'Tavuk Çökertme', c2: 'Tavuk Fajita', c3: 'Izgara Tavuk', c4: 'Körili Tavuk', c5: 'Mantarlı Tavuk',
  c6: 'Acı Soslu Tavuk', c7: 'Tavuk Sote', m1: 'Köfte', m2: 'Cheddarlı Köfte',
  sl1: 'Karışık Salata', sl2: 'Tavuklu Salata', sl3: 'Çıtır Tavuklu Salata', sl4: 'Ton Balıklı Salata',
  hm1: 'Klasik Burger', hm3: 'Şefin Burgeri', pz2: 'Karışık', pz3: 'Barbekü Tavuk',
  wr1: 'Çıtır Tavuk Dürüm', wr2: 'Tavuk Dürüm', cf11: 'Double Espresso', cf9: 'Kuvana Kafa (Türk usulü)',
  hd1: 'Siyah Çay', hd2: 'Bitki Çayı', hd4: 'Sıcak Çikolata', hd5: 'Beyaz Sıcak Çikolata',
  sd7: 'Taze Portakal Suyu', sd8: 'Su', sd9: 'Maden Suyu',
  fz1: 'Karpuz Frozen', fz5: 'Kavun Frozen', fz2: 'Çilek Frozen', fz3: 'Ananas Frozen', fz4: 'Karadut Frozen',
  ms2: 'Çikolatalı Shake', ms3: 'Çilekli Shake', ms4: 'Muzlu Shake', ck5: 'Cin Tonik',
  wn1: 'Kırmızı Şarap', wn2: 'Beyaz Şarap', wn3: 'Roze', sp3: 'Koyu Rom',
  s3: 'Havuçlu Kek', s1: 'Mozaik Pasta', s2: 'Çikolatalı Kurabiye',
};

const notes = {
  b2: 'Domates ve biberli, Türk usulü',
  sd5: 'Klasik veya şekersiz',
  wn1: 'Cabernet, gövdeli', wn2: 'Sauvignon Blanc, ferah', wn3: 'Hafif ve meyvemsi', wn4: 'Köpüklü şarap',
  s3: 'Baharatlı havuçlu kek, ceviz ve krem peynir kreması',
  s1: 'Çikolata ve bisküvi, fırınsız klasik',
  s2: 'Damla çikolatalı tereyağlı kurabiye',
};

const extrasTr = {
  'x-cheese': 'Peynir 30 g', 'x-sausage': 'Sosis 30 g', 'x-olives': 'Zeytin 30 g', 'x-tomato': 'Domates 50 g',
  'x-cucumber': 'Salatalık 50 g', 'x-egg': 'Haşlanmış yumurta', 'x-ajvar': 'Ajvar 30 g', 'x-honey': 'Bal 15 g',
  'x-butter': 'Tereyağı 20 g', 'x-bread': 'Ekmek 100 g', 'x-cheddar': 'Cheddar 50 g', 'x-sauce': 'Ekstra sos',
  'x-parmesan': 'Ekstra parmesan', 'x-pasta': 'Ekstra makarna +50 g', 'x-csauce': 'Ekstra sos',
  'x-cbread': 'Ekstra ekmek', 'x-ccheese': 'Ekstra peynir', 'x-topping': 'Ekstra sos (üstü)', 'x-fsauce': 'Ekstra sos',
  'x-whip': 'Krem şanti', 'x-mcream': 'Ekstra krema', 'x-msyrup': 'Ekstra şurup', 'x-mchoc': 'Ekstra çikolata',
};

const dealsTr = {
  'deal-morning': ['Tost & çay', 'Kaşarlı tost, patates kızartması ve bir siyah çay'],
  'deal-coffee': ['Tatlı & kahve', 'İstediğin bir kek veya kurabiye ile sıcak bir kahve'],
  'deal-beer': ['Patates & 2 Nikšićko', 'Büyük boy patates kızartması ve iki adet 0,33 l Nikšićko'],
  'deal-pasta': ['2 makarna & 2 kırmızı şarap', 'İki kişilik akşam yemeği: istediğin iki makarna ve iki kırmızı şarap'],
};

for (const [k, v] of Object.entries(ing)) if (ingredients[k]) ingredients[k].tr = v;
for (const [k, v] of Object.entries(al)) allergens[k].tr = v;
for (const list of Object.values(extras)) for (const x of list) if (extrasTr[x.id]) x.name.tr = extrasTr[x.id];
for (const d of deals) if (dealsTr[d.id]) { [d.title.tr, d.detail.tr] = dealsTr[d.id]; }

const patch = (it) => {
  if (names[it.id]) it.names = { ...(it.names || {}), tr: names[it.id] };
  if (notes[it.id] && it.note) it.note.tr = notes[it.id];
  else if (notes[it.id]) it.note = { en: '', tr: notes[it.id] };
};
for (const s of sections) {
  s.title.tr = sectionTitles[s.id];
  for (const g of s.groups) {
    g.title.tr = groupTitles[g.id];
    for (const it of g.items) patch(it);
  }
}
for (const it of Object.values(itemsById)) patch(it);
