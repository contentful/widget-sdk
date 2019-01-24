import { zipObject } from 'lodash/fp';
import {
  getAllUsers,
  getAllMemberships
} from '../access_control/OrganizationMembershipRepository.es6';
import { createOrganizationEndpoint } from '../data/EndpointFactory.es6';
import createTeamService from 'app/OrganizationSettings/Teams/TeamService.es6';
import createTeamMembershipService from 'app/OrganizationSettings/Teams/TeamMemberships/TeamMembershipService.es6';

import { USERS, TEAMS, ORG_MEMBERSHIPS, TEAM_MEMBERSHIPS } from './datasets.es6';
import getOrgId from './selectors/getOrgId.es6';

const loaders = state => {
  const orgId = getOrgId(state);
  return {
    [USERS]: () => getAllUsers(createOrganizationEndpoint(orgId)),
    [TEAMS]: () => {
      const service = createTeamService(state);
      return service.getAll();
    },
    [ORG_MEMBERSHIPS]: () => getAllMemberships(createOrganizationEndpoint(orgId)),
    [TEAM_MEMBERSHIPS]: () => {
      const service = createTeamMembershipService(state);
      return service.getAll();
    }
  };
};

export default async (dataSets, state) => {
  const boundLoaders = loaders(state);

  return zipObject(dataSets, await Promise.all(dataSets.map(dataSet => boundLoaders[dataSet]())));
};
