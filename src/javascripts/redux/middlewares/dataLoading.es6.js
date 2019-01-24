import { isEmpty } from 'lodash/fp';
import { getPath } from '../selectors/location.es6';
import loadDataSets from '../loadDataSets.es6';
import { getDataSetsToLoad } from 'redux/selectors/datasets.es6';

export default ({ getState, dispatch }) => next => action => {
  const oldPath = getPath(getState());
  const result = next(action);
  const newState = getState();
  const newPath = getPath(newState);

  if (oldPath !== newPath) {
    const datasetsToLoad = getDataSetsToLoad(newState);
    if (!isEmpty(datasetsToLoad)) {
      const type = 'DATASET_LOADING';
      dispatch({ type, meta: { pending: true, datasets: datasetsToLoad } });
      loadDataSets(datasetsToLoad, getState())
        .then(datasets => dispatch({ type, payload: { datasets } }))
        .catch(ex => dispatch({ type, error: true, payload: ex }));
    }
  }
  return result;
};
