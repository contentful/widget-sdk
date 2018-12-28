import { difference, isEmpty } from 'lodash';
import { getPath } from '../selectors/location.es6';
import { getRequiredDataSets } from '../routes.es6';
import loadDataSets from '../loadDataSets.es6';
import getDatasets from '../selectors/getDatasets.es6';

export default ({ getState, dispatch }) => next => action => {
  const oldPath = getPath(getState());
  const result = next(action);
  const newState = getState();
  const newPath = getPath(newState);

  if (oldPath !== newPath) {
    const dataSetsInState = Object.keys(getDatasets(newState));
    const newDataSetsRequired = difference(
      getRequiredDataSets(newPath),
      getRequiredDataSets(oldPath),
      dataSetsInState
    );
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
