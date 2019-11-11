import { createSpaceEndpoint } from 'data/EndpointFactory.es6';
import * as SpaceAliasesRepo from 'data/CMA/SpaceAliasesRepo.es6';

export const STEPS = {
  IDLE: 0,
  FIRST_ALIAS: 1,
  SECOND_RENAMING: 2,
  THIRD_CHANGE_ENV: 3
};

export function handleOptIn(spaceId, newEnvironmentId) {
  const endpoint = createSpaceEndpoint(spaceId);
  const { optIn } = SpaceAliasesRepo.create(endpoint);
  return optIn({ newEnvironmentId });
}

export async function handleChangeEnvironment(spaceId, alias, aliasedEnvironment) {
  const endpoint = createSpaceEndpoint(spaceId);
  const { get, update } = SpaceAliasesRepo.create(endpoint);
  const {
    sys: { id, version }
  } = await get({ id: alias.sys.id });
  return update({ id, version, aliasedEnvironment });
}
