import { makeCtor } from 'utils/TaggedValues';
import * as Store from 'ui/Framework/Store';
import { drop, assign, update, set, push } from 'utils/Collections';
import { createSlot, sleep } from 'utils/Concurrent';
import { freeze } from 'utils/Freeze';
import { caseofEq, otherwise } from 'libs/sum-types';

import { getMatchingFilters, contentTypeFilter, makeQueryObject } from './Filters';

const defaultFocus = {
  index: null,
  isValueFocused: false,
  isQueryInputFocused: false,
  suggestionsFocusIndex: null
};
const emptySuggestions = freeze({ visible: false, selected: null, items: null });

// The state for this component looks like this
// query
//   Explained in detail below. This is used to build the query object
//   we send to the API.
// query.contentType: [Filter, string, string]
//   The filter is the content type filter. The middle value, the
//   operator, is ignored for now. The last value is the content type
//   id. If this is an empty string that means we should not filter by
//   content type.
//   TODO Use 'null' to represent any content type
// query.filters: [[Filter, string, string]]
//   A list of [filter, operator, value] triples. Corresponds to the
//   pills we show.

export const initialState = (contentTypes) => ({
  query: {
    contentType: [contentTypeFilter(contentTypes), '', ''],
    filters: [],
    search: ''
  },
  input: '',
  suggestions: emptySuggestions,
  focus: defaultFocus
});


// Emitted when the value of the search input changes. Holds the new
// value.
const SetQueryInput = makeCtor('SetQueryInput');

// Emitted on every keydown event of the search input
const KeyDownQueryInput = makeCtor('KeyDownQueryInput');

// Emitted when the user selects a content type from the dropdown.
// Holds the ID of the selected content type
const SetContentType = makeCtor('SetContentType');
// Triggered whenever the value of a filter pill is changed by the
// user. Holds a [filterIndex, value] pair
const SetFilterValueInput = makeCtor('SetFilterValueInput');

const SelectFilterSuggestions = makeCtor('SelectFilterSuggestions');

const KeyDownContainer = makeCtor('KeyDownContainer');
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

export const Actions = {
  SetQueryInput,
  SetFilterValueInput,
  SetContentType,
  SelectFilterSuggestions,
  KeyDownContainer,
  TriggerSearch,
  KeyDownQueryInput,
  ToggleSuggestions,
  SetLoading,
  HideSuggestions,
  RemoveFilter,
  SetFocusOnLast,
  SetFocusOnLastValue,
  ResetFocus,
  SetFocusOnFirstSuggestion,
  SetFocusOnNextSuggestion,
  SetFocusOnPrevSuggestion,
  SetFocusOnQueryInput
};


export function makeReducer (dispatch, _cma, contentTypes, submitSearch) {
  const putTyping = createSlot(() => dispatch(UnsetTyping));

  return Store.makeReducer({
    [HideSuggestions] (state) {
      state = set(state, ['suggestions'], emptySuggestions);
      return state;
    },
    [SetQueryInput]: setInput,
    [KeyDownContainer] (state, event) {
      return caseofEq(event.key, [
        ['Enter', () => {
          if (state.suggestions.selected != null) {
            return selectFilterSuggestion(state, state.suggestions.selected);
          } else {
            return state;
          }
        }],
        ['ArrowDown', () => handleArrowPress(state, event, 1)],
        ['ArrowUp', () => handleArrowPress(state, event, -1)],
        [otherwise, () => state]
      ]);
    },
    [SelectFilterSuggestions]: selectFilterSuggestion,
    [KeyDownQueryInput] (state, event) {
      // TODO Use e.keyCode fallback
      if (event.key === 'Backspace' && event.target.selectionStart === 0 && event.target.selectionEnd === 0) {
        return update(state, ['query', 'filters'], (parts) => drop(parts, -1));
      }
      return state;
    },
    [SetFilterValueInput] (state, [filterIndex, value]) {
      state = set(state, ['isTyping'], true);
      putTyping(sleep(1000));
      state = set(state, ['query', 'filters', filterIndex, 2], value);
      return state;
    },
    [UnsetTyping] (state) {
      state = set(state, ['isTyping'], false);
      state = triggerSearch(state);
      return state;
    },
    [TriggerSearch]: triggerSearch,
    [ToggleSuggestions] (state) {
      state = update(state, ['suggestions', 'items'], (items) => {
        if (items == null) {
          return getMatchingFilters(state.input, state.query.contentType[2], contentTypes);
        } else {
          return null;
        }
      });
      return state;
    },
    [SetContentType] (state, contentTypeId) {
      state = set(state, ['query', 'contentType', 2], contentTypeId);

      state = update(state, ['query', 'filters'], (oldFilters) => {
        return oldFilters.filter(([filter, _operator, _value]) => {
          return filter.contentType
            ? filter.contentType.id === contentTypeId
            : true;
        });
      });

      return state;
    },
    // TODO rename
    [SetLoading] (state, isSearching) {
      state = set(state, ['isSearching'], isSearching);
      state = set(state, ['isTyping'], isSearching);
      return state;
    },
    [RemoveFilter] (state, indexToRemove) {
      state = update(state, ['query', 'filters'], (oldFilters) => {
        return oldFilters.filter((_, index) => {
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
    [SetFocusOnPrevSuggestion]: setFocusOnPrevSuggestion
  });

  function setFocusOnFirstSuggestion (state) {
    state = resetFocus(state);
    return set(state, ['focus', 'suggestionsFocusIndex'], 0);
  }

  function setFocusOnNextSuggestion (state) {
    const idx = state.focus.suggestionsFocusIndex;
    let indexToFocus;
    if (idx === state.suggestions.items.length - 1) {
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

    return set(state, ['focus', 'index'], state.query.filters.length - 1);
  }

  function setFocusOnLastValue (state) {
    state = setFocusOnLast(state);

    return set(state, ['focus', 'isValueFocused'], true);
  }

  function setInput (state, input) {
    const searchValue = input.trim();
    state = assign(state, { input });

    if (searchValue.length > 2) {
      state = set(state, ['isTyping'], true);
      putTyping(sleep(1000));
    }

    if (searchValue) {
      // TODO omit content type
      const items = getMatchingFilters(searchValue, state.query.contentType[2], contentTypes);
      state = set(state, ['suggestions', 'items'], items);
    } else {
      state = set(state, ['suggestions'], emptySuggestions);
    }
    state = set(state, ['query', 'search'], searchValue);
    return state;
  }


  function handleArrowPress (state, event, increment) {
    const suggestionItems = state.suggestions.items;
    if (!suggestionItems) {
      return state;
    }

    event.preventDefault();
    return update(state, ['suggestions', 'selected'], (selected) => {
      if (selected === null) {
        return 0;
      } else {
        const length = suggestionItems.length;
        return (selected + increment + length) % length;
      }
    });
  }


  function selectFilterSuggestion (state, index) {
    const filter = state.suggestions.items[index];
    if (filter) {
      if (filter.contentType) {
        state = set(state, ['query', 'contentType', 2], filter.contentType.id);
      }
      state = update(state, ['query', 'filters'], (filters) => {
        return push(filters, [filter, '', null]);
      });
    }
    state = setInput(state, '');
    state = setFocusOnLastValue(state);

    return state;
  }


  /**
   * Build the query object from the current filters and pass it to
   * `submitSearch`.
   */
  function triggerSearch (state) {
    const { query } = state;
    const queryItems = [query.contentType, ...query.filters];
    submitSearch(makeQueryObject(queryItems, query.search));
    return state;
  }
}
