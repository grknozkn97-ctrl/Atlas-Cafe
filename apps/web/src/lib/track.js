import { track as vercelTrack } from '@vercel/analytics';

// Small wrapper so a blocked or missing analytics script never breaks the menu.
// Custom events show up in Vercel > Analytics > Events (on plans that include them).
export function track(name, props) {
  try { vercelTrack(name, props); } catch { /* ignore */ }
}
