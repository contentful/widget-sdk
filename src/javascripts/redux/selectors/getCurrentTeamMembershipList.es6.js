import { eq, flow, get, filter, concat, orderBy } from 'lodash/fp';
import { getDatasets } from './datasets.es6';
import { TEAM_MEMBERSHIPS } from '../datasets.es6';
import { getCurrentTeam } from './teams.es6';
import getOptimistic from 'redux/selectors/getOptimistic.es6';

export default state => {
  const currentTeamId = getCurrentTeam(state);
  return flow(
    getDatasets,
    get(TEAM_MEMBERSHIPS),
    Object.values,
    filter(
      flow(
        get('sys.team.sys.id'),
        eq(currentTeamId)
      )
    ),
    orderBy(['sys.user.firstName', 'sys.user.lastName'], ['asc', 'asc']),
    concat(getOptimistic(state)[TEAM_MEMBERSHIPS] || [])
  )(state);
};
