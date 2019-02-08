import _ from 'lodash';
import { contentTypes, brand } from './helpers';
import { createStore, bindActions } from 'ui/Framework/Store.es6';
import * as K from 'test/helpers/mocks/kefir';
import * as State from 'app/ContentList/Search/State.es6';
import { buildFilterFieldByQueryKey } from 'app/ContentList/Search/Filters.es6';

describe('app/ContentList/Search/State.es6', () => {
  let store, actions;
  beforeEach(() => {
    const defaultState = State.initialState({
      contentTypeId: null,
      searchFilters: [],
      searchText: '',
      contentTypes: contentTypes,
      withAssets: false
    });

    const reduce = State.makeReducer(_.noop, _.noop);
    store = createStore(defaultState, reduce);
    actions = bindActions(store, State.Actions);
  });

  afterEach(() => {
    store = undefined;
    actions = undefined;
  });

  it('contains intial state', () => {
    K.assertCurrentValue(store.state$, getInitialState());
  });

  describe('ShowSuggestions', () => {
    it('opens suggestions', () => {
      actions.ShowSuggestions();
      K.assertCurrentValue(store.state$, {
        ...getInitialState(),
        isSuggestionOpen: true
      });
    });
  });

  describe('SelectFilterSuggestions', () => {
    const performAction = (payload, expected) => {
      actions.SelectFilterSuggestions(payload);
      K.assertCurrentValue(store.state$, expected);
    };

    const selectFilterSuggestionsMacro = (contentTypeId, filter) => {
      const payload = {
        queryKey: filter.queryKey,
        contentType: {
          id: contentTypeId
        },
        operators: filter.operators
      };

      const expected = {
        ...getInitialState(),
        contentTypeId: contentTypeId,
        filters: [buildFilter(filter)],
        focus: getFocusForValue(0)
      };

      performAction(payload, expected);
    };

    it('supports text field', () => {
      const filter = buildFilterFieldByQueryKey(brand, 'fields.companyName');
      const contentTypeId = brand.sys.id;

      selectFilterSuggestionsMacro(contentTypeId, filter);
    });

    it('supports status field', () => {
      const filter = buildFilterFieldByQueryKey(null, '__status');
      const contentTypeId = null;
      selectFilterSuggestionsMacro(contentTypeId, filter);
    });

    it('supports symbol field with multiple possible values', () => {
      const filter = buildFilterFieldByQueryKey(brand, 'fields.symbol2');
      const contentTypeId = brand.sys.id;

      selectFilterSuggestionsMacro(contentTypeId, filter);
    });

    it('supports symbol field with one possible value', () => {
      const filter = buildFilterFieldByQueryKey(brand, 'fields.symbol1');
      const contentTypeId = brand.sys.id;

      const payload = {
        queryKey: filter.queryKey,
        contentType: {
          id: contentTypeId
        },
        operators: filter.operators
      };

      const expected = {
        ...getInitialState(),
        contentTypeId: contentTypeId,
        filters: [buildFilter(filter)],
        focus: getFocusForValue(0)
      };

      performAction(payload, expected);
    });
  });
});

function getInitialState() {
  return {
    contentTypes: contentTypes,
    contentTypeId: '',
    filters: [],
    input: '',
    searchBoxHasFocus: false,
    isSuggestionOpen: false,
    users: [],
    isSearching: false,
    focus: {
      index: null,
      isValueFocused: false,
      isQueryInputFocused: false,
      suggestionsFocusIndex: null
    },
    withAssets: false
  };
}

function getFocusForValue(index) {
  return {
    index,
    isValueFocused: true,
    isQueryInputFocused: false,
    suggestionsFocusIndex: null
  };
}

function buildFilter(filter, value = undefined) {
  return [filter.queryKey, filter.operators[0][0], value];
}
