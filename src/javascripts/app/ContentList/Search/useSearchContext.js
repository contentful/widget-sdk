import { useState, useEffect, useMemo, useCallback } from 'react';
import { match } from 'utils/TaggedValues';
import { getModule } from 'core/NgRegistry';
import {
  contentTypeFilter as getContentTypeFilter,
  sanitizeSearchFilters,
  getFiltersFromQueryKey,
  getMatchingFilters,
  getContentTypeById,
  buildFilterFieldByQueryKey,
} from './Filters';
import ValueInput from './FilterValueInputs';
import { cloneDeep, debounce } from 'lodash';
import { track } from 'analytics/Analytics';
import { getCurrentSpaceFeature } from 'data/CMA/ProductCatalog';
import { PC_CONTENT_TAGS } from 'featureFlags';

const useSearchContext = ({ entityType, onUpdate, view, setView, getContentTypes }) => {
  const [users, setUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [withMetadata, setWithMetadata] = useState(false);

  const [isSuggestionOpen, setIsSuggestionOpen] = useState(false);
  const hideSuggestions = () => setIsSuggestionOpen(false);
  const showSuggestions = () => setIsSuggestionOpen(true);
  const toggleSuggestions = () => setIsSuggestionOpen(!isSuggestionOpen);

  const contentTypes = getContentTypes();

  const spaceContext = useMemo(() => getModule('spaceContext'), []);
  useEffect(() => {
    const init = async () => {
      const result = await spaceContext.users.getAll();
      setUsers(result);
      const withMetadata = await getCurrentSpaceFeature(PC_CONTENT_TAGS, false);
      setWithMetadata(withMetadata);
    };
    init();
  }, [spaceContext]);

  const hasLoaded = users.length > 0;
  const withAssets = entityType === 'asset';
  const { searchFilters = [], contentTypeId = '', searchText = '' } = view;

  const sanitizedFilters = useMemo(
    () => sanitizeSearchFilters(searchFilters, contentTypes, contentTypeId, withAssets),
    [searchFilters, contentTypes, contentTypeId, withAssets]
  );

  const filters = useMemo(
    () =>
      getFiltersFromQueryKey({
        users,
        contentTypes,
        searchFilters: sanitizedFilters,
        contentTypeId,
        withAssets,
        withMetadata,
      }),
    [users, contentTypes, sanitizedFilters, contentTypeId, withAssets, withMetadata]
  );

  const suggestions = useMemo(
    () => getMatchingFilters(searchText, contentTypeId, contentTypes, withAssets, withMetadata),
    [searchText, contentTypeId, contentTypes, withAssets, withMetadata]
  );

  const contentTypeFilter = useMemo(() => getContentTypeFilter(contentTypes), [contentTypes]);

  const callbackSetView = useCallback(setView, []);

  const setViewWithUpdate = useCallback(
    (key, value) => {
      callbackSetView(key, value, onUpdate);
      setIsTyping(false);
    },
    [onUpdate, callbackSetView]
  );

  const onSetSearchText = useCallback(
    (view) => {
      track('search:query_changed', { search_query: view.searchText });
      onUpdate(view);
      setIsTyping(false);
    },
    [onUpdate]
  );

  const debouncedSetSearchText = useCallback(debounce(onSetSearchText, 1000), [onSetSearchText]);

  const setSearchText = (input = '') => {
    const searchTextInput = input.trim();
    if (searchTextInput === searchText) {
      return;
    }
    setIsTyping(true);
    setView('searchText', searchTextInput, debouncedSetSearchText);
    setIsSuggestionOpen(!!searchTextInput);
  };

  const setContentType = (selectedContentTypeId) =>
    setViewWithUpdate('contentTypeId', selectedContentTypeId);

  const setSearchFilters = useCallback(
    (updatedFilters) => setViewWithUpdate('searchFilters', updatedFilters),
    [setViewWithUpdate]
  );

  const removeFilter = (removedIndex) => {
    const updated = cloneDeep(searchFilters);
    updated.splice(removedIndex, 1);
    setSearchFilters(updated);
  };

  const setFilterOperator = ([index, newOp]) => {
    const updated = cloneDeep(searchFilters);
    updated[index][1] = newOp;
    setSearchFilters(updated);
  };

  const onSetFilterValue = useCallback(
    (view) => {
      onUpdate(view);
      setIsTyping(false);
    },
    [onUpdate]
  );

  const debouncedSetFilterValue = useCallback(debounce(onSetFilterValue, 1000), [onSetFilterValue]);

  const setFilterValue = ([index, newValue]) => {
    setIsTyping(true);
    const updated = cloneDeep(searchFilters);
    updated[index][2] = newValue;
    setView('searchFilters', updated, debouncedSetFilterValue);
  };

  const selectFilterSuggestion = (filter) => {
    let contentType;
    if (filter.contentType) {
      setView('contentTypeId', filter.contentType.id);
      contentType = getContentTypeById(contentTypes, filter.contentType.id);
    }

    const filterField = buildFilterFieldByQueryKey(
      contentType,
      filter.queryKey,
      withAssets,
      withMetadata
    );

    const value = tryGetValue(filterField);
    const updatedFilters = [...searchFilters, [filter.queryKey, filter.operators[0][0], value]];
    setView('searchFilters', updatedFilters);
    setView('searchText', '', onUpdate);
    setIsSuggestionOpen(false);
  };

  const context = {
    hasLoaded,
    suggestions,
    contentTypeId,
    contentTypeFilter,
    searchText: searchText || '',
    filters,
    isTyping,
    isSuggestionOpen,
  };

  const actions = {
    setSearchText,
    setContentType,
    removeFilter,
    setFilterOperator,
    setFilterValue,
    selectFilterSuggestion,
    hideSuggestions,
    showSuggestions,
    toggleSuggestions,
  };

  return [context, actions];
};

export default useSearchContext;

function tryGetValue(filterField) {
  let value;
  match(filterField.valueInput, {
    [ValueInput.Select]: (options) => {
      if (options.length === 1) {
        value = options[0][1];
      } else if (filterField.type === 'Boolean') {
        value = options[0][0];
      }
    },
    _: () => {
      value = undefined;
    },
  });

  return value;
}
