import { zipObject, set } from 'lodash/fp';
import { getAllUsers } from 'access_control/OrganizationMembershipRepository.es6';
import { createOrganizationEndpoint } from 'data/EndpointFactory.es6';
import createTeamService from 'app/OrganizationSettings/Teams/TeamService.es6';

import { USERS, TEAMS } from '../dataSets.es6';
import getOrgId from '../selectors/getOrgId.es6';

const loaders = orgId => ({
  [USERS]: () => getAllUsers(createOrganizationEndpoint(orgId)),
  [TEAMS]: async () => {
    const service = createTeamService(orgId);
    const teams = (await service.getAll()).items;
    return Promise.all(
      teams.map(async team =>
        set('memberships', await service.getTeamMemberships(team.sys.id), team)
      )
    );
  }
});

export default async (dataSets, state) => {
  const boundLoaders = loaders(getOrgId(state));

  return zipObject(dataSets, await Promise.all(dataSets.map(dataSet => boundLoaders[dataSet]())));
};
