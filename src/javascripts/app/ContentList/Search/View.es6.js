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
          onChange: (_op, value) => actions.SetContentType(value)
        }),
        ...renderPills({
          filters,
          defaultFocus,
          onChange: ({ index, op, value }) => actions.SetFilterValueInput([index, op, value]),
          onRemove: ({ index }) => actions.RemoveFilter(index),
          onRemoveAttempt: ({ index }) => actions.SetFocusOnPill(index)
        }),
        queryInput({
          isPlaceholderVisible: filters.length === 0,
          value: input,
          onChange: actions.SetQueryInput,
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
    isSuggestionOpen && filterSuggestions({
      items: suggestions,
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


function queryInput ({value, isPlaceholderVisible, isFocused, onChange, onKeyDown}) {
  return h('input.input-reset.search-next__query-input', {
    dataTestId: 'queryInput',
    hooks: [ H.Ref(autosizeInput) ],
    ref: (el) => {
      if (isFocused && el) {
        requestAnimationFrame(() => el.focus());
      }
    },
    autofocus: true,
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
      onChange: (op, value) => onChange({index, op, value}),
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
      onChange: operator => onChange(operator, value)
    }),
    filterValue({
      valueInput: filter.valueInput,
      value,
      isFocused: isValueFocused,
      onChange: value => onChange(op, value),
      onRemove: onRemoveAttempt
    })
  ]);
}

function filterOperator ({ op, operators = [], onChange }) {
  const hasOperators = operators.length > 1;

  if (!hasOperators) {
    return null;
  }

  return h('search_select.search__select-operator', {}, [
    h('select.input-reset.search__select', {
      value: op,
      onChange: (e) => onChange(e.target.value),
      tabindex: '0'
    }, operators.map(([value, label]) => {
      return h('option', {value}, [label]);
    }))
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
  return h('input.input-reset.search__input-text', {
    dataTestId: testId,
    value: value,
    ref: inputRef,
    onInput: (e) => onChange(e.target.value),
    onKeyDown,
    tabindex: '0',
    style: {
      width: `calc(${(value === null ? 1 : value.length + 1)}ch + 20px)`
    }
  });
}

function filterSelect ({
  testId,
  options = [],
  value,
  inputRef,
  onChange,
  onKeyDown
}) {
  const [_, selectedOptionLabel] = options.find(([v]) => v === value) || ['', ''];
  const width = selectedOptionLabel.length ? `${selectedOptionLabel.length + 5}ch` : 'auto';

  return h('.search_select.search__select-value', [
    h('select.input-reset.search__select', {
      dataTestId: testId,
      value: value,
      ref: inputRef,
      onChange: ({ target: { value } }) => onChange(value),
      tabindex: '0',
      onKeyDown,
      style: {width}
    }, options.map(([value, label]) => {
      return h('option', {value}, [label]);
    }))
  ]);
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


function filterSuggestions ({items, defaultFocus, onSelect, onKeyDown}) {
  return suggestionsContainer(items.map((field, index) => {
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
      container({
        flex: '0 0 30%'
      }, [ h('.__filter-pill', [ field.name ]) ]),
      hspace('20px'),
      container({
        color: colors.textLightest,
        flex: '0 0 30%'
      }, [
        field.contentType ? field.contentType.name : 'All content types'
      ]),
      hspace('20px'),
      container({
        color: colors.textLight
      }, [ field.description ])
    ]);
  }));
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

function suggestionsContainer (content) {
  return h('div', {
    dataTestId: 'suggestions',
    style: {
      position: 'absolute',
      left: '0',
      right: '0',
      zIndex: 1,
      border: `solid ${colors.blueMid}`,
      borderWidth: '0 1px 1px 1px',
      background: 'white'
    }
  }, [
    container({
      maxHeight: '50vh',
      overflowX: 'hidden',
      overflowY: 'auto'
    }, content),
    searchHelpBanner()
  ]);
}
