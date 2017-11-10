/* global requestAnimationFrame */
import { noop, cloneDeep } from 'lodash';
import { match } from 'utils/TaggedValues';

import {h} from 'ui/Framework';
import * as H from 'ui/Framework/Hooks';
import {container, hspace} from 'ui/Layout';
import spinner from 'ui/Components/Spinner';
import {byName as colors} from 'Styles/Colors';

import filterIcon from 'svg/filter';
import infoIcon from 'svg/info';

import { ValueInput } from './Filters';
import { autosizeInput } from 'ui/AutoInputSize';
import entitySelector from 'entitySelector';
import filterValueDate from './ValueInput/Date';

const Keys = {
  arrowUp: (e) => e.key === 'ArrowUp',
  arrowDown: (e) => e.key === 'ArrowDown',
  backspace: (e) => e.key === 'Backspace',
  tab: (e) => e.key === 'Tab' && !e.shiftKey,
  shiftTab: (e) => e.key === 'Tab' && e.shiftKey,
  escape: (e) => e.key === 'Escape',
  enter: (e) => e.key === 'Enter'
};

export default function render ({
  isSearching,
  isTyping,
  focus,
  searchBoxHasFocus,
  contentTypeId,
  contentTypeFilter,
  filters,
  input,
  isSuggestionOpen,
  suggestions,
  actions
}) {
  const hasSpinner = isSearching || isTyping;
  const hasFilters = filters.length > 0;
  const defaultFocus = focus;

  return h('div', {
    hooks: [ H.TrackFocus(actions.SetBoxFocus) ],
    tabindex: '0',
    style: {
      height: '42px',
      position: 'relative'
    }
  }, [
    h('div', {
      class: searchBoxHasFocus
      ? 'search-next__pills-wrapper search-next__pills-wrapper--state-active'
      : 'search-next__pills-wrapper',
      onClick: () => actions.SetFocusOnQueryInput(),
      onFocusOut: actions.ResetFocus
    }, [
      h('div', {
        style: {
          display: 'flex',
          alignItems: 'stretch',
          flex: '1 1 auto',
          flexWrap: 'wrap',
          padding: '0 10px 5px'
        }
      }, [
        filterPill({
          value: contentTypeId,
          testId: 'contentTypeFilter',
          isRemovable: false,
          filter: contentTypeFilter,
          onChange: (value) => actions.SetContentType(value)
        }),
        ...renderPills({
          filters,
          defaultFocus,
          onChange: ({ index, value }) => actions.SetFilterValueInput([index, value]),
          onOperatorChange: ({ index, value }) => actions.SetFilterOperator([index, value]),
          onRemove: ({ index }) => actions.RemoveFilter(index),
          onRemoveAttempt: ({ index }) => actions.SetFocusOnPill(index)
        }),
        queryInput({
          isPlaceholderVisible: !hasFilters,
          value: input,
          onChange: actions.SetQueryInput,
          autofocus: !input && !hasFilters,
          isFocused: defaultFocus.isQueryInputFocused,
          onKeyDown: (e) => {
            const { target } = e;
            const hasSelection = target.selectionStart !== 0 || target.selectionEnd !== 0;
            if (Keys.backspace(e) && !hasSelection) {
              actions.SetFocusOnLast();
            } else if (Keys.arrowDown(e)) {
              if (!isSuggestionOpen) {
                actions.ShowSuggestions();
              } else {
                actions.SetFocusOnFirstSuggestion();
              }
            } else if (Keys.escape(e) || Keys.enter(e)) {
              actions.HideSuggestions();
            }
          }
        })
      ]),
      spinner({diameter: '18px'}, {
        alignSelf: 'flex-start',
        flexShrink: '0',
        marginTop: '13px',
        // We need to occupy the space to prevent breaking based on the
        // spinners visibility
        visibility: hasSpinner ? '' : 'hidden'
      }),
      hspace('8px'),
      h('.search-next__filter-toggle', {
        onClick: () => actions.ToggleSuggestions(),
        class: [
          isSuggestionOpen ? '-active' : '',
          searchBoxHasFocus ? '-focus' : ''
        ].join(' ')
      }, [
        container({
          alignSelf: 'flex-start',
          height: '40px',
          display: 'flex',
          alignItems: 'center'
        }, [
          // TODO we should be able to pass a `style` argument to
          // `filterIcon`.
          container({marginTop: '-3px'}, [filterIcon]),
          hspace('7px'),
          'Filter'
        ])
      ])
    ]),
    isSuggestionOpen && suggestionsBox({
      items: suggestions,
      searchTerm: input,
      defaultFocus,
      onSelect: (key) => {
        actions.SelectFilterSuggestions(key);
      },
      onKeyDown: (e) => {
        if (Keys.arrowUp(e) || Keys.shiftTab(e)) {
          actions.SetFocusOnPrevSuggestion();
        } else if (Keys.arrowDown(e) || Keys.tab(e)) {
          actions.SetFocusOnNextSuggestion();
        } else if (Keys.escape(e)) {
          actions.ToggleSuggestions();
          actions.SetFocusOnQueryInput();
        }
      }
    })
  ]);
}


function queryInput ({
  value,
  isPlaceholderVisible,
  isFocused,
  autofocus,
  onChange,
  onKeyDown
}) {
  return h('input.input-reset.search-next__query-input', {
    dataTestId: 'queryInput',
    hooks: [ H.Ref(autosizeInput) ],
    ref: (el) => {
      if (isFocused && el) {
        requestAnimationFrame(() => el.focus());
      }
    },
    autofocus,
    value,
    onKeyDown,
    onInput: (e) => onChange(e.target.value),
    placeholder: isPlaceholderVisible ? 'Type to search for entries' : ''
  });
}


function renderPills ({
  filters,
  defaultFocus,
  onChange,
  onOperatorChange,
  onRemove,
  onRemoveAttempt
}) {
  const pills = filters.map(([filter, op, value], index) => {
    return filterPill({
      filter,
      op,
      value,
      testId: filter.queryKey,
      isFocused: defaultFocus.index === index && !defaultFocus.isValueFocused,
      isValueFocused: defaultFocus.index === index && defaultFocus.isValueFocused,
      onChange: (value) => onChange({index, value}),
      onOperatorChange: (value) => onOperatorChange({ index, value }),
      onRemove: () => onRemove({index}),
      onRemoveAttempt: () => onRemoveAttempt({index})
    });
  });

  return pills;
}


// Filter pills
// ------------

function filterPill ({
  filter,
  op = '',
  value,
  testId,
  isFocused = false,
  isValueFocused = false,
  isRemovable = true,
  onChange,
  onOperatorChange = noop,
  onRemove = noop,
  onRemoveAttempt = noop
}) {
  return h('div.search__filter-pill', {
    dataTestId: testId,
    ref: (el) => {
      if (isFocused && el) {
        requestAnimationFrame(() => el.focus());
      }
    },
    tabindex: '0',
    onClick: (e) => {
      e.stopPropagation();
    },
    onKeyDown: (e) => {
      if (isRemovable) {
        if (Keys.backspace(e)) {
          onRemove();
          e.stopPropagation();
          e.preventDefault();
        }
      }
    }
  }, [
    h('div.search__filter-pill-label', [filter.name]),
    filterOperator({
      operators: filter.operators,
      op,
      onChange: operator => onOperatorChange(operator)
    }),
    filterValue({
      valueInput: filter.valueInput,
      value,
      isFocused: isValueFocused,
      onChange: value => onChange(value),
      onRemove: onRemoveAttempt
    })
  ]);
}

function filterOperator ({ op, operators = [], onChange }) {
  const hasOperators = operators.length > 1;

  if (!hasOperators) {
    return null;
  }

  return h('search_select.search__select-operator', [
    select({
      testId: '',
      options: operators,
      value: op,
      inputRef: noop,
      onKeyDown: noop,
      onChange
    })
  ]);
}

function filterValue ({ valueInput, value, isFocused, onChange, onRemove }) {
  const inputRef = (el) => {
    if (isFocused && el) {
      requestAnimationFrame(() => el.focus());
    }
  };

  const handleKeyDown = (e) => {
    const { target } = e;
    const hasSelection = target.selectionStart !== 0 || target.selectionEnd !== 0;
    e.stopPropagation();
    if (Keys.backspace(e) && !hasSelection) {
      onRemove();
    }
  };

  const valueTestId = 'value';

  const input = match(valueInput, {
    [ValueInput.Text]: () =>
      filterValueText({
        testId: valueTestId,
        value,
        inputRef,
        onChange,
        onKeyDown: handleKeyDown
      }),
    [ValueInput.Date]: () =>
      filterValueDate({
        testId: valueTestId,
        value,
        inputRef,
        onChange,
        onKeyDown: handleKeyDown
      }),
    [ValueInput.Select]: (options) =>
      filterSelect({
        testId: valueTestId,
        options,
        value,
        inputRef,
        onChange,
        onKeyDown: handleKeyDown
      }),
    [ValueInput.Reference]: (ctField) =>
      filterValueReference({
        testId: valueTestId,
        ctField,
        value,
        inputRef,
        onChange,
        onKeyDown: handleKeyDown
      })
  });

  return input;
}

function filterValueText ({value, testId, inputRef, onChange, onKeyDown}) {
  // In order to make the input fuild, we mirror the value of the input
  // in a span that pushes the parent div to grow.
  const shadowValue = value !== null ? value : '';

  return h('fieldset.search__input-text', [
    h('input.input-reset.search__input', {
      dataTestId: testId,
      value,
      ref: inputRef,
      onInput: (e) => onChange(e.target.value),
      onKeyDown,
      tabindex: '0'
    }),
    h('span.search__input-spacer', [shadowValue.replace(/\s/g, '|')])
  ]);
}

function filterSelect ({
  testId,
  options = [],
  value,
  inputRef,
  onChange,
  onKeyDown
}) {
  return h('.search_select.search__select-value', [
    select({
      testId,
      options,
      value,
      inputRef,
      onChange,
      onKeyDown
    })
  ]);
}

function select ({
  testId,
  options = [],
  value,
  inputRef,
  onChange,
  onKeyDown
}) {
  const [_, selectedOptionLabel] = options.find(([v]) => v === value) || ['', ''];
  const width = selectedOptionLabel.length ? `${selectedOptionLabel.length + 7}ch` : 'auto';

  return h('select.input-reset.search__select', {
    dataTestId: testId,
    value: value,
    ref: inputRef,
    onChange: ({ target: { value } }) => onChange(value),
    tabindex: '0',
    onKeyDown,
    style: {width}
  }, options.map(([value, label]) => {
    return h('option', {value}, [label]);
  }));
}

function filterValueReference ({ctField = {}, testId, value, inputRef, onChange, onKeyDown}) {
  // We do not want support field type arrays of references yet.
  const ctFieldClone = cloneDeep(ctField);

  ctFieldClone.type = 'Link';

  return h('input.input-reset.search__input-text', {
    dataTestId: testId,
    value,
    ref: inputRef,
    onClick: () => {
      entitySelector.openFromField(ctFieldClone)
        .then(entities => onChange(entities.map(e => e.sys.id).join(',')));
    },
    onKeyDown,
    tabindex: '0'
  });
}


// Suggestions
// -----------
function suggestionsBox ({
  items,
  searchTerm,
  defaultFocus,
  onSelect,
  onKeyDown
}) {
  const suggestions = items.map((field, index) => {
    return h('div.search-next__completion-item', {
      ref: (el) => {
        if (defaultFocus.suggestionsFocusIndex === index && el) {
          el.focus();
        }
      },
      tabindex: '0',
      onKeyDown: (e) => {
        if (e.key === 'Enter') {
          onSelect(field);
          e.stopPropagation();
        } else {
          onKeyDown(e);
        }
      },
      onClick: () => onSelect(field)
    }, [
      // TODO truncate with ellipses
      container({flex: '0 0 30%'}, [
        h('.__filter-pill', [ field.name ])
      ]),

      container({
        color: colors.textLightest,
        flex: '0 0 30%'
      }, [
        field.contentType ? field.contentType.name : 'All content types'
      ]),

      container({
        flex: '0 0 30%',
        color: colors.textLight
      }, [ field.description ])
    ]);
  });

  return suggestionList({
    items: suggestions,
    searchTerm
  });
}

function searchHelpBanner () {
  return container({
    display: 'flex',
    alignItems: 'center',
    background: colors.iceMid,
    borderTop: '1px solid ' + colors.elementLight,
    height: '56px',
    padding: '15px 20px'
  }, [
    infoIcon,
    h('p', {
      style: {
        color: colors.textLight,
        margin: '0',
        marginLeft: '10px'
      }
    }, [
      'Get more out of search. Here’s ',
      // TODO use ui/Content module
      h('a', {
        style: {textDecoration: 'underline'},
        href: 'https://www.contentful.com/r/knowledgebase/content-search/',
        target: '_blank'
      }, ['how search works']),
      '.'
    ])
  ]);
}

function noSuggestionsMessage ({ searchTerm }) {
  return h('div.search-next__suggestions__no-results', [
    `There are no filters matching "${searchTerm}".`
  ]);
}

function suggestionsHeader () {
  return (
    h('div.search-next__suggestions-header', [
      h('div.search-next__suggestions__column', ['Field']),
      h('div.search-next__suggestions__column', ['Content type']),
      h('div.search-next__suggestions__column', [ 'Description' ])
    ])
  );
}

function suggestionList ({ items, searchTerm }) {
  const hasSuggestions = items.length > 0;
  return h('div', {
    dataTestId: 'suggestions',
    style: {
      zIndex: 1,
      border: `solid ${colors.blueMid}`,
      borderWidth: '0 1px 1px 1px',
      background: 'white'
    }
  }, [
    hasSuggestions
    ? container({
      maxHeight: '50vh',
      overflowX: 'hidden',
      overflowY: 'auto'
    }, [suggestionsHeader(), ...items])
    : noSuggestionsMessage({ searchTerm }),
    searchHelpBanner()
  ]);
}
