import { noop } from 'lodash';
import { match } from 'utils/TaggedValues';

import {h} from 'ui/Framework';
import * as H from 'ui/Framework/Hooks';
import {container, hspace} from 'ui/Layout';
import spinner from 'ui/Components/Spinner';
import {byName as Colors} from 'Styles/Colors';

import scrollIntoView from 'scroll-into-view';

import filterIcon from 'svg/filter';
import infoIcon from 'svg/info';

import { ValueInput } from './Filters';
import { autosizeInput } from 'ui/AutoInputSize';

export default function render (state, actions) {
  const hasSuggestions = state.suggestions.items && state.suggestions.items.length > 0;
  const hasSpinner = state.isSearching || state.isTyping;
  const defaultFocus = state.focus;

  const handlePillValueChange = ({ index, value }) => {
    actions.SetFilterValueInput([index, value]);
    actions.TriggerSearch();
  }

  return h('div', {
    hooks: [ H.ClickBlur(actions.HideSuggestions) ],
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
        border: `1px solid ${Colors.blueMid}`
      },
      onFocusOut: actions.ResetFocus,
    }, [
      container({
        display: 'flex',
        alignItems: 'stretch',
        flex: '1 1 auto',
        flexWrap: 'wrap',
        padding: '0 10px 5px'
      }, [
        filterPill({
          value: state.query.contentType[2],
          isRemovable: false,
          filter: {
            name: 'contentType',
            valueInput: state.query.contentType[0].valueInput
          },
          onChange: actions.SetContentType
        }),
        ...pills({
          query: state.query, 
          defaultFocus,
          onChange: handlePillValueChange,
          onRemove: ({ index }) => actions.RemoveFilter(index),
        }),
        queryInput({
          isPlaceholderVisible: state.query.filters.length === 0,
          value: state.input,
          onChange: actions.SetQueryInput,
          isFocused: defaultFocus.isQueryInputFocused,
          onKeyDown: (e) => {
            const { key, target } = e;
            const isBackspace = key === 'Backspace';
            const hasSelection = target.selectionStart !== 0 || target.selectionEnd !== 0;
            if (isBackspace && !hasSelection) {
              actions.SetFocusOnLast();
            } else if (key === "ArrowDown") {
              if(!hasSuggestions) {
                actions.ToggleSuggestions();
              } else {
                actions.SetFocusOnFirstSuggestion();
              }
            }
          }
        })
      ]),
      hasSpinner &&
        spinner({diameter: '18px'}, {
          alignSelf: 'flex-start',
          flexShrink: '0',
          marginTop: '13px'
        }),
      hasSpinner && hspace('8px'),
      h('.search-next__filter-toggle', {
        onClick: actions.ToggleSuggestions,
        class: hasSuggestions ? '-active' : ''
      }, [
        container({marginTop: '-3px'}, [filterIcon]),
        hspace('7px'),
        'Filter'
      ])
    ]),
    hasSuggestions && filterSuggestions({
      items: state.suggestions.items,
      selected: state.suggestions.selected,
      defaultFocus,
      onSelect: (index) => {
        actions.SelectFilterSuggestions(index);
      },
      onKeyDown: (e) => {
        const {key, ctrlKey} = e;

        if(key === 'ArrowDown' || key === 'Tab') {
          actions.SetFocusOnNextSuggestion();
        } else if(key === 'ArrowUp' || (key === 'Tab' && ctrlKey)) {
          actions.SetFocusOnPrevSuggestion();
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
      marginRight: '12px'
    },
    ref: (el) => {
      if(isFocused && el) {
        requestAnimationFrame(() => el.focus());
      }
    },
    autofocus: true,
    value,
    onKeyDown,
    onInput: (e) => {
      onChange(e.target.value);
    },
    placeholder: isPlaceholderVisible ? 'Type to search for entries' : ''
  });
}


function pills ({ query, defaultFocus, onChange, onRemove }) {
  return query.filters.map(([filter, _op, value], index) => {
    return filterPill({
      value,
      filter,
      isFocused: defaultFocus.index === index && !defaultFocus.isValueFocused,
      isValueFocused: defaultFocus.index === index && defaultFocus.isValueFocused,
      onChange: (value) => onChange({index, value}),
      onRemove: () => onRemove({index}),
    });
  });
}


// Filter pills
// ------------
function filterPill ({
  value,
  filter,
  isFocused = false,
  isValueFocused = false,
  isRemovable = true,
  onChange,
  onRemove = noop,
}) {

  return h('div.search__filter-pill', {
    style: {
      display: 'flex',
      lineHeight: '30px',
      height: '30px',
      marginTop: '5px',
      marginRight: '12px'
    },
    ref:(el) => {
      if(isFocused && el) {
        requestAnimationFrame(() => el.focus());
      }
    },
    tabindex: '0',
    onKeyDown: (e) => {
      if (isRemovable) {
        if (e.key === 'Backspace') {
          onRemove();
          e.stopPropagation();
        }
      }
    }
  }, [
    filterName({ 
      name: filter.name
    }),
    filterValue({ 
      valueInput: filter.valueInput, 
      value, 
      isFocused: isValueFocused,
      onChange, 
      onRemove,
    })
  ]);
}


function filterName ({ name }) {
  return h('div', {
    style: {
      backgroundColor: Colors.blueDarkest,
      color: 'white',
      padding: '0 12px',
      borderRadius: '3px 0 0 3px',
      cursor: 'pointer'
    }
  }, [name]);
}


function filterValue ({ valueInput, value, isFocused, onChange, onRemove }) {
  const inputRef = (el) => {
    if(isFocused && el) {
      requestAnimationFrame(() => el.focus());
    }
  };

  const handleKeyDown = (e) => {
    const { key, target } = e;
    const isBackspace = key === 'Backspace';
    const hasSelection = target.selectionStart !== 0 || target.selectionEnd !== 0;
    e.stopPropagation();
    if (isBackspace && !hasSelection) {
      onRemove();
    }
  }

  return match(valueInput, {
    [ValueInput.Text]: () => 
      filterValueText({
        value,
        inputRef,
        onChange,
        onKeyDown: handleKeyDown,
        onRemove
      }),
    [ValueInput.Select]: (options) => 
      filterValueSelect({
        options,
        value, 
        inputRef,
        onKeyDown: handleKeyDown,
        onChange
      })
  });
}


function filterValueText ({value, inputRef, onChange, onKeyDown, onRemove}) {
  return h('input.input-reset', {
    value: value,
    ref: inputRef,
    onInput: (e) => onChange(e.target.value),
    onKeyDown, 
    tabindex: '0',
    style: {
      background: Colors.blueMid,
      color: 'white',
      lineHeight: '30px',
      padding: '0 12px',
      minWidth: '100px',
      borderRadius: '0 3px 3px 0'
    }
  });
}

function filterValueSelect ({options, inputRef, value, onKeyDown, onChange}) {
  return h('select.input-reset', {
    value: value,
    ref: inputRef,
    onChange: ({ target: { value } }) => onChange(value),
    tabindex: '0',
    style: {
      background: Colors.blueMid,
      color: 'white',
      lineHeight: '30px',
      padding: '0 12px',
      borderRadius: '0 3px 3px 0'
    }
  }, options.map(([value, label]) => {
    return h('option', {value}, [label]);
  }));
}


// Suggestions
// -----------


function filterSuggestions ({items, selected, defaultFocus, onSelect, onKeyDown}) {
  return suggestionsContainer(items.map((field, index) => {
    const isSelected = index === selected;
    return h('div.search-next__completion-item', {
      class: isSelected ? '--selected' : '',
      ref: (el) => {
        if(defaultFocus.suggestionsFocusIndex === index && el) {
          requestAnimationFrame(() => el.focus());
        }
      },
      tabindex: '0',
      onKeyDown: (e) => {
        if (e.key === 'Enter') {
          onSelect(index);
          e.stopPropagation();
        } else {
          onKeyDown(e);
        }
      },
      onClick: () => onSelect(index)
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
