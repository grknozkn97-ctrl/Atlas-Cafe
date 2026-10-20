import { MINISTRIES, PROJECT_TYPES } from './constants';
import { applyEventOption } from './events';
import type { Rng } from './ministers';
import {
  ActionError,
  appointMinister,
  campaignAction,
  dismissMinister,
  raiseMinWage,
  setBudget,
  setCbIndependence,
  setPolicyRate,
  setTaxes,
  startProject,
} from './sim';
import type { ClientMessage, CountryState, MinistryId } from './types';

const num = (x: unknown) => (typeof x === 'number' && Number.isFinite(x) ? x : undefined);
const isMinistry = (x: unknown): x is MinistryId => MINISTRIES.includes(x as MinistryId);

/** Oyuncunun ülkesine yönelik eylemleri doğrulayıp uygular. */
export function handleAction(c: CountryState, day: number, msg: ClientMessage, rng: Rng) {
  switch (msg.type) {
    case 'setEconomy': {
      if (msg.cbIndependent !== undefined) setCbIndependence(c, day, !!msg.cbIndependent);
      if (msg.taxes) {
        setTaxes(c, { income: num(msg.taxes.income), corporate: num(msg.taxes.corporate), vat: num(msg.taxes.vat) });
      }
      const rate = num(msg.policyRate);
      if (rate !== undefined && Math.abs(rate - c.policyRate) > 1e-9) setPolicyRate(c, rate);
      const raise = num(msg.minWageRaise);
      if (raise !== undefined && raise > 0) raiseMinWage(c, day, raise);
      return;
    }
    case 'setBudget': {
      const b: Partial<Record<MinistryId, number>> = {};
      for (const [k, v] of Object.entries(msg.budget ?? {})) if (isMinistry(k) && num(v) !== undefined) b[k] = v;
      setBudget(c, b);
      return;
    }
    case 'startProject':
      if (!PROJECT_TYPES.includes(msg.projectType)) throw new ActionError('Bilinmeyen proje.');
      startProject(c, day, msg.projectType);
      return;
    case 'appointMinister':
      if (!isMinistry(msg.ministry)) throw new ActionError('Bilinmeyen bakanlık.');
      appointMinister(c, day, msg.ministry, String(msg.candidateId));
      return;
    case 'dismissMinister':
      if (!isMinistry(msg.ministry)) throw new ActionError('Bilinmeyen bakanlık.');
      dismissMinister(c, day, msg.ministry);
      return;
    case 'resolveEvent': {
      const ev = c.pendingEvents.find((e) => e.id === msg.eventId);
      if (!ev) throw new ActionError('Bu karar artık geçerli değil.');
      const opt = Math.floor(num(msg.option) ?? -1);
      if (opt < 0 || opt >= ev.options.length) throw new ActionError('Geçersiz seçenek.');
      c.pendingEvents = c.pendingEvents.filter((e) => e.id !== ev.id);
      applyEventOption(c, ev, opt, day, rng);
      return;
    }
    case 'campaign':
      if (msg.action !== 'miting' && msg.action !== 'secimEkonomisi') throw new ActionError('Bilinmeyen kampanya eylemi.');
      campaignAction(c, day, msg.action);
      return;
    default:
      throw new ActionError('Bilinmeyen istek.');
  }
}
