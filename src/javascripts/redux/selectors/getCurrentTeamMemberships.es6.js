import { eq, flow, get } from 'lodash/fp';
import getDatasets from './getDatasets.es6';
import { TEAM_MEMBERSHIPS } from '../dataSets.es6';
import { getTeamId } from './teams.es6';

export default state => {
  const memberships = Object.values(getDatasets(state)[TEAM_MEMBERSHIPS]);
  const currentTeamId = getTeamId(state);
  return memberships.filter(
    flow(
      get('sys.team.sys.id'),
      eq(currentTeamId)
    )
  );
};
