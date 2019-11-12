import { concat, update, drop } from 'lodash/fp';
import { TEAMS, TEAM_MEMBERSHIPS, TEAM_SPACE_MEMBERSHIPS } from '../datasets';

// This reducers enables showing a placeholder when new
// items are to be created but the API request is still pending

// More specifically it creates state for that and the UI can
// do with that what it wants
export default (state = {}, { type, payload }) => {
  switch (type) {
    case 'CREATE_NEW_TEAM': {
      return update(
        TEAMS,
        // handle placeholders as a list
        teams => concat({ ...payload.team, sys: { id: 'placeholder' } }, teams || []),
        state
      );
    }
    case 'SUBMIT_NEW_TEAM_MEMBERSHIP': {
      return update(
        TEAM_MEMBERSHIPS,
        memberships =>
          concat(
            { ...payload.orgMembership, admin: false, sys: { id: 'placeholder' } },
            memberships || []
          ),
        state
      );
    }
    case 'SUBMIT_NEW_TEAM_SPACE_MEMBERSHIP': {
      return update(
        TEAM_SPACE_MEMBERSHIPS,
        teamSpaceMembershiosPlaceholders =>
          concat({ sys: { id: 'placeholder' } }, teamSpaceMembershiosPlaceholders || []),
        state
      );
    }
    // placeholders are 'blindly' removed in the order they were created
    // in theory that could result in the wrong placeholder being removed
    case 'SUBMIT_NEW_TEAM_FAILED': {
      return update(TEAMS, drop(1), state);
    }
    case 'SUBMIT_NEW_TEAM_MEMBERSHIP_FAILED': {
      return update(TEAM_MEMBERSHIPS, drop(1), state);
    }
    case 'SUBMIT_NEW_TEAM_SPACE_MEMBERSHIP_FAILED': {
      return update(TEAM_SPACE_MEMBERSHIPS, drop(1), state);
    }
    case 'ADD_TO_DATASET': {
      return update(payload.dataset, drop(1), state);
    }
  }
  return state;
};
