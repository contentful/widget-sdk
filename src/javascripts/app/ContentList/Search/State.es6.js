import { makeCtor } from 'utils/TaggedValues';
import * as Store from 'ui/Framework/Store';
import { assign, update, set, push } from 'utils/Collections';
import { createSlot, sleep } from 'utils/Concurrent';
import { otherwise } from 'libs/sum-types';

import {
  getMatchingFilters,
  isFieldFilterApplicableToContentType,
  getContentTypeById } from './Filters';

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

export const initialState = ({ contentTypeId = '', filters = [], input = '' }) => ({
  contentTypeId,
  filters,
  input,
  searchBoxHasFocus: false,
  isSuggestionOpen: false,
  focus: defaultFocus
});


// Emitted when the value of the search input changes. Holds the new
// value.
const SetQueryInput = makeCtor('SetQueryInput');

// Emitted when the user selects a content type from the dropdown.
// Holds the ID of the selected content type
const SetContentType = makeCtor('SetContentType');
// Triggered whenever the value of a filter pill is changed by the
// user. Holds a [filterIndex, value] pair
const SetFilterValueInput = makeCtor('SetFilterValueInput');

const SelectFilterSuggestions = makeCtor('SelectFilterSuggestions');

const SetBoxFocus = makeCtor('SetBoxFocus');
const HideSuggestions = makeCtor('HideSuggestions');

const TriggerSearch = makeCtor('TriggerSearch');
const ToggleSuggestions = makeCtor('ToggleSuggestions');

const SetLoading = makeCtor('SetLoading');

// Emitted 0.5 seconds after user stopped typing
const UnsetTyping = makeCtor('UnsetTyping');

const RemoveFilter = makeCtor('RemoveFilter');
const SetFocusOnLast = makeCtor('SetFocusOnLast');
const SetFocusOnLastValue = makeCtor('SetFocusOnLastValue');
const ResetFocus = makeCtor('ResetFocus');
const SetFocusOnFirstSuggestion = makeCtor('SetFocusOnFirstSuggestion');
const SetFocusOnNextSuggestion = makeCtor('SetFocusOnNextSuggestion');
const SetFocusOnPrevSuggestion = makeCtor('SetFocusOnPrevSuggestion');
const SetFocusOnQueryInput = makeCtor('SetFocusOnQueryInput');
const ShowSuggestions = makeCtor('ShowSuggestions');

export const Actions = {
  SetQueryInput,
  SetFilterValueInput,
  SetContentType,
  SelectFilterSuggestions,
  TriggerSearch,
  ToggleSuggestions,
  SetLoading,
  SetBoxFocus,
  RemoveFilter,
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

export function makeReducer ({ contentTypes }, dispatch, submitSearch) {

  // TODO: remove side-effects from the reducer and use actionCreators instead.
  // Reducer must not create side-effects e.g dispatch(UnsetTyping);
  // http://redux.js.org/docs/basics/Reducers.html#handling-actions
  // http://redux.js.org/docs/Glossary.html#action-creator
  const putTyping = createSlot(() => dispatch(UnsetTyping));

  return Store.makeReducer({
    [SetQueryInput]: setInput,
    [SetBoxFocus] (state, hasFocus) {
      state = set(state, ['searchBoxHasFocus'], hasFocus);
      if (!hasFocus) {
        state = set(state, ['isSuggestionOpen'], false);
      }
      return state;
    },
    [SelectFilterSuggestions]: selectFilterSuggestion,
    [SetFilterValueInput] (state, [filterIndex, op, value]) {
      state = set(state, ['isTyping'], true);
      putTyping(sleep(1000));
      return update(state, ['filters', filterIndex], filter => [filter[0], op, value]);
    },
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
    // TODO rename
    [SetLoading] (state, isSearching) {
      state = set(state, ['isSearching'], isSearching);
      state = set(state, ['isTyping'], isSearching);
      return state;
    },
    [RemoveFilter] (state, indexToRemove) {
      state = update(state, ['filters'], (filters) => {
        return filters.filter((_, index) => {
          return index !== indexToRemove;
        });
      });

      state = setFocusOnQueryInput(state);
      return state;

    },
    [ResetFocus]: resetFocus,
    [SetFocusOnLast]: setFocusOnLast,
    [SetFocusOnLastValue]: setFocusOnLastValue,
    [SetFocusOnQueryInput]: setFocusOnQueryInput,
    [SetFocusOnFirstSuggestion]: setFocusOnFirstSuggestion,
    [SetFocusOnNextSuggestion]: setFocusOnNextSuggestion,
    [SetFocusOnPrevSuggestion]: setFocusOnPrevSuggestion,
  });

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
    const suggestions = getMatchingFilters(state.input, state.contentTypeId, contentTypes);
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

  function setFocusOnLast (state) {
    state = resetFocus(state);

    return set(state, ['focus', 'index'], state.filters.length - 1);
  }

  function setFocusOnLastValue (state) {
    state = setFocusOnLast(state);

    return set(state, ['focus', 'isValueFocused'], true);
  }

  function setInput (state, input) {
    state = assign(state, { input });

    const searchValue = input.trim();
    if (searchValue.length > 2 || searchValue === '') {
      state = set(state, ['isTyping'], true);
      putTyping(sleep(1000));
    }

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

  function selectFilterSuggestion (state, filter) {
    if (filter.contentType) {
      state = setContentType(state, filter.contentType.id);
    }

    state = update(state, ['filters'], filters => {
      return push(filters, [filter.queryKey, filter.operators[0][0], null]);
    });
    state = setInput(state, '');
    state = setFocusOnLastValue(state);

    return state;
  }

  function removeUnapplicableFilters (state) {
    const { contentTypeId } = state;

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
      searchTerm: state.input
    });

    return state;
  }
}
