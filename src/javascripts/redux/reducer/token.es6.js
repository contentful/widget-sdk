import { set } from 'lodash/fp';

export default (state = {}, { type, payload }) => {
  // Ensure we don't change state if there was no change
  switch (type) {
    case 'USER_UPDATE_FROM_TOKEN':
      return set('user', payload.user, state);
    case 'ORGANIZATIONS_UPDATE_FROM_TOKEN':
      return set('organization', payload.organization, state);
    case 'SPACES_BY_ORG_UPDATE_FROM_TOKEN':
      return set('spaces', payload.spaces, state);
  }
  return state;
};
