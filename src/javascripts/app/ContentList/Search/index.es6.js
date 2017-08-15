import * as K from 'utils/kefir';
import { createStore, bindActions } from 'ui/Framework/Store';

import render from './View';
import { initialState, makeReducer, Actions } from './State';


export default function create ($scope, spaceContext, submitSearch, isSearching$) {
  try {
    const contentTypes = K.getValue(spaceContext.publishedCTs.items$).toJS();

    const reduce = makeReducer(dispatch, spaceContext.cma, contentTypes, submitSearch);
    const store = createStore(initialState(contentTypes), reduce);
    const actions_ = bindActions(store, Actions);

    isSearching$.onValue(actions_.SetLoading);

    K.onValueScope($scope, store.state$, (state) => {
      window._state = state
      $scope.search = render(state, actions_);
    });

    function dispatch (action, payload) {
      store.dispatch(action, payload);
    }
  } catch (e) {
    console.error(e)
  }
}
