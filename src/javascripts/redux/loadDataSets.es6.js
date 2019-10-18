import { zipObject } from 'lodash/fp';
import { getAllUsers, getAllMemberships } from '../access_control/OrganizationMembershipRepository';
import { createOrganizationEndpoint } from '../data/EndpointFactory.es6';
import { getAllSpaces, getAllRoles } from 'access_control/OrganizationMembershipRepository';
import createTeamService from 'app/OrganizationSettings/Teams/TeamService.es6';
import createTeamMembershipService from 'app/OrganizationSettings/Teams/TeamMemberships/TeamMembershipService.es6';
import createTeamSpaceMembershipService from 'app/OrganizationSettings/Teams/TeamSpaceMemberships/TeamSpaceMembershipsService.es6';
import ResolveLinks from 'data/LinkResolver.es6';

import {
  USERS,
  TEAMS,
  ORG_MEMBERSHIPS,
  TEAM_MEMBERSHIPS,
  TEAM_SPACE_MEMBERSHIPS,
  ORG_SPACES,
  ORG_SPACE_ROLES
} from './datasets.es6';
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
    },
    [TEAM_SPACE_MEMBERSHIPS]: async () => {
      const service = createTeamSpaceMembershipService(state);
      const includePaths = ['roles'];
      const { items, includes } = await service.getAll({ include: includePaths });
      return ResolveLinks({ paths: includePaths, items, includes });
    },
    [ORG_SPACES]: () => {
      const endpoint = createOrganizationEndpoint(orgId);
      return getAllSpaces(endpoint);
    },
    [ORG_SPACE_ROLES]: () => {
      const endpoint = createOrganizationEndpoint(orgId);
      return getAllRoles(endpoint);
    }
  };
};

export default async (dataSets, state) => {
  const boundLoaders = loaders(state);

  return zipObject(dataSets, await Promise.all(dataSets.map(dataSet => boundLoaders[dataSet]())));
};
