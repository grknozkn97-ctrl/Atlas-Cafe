// Structured data for search engines. Google reads JSON-LD that is added by
// script, so the full menu (with the live prices from the owner's sheet) is
// published here as a schema.org Menu linked to the cafe. The cafe's own
// details live in index.html so they are there before any script runs.
import { ingredients } from '@/data/ingredients.js';

const SITE = 'https://www.cafeatlas.me/';

function describe(it) {
  if (it.note && it.note.en) return it.note.en;
  const parts = (it.ing || []).map((k) => {
    const [n, key] = k.includes(':') ? k.split(':') : [null, k];
    const word = (ingredients[key] || {}).en || key;
    return n ? `${n} ${word}` : word;
  });
  return parts.length ? parts.join(', ') : undefined;
}

export function menuSchema(sections) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Menu',
    '@id': `${SITE}#menu`,
    name: 'Atlas Cafe & Bar menu',
    url: SITE,
    inLanguage: ['en', 'sr-ME', 'it', 'fr', 'tr'],
    hasMenuSection: sections.map((s) => ({
      '@type': 'MenuSection',
      name: s.title.en,
      hasMenuSection: s.groups.map((g) => ({
        '@type': 'MenuSection',
        name: g.title.en,
        hasMenuItem: g.items.filter((it) => !it.soldOut).map((it) => {
          const item = { '@type': 'MenuItem', name: it.name };
          const d = describe(it);
          if (d) item.description = d;
          if (it.size) item.description = item.description ? `${item.description} (${it.size})` : it.size;
          if (it.kcal) item.nutrition = { '@type': 'NutritionInformation', calories: `${it.kcal} calories` };
          if (typeof it.price === 'number') {
            item.offers = { '@type': 'Offer', price: it.price.toFixed(2), priceCurrency: 'EUR' };
          }
          if (it.img) item.image = it.img;
          return item;
        }),
      })),
    })),
  };
}

export function publishMenuSchema(sections) {
  if (typeof document === 'undefined') return;
  let tag = document.getElementById('ld-menu');
  if (!tag) {
    tag = document.createElement('script');
    tag.type = 'application/ld+json';
    tag.id = 'ld-menu';
    document.head.appendChild(tag);
  }
  tag.textContent = JSON.stringify(menuSchema(sections));
}
