import { getCurrentTeam } from '../teams.es6';

import getMembershipsByTeam from './getMembershipsByTeam.es6';

/**
 * @description
 * Returns list of memberships of the current team
 *
 * Gets current team from url.
 * Depends on data fetching via 'redux/routes.es6.js'.
 *
 * @return {Array}
 */
export default state => {
  // get memberships of currently active team (e.g. containg in url)
  const currentTeamId = getCurrentTeam(state);
  return getMembershipsByTeam(state)[currentTeamId];
};
