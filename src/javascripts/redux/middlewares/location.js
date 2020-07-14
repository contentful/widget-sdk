import { getQuery, getPath } from '../selectors/location';

const updateLocation = (method, newQuery, newPath) =>
  window.history[method]({}, '', `${newPath}${newQuery}`);

// handles actions that should change browser history
export default ({ getState }) => (next) => (action) => {
  const oldState = getState();
  // update location in redux state
  const result = next(action);
  const newState = getState();
  const oldQuery = getQuery(oldState);
  const oldPath = getPath(oldState);
  // the reducer calculates what should change in the location
  // put as much logic as possible in reducers (or selectors)...
  // ...for tooling, testability and efficiency
  const newQuery = getQuery(newState);
  const newPath = getPath(newState);
  // check if any change have to be applied to browser history
  if (oldQuery !== newQuery || oldPath !== newPath) {
    if (action.type !== 'LOCATION_CHANGED') {
      // all other changes should be pushed to browser history (and therefor navigatable)
      updateLocation('pushState', newQuery, newPath);
    }
  }
  return result;
};
