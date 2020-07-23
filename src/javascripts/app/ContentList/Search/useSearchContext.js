import { useState, useMemo, useCallback } from 'react';
import { match } from 'utils/TaggedValues';
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

const useSearchContext = ({
  entityType,
  onUpdate,
  getContentTypes,
  users,
  listViewContext,
  withMetadata,
}) => {
  const { getView, setViewKey, setViewAssigned } = listViewContext;
  const { searchFilters, contentTypeId, searchText: initialSearchText } = getView();

  const [isTyping, setIsTyping] = useState(false);
  const [searchText, setSearch] = useState(initialSearchText);
  const contentTypes = getContentTypes();

  const [isSuggestionOpen, setIsSuggestionOpen] = useState(false);

  const hideSuggestions = () => setIsSuggestionOpen(false);
  const showSuggestions = () => setIsSuggestionOpen(true);
  const toggleSuggestions = () => setIsSuggestionOpen(!isSuggestionOpen);

  const withAssets = entityType === 'asset';

  const sanitizedFilters = useMemo(
    () =>
      sanitizeSearchFilters(searchFilters, contentTypes, contentTypeId, withAssets, withMetadata),
    [searchFilters, contentTypes, contentTypeId, withAssets, withMetadata]
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

  const callbackSetView = useCallback(setViewKey, []);

  const setViewWithUpdate = useCallback(
    (key, value) => {
      callbackSetView(key, value, onUpdate);
      setIsTyping(false);
    },
    [onUpdate, callbackSetView]
  );

  const onSetSearchText = useCallback(
    (searchText) => {
      track('search:query_changed', { search_query: searchText });
      onUpdate({ searchText });
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
    setSearch(searchTextInput);
    setViewKey('searchText', searchTextInput);
    debouncedSetSearchText(searchTextInput);
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

  const onSetFilterValue = useCallback(() => {
    onUpdate();
    setIsTyping(false);
  }, [onUpdate]);

  const debouncedSetFilterValue = useCallback(debounce(onSetFilterValue, 1000), [onSetFilterValue]);

  const setFilterValue = ([index, newValue]) => {
    setIsTyping(true);
    const updated = cloneDeep(searchFilters);
    updated[index][2] = newValue;
    setViewKey('searchFilters', updated);
    debouncedSetFilterValue();
  };

  const selectFilterSuggestion = (filter) => {
    let contentType;
    if (filter.contentType) {
      setViewKey('contentTypeId', filter.contentType.id);
      contentType = getContentTypeById(contentTypes, filter.contentType.id);
    }

    const filterField = buildFilterFieldByQueryKey(
      contentType,
      filter.queryKey,
      withAssets,
      withMetadata
    );

    const value = tryGetValue(filterField);
    setSearch('');
    const updatedFilters = [...searchFilters, [filter.queryKey, filter.operators[0][0], value]];
    setViewAssigned({ searchFilters: updatedFilters, searchText: '' });
    onUpdate();
    setIsSuggestionOpen(false);
  };

  const context = {
    suggestions,
    contentTypeId,
    contentTypeFilter,
    searchText,
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
