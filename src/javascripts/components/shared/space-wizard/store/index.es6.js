import * as actions from './actions';
import * as reducers from './reducers';
import store from './store';

const dispatch = store.dispatch;

export {
  actions,
  reducers,
  dispatch,
  store
};
