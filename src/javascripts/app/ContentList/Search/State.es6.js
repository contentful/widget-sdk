import { makeCtor, match } from 'utils/TaggedValues';
import * as Store from 'ui/Framework/Store';
import { assign, update, set, push } from 'utils/Collections';
import { createSlot, sleep } from 'utils/Concurrent';

import {
  getMatchingFilters,
  isFieldFilterApplicableToContentType,
  getContentTypeById,
  buildFilterFieldByQueryKey,
  ValueInput } from './Filters';

const CONTENT_TYPE_ALL = '';

const defaultFocus = {
  index: null,
  isValueFocused: false,
  isQueryInputFocused: false,
  suggestionsFocusIndex: null
};

// The state for this component looks like this
// query
//   Explained in detail below. This is used to build the query object
//   we send to the API.
// contentTypeId: string
//   The filter is the content type filter. The middle value, the
//   operator, is ignored for now. The last value is the content type
//   id. If this is an empty string that means we should not filter by
//   content type.
// filters: [[string, string, string]]
//   A list of [queryKey, operator, value] triples. Corresponds to the
//   pills we show.
// searchBoxHasFocus: boolean
//   Set to 'true' if any of the children of the search box has focus.
//   If 'false' we grey the border, hide the suggestions box, and
//   collapse multiline filters.

export const initialState = ({
  contentTypeId,
  searchFilters = [],
  searchText = '',
  contentTypes,
  withAssets
}) => ({
  contentTypeId: contentTypeId || CONTENT_TYPE_ALL,
  filters: searchFilters,
  input: searchText,
  searchBoxHasFocus: false,
  isSuggestionOpen: false,
  focus: defaultFocus,
  withAssets,

  // FIXME: the following fields should have a separate reducer
  contentTypes,
  users: [],
  // FIXME: Should be moved closer to the reducer responsible for the search.
  isSearching: false
});


// Emitted when the value of the search input changes. Holds the new
// value.
const SetQueryInput = makeCtor('SetQueryInput');

// Emitted when the user selects a content type from the dropdown.
// Holds the ID of the selected content type
const SetContentType = makeCtor('SetContentType');

// Triggered whenever the value of a filter pill is changed by the
// user. Holds a [filterIndex, value]
const SetFilterValueInput = makeCtor('SetFilterValueInput');
const SetFilterOperator = makeCtor('SetFilterOperator');

const SelectFilterSuggestions = makeCtor('SelectFilterSuggestions');

const SetBoxFocus = makeCtor('SetBoxFocus');
const HideSuggestions = makeCtor('HideSuggestions');

const TriggerSearch = makeCtor('TriggerSearch');
const ToggleSuggestions = makeCtor('ToggleSuggestions');

// Emitted 0.5 seconds after user stopped typing
const UnsetTyping = makeCtor('UnsetTyping');

const RemoveFilter = makeCtor('RemoveFilter');
const SetFocusOnLast = makeCtor('SetFocusOnLast');
const SetFocusOnPill = makeCtor('SetFocusOnPill');
const SetFocusOnPillValue = makeCtor('SetFocusOnPillValue');
const SetFocusOnLastValue = makeCtor('SetFocusOnLastValue');
const ResetFocus = makeCtor('ResetFocus');
const SetFocusOnFirstSuggestion = makeCtor('SetFocusOnFirstSuggestion');
const SetFocusOnNextSuggestion = makeCtor('SetFocusOnNextSuggestion');
const SetFocusOnPrevSuggestion = makeCtor('SetFocusOnPrevSuggestion');
const SetFocusOnQueryInput = makeCtor('SetFocusOnQueryInput');
const ShowSuggestions = makeCtor('ShowSuggestions');
const SetUsers = makeCtor('SetUsers');
const SetIsSearching = makeCtor('SetIsSearching');

export const Actions = {
  SetUsers,
  SetIsSearching,
  SetQueryInput,
  SetFilterOperator,
  SetFilterValueInput,
  SetContentType,
  SelectFilterSuggestions,
  TriggerSearch,
  ToggleSuggestions,
  SetBoxFocus,
  RemoveFilter,
  SetFocusOnPill,
  SetFocusOnPillValue,
  SetFocusOnLast,
  SetFocusOnLastValue,
  ResetFocus,
  SetFocusOnFirstSuggestion,
  SetFocusOnNextSuggestion,
  SetFocusOnPrevSuggestion,
  SetFocusOnQueryInput,
  HideSuggestions,
  ShowSuggestions
};

export function makeReducer (dispatch, submitSearch) {
  // TODO: remove side-effects from the reducer and use actionCreators instead.
  // Reducer must not create side-effects e.g dispatch(UnsetTyping);
  // http://redux.js.org/docs/basics/Reducers.html#handling-actions
  // http://redux.js.org/docs/Glossary.html#action-creator
  const putTyping = createSlot(() => dispatch(UnsetTyping));

  return Store.makeReducer({
    [SetUsers] (state, users) {
      return assign(state, {
        users
      });
    },
    [SetIsSearching] (state, isSearching) {
      return assign(state, {
        isSearching
      });
    },
    [SetQueryInput]: setInput,
    [SetBoxFocus] (state, hasFocus) {
      state = set(state, ['searchBoxHasFocus'], hasFocus);
      if (!hasFocus) {
        state = hideSuggestions(state);
      }
      return state;
    },
    [SelectFilterSuggestions]: selectFilterSuggestion,
    [SetFilterOperator]: setFilterOperator,
    [SetFilterValueInput]: setFilterValueInput,
    [UnsetTyping] (state) {
      state = set(state, ['isTyping'], false);
      state = triggerSearch(state);
      return state;
    },
    [TriggerSearch]: triggerSearch,
    [ToggleSuggestions] (state) {
      return update(state, ['isSuggestionOpen'], value => !value);
    },
    [ShowSuggestions] (state) {
      return set(state, ['isSuggestionOpen'], true);
    },
    [HideSuggestions] (state) {
      return set(state, ['isSuggestionOpen'], false);
    },
    [SetContentType]: setContentType,
    [RemoveFilter] (state, indexToRemove) {
      state = update(state, ['filters'], (filters) => {
        return filters.filter((_, index) => {
          return index !== indexToRemove;
        });
      });
      state = triggerSearch(state);
      state = setFocusOnQueryInput(state);
      return state;
    },
    [ResetFocus]: resetFocus,
    [SetFocusOnPill]: setFocusOnPill,
    [SetFocusOnPillValue]: setFocusOnPillValue,
    [SetFocusOnLast]: setFocusOnLast,
    [SetFocusOnLastValue]: setFocusOnLastValue,
    [SetFocusOnQueryInput]: setFocusOnQueryInput,
    [SetFocusOnFirstSuggestion]: setFocusOnFirstSuggestion,
    [SetFocusOnNextSuggestion]: setFocusOnNextSuggestion,
    [SetFocusOnPrevSuggestion]: setFocusOnPrevSuggestion
  });

  function setFilterOperator (state, [index, op]) {
    state = update(
      state,
      ['filters', index],
      ([queryKey, _op, value]) => [queryKey, op, value]
    );
    state = triggerSearch(state);
    return state;
  }

  function setFilterValueInput (state, [index, value]) {
    state = set(state, ['isTyping'], true);
    putTyping(sleep(1000));
    return update(
      state,
      ['filters', index],
      ([queryKey, op, _value]) => [queryKey, op, value]
    );
  }

  function showSuggestions (state) {
    return set(state, ['isSuggestionOpen'], true);
  }

  function hideSuggestions (state) {
    return set(state, ['isSuggestionOpen'], false);
  }

  function setFocusOnFirstSuggestion (state) {
    state = resetFocus(state);
    return set(state, ['focus', 'suggestionsFocusIndex'], 0);
  }

  function setFocusOnNextSuggestion (state) {
    const idx = state.focus.suggestionsFocusIndex;
    const suggestions = getMatchingFilters(
      state.input,
      state.contentTypeId,
      state.contentTypes,
      state.withAssets
    );
    let indexToFocus;

    if (idx === suggestions.length - 1) {
      indexToFocus = 0;
    } else {
      indexToFocus = idx + 1;
    }
    state = resetFocus(state);
    return set(state, ['focus', 'suggestionsFocusIndex'], indexToFocus);
  }

  function setFocusOnPrevSuggestion (state) {
    const idx = state.focus.suggestionsFocusIndex;
    state = resetFocus(state);
    let indexToFocus;
    if (idx > 0) {
      indexToFocus = idx - 1;
      state = set(state, ['focus', 'suggestionsFocusIndex'], indexToFocus);
    } else {
      state = setFocusOnQueryInput(state);
    }
    return state;
  }

  function setFocusOnQueryInput (state) {
    state = resetFocus(state);
    return set(state, ['focus', 'isQueryInputFocused'], true);
  }

  function resetFocus (state) {
    return set(state, ['focus'], defaultFocus);
  }

  function setFocusOnPill (state, index) {
    state = resetFocus(state);

    return set(state, ['focus', 'index'], index);
  }

  function setFocusOnPillValue (state, index) {
    state = setFocusOnPill(state, index);

    return set(state, ['focus', 'isValueFocused'], true);
  }
  function setFocusOnLast (state) {
    const lastIndex = state.filters.length - 1;
    return setFocusOnPill(state, lastIndex);
  }

  function setFocusOnLastValue (state) {
    const lastIndex = state.filters.length - 1;

    return setFocusOnPillValue(state, lastIndex);
  }

  function setInput (state, input) {
    if (input === state.input) {
      return state;
    }

    state = assign(state, { input });

    const searchValue = input.trim();
    state = set(state, ['isTyping'], true);
    putTyping(sleep(1000));

    if (searchValue) {
      state = showSuggestions(state);
    } else {
      state = hideSuggestions(state);
    }

    return state;
  }

  function setContentType (state, contentTypeId) {
    state = set(state, ['contentTypeId'], contentTypeId);
    state = removeUnapplicableFilters(state);
    state = triggerSearch(state);
    return state;
  }

  function tryGetValue (filterField) {
    let value;
    match(filterField.valueInput, {
      [ValueInput.Select]: (options) => {
        if (options.length === 1) {
          value = options[0][1];
        }
      },
      _: () => {
        value = undefined;
      }
    });

    return value;
  }

  function selectFilterSuggestion (state, filter) {
    let contentType;
    if (filter.contentType) {
      state = setContentType(state, filter.contentType.id);
      contentType = getContentTypeById(state.contentTypes, filter.contentType.id);
    }

    const filterField = buildFilterFieldByQueryKey(contentType, filter.queryKey, state.withAssets);

    const value = tryGetValue(filterField);

    state = update(state, ['filters'], filters => {
      return push(filters, [filter.queryKey, filter.operators[0][0], value]);
    });
    state = setInput(state, '');
    state = setFocusOnLastValue(state);
    state = hideSuggestions(state);

    return state;
  }

  function removeUnapplicableFilters (state) {
    const { contentTypeId, contentTypes } = state;

    const contentType = getContentTypeById(contentTypes, contentTypeId);
    state = update(state, ['filters'], (filters) => {
      return filters.filter(([queryKey]) => {
        return isFieldFilterApplicableToContentType(contentType, queryKey);
      });
    });

    return state;
  }

  /**
   * Build the query object from the current filters and pass it to
   * `submitSearch`.
   */
  function triggerSearch (state) {
    submitSearch({
      contentTypeId: state.contentTypeId,
      searchFilters: state.filters,
      searchText: state.input
    });

    return state;
  }
}
