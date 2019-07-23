import { get, flow, toLower, defaultTo, find, concat, identity, filter, sortBy } from 'lodash/fp';
import { createSelector } from 'reselect';

import { getPath } from './location.es6';
import { getDatasets } from './datasets.es6';
import ROUTES from '../routes.es6';
import { TEAMS } from '../datasets.es6';
import getOptimistic from './getOptimistic.es6';
import getOrgRole from './getOrgRole.es6';
import getMembershipsByTeam from './teamMemberships/getMembershipsByTeam.es6';
import { getCurrentUser } from './users.es6';

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
