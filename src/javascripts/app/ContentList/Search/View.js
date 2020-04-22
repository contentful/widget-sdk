/* eslint "rulesdir/restrict-inline-styles": "warn" */
/* eslint-disable react/prop-types */
// TODO: add prop-types

import React, { useLayoutEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import { css } from 'emotion';
import { Spinner } from '@contentful/forma-36-react-components';

import Keys from './Keys';
import FilterIcon from 'svg/filter.svg';
import tokens from '@contentful/forma-36-tokens';

import FilterPill from './FilterPill';
import SuggestionsBox from './SuggestionsBox';
import QueryInput from './Components/QueryInput';

import { track as analyticsTrack } from 'analytics/Analytics';

const track = (e, data) => analyticsTrack('search:' + e, data);

function PillsList({
  filters,
  defaultFocus,
  onChange,
  onOperatorChange,
  onRemove,
  onRemoveAttempt,
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
          onChange: (value) => {
            track('filter_added', { filter: filter.name });
            onChange({ index, value });
          },
          onOperatorChange: (value) => onOperatorChange({ index, value }),
          onRemove: () => {
            track('filter_removed', { filter: filter.name });
            onRemove({ index });
          },
          onRemoveAttempt: () => onRemoveAttempt({ index }),
        }}
      />
    );
  });
}

const styles = {
  searchWrapper: css({
    marginLeft: tokens.spacingS,
  }),
  searchIconWrapper: css({
    marginTop: '-3px',
    marginRight: tokens.spacingS,
  }),
};

function PillsWrapper({ searchBoxHasFocus, actions, children }) {
  const [isOverflownY, setOverflownY] = useState(false);
  const el = useRef(null);

  // eslint-disable-next-line
  useLayoutEffect(() => {
    if (el.current) {
      // HACK: fixes the scroll position after selecting entity
      // in reference filter pill
      if (!searchBoxHasFocus) {
        el.current.scrollTop = 0;
      }
      if (el.current.scrollHeight > el.current.clientHeight) {
        setOverflownY(true);
      } else {
        setOverflownY(false);
      }
    }
  });

  return (
    <div
      className={classNames('search-next__pills-wrapper', {
        'search-next__pills-wrapper--state-active': searchBoxHasFocus,
        'is-overflown-y': isOverflownY,
      })}
      onClick={() => actions.SetFocusOnQueryInput()}
      onBlur={() => actions.ResetFocus()}
      ref={el}>
      {children}
    </div>
  );
}

function Wrapper({ actions, searchBoxHasFocus, children }) {
  const el = useRef(null);

  return (
    <div
      style={{
        height: '40px',
        width: '100%',
        position: 'relative',
      }}
      onFocus={() => {
        if (!searchBoxHasFocus) {
          actions.SetBoxFocus(true);
        }
      }}
      onBlur={(event) => {
        if (el.current) {
          const parent = el.current;
          // Related target is not defined in IE11 so we need to fallback to the activeElement
          const activeElement = event.relatedTarget || document.activeElement;

          const isChildFocused = parent !== activeElement && parent.contains(activeElement);

          if (!isChildFocused) {
            actions.SetBoxFocus(false);
          }
        }
      }}
      ref={el}>
      {children}
    </div>
  );
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
    hasLoaded,
  } = props;

  if (!hasLoaded) {
    return <div data-test-id="loader" />;
  }

  const hasFilters = filters.length > 0;
  const hasSpinner = isSearching || isTyping;
  const placeholder = hasFilters ? '' : 'Type to search for ' + (withAssets ? 'assets' : 'entries');
  const defaultFocus = props.focus;

  return (
    <Wrapper actions={actions} searchBoxHasFocus={searchBoxHasFocus}>
      <PillsWrapper actions={actions} searchBoxHasFocus={searchBoxHasFocus}>
        <div className="search-next__pills-list">
          {!withAssets && (
            <FilterPill
              value={contentTypeId}
              testId="contentTypeFilter"
              isRemovable={false}
              filter={contentTypeFilter}
              onChange={(value) => actions.SetContentType(value)}
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
            onChange={(value) => actions.SetQueryInput(value)}
            autoFocus={!input && !hasFilters}
            isFocused={defaultFocus.isQueryInputFocused}
            onKeyUp={(e) => {
              if (Keys.escape(e)) {
                if (isSuggestionOpen) {
                  e.stopPropagation();
                  actions.HideSuggestions();
                }
              }
            }}
            onKeyDown={(e) => {
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
              } else if (Keys.enter(e)) {
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
            visibility: hasSpinner ? '' : 'hidden',
          }}>
          <Spinner style={{ display: 'inline-block' }} />
        </div>
        <div
          className={classNames(styles.searchWrapper, 'search-next__filter-toggle', {
            '-active': isSuggestionOpen,
            '-focus': searchBoxHasFocus,
          })}
          onClick={() => actions.ToggleSuggestions()}>
          <div
            style={{
              alignSelf: 'flex-start',
              height: '38px',
              display: 'flex',
              alignItems: 'center',
            }}>
            <div className={styles.searchIconWrapper}>
              <FilterIcon />
            </div>
            Filter
          </div>
        </div>
      </PillsWrapper>
      {isSuggestionOpen &&
        (defaultFocus.suggestionsFocusIndex >= 0 || defaultFocus.isQueryInputFocused) && (
          <SuggestionsBox
            items={suggestions}
            searchTerm={input}
            defaultFocus={defaultFocus}
            onSelect={(key) => {
              actions.SelectFilterSuggestions(key);
            }}
            onKeyUp={(e) => {
              if (Keys.escape(e)) {
                e.stopPropagation();
                actions.ToggleSuggestions();
                actions.SetFocusOnQueryInput();
              }
            }}
            onKeyDown={(e) => {
              if (Keys.arrowUp(e) || Keys.shiftTab(e)) {
                actions.SetFocusOnPrevSuggestion();
              } else if (Keys.arrowDown(e) || Keys.tab(e)) {
                actions.SetFocusOnNextSuggestion();
              }
            }}
          />
        )}
    </Wrapper>
  );
}
