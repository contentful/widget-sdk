import { isEmpty, get, flow, filter } from 'lodash/fp';
import { getPath } from '../selectors/location.es6';
import { getRequiredDataSets } from '../routes.es6';
import loadDataSets from '../loadDataSets.es6';
import { getMeta } from '../selectors/datasets.es6';

const filterDatasetsWithPendingOperations = state => {
  const datasetsMeta = getMeta(state);
  return filter(dataset => !get([dataset, 'pending'], datasetsMeta));
};

export default ({ getState, dispatch }) => next => action => {
  const oldPath = getPath(getState());
  const result = next(action);
  const newState = getState();
  const newPath = getPath(newState);

  if (oldPath !== newPath) {
    const newDataSetsRequired = flow(
      getRequiredDataSets,
      filterDatasetsWithPendingOperations(newState)
    )(newPath);
    if (!isEmpty(newDataSetsRequired)) {
      const type = 'DATASET_LOADING';
      dispatch({ type, meta: { pending: true, datasets: newDataSetsRequired } });
      loadDataSets(newDataSetsRequired, getState())
        .then(datasets => dispatch({ type, payload: { datasets } }))
        .catch(ex => dispatch({ type, error: true, payload: ex }));
    }
  }
  return result;
};
