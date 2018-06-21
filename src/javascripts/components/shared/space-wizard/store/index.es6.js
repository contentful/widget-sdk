import * as actions from './actions';
import * as actionCreators from './actionCreators';
import * as reducers from './reducers';
import store from './store';

const dispatch = store.dispatch;

export {
  actions,
  actionCreators,
  reducers,
  dispatch,
  store
};
