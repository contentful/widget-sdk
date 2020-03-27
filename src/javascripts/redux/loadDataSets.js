import { zipObject } from 'lodash/fp';
import { getAllUsers, getAllMemberships } from '../access_control/OrganizationMembershipRepository';
import { createOrganizationEndpoint } from '../data/EndpointFactory';
import { getAllSpaces, getAllRoles } from 'access_control/OrganizationMembershipRepository';
import createTeamService from 'app/OrganizationSettings/Teams/TeamService';
import createTeamMembershipService from 'app/OrganizationSettings/Teams/TeamMemberships/TeamMembershipService';
import createTeamSpaceMembershipService from 'app/OrganizationSettings/Teams/TeamSpaceMemberships/TeamSpaceMembershipsService';
import ResolveLinks from 'data/LinkResolver';

import {
  USERS,
  TEAMS,
  ORG_MEMBERSHIPS,
  TEAM_MEMBERSHIPS,
  TEAM_SPACE_MEMBERSHIPS,
  ORG_SPACES,
  ORG_SPACE_ROLES,
} from './datasets';
import getOrgId from './selectors/getOrgId';

const loaders = (state) => {
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
    },
  };
};

export default async (dataSets, state) => {
  const boundLoaders = loaders(state);

  return zipObject(dataSets, await Promise.all(dataSets.map((dataSet) => boundLoaders[dataSet]())));
};
