// Business facts, taken from the Google Business Profile (19.10.2026).
export const PLACE_ID = 'ChIJbzySwS7rTRMRRWf2Ug6lcsI';
export const REVIEW_URL = `https://search.google.com/local/writereview?placeid=${PLACE_ID}`;
export const MAPS_URL = `https://www.google.com/maps/place/?q=place_id:${PLACE_ID}`;
export const INSTAGRAM_URL = 'https://www.instagram.com/atlascafefoodbar/';

export const rating = { score: 4.9, count: 126 };

// Opening hours by weekday (0 = Sunday). null = closed. Hours are Podgorica time.
export const hours = [
  null,     // Sunday
  [9, 21],  // Monday
  [9, 21],
  [9, 21],
  [9, 21],
  [9, 21],
  [9, 21],  // Saturday
];

// Current open state in Podgorica time.
export function openState(now = new Date()) {
  let day = now.getDay();
  let hour = now.getHours() + now.getMinutes() / 60;
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Podgorica', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false,
    }).formatToParts(now);
    const get = (t) => parts.find((p) => p.type === t)?.value;
    day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
    hour = (Number(get('hour')) % 24) + Number(get('minute')) / 60;
  } catch { /* fall back to device time */ }

  const today = hours[day];
  if (today && hour >= today[0] && hour < today[1]) return { open: true, until: today[1] };
  if (today && hour < today[0]) return { open: false, opensDay: day, opensAt: today[0], today: true };
  for (let i = 1; i <= 7; i += 1) {
    const d = (day + i) % 7;
    if (hours[d]) return { open: false, opensDay: d, opensAt: hours[d][0], today: false, tomorrow: i === 1 };
  }
  return { open: false };
}
