import { findIndex, clone } from 'lodash';
import resolveLinks from 'data/LinkResolver';

enum SpaceTeamsReducerActionType {
  ERROR = 'ERROR',
  INITIAL_FETCH_SUCCESS = 'INITIAL_FETCH_SUCCESS',
  OPERATION_PENDING = 'OPERATION_PENDING',
  UPDATE_SUCCESS = 'UPDATE_SUCCESS',
  DELETE_SUCCESS = 'DELETE_SUCCESS',
}

type SpaceTeamsReducerActionPayload = {
  type: SpaceTeamsReducerActionType;
  payload?: any;
};

const initialState = {
  availableRoles: [],
  teams: [],
  teamSpaceMemberships: [],
  spaceMemberships: [],
  error: false,
  isPending: false,
};

const reducer = (
  state,
  { type, payload = {} }: SpaceTeamsReducerActionPayload
): typeof initialState => {
  switch (type) {
    case SpaceTeamsReducerActionType.ERROR:
      return { ...state, error: true, isPending: false };

    case SpaceTeamsReducerActionType.INITIAL_FETCH_SUCCESS: {
      const { teamSpaceMemberships, spaceMemberships, availableRoles, teams } = payload;
      const sortedTeamSpaceMemberships = teamSpaceMemberships.sort(
        (
          {
            sys: {
              team: { name: nameA },
            },
          },
          {
            sys: {
              team: { name: nameB },
            },
          }
        ) => nameA.localeCompare(nameB)
      );
      return {
        ...state,
        availableRoles,
        teams,
        teamSpaceMemberships: sortedTeamSpaceMemberships,
        spaceMemberships,
        error: false,
      };
    }

    case SpaceTeamsReducerActionType.OPERATION_PENDING: {
      return { ...state, isPending: true };
    }

    case SpaceTeamsReducerActionType.UPDATE_SUCCESS: {
      const { updatedMembership } = payload;
      const { teamSpaceMemberships, availableRoles } = state;
      const [updatedMembershipWithRoles] = resolveLinks({
        paths: ['roles'],
        includes: { Role: availableRoles },
        items: [updatedMembership],
      });
      const index = findIndex(teamSpaceMemberships, { sys: { id: updatedMembership.sys.id } });
      const oldMembership = teamSpaceMemberships[index];
      const updatedMembershipResolvedLinks = {
        ...updatedMembershipWithRoles,
        sys: { ...updatedMembershipWithRoles.sys, team: oldMembership.sys.team },
      };

      const updatedTeamSpaceMemberships = clone(teamSpaceMemberships);
      updatedTeamSpaceMemberships.splice(index, 1, updatedMembershipResolvedLinks);
      return { ...state, teamSpaceMemberships: updatedTeamSpaceMemberships, isPending: false };
    }

    case SpaceTeamsReducerActionType.DELETE_SUCCESS: {
      const { teamSpaceMemberships } = state;
      const { membershipId } = payload;
      return {
        ...state,
        teamSpaceMemberships: teamSpaceMemberships.filter(({ sys: { id } }) => id !== membershipId),
        isPending: false,
      };
    }

    default:
      return state;
  }
};

export { SpaceTeamsReducerActionType, reducer, initialState };
