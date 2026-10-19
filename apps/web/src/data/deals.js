// Combo deals. `from`/`to` are hours (Podgorica time) when the deal is the
// natural choice; outside that window it still shows, just after the live ones.
// `regular` is what the same items cost one by one; leave it null when the
// regular price is not known exactly, and no saving is claimed.

const CDN = 'https://horizons-cdn.hostinger.com/9990fccc-f647-46a3-9783-2f5f1ca49c5d/';
const T = (en, me, it, fr) => ({ en, me, it, fr });

export const deals = [
  {
    id: 'deal-morning',
    title: T('Toast & tea', 'Tost & čaj', 'Toast & tè', 'Croque & thé'),
    detail: T('Cheese toast with fries and a black tea', 'Tost sa sirom i pomfritom uz crni čaj', 'Toast al formaggio con patatine e un tè nero', 'Croque au fromage avec frites et un thé noir'),
    price: 4.0,
    regular: 5.5,
    from: 9, to: 12,
    img: CDN + '8f7d7fe256589569a8abb7d8eec9b715.png',
  },
  {
    id: 'deal-coffee',
    title: T('Dessert & coffee', 'Desert & kafa', 'Dolce & caffè', 'Dessert & café'),
    detail: T('Any cake or cookie with a hot coffee', 'Bilo koja torta ili kolačić uz toplu kafu', 'Una torta o un biscotto con un caffè caldo', 'Un gâteau ou un cookie avec un café chaud'),
    price: 4.99,
    regular: null,
    saveUpTo: 2.0, // carrot cake 4.50 + cappuccino 2.50 = 7.00
    from: 12, to: 18,
    img: CDN + 'f62e3667ed0e3d3229a9089dd8c0e053.png',
  },
  {
    id: 'deal-beer',
    title: T('Fries & 2 Nikšićko', 'Pomfrit & 2 Nikšićko', 'Patatine & 2 Nikšićko', 'Frites & 2 Nikšićko'),
    detail: T('A big portion of fries and two 0.33 l Nikšićko', 'Velika porcija pomfrita i dva Nikšićka 0,33 l', 'Una porzione grande di patatine e due Nikšićko da 0,33 l', 'Une grande portion de frites et deux Nikšićko 33 cl'),
    price: 6.0,
    regular: 9.0,
    from: 16, to: 21,
    img: CDN + '57461599610c22066d7d59b1ade9d029.png',
  },
  {
    id: 'deal-pasta',
    title: T('2 pasta & 2 red wine', '2 paste & 2 crna vina', '2 pasta & 2 vini rossi', '2 pâtes & 2 vins rouges'),
    detail: T('Dinner for two: any two pastas and two red wines', 'Večera za dvoje: dvije paste po izboru i dva crna vina', 'Cena per due: due paste a scelta e due vini rossi', 'Dîner pour deux : deux pâtes au choix et deux vins rouges'),
    price: 15.0,
    regular: null,
    from: 18, to: 21,
    img: CDN + '4ba4d8effa966d7c6fe4743afb4ab281.png',
  },
];

// Which deal to suggest inside a product card, by menu group.
export const dealForGroup = {
  breakfast: 'deal-morning',
  toast: 'deal-morning',
  'hot-drink': 'deal-morning',
  'hot-coffee': 'deal-coffee',
  'cold-coffee': 'deal-coffee',
  'dessert-sub': 'deal-coffee',
  snacks: 'deal-beer',
  beer: 'deal-beer',
  pasta: 'deal-pasta',
  wine: 'deal-pasta',
};
