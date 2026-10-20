const nf1 = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1, minimumFractionDigits: 1 });
const nf0 = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 });
const nf2 = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2, minimumFractionDigits: 2 });

export const n1 = (x: number) => nf1.format(x);
export const n0 = (x: number) => nf0.format(x);
export const n2 = (x: number) => nf2.format(x);
export const pct = (x: number) => `%${nf1.format(x)}`;
export const signed = (x: number) => (x > 0 ? '+' : '') + nf1.format(x);

export function money(bn: number): string {
  if (bn >= 1000) return `${nf2.format(bn / 1000)} trilyon $`;
  return `${nf0.format(bn)} milyar $`;
}

/** Oyun günü sayısını gerçek süreye çevirir. */
export function realDuration(days: number, dayMs: number): string {
  const mins = (days * dayMs) / 60000;
  if (mins < 90) return `${Math.max(1, Math.round(mins))} dk`;
  const hours = mins / 60;
  if (hours < 48) return `${Math.round(hours)} saat`;
  return `${Math.round(hours / 24)} gün`;
}
