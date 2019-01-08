import { getQuery, getPath } from '../selectors/location.es6';

const updateLocation = (method, newQuery, newPath) =>
  window.history[method]({}, '', `${newPath}${newQuery}`);

export default ({ getState }) => next => action => {
  const oldState = getState();
  // update location in redux state
  const result = next(action);
  const newState = getState();
  const oldQuery = getQuery(oldState);
  const oldPath = getPath(oldState);
  const newQuery = getQuery(newState);
  const newPath = getPath(newState);
  if (oldQuery !== newQuery || oldPath !== newPath) {
    if (['RESET_FILTERS', 'CHANGE_FILTERS', 'UPDATE_SEARCH_TERM'].includes(action.type)) {
      updateLocation('replaceState', newQuery, newPath);
    } else if (action.type !== 'LOCATION_CHANGED') {
      updateLocation('pushState', newQuery, newPath);
    }
  }
  return result;
};
