/*global window */
import * as Kefir from 'libs/kefir';
import * as K from 'utils/kefir';
import { createStore, bindActions } from 'ui/Framework/Store';
import logger from 'logger';

import render from './View';
import renderLoader from './Loader';
import { initialState, makeReducer, Actions } from './State';
import {
  getMatchingFilters,
  contentTypeFilter,
  getFiltersFromQueryKey
} from './Filters';

export default function create (
  $scope,
  spaceContext,
  submitSearch,
  isSearching$,
  initState = {},
  users$
) {
  try {
    const contentTypes = K.getValue(spaceContext.publishedCTs.items$).toJS();

    const reduce = makeReducer({ contentTypes }, dispatch, submitSearch);
    const defaultState = initialState(initState);
    const store = createStore(defaultState, reduce);
    const actions = bindActions(store, Actions);

    // Showing empty component while we're waiting for the data from the streams
    $scope.search = renderLoader();

    K.onValueScope(
      $scope,
      Kefir.combine([isSearching$, store.state$, users$]),
      ([isSearching, state, users]) => {
        window._state = state;
        $scope.search = render(
          mapStateToProps(state, { contentTypes, users, isSearching }, actions)
        );
      }
    );

    // eslint-disable-next-line
    function dispatch (action, payload) {
      store.dispatch(action, payload);
    }
  } catch (e) {
    logger.logError(e);
  }
}

function mapStateToProps (state, props, actions) {
  const { contentTypeId, filters } = state;
  const { contentTypes, users = [], isSearching = false } = props;

  return {
    contentTypeFilter: contentTypeFilter(contentTypes),
    filters: getFiltersFromQueryKey({
      users,
      contentTypes,
      searchFilters: filters,
      contentTypeId
    }),
    suggestions: state.isSuggestionOpen
      ? getMatchingFilters(state.input, state.contentTypeId, contentTypes)
      : [],
    focus: state.focus,
    contentTypeId: state.contentTypeId,
    isSearching: isSearching,
    input: state.input,
    searchBoxHasFocus: state.searchBoxHasFocus,
    isSuggestionOpen: state.isSuggestionOpen,
    actions
  };
}
