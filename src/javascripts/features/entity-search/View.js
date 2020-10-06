import React, { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { css } from 'emotion';
import { Icon, Spinner, TextInput } from '@contentful/forma-36-react-components';
import { Keys } from './Keys';
import tokens from '@contentful/forma-36-tokens';
import { ReadTagsProvider, TagsRepoProvider, useTagsFeatureEnabled } from 'features/content-tags';
import createUserCache from 'data/userCache';
import { createSpaceEndpoint } from 'data/EndpointFactory';

import cn from 'classnames';
import { FilterPill } from './FilterPill';
import { SuggestionsBox } from './SuggestionsBox';
import pluralize from 'pluralize';

import { track as analyticsTrack } from 'analytics/Analytics';
import { useFocus } from './useFocus';
import { useSearchContext } from './useSearchContext';
import noop from 'lodash/noop';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { contentTypeFilter as getContentTypeFilter } from 'core/services/ContentQuery';
import { useAsync } from 'core/hooks';

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
          isFocused: defaultFocus.pillIndex === index && !defaultFocus.isOnPillValue,
          isValueFocused: defaultFocus.pillIndex === index && defaultFocus.isOnPillValue,
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

function ContentTypeFilterPill({ contentTypeId, setContentType, readableContentTypes }) {
  const contentTypeFilter = useMemo(() => getContentTypeFilter(readableContentTypes), [
    readableContentTypes,
  ]);

  return (
    <FilterPill
      value={contentTypeId}
      testId="contentTypeFilter"
      isRemovable={false}
      filter={contentTypeFilter}
      onChange={setContentType}
    />
  );
}

ContentTypeFilterPill.propTypes = {
  contentTypeId: PropTypes.string,
  readableContentTypes: PropTypes.array.isRequired,
  setContentType: PropTypes.func.isRequired,
};

const focus = {
  outline: 'none',
  borderColor: tokens.colorBlueMid,
  height: 'auto',
  overflow: 'visible',
};

const styles = {
  wrapper: css({
    height: '40px',
    width: '100%',
    position: 'relative',
  }),
  inputWrapper: css({
    paddingLeft: tokens.spacingXs,
    display: 'flex',
    background: tokens.colorWhite,
    border: '1px solid transparent',
    borderColor: tokens.colorElementMid,
    height: '38px',
    overflow: 'hidden',
    '&:focus-within, &:focus': focus,
  }),
  focused: css(focus),
  input: css({
    flex: '1 1 auto',
    width: 'auto',
    height: '30px',
    '& > input': {
      padding: 0,
      border: 'none !important',
      boxShadow: 'none !important',
    },
  }),
  pillsInput: css({
    transition: 'padding 0.1s ease-in-out',
    display: 'flex',
    alignItems: 'center',
    flex: '1 1 auto',
    flexWrap: 'wrap',
  }),
  centerTop: css({
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    '& > svg': {
      marginRight: tokens.spacingS,
    },
  }),
  hidden: css({
    visibility: 'hidden',
  }),
  filterWrapper: css({
    cursor: 'pointer',
    padding: '0 14px',
    fontSize: tokens.fontSizeS,
    color: tokens.colorBlueMid,
    borderLeft: '1px solid transparent',
    '&:hover': {
      backgroundColor: tokens.colorElementLightest,
    },
  }),
  filterActive: css({
    borderColor: tokens.colorBlueMid,
  }),
};

export function Search(props) {
  const { tagsEnabled: withMetadata } = useTagsFeatureEnabled();
  return (
    <TagsRepoProvider>
      <ReadTagsProvider>
        <View withMetadata={withMetadata} {...props} />
      </ReadTagsProvider>
    </TagsRepoProvider>
  );
}

function View({
  className,
  isLoading,
  listViewContext,
  onUpdate,
  entityType,
  readableContentTypes,
  withMetadata,
}) {
  const { currentSpaceId, currentEnvironmentId } = useSpaceEnvContext();
  const [users, setUsers] = useState([]);

  const [
    { contentTypeId, filters, isSuggestionOpen, isTyping, suggestions, searchText },
    {
      hideSuggestions,
      removeFilter,
      selectFilterSuggestion,
      setContentType,
      setFilterOperator,
      setFilterValue,
      setSearchText,
      showSuggestions,
      toggleSuggestions,
      setIsTyping,
    },
  ] = useSearchContext({
    entityType,
    onUpdate,
    listViewContext,
    readableContentTypes,
    users,
    withMetadata,
  });

  const [
    { focus, inputRef },
    {
      resetFocus,
      setFocusOnFirstSuggestion,
      setFocusOnLastPill,
      setFocusOnLastPillValue,
      setFocusOnNextSuggestion,
      setFocusOnPill,
      setFocusOnPillValue,
      setFocusOnPrevSuggestion,
      setFocusOnQueryInput,
    },
  ] = useFocus({ suggestions, filters });

  const { data: allUsers } = useAsync(
    useCallback(async () => {
      const spaceEndpoint = createSpaceEndpoint(currentSpaceId, currentEnvironmentId);
      const userClient = createUserCache(spaceEndpoint);
      return await userClient.getAll();
    }, [currentSpaceId, currentEnvironmentId])
  );

  useEffect(() => {
    setUsers(allUsers || []);
    setIsTyping(false);
  }, [setUsers, setIsTyping, allUsers]);

  const hideSpinner = !isLoading && !isTyping;

  return (
    <div className={cn(styles.wrapper, className)}>
      <div
        className={classNames(styles.inputWrapper, {
          [styles.focused]: isSuggestionOpen,
        })}
        onClick={setFocusOnQueryInput}>
        <div className={styles.pillsInput}>
          {entityType === 'entry' && (
            <ContentTypeFilterPill
              contentTypeId={contentTypeId}
              readableContentTypes={readableContentTypes}
              setContentType={setContentType}
            />
          )}
          <PillsList
            filters={filters}
            defaultFocus={focus}
            onChange={({ index, value }) => {
              // Keep the focus on the search box after setting a pill value
              // with a dialog/anyway that loses searchbox focus.
              setFocusOnPillValue(index);
              setFilterValue([index, value]);
            }}
            onOperatorChange={({ index, value }) => {
              setFilterOperator([index, value]);
            }}
            onRemove={({ index }) => {
              removeFilter(index);
              resetFocus();
              setFocusOnQueryInput();
            }}
            onRemoveAttempt={({ index }) => setFocusOnPill(index)}
          />
          <TextInput
            testId="queryInput"
            inputRef={inputRef}
            className={styles.input}
            placeholder={`Type to search for ${pluralize(entityType)}`}
            value={searchText}
            autoComplete="off"
            onChange={(evt) => {
              evt.stopPropagation();
              resetFocus();
              setSearchText(evt.target.value);
            }}
            onClick={() => {
              hideSuggestions();
              resetFocus();
            }}
            autoFocus
            onKeyUp={(evt) => {
              if (Keys.escape(evt) && isSuggestionOpen) {
                evt.stopPropagation();
                hideSuggestions();
              }
            }}
            onKeyDown={(evt) => {
              const { target } = evt;
              evt.stopPropagation();
              const hasSelection = target.selectionStart !== 0 || target.selectionEnd !== 0;
              if (Keys.backspace(evt) && !hasSelection) {
                setFocusOnLastPill();
              } else if (Keys.arrowDown(evt)) {
                setFocusOnFirstSuggestion();
                showSuggestions();
              } else if (Keys.enter(evt)) {
                hideSuggestions();
              }
            }}
          />
        </div>
        <div className={classNames(styles.centerTop, { [styles.hidden]: hideSpinner })}>
          <Spinner />
        </div>
        <div
          className={classNames(styles.filterWrapper, {
            [styles.filterActive]: isSuggestionOpen,
          })}
          onClick={(e) => {
            // otherwise, it triggered setFocusOnQueryInput as onClick in the parent div
            // and that reset focus back to input when Filter button was clicked
            e.stopPropagation();
            toggleSuggestions();
            resetFocus();
          }}>
          <div className={styles.centerTop}>
            <Icon icon="Filter" />
            Filter
          </div>
        </div>
      </div>
      {isSuggestionOpen && (
        <SuggestionsBox
          items={suggestions}
          searchTerm={searchText}
          defaultFocus={focus}
          hideSuggestions={hideSuggestions}
          selectedSuggestion={focus.suggestionIndex}
          onSelect={(field) => {
            selectFilterSuggestion(field);
            setFocusOnLastPillValue();
          }}
          onKeyUp={(evt) => {
            if (Keys.escape(evt)) {
              evt.stopPropagation();
              hideSuggestions();
              setFocusOnQueryInput();
            }
          }}
          onKeyDown={(evt) => {
            if (Keys.arrowUp(evt) || Keys.shiftTab(evt)) {
              setFocusOnPrevSuggestion();
            } else if (Keys.arrowDown(evt) || Keys.tab(evt)) {
              setFocusOnNextSuggestion();
            }
          }}
        />
      )}
    </div>
  );
}

View.propTypes = {
  className: PropTypes.string,
  readableContentTypes: PropTypes.array.isRequired,
  entityType: PropTypes.oneOf(['entry', 'asset']).isRequired,
  isLoading: PropTypes.bool,
  withMetadata: PropTypes.bool.isRequired,
  onUpdate: PropTypes.func.isRequired,
  listViewContext: PropTypes.shape({
    getView: PropTypes.func.isRequired,
    setView: PropTypes.func.isRequired,
  }).isRequired,
};

View.defaultProps = {
  withMetadata: false,
  onUpdate: noop,
};
