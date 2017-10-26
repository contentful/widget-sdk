/*global window */
import * as K from 'utils/kefir';
import { createStore, bindActions } from 'ui/Framework/Store';
import logger from 'logger';

import render from './View';
import { initialState, makeReducer, Actions } from './State';
import { getMatchingFilters, contentTypeFilter, getFiltersFromQueryKey } from './Filters';

export default function create (
  $scope, spaceContext, submitSearch, isSearching$, initState = {}
) {
  try {
    const contentTypes = K.getValue(spaceContext.publishedCTs.items$).toJS();

    const reduce = makeReducer({ contentTypes }, dispatch, submitSearch);
    const store = createStore(initialState(initState), reduce);
    const actions = bindActions(store, Actions);

    isSearching$.onValue(actions.SetLoading);

    K.onValueScope($scope, store.state$, (state) => {
      window._state = state;

      $scope.search = render(mapStateToProps(state, { contentTypes }, actions));
    });

    // eslint-disable-next-line
    function dispatch (action, payload) {
      store.dispatch(action, payload);
    }
  } catch (e) {
    logger.logError(e);
  }
}


function mapStateToProps (state, props, actions) {
  const { contentTypes } = props;
  return {
    contentTypeFilter: contentTypeFilter(contentTypes),
    filters: getFiltersFromQueryKey(contentTypes, state.filters, state.contentTypeId),
    suggestions: state.isSuggestionOpen
      ? getMatchingFilters(state.input, state.contentTypeId, contentTypes)
      : [],
    focus: state.focus,
    contentTypeId: state.contentTypeId,
    isSearching: state.isSearching,
    input: state.input,
    searchBoxHasFocus: state.searchBoxHasFocus,
    isSuggestionOpen: state.isSuggestionOpen,
    actions
  };
}
