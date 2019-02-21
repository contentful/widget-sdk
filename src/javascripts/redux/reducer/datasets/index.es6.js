import combineReducers from '../combineReducers.es6';
import meta from './meta.es6';
import payload from './payload.es6';

// payload has the actual data
// and meta additional information about it
export default combineReducers({
  meta,
  payload
});
