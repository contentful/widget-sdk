import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { noop, memoize, uniqBy } from 'lodash';
import { cx } from 'emotion';
import EntryLink from 'app/widgets/link/EntryLink';
import AssetLink from 'app/widgets/link/AssetLink';
import { newForLocale } from 'app/entity_editor/entityHelpers';
import { Paragraph, TextLink, Note } from '@contentful/forma-36-react-components';
import { useEntityLoader } from './useEntityLoader';
import { useSelection } from './useSelection';
import { useScrollToBottomTrigger } from './useScrollToBottomTrigger';
import { Wrapper } from './Wrapper';
import { isSearchUsed, getValidContentTypes, getOrder } from './utils';
import { CreateEntity } from './CreateEntity';
import { getReadableContentTypes } from 'data/ContentTypeRepo/filter';
import { Search } from '../View';
import { useListView } from '../useListView';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';

/*
  The core of this component was split into 3 hooks:

  useLoader - handles the loading, handling errors
  useSelection - handles toggling, selection
  useScrollToBottomTrigger - handles the loadMore as a result of reaching the bottom of the viewport

  useSelection
    has an array of selection

  useScrollToBottomTrigger
    triggers a loadMore call for the current state (search or not search)

  The state is split in two for sanity - state and search.
  State contains loaded entities, that were not affected by search or filters
  Search state contains the loaded entities, as a result of search or filters

  Although they can contain duplicates, the logic of the component became
  more straightforward. Eventually both are joined into a selection map, avoiding duplication
*/
export const EntitySelectorForm = ({
  labels,
  onChange,
  locale,
  withCreate,
  multiple,
  entityType,
  linkedContentTypeIds,
  fetch,
}) => {
  const { currentSpaceContentTypes } = useSpaceEnvContext();

  const singleContentTypeId =
    Array.isArray(linkedContentTypeIds) && linkedContentTypeIds.length === 1
      ? linkedContentTypeIds[0]
      : null;

  const [showingSelected, setShowSelected] = useState(false);
  const [state, setState] = useState({
    entities: [],
    hasMore: false,
  });
  const [search, setSearch] = useState({
    state: {
      ...getOrder(currentSpaceContentTypes, singleContentTypeId),
    },
    searchResult: {
      entities: [],
      hasMore: false,
    },
  });
  const entitySelectorRef = useRef();

  const listViewContext = useListView({
    entityType,
    initialState: search.state,
    isPersisted: false,
  });

  // if at least one property is not empty, then some filter or query is present
  const isSearching = isSearchUsed(search.state);
  const hasMore = isSearching ? search.searchResult.hasMore : state.hasMore;
  const entities = isSearching ? search.searchResult.entities : state.entities;
  const helpers = useMemo(() => newForLocale(locale), [locale]);
  // Returns a promise for the content type of the given entry.
  // We cache this by the entry id
  const getContentType = memoize(
    (entity) => currentSpaceContentTypes.find((ct) => ct.sys.id === entity.sys.contentType.sys.id),
    (entity) => entity.sys.id
  );

  let createEntityProps;
  let createEntityInlineProps;

  if (withCreate) {
    createEntityProps = {
      contentTypes: getValidContentTypes(linkedContentTypeIds, currentSpaceContentTypes),
      suggestedContentTypeId: search.state.contentTypeId,
      onSelect: (entity) => onChange([entity]),
      type: entityType,
    };

    createEntityInlineProps = { ...createEntityProps, hasPlusIcon: false };
  }

  // hooks
  const [{ isLoading, error }, load] = useEntityLoader({
    entityType,
    fetch,
    contentTypeId: singleContentTypeId,
    contentTypes: currentSpaceContentTypes,
  });

  const { lastToggledIndex, selectedEntities, isSelected, toggle } = useSelection({
    multipleSelection: multiple,
  });

  useEffect(() => {
    async function loadData() {
      const { data: loadedEntities, hasMore } = await load();
      setState({
        entities: loadedEntities,
        hasMore,
      });
    }
    loadData();
  }, [load]);

  const loadMore = useCallback(
    async (isSearching) => {
      if (isLoading) {
        return;
      }
      const params = { more: true };
      if (isSearching) {
        Object.assign(params, { search: search.state });
      }
      const { data: batchOfEntities, hasMore } = await load(params);
      const checkedIds = entities.map((entity) => entity.sys.id);
      const itemsToKeep = batchOfEntities.reduce((acc, item) => {
        const id = item?.sys.id;
        const isAssetWithoutFile = item?.sys.type === 'Asset' && !item?.fields.file;
        if (!checkedIds.includes(id) && !isAssetWithoutFile) {
          checkedIds.push(id);
          return acc.concat(item);
        }
        return acc;
      }, []);

      const itemsCombined = [...entities, ...itemsToKeep];

      if (isSearching) {
        setSearch((currentSearch) => ({
          ...currentSearch,
          searchResult: {
            entities: itemsCombined,
            hasMore,
          },
        }));
      } else {
        setState({
          entities: itemsCombined,
          hasMore,
        });
      }
    },
    [isLoading, load, entities, search]
  );

  const onBottomHit = useCallback(() => {
    if (!showingSelected && !isLoading && hasMore) {
      loadMore(isSearching);
    }
  }, [isLoading, loadMore, showingSelected, isSearching, hasMore]);

  useScrollToBottomTrigger({
    target: entitySelectorRef.current,
    handler: onBottomHit,
  });

  const onUpdate = useCallback(
    async (searchState) => {
      // no need to fetch anything since search is empty
      if (!isSearchUsed(searchState)) {
        setSearch({
          state: searchState,
          searchResult: {
            entities: [],
            hasMore: false,
          },
        });
        return;
      }

      const { data: loadedBatch, hasMore } = await load({ reset: true, search: searchState });
      setSearch({
        state: searchState,
        searchResult: {
          entities: loadedBatch,
          hasMore,
        },
      });
    },
    [load]
  );

  useEffect(() => {
    const status = error?.status;
    const isInvalidQuery = status === 400 || status === 422;
    const isForbiddenQuery = status === 403 || status === 404;
    if (isInvalidQuery || isForbiddenQuery) {
      const reset = async () => {
        const { data: entities, hasMore } = await load({ reset: true, retry: true });
        const result = { entities, hasMore };
        setState(result);
        setSearch(({ state }) => ({
          state: { ...state, contentTypeId: null },
          searchResult: result,
        }));
      };
      reset();
    }
  }, [error, load]);

  const readableContentTypes = useMemo(() => {
    const accessibleContentTypes = getReadableContentTypes(
      currentSpaceContentTypes,
      singleContentTypeId
    );
    return getValidContentTypes(linkedContentTypeIds, accessibleContentTypes);
  }, [linkedContentTypeIds, singleContentTypeId, currentSpaceContentTypes]);

  // TODO: refactor in follow up
  const renderEntities = (entities) => {
    const onSelect = (entity, entityIndex) => (event) => {
      event.preventDefault();
      let affectedEntities;
      if (multiple && event.shiftKey) {
        const from = entityIndex;
        const to = lastToggledIndex;
        const first = Math.min(from, to);
        const last = Math.max(from, to) + 1;
        affectedEntities = toggle(entities.slice(first, last), entityIndex);
      } else {
        affectedEntities = toggle(entity, entityIndex);
      }
      setState((state) => ({
        ...state,
        entities: uniqBy(state.entities.concat(affectedEntities), 'sys.id'),
      }));
      onChange(affectedEntities);
    };

    const renderEntityLink = (entity, entityIndex) => {
      if (entityType === 'Entry') {
        return (
          <EntryLink
            entry={entity}
            entityHelpers={helpers}
            isSelected={isSelected(entity)}
            getContentType={getContentType}
            onClick={onSelect(entity, entityIndex)}
          />
        );
      } else if (entityType === 'Asset') {
        return (
          <AssetLink
            onClick={onSelect(entity, entityIndex)}
            asset={entity}
            isSelected={isSelected(entity)}
            entityHelpers={helpers}
          />
        );
      }
      return null;
    };

    return entities.map((entity, i) => {
      const isLast = showingSelected
        ? i === entities.length - 1
        : i === entities.length - 1 && !hasMore;
      return (
        <Wrapper
          key={entity.sys.id}
          isLast={isLast}
          entityType={entityType}
          showSelected={showingSelected}>
          {renderEntityLink(entity, i)}
        </Wrapper>
      );
    });
  };

  const renderEmptyStateMessage = () => {
    const shouldDisplayEmptyMessage = showingSelected
      ? selectedEntities.length < 1
      : !isLoading && entities.length < 1;

    if (!shouldDisplayEmptyMessage) {
      return null;
    }

    if (showingSelected) {
      return (
        <div className="entity-selector__item-list-placeholder">{labels.empty} selected yet</div>
      );
    }

    return (
      <div className="entity-selector__item-list-placeholder">
        {labels.empty} found.
        {withCreate ? (
          <span>
            <CreateEntity {...createEntityInlineProps} />
          </span>
        ) : null}
      </div>
    );
  };

  return (
    <div className="entity-selector">
      <div className="entity-selector__input-label">
        {labels.input ? <Paragraph>{labels.input}</Paragraph> : null}
        {withCreate ? (
          <Paragraph className="entity-selector__mode-switcher">
            <CreateEntity {...createEntityProps} />
          </Paragraph>
        ) : null}
        {multiple ? (
          <Paragraph className="entity-selector__mode-switcher">
            {!showingSelected ? (
              <TextLink
                href={undefined}
                testId="show-selected"
                onClick={(event) => {
                  event.preventDefault();
                  setShowSelected(true);
                }}>
                Show {labels.selected} ({selectedEntities.length})
              </TextLink>
            ) : (
              <TextLink
                href={undefined}
                testId="hide-selected"
                onClick={(event) => {
                  event.preventDefault();
                  setShowSelected(false);
                }}>
                Hide {labels.selected} ({selectedEntities.length})
              </TextLink>
            )}
          </Paragraph>
        ) : null}
      </div>
      <div className="entity-selector__search">
        <Search
          entityType={entityType.toLowerCase()}
          isLoading={isLoading}
          onUpdate={onUpdate}
          readableContentTypes={readableContentTypes}
          listViewContext={listViewContext}
        />
      </div>
      <div
        className={cx('entity-selector__item-list', {
          'entity-selector__thumbnails': showingSelected
            ? !!selectedEntities.length
            : entityType === 'Asset',
          'entity-selector__item-list--empty': !showingSelected && !entities.length,
        })}
        data-test-id="entity-selector-list"
        ref={entitySelectorRef}>
        {renderEmptyStateMessage()}
        {showingSelected ? renderEntities(selectedEntities) : renderEntities(entities)}
      </div>
      {labels.info ? <Note noteType="primary">{labels.info}</Note> : null}
      {error ? <Note noteType="negative">{error.message || error.data.message}</Note> : null}
    </div>
  );
};

EntitySelectorForm.propTypes = {
  labels: PropTypes.shape({
    input: PropTypes.string.isRequired,
    info: PropTypes.string,
    selected: PropTypes.string,
    empty: PropTypes.string,
    insert: PropTypes.string,
    searchPlaceholder: PropTypes.string,
  }).isRequired,
  locale: PropTypes.string.isRequired,
  withCreate: PropTypes.bool,
  multiple: PropTypes.bool,
  entityType: PropTypes.oneOf(['Entry', 'Asset']).isRequired,
  linkedContentTypeIds: PropTypes.array,
  fetch: PropTypes.func.isRequired,
  onChange: PropTypes.func,
};

EntitySelectorForm.defaultProps = {
  onChange: noop,
  withCreate: false,
  multiple: false,
  linkedContentTypeIds: [],
};
