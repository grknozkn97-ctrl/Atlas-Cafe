import React from 'react';
import { isHalloween, isNewYear } from '@/data/theme.js';
import { Pumpkin } from './icons.jsx';
import { TrickOrTreaters, PhotoDecor as HalloweenDecor } from './Halloween.jsx';
import { Snowfall, PhotoDecor as NewYearDecor, GoldStar } from './NewYear.jsx';

// One place that knows which costume the menu is wearing.

export function SeasonBackdrop() {
  if (isHalloween) return <TrickOrTreaters />;
  if (isNewYear) return <Snowfall />;
  return null;
}

export function SeasonDecor(props) {
  if (isHalloween) return <HalloweenDecor {...props} />;
  if (isNewYear) return <NewYearDecor {...props} />;
  return null;
}

export function SeasonIcon(props) {
  if (isNewYear) return <GoldStar {...props} />;
  return <Pumpkin {...props} />;
}
