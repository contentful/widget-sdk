import * as actions from './actions.es6';

export function updateOrganizationsFromToken(organizations) {
  return dispatch => {
    dispatch(actions.organizationsUpdateFromToken(organizations));
  };
}

export function updateSpacesByOrgIdFromToken(spaces) {
  return dispatch => {
    dispatch(actions.spacesByOrgUpdateFromToken(spaces));
  };
}

export function updateUserFromToken(spaces) {
  return dispatch => {
    dispatch(actions.userUpdateFromToken(spaces));
  };
}
