export const USER_UPDATE_FROM_TOKEN = 'USER_UPDATE_FROM_TOKEN';
export function userUpdateFromToken(user) {
  return {
    type: USER_UPDATE_FROM_TOKEN,
    payload: { user }
  };
}
export const ORGANIZATIONS_UPDATE_FROM_TOKEN = 'ORGANIZATIONS_UPDATE_FROM_TOKEN';
export function organizationsUpdateFromToken(organization) {
  return {
    type: ORGANIZATIONS_UPDATE_FROM_TOKEN,
    payload: { organization }
  };
}
export const SPACES_BY_ORG_UPDATE_FROM_TOKEN = 'SPACES_BY_ORG_UPDATE_FROM_TOKEN';
export function spacesByOrgUpdateFromToken(spaces) {
  return {
    type: SPACES_BY_ORG_UPDATE_FROM_TOKEN,
    payload: { spaces }
  };
}
