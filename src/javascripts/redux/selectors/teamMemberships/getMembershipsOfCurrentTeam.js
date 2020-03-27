import { getCurrentTeam } from '../teams';

import getMembershipsByTeam from './getMembershipsByTeam';

/**
 * @description
 * Returns list of memberships of the current team
 *
 * Gets current team from url.
 * Depends on data fetching via 'redux/routes.js'.
 *
 * @return {Array}
 */
export default (state) => {
  // get memberships of currently active team (e.g. containg in url)
  const currentTeamId = getCurrentTeam(state);
  return getMembershipsByTeam(state)[currentTeamId];
};
