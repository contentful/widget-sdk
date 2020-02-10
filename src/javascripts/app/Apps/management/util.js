import { getSpaces, getOrganizations } from 'services/TokenStore';
import { createSpaceEndpoint } from 'data/EndpointFactory';
import { create as createSpaceEnvRepo } from 'data/CMA/SpaceEnvironmentsRepo';
import { getStore } from 'browserStorage';

export async function getOrgsAndSpaces() {
  const orgs = await getOrganizations();
  const spaces = await getSpaces();

  const orgSpaceMap = spaces.reduce((acc, space) => {
    const orgId = space.organization.sys.id;

    if (acc[orgId]) {
      acc[orgId].push(space);
    } else {
      acc[orgId] = [space];
    }

    return acc;
  }, {});

  return orgs.map(org => ({ org, spaces: orgSpaceMap[org.sys.id] }));
}

export async function getEnvsFor(spaceId) {
  const spaceEndpoint = createSpaceEndpoint(spaceId, 'master');
  const spaceEnvRepo = createSpaceEnvRepo(spaceEndpoint);
  const { environments } = await spaceEnvRepo.getAll();

  return environments;
}

export function getLastUsedSpace() {
  return getStore().get('lastUsedSpace');
}
