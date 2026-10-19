// Seasonal themes. "classic" is the everyday menu and always the fallback.
// A season switches itself on and off by date (Podgorica time), so nobody has
// to remember to change it back. ?theme=classic or ?theme=halloween forces one.
export const SEASONS = [
  { id: 'halloween', from: '2026-10-20', to: '2026-11-01' }, // last day included
];

function podgoricaDate() {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Podgorica' }).format(new Date()); // YYYY-MM-DD
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

export function pickTheme() {
  try {
    const q = new URLSearchParams(window.location.search).get('theme');
    if (q === 'classic' || SEASONS.some((s) => s.id === q)) return q;
  } catch { /* ignore */ }
  const today = podgoricaDate();
  const season = SEASONS.find((s) => today >= s.from && today <= s.to);
  return season ? season.id : 'classic';
}

export const THEME = pickTheme();
export const isHalloween = THEME === 'halloween';
