import { assign } from 'lodash';
import * as Kefir from 'kefir';
import * as K from 'core/utils/kefir';
import { createStore, bindActions } from 'ui/Framework/Store';
import * as logger from 'services/logger';
import { pick } from 'lodash';
import React from 'react';
import renderSearch from './View';
import { ReadTagsProvider, TagsRepoProvider } from 'features/content-tags';

import { initialState, makeReducer, Actions } from './State';
import {
  getMatchingFilters,
  contentTypeFilter,
  getFiltersFromQueryKey,
  sanitizeSearchFilters,
} from './Filters';

let uiState = {};
export default function create({
  $scope,
  contentTypes = [],
  onSearchChange,
  isSearching$,
  initState = {},
  users$,
  withAssets = false,
  withMetadata = false,
}) {
  try {
    // Removes invalid filters before initializing the state.
    const sanitizedFilters = sanitizeSearchFilters(
      initState.searchFilters,
      contentTypes,
      initState.contentTypeId,
      withAssets,
      withMetadata
    );
    const reduce = makeReducer(dispatch, onSearchChange);
    const defaultState = initialState(
      assign({}, uiState, initState, {
        searchFilters: sanitizedFilters,
        contentTypes,
        withAssets,
        withMetadata,
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

    const unsubscribeFromSearchStore = K.onValueScope($scope, store.state$, async (state) => {
      // TODO remove workaround when search ui state is refactored to local
      uiState = pick(state, ['searchBoxHasFocus', 'isSuggestionOpen', 'focus']);
      $scope.search = withMetadata ? (
        <TagsRepoProvider>
          <ReadTagsProvider>
            {renderSearch(mapStateToProps({ ...state, withMetadata }, actions))}
          </ReadTagsProvider>
        </TagsRepoProvider>
      ) : (
        renderSearch(mapStateToProps({ ...state, withMetadata }, actions))
      );
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
  const {
    contentTypeId,
    filters,
    contentTypes,
    users,
    isSearching,
    withAssets,
    withMetadata,
  } = state;
  const suggestions = getMatchingFilters(
    state.input,
    state.contentTypeId,
    contentTypes,
    withAssets,
    withMetadata
  );
  return {
    contentTypeFilter: contentTypeFilter(contentTypes),
    filters: getFiltersFromQueryKey({
      users,
      contentTypes,
      searchFilters: filters,
      contentTypeId,
      withAssets,
      withMetadata,
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
    withAssets,
  };
}
