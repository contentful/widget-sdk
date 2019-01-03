import { zipObject, set } from 'lodash/fp';
import {
  getAllUsers,
  getAllMemberships
} from '../access_control/OrganizationMembershipRepository.es6';
import { createOrganizationEndpoint } from '../data/EndpointFactory.es6';
import createTeamService from '../app/OrganizationSettings/Teams/TeamService.es6';

import { USERS, TEAMS, ORG_MEMBERSHIPS, TEAM_MEMBERSHIPS } from './dataSets.es6';
import getOrgId from './selectors/getOrgId.es6';
import { getTeamId } from './selectors/teams.es6';

const loaders = state => {
  const orgId = getOrgId(state);
  return {
    [USERS]: () => getAllUsers(createOrganizationEndpoint(orgId)),
    [TEAMS]: async () => {
      const service = createTeamService(orgId);
      return (await service.getAll()).items;
    },
    [ORG_MEMBERSHIPS]: () => getAllMemberships(createOrganizationEndpoint(orgId)),
    [TEAM_MEMBERSHIPS]: async () => {
      const service = createTeamService(orgId);
      const teamId = getTeamId(state);
      const memberships = (await service.getTeamMemberships(teamId)).items;
      return memberships.map(
        set('sys.team', { sys: { type: 'Link', linkType: 'Team', id: teamId } })
      );
    }
  };
};

export default async (dataSets, state) => {
  const boundLoaders = loaders(state);

  return zipObject(dataSets, await Promise.all(dataSets.map(dataSet => boundLoaders[dataSet]())));
};
