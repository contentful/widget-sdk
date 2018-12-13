import { getAllMembershipsWithQuery } from 'access_control/OrganizationMembershipRepository.es6';
import { createOrganizationEndpoint } from 'data/EndpointFactory.es6';
import createTeamService from 'app/OrganizationSettings/Teams/TeamService.es6';

import { ORG_MEMBERS, TEAMS } from '../dataSets.es6';
import getOrgId from '../selectors/getOrgId.es6';

const loaders = (orgId) => ({
  [ORG_MEMBERS]: () =>
    getAllMembershipsWithQuery(createOrganizationEndpoint(orgId), { include: ['sys.user'] }),
  [TEAMS]: async () => {
    const service = createTeamService(orgId);
    const teams = (await service.getAll()).items;
    return Promise.all(teams.map(async (team) => {
      team.memberships = (await service.getTeamMemberships(team.sys.id)).items;
    }));
  }
});

export default (dataSets, state) => {
  const boundLoaders = loaders(getOrgId(state));
  return Promise.all(
    dataSets.map(
      dataSet => boundLoaders[dataSet]
    )
  );
}
