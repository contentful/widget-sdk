import { getSpaces } from 'services/TokenStore';
import { createSpaceEndpoint } from 'data/EndpointFactory';
import { create as createSpaceEnvRepo } from 'data/CMA/SpaceEnvironmentsRepo';
import { getStore } from 'browserStorage';

export async function getOrgSpacesFor(orgId) {
  const spaces = await getSpaces();

  return spaces.filter(s => s.organization.sys.id === orgId);
}

export async function getEnvsFor(spaceId) {
  const spaceEndpoint = createSpaceEndpoint(spaceId, 'master');
  const spaceEnvRepo = createSpaceEnvRepo(spaceEndpoint);
  const { environments } = await spaceEnvRepo.getAll();

  return environments;
}

export function getLastUsedSpace() {
  return getStore().get('lastUsedSpace') || '';
}
