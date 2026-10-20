/**
 * Oyuncu mesajlarını dünyaya uygular. Sunucu ve tek oyunculu deneme aynı kuralları kullanır.
 */
import { handleAction } from './actions';
import type { Rng } from './ministers';
import { makeCharacter, partyAction, playerParty, setPromises, setShadow } from './politics';
import { ActionError } from './sim';
import type { ClientMessage, PlayerView } from './types';
import { foundCountryParty, joinCountryParty, leaveCountry, type Player, type World } from './world';

/** Mesajın sonucunu oyuncuya bildirmek için kısa bir metin döndürebilir. */
export function dispatch(world: World, player: Player, msg: ClientMessage, rng: Rng): string | void {
  switch (msg.type) {
    case 'hello':
      return;
    case 'createCharacter': {
      if (player.partyId) throw new ActionError('Siyasete atıldıktan sonra karakter değiştirilemez.');
      player.character = makeCharacter(msg.character);
      player.name = player.character.name;
      return;
    }
    case 'joinParty':
      joinCountryParty(world, player, msg.countryId, msg.partyId, rng);
      return;
    case 'foundParty':
      foundCountryParty(world, player, msg.countryId, msg, rng);
      return;
    case 'leaveCountry':
      leaveCountry(world, player);
      return;
  }
  const c = player.countryId ? world.countries[player.countryId] : null;
  if (!c) throw new ActionError('Önce bir ülkede siyasete atılmalısın.');
  const party = playerParty(c, player.id);
  switch (msg.type) {
    case 'partyAction':
      if (!party) throw new ActionError('Bir partin yok.');
      return partyAction(c, party, world.day, msg.action, rng, msg.action === 'miting' ? msg.regionId : undefined);
    case 'setPromises':
      if (!party) throw new ActionError('Bir partin yok.');
      setPromises(party, msg.promises);
      return;
    case 'setShadow':
      if (!party) throw new ActionError('Bir partin yok.');
      if (party.inGovernment) throw new ActionError('Hükümetteyken kabineyi doğrudan atarsın.');
      setShadow(c, party, msg.ministry, msg.candidateId);
      return;
  }
  if (c.ownerId !== player.id) throw new ActionError('Bunu yapabilmek için seçim kazanıp hükümeti kurmalısın.');
  handleAction(c, world.day, msg, rng);
}

export function playerView(p: Player | null | undefined): PlayerView | null {
  if (!p) return null;
  return { id: p.id, name: p.name, character: p.character, countryId: p.countryId, partyId: p.partyId };
}
