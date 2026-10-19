# Atlas Cafe & Bar — menu site

Everything a guest sees lives in `apps/web/src/data/`:

| File | What it holds |
| --- | --- |
| `menu.js` | Every product: name, price, portion, photo, ingredients, allergens, kcal, extras |
| `deals.js` | The combo deals, their prices, regular prices and the hours they are shown first |
| `ingredients.js` | Ingredient names and the 14 EU allergens in all four languages |
| `i18n.js` | Every button and sentence of the interface in ME / EN / IT / FR |

## Common changes

- **Change a price:** find the product in `menu.js` and edit `price: 5.0`.
- **Add a dish:** copy a similar line in the same group, give it a new `id`, and list its
  ingredients by key from `ingredients.js`. If an ingredient is missing, add it there with all
  four languages.
- **Add a photo:** set `img:` to the photo address. Only the café's own photos are used.
- **Allergens:** `al: [1, 3, 7]` uses the official EU numbers (1 gluten, 3 eggs, 7 milk …).
  Keep them in step with the recipe (normativ) sheet.
- **Deals:** `regular` is what the same items cost separately. When it is set, the menu shows
  the saving. Leave it `null` when the exact regular price is not known.

## Languages

Seasonal themes live in `apps/web/src/data/theme.js` (dates) and `halloween.js` (nicknames, picks). Outside a season the classic menu shows; `?theme=classic` or `?theme=halloween` forces one.

The site opens in the phone's language (Montenegrin for sr/hr/bs/me phones, Italian, French,
otherwise English). A QR code can force a language: `https://www.cafeatlas.me/?lang=me`.

## Build

`npm install` then `npm run build` at the repository root. Vercel does this automatically on
every push (project root: `apps/web`); `apps/web/vercel.json` sends every page address to the menu so links like `/drinks` work.
