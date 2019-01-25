/* eslint-disable react/prop-types */
// TODO: add prop-types

import React from 'react';
import classNames from 'classnames';
import { Spinner } from '@contentful/forma-36-react-components';

import Keys from './Keys.es6';
import FilterIcon from 'svg/filter.es6';

import FilterPill from './FilterPill.es6';
import SuggestionsBox from './SuggestionsBox.es6';
import QueryInput from './Components/QueryInput.es6';
import LegacyHook from './Hooks/LegacyHook.es6';
import { TrackFocus, IsOverflownY } from './Hooks/FocusManagerHook.es6';

function PillsList({
  filters,
  defaultFocus,
  onChange,
  onOperatorChange,
  onRemove,
  onRemoveAttempt
}) {
  return filters.map(([filter, op, value], index) => {
    return (
      <FilterPill
        key={index}
        {...{
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
        }}
      />
    );
  });
}

export default function View(props) {
  const {
    isSearching,
    isTyping,
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
  } = props;

  if (!hasLoaded) {
    return <div data-test-id="loader" />;
  }

  const hasFilters = filters.length > 0;
  const hasSpinner = isSearching || isTyping;
  const placeholder = hasFilters ? '' : 'Type to search for ' + (withAssets ? 'assets' : 'entries');
  const defaultFocus = props.focus;

  return (
    <LegacyHook
      style={{
        height: '40px',
        width: '100%',
        position: 'relative'
      }}
      args={{
        tag: 'div',
        hooks: [TrackFocus(value => actions.SetBoxFocus(value))]
      }}>
      <LegacyHook
        className={
          searchBoxHasFocus
            ? 'search-next__pills-wrapper search-next__pills-wrapper--state-active'
            : 'search-next__pills-wrapper'
        }
        onClick={() => actions.SetFocusOnQueryInput()}
        onBlur={() => actions.ResetFocus()}
        args={{
          tag: 'div',
          hooks: [IsOverflownY()],
          ref: el => {
            // HACK: fixes the scroll position after selecting entity
            // in reference filter pill
            if (el && !searchBoxHasFocus) {
              el.scrollTop = 0;
            }
          }
        }}>
        <div className="search-next__pills-list">
          {!withAssets && (
            <FilterPill
              value={contentTypeId}
              testId="contentTypeFilter"
              isRemovable={false}
              filter={contentTypeFilter}
              onChange={value => actions.SetContentType(value)}
            />
          )}
          <PillsList
            filters={filters}
            defaultFocus={defaultFocus}
            onChange={({ index, value }) => {
              // Keep the focus on the search box after setting a pill value
              // with a dialog/anyway that loses searchbox focus.
              actions.SetFocusOnPillValue(index);
              actions.SetFilterValueInput([index, value]);
            }}
            onOperatorChange={({ index, value }) => actions.SetFilterOperator([index, value])}
            onRemove={({ index }) => actions.RemoveFilter(index)}
            onRemoveAttempt={({ index }) => actions.SetFocusOnPill(index)}
          />
          <QueryInput
            placeholder={placeholder}
            value={input || ''}
            onChange={value => actions.SetQueryInput(value)}
            autoFocus={!input && !hasFilters}
            isFocused={defaultFocus.isQueryInputFocused}
            onKeyDown={e => {
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
            }}
          />
        </div>
        <div
          style={{
            paddingTop: '10px',
            // We need to occupy the space to prevent breaking based on the
            // spinners visibility
            visibility: hasSpinner ? '' : 'hidden'
          }}>
          <Spinner style={{ display: 'inline-block' }} />
        </div>
        <div className="f36-margin-left--s" />
        <div
          className={classNames('search-next__filter-toggle', {
            '-active': isSuggestionOpen,
            '-focus': searchBoxHasFocus
          })}
          onClick={() => actions.ToggleSuggestions()}>
          <div
            style={{
              alignSelf: 'flex-start',
              height: '38px',
              display: 'flex',
              alignItems: 'center'
            }}>
            <div style={{ marginTop: '-3px' }}>
              <FilterIcon />
            </div>
            <div className="f36-margin-left--s" />
            Filter
          </div>
        </div>
      </LegacyHook>
      {isSuggestionOpen &&
        (defaultFocus.suggestionsFocusIndex >= 0 || defaultFocus.isQueryInputFocused) && (
          <SuggestionsBox
            items={suggestions}
            searchTerm={input}
            defaultFocus={defaultFocus}
            onSelect={key => {
              actions.SelectFilterSuggestions(key);
            }}
            onKeyDown={e => {
              if (Keys.arrowUp(e) || Keys.shiftTab(e)) {
                actions.SetFocusOnPrevSuggestion();
              } else if (Keys.arrowDown(e) || Keys.tab(e)) {
                actions.SetFocusOnNextSuggestion();
              } else if (Keys.escape(e)) {
                actions.ToggleSuggestions();
                actions.SetFocusOnQueryInput();
              }
            }}
          />
        )}
    </LegacyHook>
  );
}
