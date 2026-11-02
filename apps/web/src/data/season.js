// The costume the menu is wearing right now, if any. Every seasonal file has
// the same shape: nicknames, featured, tales, hui (strings per language) and
// featureFirst(sections).
import { THEME } from './theme.js';
import * as halloween from './halloween.js';
import * as newyear from './newyear.js';

const SEASON_DATA = { halloween, newyear };

export const season = SEASON_DATA[THEME] || null;
export const featureFirst = (sections) => (season ? season.featureFirst(sections) : sections);
