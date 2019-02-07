import { assign } from 'lodash';
import * as Kefir from 'kefir';
import * as K from 'utils/kefir.es6';
import { createStore, bindActions } from 'ui/Framework/Store.es6';
import * as logger from 'services/logger.es6';

import renderSearch from './View.es6';

import { initialState, makeReducer, Actions } from './State.es6';
import {
  getMatchingFilters,
  contentTypeFilter,
  getFiltersFromQueryKey,
  sanitizeSearchFilters
} from './Filters.es6';

export default function create({
  $scope,
  contentTypes = [],
  onSearchChange,
  isSearching$,
  initState = {},
  users$,
  withAssets = false
}) {
  try {
    // Removes invalid filters before initializing the state.
    const sanitizedFilters = sanitizeSearchFilters(
      initState.searchFilters,
      contentTypes,
      initState.contentTypeId,
      withAssets
    );
    const reduce = makeReducer(dispatch, onSearchChange);
    const defaultState = initialState(
      assign({}, initState, {
        searchFilters: sanitizedFilters,
        contentTypes,
        withAssets
      })
    );
    const store = createStore(defaultState, reduce);
    const actions = bindActions(store, Actions);

    // unsubscribe from stream if rerender happens
    if ($scope.unsubscribeSearch) {
      $scope.unsubscribeSearch();
    }

    const unsubscribeSearchWidget = K.onValueScope(
      $scope,
      Kefir.combine([isSearching$, users$]),
      ([isSearching, users]) => {
        actions.SetUsers(users);
        actions.SetIsSearching(isSearching);
      }
    );

    const unsubscribeFromSearchStore = K.onValueScope($scope, store.state$, state => {
      $scope.search = renderSearch(mapStateToProps(state, actions));
    });

    $scope.unsubscribeSearch = () => {
      unsubscribeSearchWidget();
      unsubscribeFromSearchStore();
    };

    // eslint-disable-next-line no-inner-declarations
    function dispatch(action, payload) {
      store.dispatch(action, payload);
    }
  } catch (error) {
    const data = { initState, withAssets };
    logger.logError('Unexpected search ui error', { error, data });
  }
}

function mapStateToProps(state, actions) {
  const { contentTypeId, filters, contentTypes, users, isSearching, withAssets } = state;
  const suggestions = getMatchingFilters(
    state.input,
    state.contentTypeId,
    contentTypes,
    withAssets
  );
  return {
    contentTypeFilter: contentTypeFilter(contentTypes),
    filters: getFiltersFromQueryKey({
      users,
      contentTypes,
      searchFilters: filters,
      contentTypeId,
      withAssets
    }),
    suggestions: state.isSuggestionOpen ? suggestions : [],
    focus: state.focus,
    contentTypeId: state.contentTypeId,
    isSearching,
    hasLoaded: users.length > 0,
    input: state.input,
    searchBoxHasFocus: state.searchBoxHasFocus,
    isSuggestionOpen: state.isSuggestionOpen,
    actions,
    withAssets
  };
}
