/**
 * Oyuncu mesajlarını dünyaya uygular. Sunucu ve tek oyunculu deneme aynı kuralları kullanır.
 */
import { handleAction } from './actions';
import { BACKGROUND_FAME, challengeLeader, doMedia, foundAsLeader, joinAsMember, quitParty } from './career';
import { MINISTRIES } from './constants';
import { isPlayerMunicipality, municipalAction, nominate, nominateAll, startMunicipalProject } from './local';
import type { Rng } from './ministers';
import { makeCharacter, partyAction, playerParty, setPromises, setShadow } from './politics';
import { ActionError, DIRECTIVES } from './sim';
import type { ClientMessage } from './types';
import { leaveCountry, type Player, type World } from './world';

export { playerView } from './career';

/** Mesajın sonucunu oyuncuya bildirmek için kısa bir metin döndürebilir. */
export function dispatch(world: World, player: Player, msg: ClientMessage, rng: Rng): string | void {
  switch (msg.type) {
    case 'hello':
      return;
    case 'createCharacter': {
      if (player.membership) throw new ActionError('Siyasete atıldıktan sonra karakter değiştirilemez.');
      player.character = makeCharacter(msg.character);
      player.name = player.character.name;
      player.fame = BACKGROUND_FAME_DEFAULT(player);
      return;
    }
    case 'joinParty':
      return joinAsMember(world, player, msg.countryId, msg.partyId);
    case 'foundParty':
      foundAsLeader(world, player, msg.countryId, msg, rng);
      return 'Partin kuruldu. Kuruluş dilekçesi İçişleri Bakanlığına verildi.';
    case 'leaveCountry':
      leaveCountry(world, player);
      return;
    case 'leaveParty':
      quitParty(world, player);
      return 'Partiden istifa ettin. Başka bir partiye katılabilir ya da kendi partini kurabilirsin.';
    case 'media':
      return doMedia(world, player, msg.action, rng);
    case 'challengeLeader':
      return challengeLeader(world, player, rng);
  }
  const c = player.countryId ? world.countries[player.countryId] : null;
  if (!c) throw new ActionError('Önce bir ülkede siyasete atılmalısın.');
  const party = playerParty(c, player.id);
  switch (msg.type) {
    case 'partyAction':
      if (!party) throw new ActionError('Bunu ancak genel başkan yapabilir.');
      return partyAction(c, party, world.day, msg.action, rng, msg.action === 'miting' ? msg.regionId : undefined);
    case 'setPromises':
      if (!party) throw new ActionError('Vaatleri genel başkan belirler.');
      setPromises(party, msg.promises);
      return;
    case 'setShadow':
      if (!party) throw new ActionError('Gölge kabineyi genel başkan kurar.');
      if (party.inGovernment) throw new ActionError('Hükümetteyken kabineyi doğrudan atarsın.');
      setShadow(c, party, msg.ministry, msg.candidateId);
      return;
    case 'nominateMayor':
      if (!party) throw new ActionError('Belediye başkanı adaylarını genel başkan belirler.');
      nominate(c, party, msg.provinceId, msg.candidateId, world.day);
      return;
    case 'nominateAll':
      if (!party) throw new ActionError('Belediye başkanı adaylarını genel başkan belirler.');
      return nominateAll(c, party, world.day);
    case 'municipal': {
      const pv = c.provinces.find((x) => x.id === msg.provinceId);
      if (!pv) throw new ActionError('İl bulunamadı.');
      if (!party || pv.mayor.partyId !== party.id || !isPlayerMunicipality(c, pv)) {
        throw new ActionError('Bu ili yönetmek için belediyenin senin partinde olması gerekir.');
      }
      return municipalAction(c, pv, world.day, msg);
    }
    case 'stateInvest': {
      if (c.ownerId !== player.id) throw new ActionError('Devlet yatırımını hükümet yapar.');
      const pv = c.provinces.find((x) => x.id === msg.provinceId);
      if (!pv) throw new ActionError('İl bulunamadı.');
      return startMunicipalProject(c, pv, world.day, msg.project, true);
    }
    case 'ministerDirective': {
      if (c.ownerId !== player.id) throw new ActionError('Bakanlara talimatı hükümet verir.');
      if (!MINISTRIES.includes(msg.ministry) || !(msg.directive in DIRECTIVES)) throw new ActionError('Geçersiz talimat.');
      c.directives = { ...(c.directives ?? {}), [msg.ministry]: msg.directive };
      return `Talimat verildi: ${DIRECTIVES[msg.directive].label}.`;
    }
  }
  if (c.ownerId !== player.id) throw new ActionError('Bunu yapabilmek için seçim kazanıp hükümeti kurmalısın.');
  handleAction(c, world.day, msg, rng);
}

function BACKGROUND_FAME_DEFAULT(player: Player) {
  return BACKGROUND_FAME[player.character!.background];
}
