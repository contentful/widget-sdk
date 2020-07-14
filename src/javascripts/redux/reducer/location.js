import { set, get } from 'lodash/fp';
import getOrgId from '../selectors/getOrgId';
import ROUTES from '../routes';
import { TEAMS } from '../datasets';

// Guide about flows: https://contentful.atlassian.net/wiki/spaces/BH/pages/1279721792

// Action structure follows this guideline: https://github.com/redux-utilities/flux-standard-actions
export default (state = null, { type, payload, meta }, globalState) => {
  switch (type) {
    case 'LOCATION_CHANGED':
      return payload.location;
    // remove item from the application state while the server request is still pending
    case 'REMOVE_FROM_DATASET': {
      if (get('pending', meta) && get('dataset', payload) === TEAMS) {
        return set(
          'pathname',
          ROUTES.organization.children.teams.build({ orgId: getOrgId(globalState) }),
          state
        );
      }
      return state;
    }
    default:
      return state;
  }
};
