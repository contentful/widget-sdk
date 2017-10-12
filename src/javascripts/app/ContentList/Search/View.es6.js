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

  return h('div', {
    hooks: [ H.ClickBlur(actions.HideSuggestions) ],
    onKeyDown: actions.KeyDownContainer,
    onFocusOut: actions.FocusOut,
    tabindex: '1',
    style: {
      height: '42px',
      position: 'relative'
    }
  }, [
    container({
      display: 'flex',
      background: 'white',
      border: `1px solid ${Colors.blueMid}`
    }, [
      container({
        display: 'flex',
        alignItems: 'stretch',
        flex: '1 1 auto',
        flexWrap: 'wrap',
        padding: '0 10px 5px'
      }, [
        ...pills(state.query, state.focus === 'lastValueInput', actions),
        queryInput(state, actions)
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
    hasSuggestions && filterSuggestions(state.suggestions, actions.ClickFilterSuggestion)
  ]);
}


function queryInput (state, actions) {
  return h('input.input-reset', {
    hooks: [ H.Ref(autosizeInput) ],
    style: {
      flexGrow: '1',
      lineHeight: '30px',
      height: '30px',
      marginTop: '5px',
      marginRight: '12px'
    },
    autofocus: true,
    ref: (el) => {
      if (el && state.focus === 'queryInput') {
        // TODO Check if we can do away with setTimeout if we use
        // react. If not we should provide a generic hook for this that
        // uses requestAnimationFrame
        // eslint-disable-next-line
        requestAnimationFrame(() => el.focus());
      }
    },
    value: state.input,
    onKeyDown: actions.KeyDownQueryInput,
    onInput: (e) => actions.SetQueryInput(e.target.value),
    placeholder: state.query.filters.length ? '' : 'Type to search for entries'
  });
}


function pills (query, focusValue, actions) {
  const generic = query.filters.map(([filter, _op, value], index) => {
    const isLast = index === query.filters.length - 1;
    const setValue = (value) => actions.SetFilterValueInput([index, value]);
    const state =
      isLast && focusValue ? 'focus'
      : null;

    return filterPill({
      state,
      name: filter.name,
      value: value,
      input: filter.valueInput,
      actions: {
        setValue,
        TriggerSearch: actions.triggerSearch
      }
    });
  });

  return [
    filterPill({
      state: null,
      name: 'contentType',
      value: query.contentType[2],
      input: query.contentType[0].valueInput,
      actions: {
        setValue: actions.SetContentType,
        TriggerSearch: actions.TriggerSearch
      }
    }),
    ...generic
  ];
}


// Filter pills
// ------------

function filterPill ({
  state,
  name,
  value,
  input,
  actions
}) {
  return container({
    display: 'flex',
    lineHeight: '30px',
    height: '30px',
    marginTop: '5px',
    marginRight: '12px'
  }, [
    filterName(name),
    filterValue(input, value, state === 'focus', actions)
  ]);
}


function filterName (name) {
  return container({
    background: Colors.blueDarkest,
    color: 'white',
    padding: '0 12px',
    borderRadius: '3px 0 0 3px'
  }, [name]);
}


function filterValue (valueInput, value, focus, actions) {
  return match(valueInput, {
    [ValueInput.Text]: () => filterValueText(value, focus, actions),
    [ValueInput.Select]: (options) => filterValueSelect(options, value, focus, actions)
  });
}


function filterValueText (value, focus, actions) {
  return h('input.input-reset', {
    ref: (el) => {
      if (focus && el) {
        // TODO Check if we can do away with setTimeout if we use
        // react. If not we should provide a generic hook for this that
        // uses requestAnimationFrame
        // eslint-disable-next-line
        setTimeout(() => el.focus());
      }
    },
    hooks: [ H.Ref(autosizeInput) ],
    value: value,
    onInput: (e) => actions.setValue(e.target.value),
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

function filterValueSelect (options, value, _focus, actions) {
  return h('select.input-reset', {
    value: value,
    onChange: (e) => {
      actions.setValue(e.target.value);
      actions.TriggerSearch();
    },
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


function filterSuggestions ({items, selected}, SelectFilterSuggestion) {
  return suggestionsContainer(items.map((field, index) => {
    const isSelected = index === selected;
    return h('div.search-next__completion-item', {
      class: isSelected ? '--selected' : '',
      ref: (el) => {
        // TODO use hooks
        isSelected && el && scrollIntoView(el);
      },
      onClick: () => SelectFilterSuggestion(index)
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
