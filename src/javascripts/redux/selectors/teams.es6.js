import { get, flow, toLower, defaultTo, find, concat, identity, filter } from 'lodash/fp';
import { sortBy } from 'lodash';
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
export const getTeamListWithOptimistic = state => {
  const optimisticPlaceholders = get(TEAMS, getOptimistic(state)) || [];
  const membershipsByTeam = getMembershipsByTeam(state);
  const currentUser = getCurrentUser(state);

  const currentUserIsMember = team =>
    find(
      { sys: { user: { sys: { id: get('sys.id', currentUser) } } } },
      membershipsByTeam[team.sys.id]
    );

  const isManager = ['owner', 'admin'].includes(getOrgRole(state));

  const teamListWithOptimistic = flow(
    getTeams,
    Object.values,
    isManager ? identity : filter(currentUserIsMember),
    concat(optimisticPlaceholders)
  )(state);

  // sorts teams and placeholders by their name, ignoring capitalization
  return sortBy(
    teamListWithOptimistic,
    flow(
      get('name'),
      toLower
    )
  );
};

export const getCurrentTeam = flow(
  getPath,
  // returns object with parameters on direct or child match
  ROUTES.organization.children.teams.children.team.partialTest,
  get('teamId')
);

export const hasReadOnlyPermission = state => !['owner', 'admin'].includes(getOrgRole(state));
