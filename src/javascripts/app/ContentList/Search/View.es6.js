/* global requestAnimationFrame */
import { noop } from 'lodash';
import { match } from 'utils/TaggedValues';

import {h} from 'ui/Framework';
import * as H from 'ui/Framework/Hooks';
import {container, hspace} from 'ui/Layout';
import spinner from 'ui/Components/Spinner';
import {byName as Colors} from 'Styles/Colors';

import filterIcon from 'svg/filter';
import infoIcon from 'svg/info';

import { ValueInput } from './Filters';
import { autosizeInput } from 'ui/AutoInputSize';

const Keys = {
  arrowUp: (e) => e.key === 'ArrowUp',
  arrowDown: (e) => e.key === 'ArrowDown',
  backspace: (e) => e.key === 'Backspace',
  tab: (e) => e.key === 'Tab' && !e.shiftKey,
  shiftTab: (e) => e.key === 'Tab' && e.shiftKey,
  escape: (e) => e.key === 'Escape'
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

  const handlePillValueChange = ({ index, op, value }) => {
    actions.SetFilterValueInput([index, op, value]);
    actions.TriggerSearch();
  };

  return h('div', {
    hooks: [ H.TrackFocus(actions.SetBoxFocus) ],
    tabindex: '0',
    style: {
      height: '42px',
      position: 'relative'
    }
  }, [
    h('div', {
      style: {
        display: 'flex',
        background: 'white',
        border: '1px solid transparent',
        borderColor: searchBoxHasFocus ? Colors.blueMid : Colors.elementMid,
        height: searchBoxHasFocus ? 'auto' : '42px',
        overflow: searchBoxHasFocus ? '' : 'hidden'
      },
      onFocusOut: actions.ResetFocus
    }, [
      container({
        display: 'flex',
        alignItems: 'stretch',
        flex: '1 1 auto',
        flexWrap: 'wrap',
        padding: '0 10px 5px'
      }, [
        filterPill({
          value: contentTypeId,
          isRemovable: false,
          filter: contentTypeFilter,
          onChange: actions.SetContentType
        }),
        ...pills({
          filters: filters,
          defaultFocus,
          onChange: handlePillValueChange,
          onRemove: ({ index }) => actions.RemoveFilter(index)
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
            } else if (Keys.escape(e)) {
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
  return h('input.input-reset', {
    hooks: [ H.Ref(autosizeInput) ],
    style: {
      flexGrow: '1',
      lineHeight: '30px',
      height: '30px',
      marginTop: '5px',
      marginRight: '12px',
      fontSize: 'inherit'
    },
    ref: (el) => {
      if (isFocused && el) {
        el.focus();
      }
    },
    autofocus: true,
    value,
    onKeyDown,
    onInput: (e) => onChange(e.target.value),
    placeholder: isPlaceholderVisible ? 'Type to search for entries' : ''
  });
}


function pills ({ filters, defaultFocus, onChange, onRemove }) {
  return filters.map(([filter, op, value], index) => {
    return filterPill({
      filter,
      op,
      value,
      isFocused: defaultFocus.index === index && !defaultFocus.isValueFocused,
      isValueFocused: defaultFocus.index === index && defaultFocus.isValueFocused,
      onChange: (op, value) => onChange({index, op, value}),
      onRemove: () => onRemove({index})
    });
  });
}


// Filter pills
// ------------

function filterPill ({
  filter,
  op,
  value,
  isFocused = false,
  isValueFocused = false,
  isRemovable = true,
  onChange,
  onRemove = noop
}) {
  return h('div.search__filter-pill', {
    ref: (el) => {
      if (isFocused && el) {
        requestAnimationFrame(() => el.focus());
      }
    },
    tabindex: '0',
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
    ...filterValue({
      operators: filter.operators,
      valueInput: filter.valueInput,
      op,
      value,
      isFocused: isValueFocused,
      onChange,
      onRemove
    })
  ]);
}

function filterValue ({ operators, valueInput, op, value, isFocused, onChange, onRemove }) {
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

  const hasOperators = operators && operators.length > 1;
  const operatorSelect = hasOperators && filterOperatorSelect({
    op,
    operators,
    inputRef,
    onChange: newOp => onChange(newOp, value),
    onKeyDown: handleKeyDown
  });

  const onValueChange = newValue => onChange(op, newValue);
  const input = match(valueInput, {
    [ValueInput.Text]: () =>
      filterValueText({
        value,
        inputRef,
        onChange: onValueChange,
        onKeyDown: handleKeyDown
      }),
    [ValueInput.Select]: (options) =>
      filterValueSelect({
        options,
        value,
        inputRef,
        onChange: onValueChange,
        onKeyDown: handleKeyDown
      })
  });

  return [operatorSelect, input];
}


function filterValueText ({value, inputRef, onChange, onKeyDown}) {
  return h('input.input-reset.search__input-text', {
    value: value,
    ref: inputRef,
    onInput: (e) => onChange(e.target.value),
    onKeyDown,
    tabindex: '0'
  });
}

function filterOperatorSelect({op, operators, inputRef, onChange, onKeyDown}) {
  return h('select.input-reset.search__select', {
    value: op,
    ref: inputRef,
    onChange: ({ target: { value } }) => onChange(value),
    tabindex: '0',
    onKeyDown
  }, operators.map(([value, label]) => {
    return h('option', {value}, [label]);
  }));
}

function filterValueSelect ({options, inputRef, value, onKeyDown, onChange}) {
  return h('select.input-reset.search__select', {
    value: value,
    ref: inputRef,
    onChange: ({ target: { value } }) => onChange(value),
    tabindex: '0',
    onKeyDown,
  }, options.map(([value, label]) => {
    return h('option', {value}, [label]);
  }));
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
        color: Colors.textLightest,
        flex: '0 0 30%'
      }, [
        field.contentType ? field.contentType.name : 'All content types'
      ]),
      hspace('20px'),
      container({
        color: Colors.textLight
      }, [ field.description ])
    ]);
  }));
}

function searchHelpBanner () {
  return container({
    display: 'flex',
    alignItems: 'center',
    background: Colors.iceMid,
    borderTop: '1px solid ' + Colors.elementLight,
    height: '56px',
    padding: '15px 20px'
  }, [
    infoIcon,
    h('p', {
      style: {
        color: Colors.textLight,
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
  return container({
    position: 'absolute',
    left: '0',
    right: '0',
    zIndex: 1,
    border: `solid ${Colors.blueMid}`,
    borderWidth: '0 1px 1px 1px',
    background: 'white'
  }, [
    container({
      maxHeight: '50vh',
      overflowX: 'hidden',
      overflowY: 'auto'
    }, content),
    searchHelpBanner()
  ]);
}
