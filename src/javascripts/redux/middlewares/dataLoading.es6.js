import { isEmpty } from 'lodash/fp';
import { getPath } from '../selectors/location.es6';
import loadDataSets from '../loadDataSets.es6';
import { getDataSetsToLoad } from 'redux/selectors/datasets.es6';
import getOrgId from 'redux/selectors/getOrgId.es6';
import { getFeature } from '../routes.es6';
import { getOrgFeature } from 'data/CMA/ProductCatalog.es6';

export default ({ getState, dispatch }) => next => async action => {
  const oldPath = getPath(getState());
  // calls other middleware and reducer
  const result = next(action);
  const newState = getState();
  const newPath = getPath(newState);

  if (oldPath !== newPath) {
    const featureRequired = getFeature(newPath);
    if (featureRequired) {
      const orgId = getOrgId(newState);
      const isActive = await getOrgFeature(orgId, 'teams');
      if (!isActive) {
        dispatch({ type: 'ACCESS_DENIED', payload: { reason: 'feature_inactive' } });
        return result;
      }
    }
    const datasetsToLoad = getDataSetsToLoad(newState);
    if (!isEmpty(datasetsToLoad)) {
      const type = 'DATASET_LOADING';
      dispatch({ type, meta: { pending: true, datasets: datasetsToLoad } });
      try {
        const datasets = await loadDataSets(datasetsToLoad, newState);
        dispatch({ type, payload: { datasets } });
      } catch (e) {
        dispatch({ type, error: true, payload: e });
      }
    }
  }
  return result;
};
