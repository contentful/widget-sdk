/* global window */
import { assign } from 'lodash';
import * as Kefir from 'libs/kefir';
import * as K from 'utils/kefir';
import { createStore, bindActions } from 'ui/Framework/Store';
import logger from 'logger';

import renderSearch from './View';

import { initialState, makeReducer, Actions } from './State';
import {
  getMatchingFilters,
  contentTypeFilter,
  getFiltersFromQueryKey,
  sanitizeSearchFilters
} from './Filters';

export default function create (
  $scope,
  spaceContext,
  onSearchChange,
  isSearching$,
  initState = {},
  users$,
  withAssets = false
) {
  try {
    const contentTypes = K.getValue(spaceContext.publishedCTs.items$).toJS();
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
      window._state = state;

      $scope.search = renderSearch(mapStateToProps(state, actions));
    });

    $scope.unsubscribeSearch = () => {
      unsubscribeSearchWidget();
      unsubscribeFromSearchStore();
    };

    // eslint-disable-next-line no-inner-declarations
    function dispatch (action, payload) {
      store.dispatch(action, payload);
    }
  } catch (e) {
    logger.logError(e);
  }
}

function mapStateToProps (state, actions) {
  const {
    contentTypeId,
    filters,
    contentTypes,
    users,
    isSearching,
    withAssets
  } = state;

  return {
    contentTypeFilter: contentTypeFilter(contentTypes),
    filters: getFiltersFromQueryKey({
      users,
      contentTypes,
      searchFilters: filters,
      contentTypeId,
      withAssets
    }),
    suggestions: state.isSuggestionOpen
      ? getMatchingFilters(
          state.input,
          state.contentTypeId,
          contentTypes,
          withAssets
        )
      : [],
    focus: state.focus,
    contentTypeId: state.contentTypeId,
    isSearching: isSearching,
    hasLoaded: users.length > 0,
    input: state.input,
    searchBoxHasFocus: state.searchBoxHasFocus,
    isSuggestionOpen: state.isSuggestionOpen,
    actions,
    withAssets
  };
}
