import combineReducers from '../combineReducers';
import meta from './meta';
import payload from './payload';

// payload has the actual data
// and meta additional information about it
export default combineReducers({
  meta,
  payload
});
