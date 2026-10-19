import React from 'react';
import { useLang } from '@/lib/store.jsx';
import { LANGS } from '@/data/i18n.js';
import { CloseIcon, FilterIcon, GlobeIcon, SearchIcon, Star } from './icons.jsx';

export default function Top({ query, setQuery, onLang, onFilter, hiddenAllergens, hiddenCount, clearFilter }) {
  const { t, lang } = useLang();
  const short = LANGS.find((l) => l.code === lang)?.short;
  const filterOn = hiddenAllergens.length > 0;

  return (
    <header className="top wrap">
      <div className="top-row">
        <a className="brand" href="/" aria-label="Atlas Cafe & Bar">
          <img src="/logo.png" alt="" width="40" height="66" />
          <span>
            <span className="brand-name">Atlas Cafe &amp; Bar</span>
            <span className="brand-sub" style={{ display: 'block' }}>{t.tagline}</span>
          </span>
        </a>
        <button type="button" className="lang-btn" onClick={onLang} aria-label={t.language}>
          <GlobeIcon /> {short}
        </button>
      </div>

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

export function RatingLink() {
  return (
    <a className="rating" href="https://share.google/gx9QBu5N87yWGipUd" target="_blank" rel="noopener noreferrer">
      <Star /> 4.9 Google
    </a>
  );
}
