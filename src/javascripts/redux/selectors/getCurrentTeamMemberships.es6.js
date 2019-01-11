import { eq, flow, get } from 'lodash/fp';
import { getDatasets } from './datasets.es6';
import { TEAM_MEMBERSHIPS } from '../dataSets.es6';
import { getCurrentTeam } from './teams.es6';
import getOptimistic from 'redux/selectors/getOptimistic.es6';

export default state => {
  const memberships = Object.values(getDatasets(state)[TEAM_MEMBERSHIPS]);
  const currentTeamId = getCurrentTeam(state);
  return memberships
    .filter(
      flow(
        get('sys.team.sys.id'),
        eq(currentTeamId)
      )
    )
    .concat(getOptimistic(state)[TEAM_MEMBERSHIPS] || []);
};
