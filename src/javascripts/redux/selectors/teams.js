import { get, flow, toLower, defaultTo, find, concat, identity, filter, sortBy } from 'lodash/fp';
import { createSelector } from 'reselect';

import { getPath } from './location';
import { getDatasets } from './datasets';
import ROUTES from '../routes';
import { TEAMS } from '../datasets';
import getOptimistic from './getOptimistic';
import getOrgRole from './getOrgRole';
import getMembershipsByTeam from './teamMemberships/getMembershipsByTeam';
import { getCurrentUser } from './users';

export const getTeams = flow(
  getDatasets,
  get(TEAMS),
  defaultTo({})
);

// Guide about flows: https://contentful.atlassian.net/wiki/spaces/BH/pages/1279721792
export const getTeamListWithOptimistic = createSelector(
  getOptimistic,
  getMembershipsByTeam,
  getCurrentUser,
  getOrgRole,
  getTeams,
  (optimisticPlaceholders, membershipsByTeam, currentUser, orgRole, teams) => {
    const optimisticTeamPlaceholders = get(TEAMS, optimisticPlaceholders) || [];
    const currentUserIsMember = team =>
      find(
        { sys: { user: { sys: { id: get('sys.id', currentUser) } } } },
        membershipsByTeam[team.sys.id]
      );

    const isManager = ['owner', 'admin'].includes(orgRole);

    const teamListWithOptimistic = flow(
      Object.values,
      isManager ? identity : filter(currentUserIsMember),
      concat(optimisticTeamPlaceholders)
    )(teams);

    // sorts teams and placeholders by their name, ignoring capitalization
    return sortBy(
      flow(
        get('name'),
        toLower
      ),
      teamListWithOptimistic
    );
  }
);

export const getCurrentTeam = flow(
  getPath,
  // returns object with parameters on direct or child match
  ROUTES.organization.children.teams.children.team.partialTest,
  get('teamId')
);

export const hasReadOnlyPermission = state => !['owner', 'admin'].includes(getOrgRole(state));
