import { getQuery } from '../selectors/location.es6';

const updateQuery = (method, newQuery) =>
  window.history[method]({}, '', `${window.location.pathname}${newQuery}`);

export default ({ getState }) => next => action => {
  const oldQuery = getQuery(getState());
  // update query in redux state
  const result = next(action);
  const newQuery = getQuery(getState());
  if (oldQuery !== newQuery) {
    if (['RESET_FILTERS', 'CHANGE_FILTERS', 'UPDATE_SEARCH_TERM'].includes(action.type)) {
      updateQuery('replaceState', newQuery);
    } else if (action.type !== 'LOCATION_CHANGED') {
      updateQuery('pushState', newQuery);
    }
  }
  return result;
};
