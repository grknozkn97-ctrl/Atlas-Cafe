import React from 'react';
import { useLang } from '@/lib/store.jsx';
import { LANGS } from '@/data/i18n.js';
import { MAPS_URL, REVIEW_URL, openState, rating } from '@/data/business.js';
import { CloseIcon, FilterIcon, GlobeIcon, SearchIcon, Star, Pumpkin } from './icons.jsx';
import { isHalloween } from '@/data/theme.js';
import { hui } from '@/data/halloween.js';

export default function Top({ query, setQuery, onLang, onFilter, hiddenAllergens, hiddenCount, clearFilter }) {
  const { t, lang } = useLang();
  const short = LANGS.find((l) => l.code === lang)?.short;
  const filterOn = hiddenAllergens.length > 0;

  return (
    <header className="top wrap">
      <div className="top-row">
        <a className="brand" href="/" aria-label="Atlas Cafe & Bar">
          <span className="logo-wrap"><img src="/logo.png" alt="" width="40" height="66" /></span>
          <span>
            <span className="brand-name">Atlas Cafe &amp; Bar</span>
            <span className="brand-sub" style={{ display: 'block' }}>{t.tagline}</span>
          </span>
        </a>
        <button type="button" className="lang-btn" onClick={onLang} aria-label={t.language}>
          <GlobeIcon /> {short}
        </button>
      </div>

      <StatusRow />
      {isHalloween && (
        <div className="hw-banner">
          <Pumpkin />
          <span>
            <strong>{hui[lang].bannerTitle}</strong>
            <span>{hui[lang].bannerText}</span>
          </span>
        </div>
      )}
      {isHalloween && <Bats />}

      <div className="tools">
        <label className="search">
          <SearchIcon />
          <span className="sr-only">{t.search}</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.search}
            enterKeyHint="search"
            autoComplete="off"
          />
          {query && (
            <button type="button" className="clear" onClick={() => setQuery('')} aria-label={t.clearSearch}>
              <CloseIcon />
            </button>
          )}
        </label>
        <button type="button" className="filter-btn" data-on={filterOn} onClick={onFilter} aria-label={t.filterTitle}>
          <FilterIcon /> {filterOn ? hiddenAllergens.length : <span className="label">{t.filter}</span>}
        </button>
      </div>

      {filterOn && (
        <p className="hidden-note">
          <span>{t.hidden(hiddenCount)}</span>
          <button type="button" onClick={clearFilter}>{t.showAll}</button>
        </p>
      )}
    </header>
  );
}

// A small flight of bats crosses the header once when the page opens.
function Bats() {
  const bat = 'M0 6 C3 2 6 2 8 5 C9 3 10 3 11 5 C12 3 13 3 14 5 C16 2 19 2 22 6 C19 5 17 6 15 9 C13 8 9 8 7 9 C5 6 3 5 0 6 Z';
  return (
    <svg className="bats" viewBox="0 0 120 50" aria-hidden="true">
      <path d={bat} transform="translate(10 18)" />
      <path d={bat} transform="translate(46 4) scale(0.8)" />
      <path d={bat} transform="translate(78 24) scale(0.65)" />
    </svg>
  );
}

function dayName(day, lang) {
  const meta = LANGS.find((l) => l.code === lang);
  const d = new Date(Date.UTC(2026, 0, 4 + day)); // 4 Jan 2026 was a Sunday
  try { return new Intl.DateTimeFormat(meta?.html || 'en', { weekday: 'long', timeZone: 'UTC' }).format(d); } catch { return ''; }
}

export function openLabel(t, lang, st = openState()) {
  if (st.open) return t.openUntil(st.until);
  if (st.opensAt == null) return t.closed;
  if (st.today) return t.opensAt(st.opensAt);
  if (st.tomorrow) return t.opensTomorrow(st.opensAt);
  return t.opensOn(dayName(st.opensDay, lang), st.opensAt);
}

function StatusRow() {
  const { t, lang } = useLang();
  const st = openState();
  const score = new Intl.NumberFormat(LANGS.find((l) => l.code === lang)?.html || 'en', { minimumFractionDigits: 1 }).format(rating.score);
  return (
    <div className="status-row">
      <span className="open-state" data-open={st.open}>{openLabel(t, lang, st)}</span>
      <a className="stars" href={MAPS_URL} target="_blank" rel="noopener noreferrer">
        <Star /> {score} <span>· {t.reviews(rating.count)}</span>
      </a>
    </div>
  );
}

export function RatingLink() {
  const { t } = useLang();
  return (
    <a className="rating" href={REVIEW_URL} target="_blank" rel="noopener noreferrer">
      <Star /> {t.rate}
    </a>
  );
}
