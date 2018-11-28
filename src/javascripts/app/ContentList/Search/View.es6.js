/* global requestAnimationFrame */
/* eslint-disable react/prop-types */
// TODO: add prop-types
import { noop } from 'lodash';
import { match } from 'utils/TaggedValues.es6';
import { truncate } from 'utils/StringUtils.es6';
import React from 'react';
import { h } from 'ui/Framework';
import * as H from 'ui/Framework/Hooks';
import { container, hspace } from 'ui/Layout.es6';
import { Spinner } from '@contentful/forma-36-react-components';
import { byName as colors } from 'Styles/Colors.es6';
import keycodes from 'utils/keycodes.es6';

import FilterIcon from 'svg/filter.es6';
import InfoIcon from 'svg/info.es6';

import { ValueInput } from './Filters.es6';
import filterValueDate from './ValueInput/Date.es6';
import FilterValueReference from './ValueInput/Reference.es6';
import TextValueInput from './ValueInput/Text.es6';
import Select from './ValueInput/select.es6';
import QueryInput from './Components/QueryInput.es6';
import { IsOverflownY as IsOverflownYHook } from './Hooks/IsOverflown.es6';

const Keys = {
  arrowUp: e => e.keyCode === keycodes.UP,
  arrowDown: e => e.keyCode === keycodes.DOWN,
  backspace: e => e.keyCode === keycodes.BACKSPACE,
  tab: e => e.keyCode === keycodes.TAB && !e.shiftKey,
  shiftTab: e => e.keyCode === keycodes.TAB && e.shiftKey,
  escape: e => e.keyCode === keycodes.ESC,
  enter: e => e.keyCode === keycodes.ENTER
};

export default function render({
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
  actions,
  withAssets,
  hasLoaded
}) {
  const hasSpinner = isSearching || isTyping;
  const hasFilters = filters.length > 0;
  const defaultFocus = focus;
  const placeholder = hasFilters ? '' : 'Type to search for ' + (withAssets ? 'assets' : 'entries');

  if (!hasLoaded) {
    return h(
      'div',
      {
        dataTestId: 'loader'
      },
      []
    );
  }

  return h(
    'div',
    {
      hooks: [H.TrackFocus(value => actions.SetBoxFocus(value))],
      style: {
        height: '40px',
        width: '100%',
        position: 'relative'
      }
    },
    [
      h(
        'div',
        {
          class: searchBoxHasFocus
            ? 'search-next__pills-wrapper search-next__pills-wrapper--state-active'
            : 'search-next__pills-wrapper',
          onClick: () => actions.SetFocusOnQueryInput(),
          onBlur: () => actions.ResetFocus(),
          hooks: [IsOverflownYHook()],
          ref: el => {
            // HACK: fixes the scroll position after selecting entity
            // in reference filter pill
            if (el && !searchBoxHasFocus) {
              el.scrollTop = 0;
            }
          }
        },
        [
          h(
            'div',
            {
              class: 'search-next__pills-list'
            },
            [
              !withAssets &&
                filterPill({
                  value: contentTypeId,
                  testId: 'contentTypeFilter',
                  isRemovable: false,
                  filter: contentTypeFilter,
                  onChange: value => actions.SetContentType(value)
                }),
              ...renderPills({
                filters,
                defaultFocus,
                onChange: ({ index, value }) => {
                  // Keep the focus on the search box after setting a pill value
                  // with a dialog/anyway that loses searchbox focus.
                  actions.SetFocusOnPillValue(index);
                  actions.SetFilterValueInput([index, value]);
                },
                onOperatorChange: ({ index, value }) => actions.SetFilterOperator([index, value]),
                onRemove: ({ index }) => actions.RemoveFilter(index),
                onRemoveAttempt: ({ index }) => actions.SetFocusOnPill(index)
              }),
              React.createElement(QueryInput, {
                placeholder,
                value: input || '',
                onChange: value => actions.SetQueryInput(value),
                autoFocus: !input && !hasFilters,
                isFocused: defaultFocus.isQueryInputFocused,
                onKeyDown: e => {
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
            ]
          ),
          h(
            'div',
            {
              style: {
                paddingTop: '10px',
                // We need to occupy the space to prevent breaking based on the
                // spinners visibility
                visibility: hasSpinner ? '' : 'hidden'
              }
            },
            [
              h(Spinner, {
                style: {
                  display: 'inline-block'
                }
              })
            ]
          ),
          hspace('8px'),
          h(
            '.search-next__filter-toggle',
            {
              onClick: () => actions.ToggleSuggestions(),
              class: [isSuggestionOpen ? '-active' : '', searchBoxHasFocus ? '-focus' : ''].join(
                ' '
              )
            },
            [
              container(
                {
                  alignSelf: 'flex-start',
                  height: '38px',
                  display: 'flex',
                  alignItems: 'center'
                },
                [
                  // TODO we should be able to pass a `style` argument to
                  // `filterIcon`.
                  container({ marginTop: '-3px' }, [h(FilterIcon)]),
                  hspace('7px'),
                  'Filter'
                ]
              )
            ]
          )
        ]
      ),
      isSuggestionOpen &&
        (defaultFocus.suggestionsFocusIndex >= 0 || defaultFocus.isQueryInputFocused) &&
        suggestionsBox({
          items: suggestions,
          searchTerm: input,
          defaultFocus,
          onSelect: key => {
            actions.SelectFilterSuggestions(key);
          },
          onKeyDown: e => {
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
    ]
  );
}

function renderPills({
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
      onChange: value => onChange({ index, value }),
      onOperatorChange: value => onOperatorChange({ index, value }),
      onRemove: () => onRemove({ index }),
      onRemoveAttempt: () => onRemoveAttempt({ index })
    });
  });

  return pills;
}

// Filter pills
// ------------

function filterPill({
  filter,
  op = '',
  value = '',
  testId,
  isFocused = false,
  isValueFocused = false,
  isRemovable = true,
  onChange,
  onOperatorChange = noop,
  onRemove = noop,
  onRemoveAttempt = noop
}) {
  return h(
    'div.search__filter-pill',
    {
      'data-test-id': testId,
      ref: el => {
        if (isFocused && el) {
          requestAnimationFrame(() => el.focus());
        }
      },
      tabIndex: '0',
      onClick: e => {
        e.stopPropagation();
      },
      onKeyDown: e => {
        if (Keys.backspace(e)) {
          if (isRemovable) {
            onRemove();
          }
          e.stopPropagation();
          e.preventDefault();
        }
      }
    },
    [
      h('div.search__filter-pill-label', [filter.label || filter.name]),
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
        onRemove: () => {
          if (isRemovable) {
            onRemoveAttempt();
          }
        }
      })
    ]
  );
}

function filterOperator({ op, operators = [], onChange }) {
  const hasOperators = operators.length > 1;

  if (!hasOperators) {
    return null;
  }

  return h('.search_select.search__select-operator', [
    React.createElement(Select, {
      testId: '',
      options: operators,
      value: op,
      inputRef: noop,
      onKeyDown: noop,
      onChange
    })
  ]);
}

function filterValue({ valueInput, value, isFocused, onChange, onRemove }) {
  const inputRef = el => {
    if (isFocused && el) {
      requestAnimationFrame(() => el.focus());
    }
  };

  const handleKeyDown = e => {
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
      React.createElement(TextValueInput, {
        testId: valueTestId,
        value,
        inputRef,
        onChange,
        onKeyDown: handleKeyDown
      }),
    [ValueInput.AssetDetailsSize]: () =>
      filterValueAssetSize({
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
    [ValueInput.Select]: options =>
      filterSelect({
        testId: valueTestId,
        options,
        value,
        inputRef,
        onChange,
        onKeyDown: handleKeyDown
      }),
    [ValueInput.Reference]: ctField =>
      React.createElement(FilterValueReference, {
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

function filterValueAssetSize(props) {
  return React.createElement(TextValueInput, {
    ...props,
    value: props.value,
    onChange: nextValue => props.onChange(nextValue)
  });
}

function filterSelect({ testId, options = [], value, inputRef, onChange, onKeyDown }) {
  return h('.search__select-value', [
    React.createElement(Select, {
      testId,
      options,
      value,
      inputRef,
      onChange,
      onKeyDown
    })
  ]);
}

// Suggestions
// -----------
function suggestionsBox({ items, searchTerm, defaultFocus, onSelect, onKeyDown }) {
  const suggestions = items.map((field, index) => {
    return h(
      'div.search-next__completion-item',
      {
        'data-test-id': field.queryKey,
        ref: el => {
          if (defaultFocus.suggestionsFocusIndex === index && el) {
            el.focus();
          }
        },
        tabIndex: '0',
        onKeyDown: e => {
          if (Keys.enter(e)) {
            onSelect(field);
            e.stopPropagation();
          } else {
            onKeyDown(e);
          }
        },
        onClick: () => onSelect(field)
      },
      [
        // TODO truncate with ellipses
        h(
          'div',
          {
            'data-test-id': 'label',
            style: { flex: '0 0 30%' }
          },
          [h('.__filter-pill', [field.name])]
        ),

        h(
          'div',
          {
            'data-test-id': 'contentType',
            style: {
              color: colors.textLightest,
              flex: '0 0 30%'
            }
          },
          [field.contentType ? field.contentType.name : 'All content types']
        ),

        h(
          'div',
          {
            'data-test-id': 'description',
            style: {
              flex: '0 0 30%',
              color: colors.textLight
            }
          },
          [field.description]
        )
      ]
    );
  });

  return suggestionList({
    items: suggestions,
    searchTerm
  });
}

function searchHelpBanner() {
  return container(
    {
      display: 'flex',
      alignItems: 'center',
      background: colors.iceMid,
      borderTop: '1px solid ' + colors.elementLight,
      height: '56px',
      padding: '15px 20px'
    },
    [
      h(InfoIcon),
      h(
        'p',
        {
          style: {
            color: colors.textLight,
            margin: '0',
            marginLeft: '10px'
          }
        },
        [
          'Get more out of search. Here’s ',
          // TODO use ui/Content module
          h(
            'a',
            {
              style: { textDecoration: 'underline' },
              href: 'https://www.contentful.com/r/knowledgebase/content-search/',
              target: '_blank'
            },
            ['how search works']
          ),
          '.'
        ]
      )
    ]
  );
}

function noSuggestionsMessage({ searchTerm }) {
  return h('div.search-next__suggestions__no-results', [
    `There are no filters matching “${truncate(searchTerm.trim(), 25)}”`
  ]);
}

function suggestionsHeader() {
  return h('div.search-next__suggestions-header', [
    h('div.search-next__suggestions__column', ['Field']),
    h('div.search-next__suggestions__column', ['Content type']),
    h('div.search-next__suggestions__column', ['Description'])
  ]);
}

function suggestionList({ items, searchTerm }) {
  const hasSuggestions = items.length > 0;
  return h(
    'div',
    {
      'data-test-id': 'suggestions',
      style: {
        zIndex: 1,
        border: `solid ${colors.blueMid}`,
        borderWidth: '0 1px 1px 1px',
        background: 'white'
      }
    },
    [
      hasSuggestions
        ? container(
            {
              maxHeight: '50vh',
              overflowX: 'hidden',
              overflowY: 'auto'
            },
            [suggestionsHeader(), ...items]
          )
        : noSuggestionsMessage({ searchTerm }),
      searchHelpBanner()
    ]
  );
}
