import { defaultTo, flow, some } from 'lodash/fp';
import getOrgId from '../selectors/getOrgId.es6';
import getOrganizationsList from '../selectors/getOrganizationsList.es6';
import { fetchOrgConstants } from '../actions/orgConstants/actionCreators.es6';

export default ({ getState, dispatch }) => next => async action => {
  // check if the user has navigated to a diferent org
  const oldOrgId = getOrgId(getState());
  const result = next(action);
  const newOrgId = getOrgId(getState());

  if (newOrgId && newOrgId !== oldOrgId) {
    // check if the org is available in the token
    const orgIsAvailable = flow(
      getOrganizationsList,
      defaultTo([]),
      some(org => org.sys.id === newOrgId)
    )(getState());

    if (orgIsAvailable) {
      dispatch(fetchOrgConstants(newOrgId));
    }
  }

  return result;
};
