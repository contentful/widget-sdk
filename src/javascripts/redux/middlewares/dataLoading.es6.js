import { isEmpty, get } from 'lodash/fp';
import { getPath } from '../selectors/location.es6';
import loadDataSets from '../loadDataSets.es6';
import { getDataSetsToLoad } from 'redux/selectors/datasets.es6';
import getOrgId from 'redux/selectors/getOrgId.es6';
import { getFeature } from '../routes.es6';
import { getOrgFeature } from 'data/CMA/ProductCatalog.es6';

export default ({ getState, dispatch }) => next => async action => {
  const oldPath = getPath(getState());
  // calls other middleware and reducer; the reducer updates the state
  const result = next(action);
  const newState = getState();
  const newPath = getPath(newState);

  if (oldPath !== newPath) {
    // feature catalog handling
    const featureRequired = getFeature(newPath);
    // does the new location depend on a feature from the catalog?
    if (featureRequired) {
      const orgId = getOrgId(newState);
      // if it does, load the feature and check if it's enabled
      const isActive = get('enabled', await getOrgFeature(orgId, 'teams'));
      if (!isActive) {
        dispatch({ type: 'ACCESS_DENIED', payload: { reason: 'feature_inactive' } });
        // skip dataset loading
        return result;
      }
    }

    // dataset loading
    // datasets are users, teams, team memberships etc
    const datasetsToLoad = getDataSetsToLoad(newState);
    if (!isEmpty(datasetsToLoad)) {
      const type = 'DATASET_LOADING';
      dispatch({ type, meta: { pending: true, datasets: datasetsToLoad } });
      try {
        const datasets = await loadDataSets(datasetsToLoad, newState);
        dispatch({ type, payload: { datasets }, meta: { fetched: Date.now() } });
      } catch (e) {
        dispatch({ type, error: true, payload: e });
      }
    }
  }
  return result;
};
