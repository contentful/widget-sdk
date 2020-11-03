import { useCallback, useMemo, useState } from 'react';
import { match } from 'utils/TaggedValues';
import {
  buildFilterFieldByQueryKey,
  FilterValueInputs as ValueInput,
  getContentTypeById,
  getFiltersFromQueryKey,
  getMatchingFilters,
  sanitizeSearchFilters,
} from 'core/services/ContentQuery';
import { cloneDeep, debounce } from 'lodash';
import { track } from 'analytics/Analytics';

export const useSearchContext = ({
  entityType,
  onUpdate,
  users,
  listViewContext,
  readableContentTypes,
  withMetadata,
}) => {
  const { getView, assignView } = listViewContext;
  const { searchFilters, contentTypeId, searchText: initialSearchText } = getView();
  const getSearchFilters = () => cloneDeep(getView().searchFilters || []);

  const [isTyping, setIsTyping] = useState(true);
  const [searchText, setSearch] = useState(initialSearchText);

  const [isSuggestionOpen, setIsSuggestionOpen] = useState(false);

  const hideSuggestions = () => setIsSuggestionOpen(false);
  const showSuggestions = () => setIsSuggestionOpen(true);
  const toggleSuggestions = () => setIsSuggestionOpen(!isSuggestionOpen);

  const withAssets = entityType === 'asset';

  const filters = useMemo(() => {
    const sanitizedFilters = sanitizeSearchFilters(
      searchFilters,
      readableContentTypes,
      contentTypeId,
      withAssets,
      withMetadata
    );

    return getFiltersFromQueryKey({
      users,
      contentTypes: readableContentTypes,
      searchFilters: sanitizedFilters,
      contentTypeId,
      withAssets,
      withMetadata,
    });
  }, [searchFilters, users, readableContentTypes, contentTypeId, withAssets, withMetadata]);

  const suggestions = useMemo(
    () =>
      getMatchingFilters(searchText, contentTypeId, readableContentTypes, withAssets, withMetadata),
    [searchText, contentTypeId, readableContentTypes, withAssets, withMetadata]
  );

  const setViewWithUpdate = useCallback(
    (key, value) => {
      assignView({ [key]: value }, onUpdate);
      setIsTyping(false);
    },
    [onUpdate, assignView]
  );

  const onSetSearchText = useCallback(
    (searchText) => {
      track('search:query_changed', { search_query: searchText });
      onUpdate({ ...getView(), searchText });
      setIsTyping(false);
    },
    [onUpdate, getView]
  );

  const debouncedSetSearchText = useCallback(debounce(onSetSearchText, 1000), [onSetSearchText]);

  const setSearchText = (input = '') => {
    const searchTextInput = input.trim();
    if (searchTextInput === searchText) {
      return;
    }
    setIsTyping(true);
    setSearch(searchTextInput);
    assignView({ searchText: searchTextInput });
    debouncedSetSearchText(searchTextInput);
    setIsSuggestionOpen(!!searchTextInput);
  };

  const setContentType = useCallback(
    (selectedContentTypeId) => setViewWithUpdate('contentTypeId', selectedContentTypeId),
    [setViewWithUpdate]
  );

  const setSearchFilters = useCallback(
    (updatedFilters) => setViewWithUpdate('searchFilters', updatedFilters),
    [setViewWithUpdate]
  );

  const removeFilter = (removedIndex) => {
    const updated = getSearchFilters();
    updated.splice(removedIndex, 1);
    setSearchFilters(updated);
  };

  const setFilterOperator = ([index, newOp]) => {
    const updated = getSearchFilters();
    updated[index][1] = newOp;
    setSearchFilters(updated);
  };

  const onSetFilterValue = useCallback(() => {
    onUpdate(getView());
    setIsTyping(false);
  }, [onUpdate, getView]);

  const debouncedSetFilterValue = useCallback(debounce(onSetFilterValue, 1000), [onSetFilterValue]);

  const setFilterValue = ([index, newValue]) => {
    setIsTyping(true);
    const updated = getSearchFilters();
    updated[index][2] = newValue;
    assignView({ searchFilters: updated });
    debouncedSetFilterValue();
  };

  const selectFilterSuggestion = (filter) => {
    let contentType;
    const view = { searchText: '' };
    if (filter.contentType) {
      view.contentTypeId = filter.contentType.id;
      contentType = getContentTypeById(readableContentTypes, filter.contentType.id);
    }

    const filterField = buildFilterFieldByQueryKey(
      contentType,
      filter.queryKey,
      withAssets,
      withMetadata
    );

    const value = tryGetValue(filterField);
    setSearch('');

    const updatedFilters = [
      ...getSearchFilters(),
      [filter.queryKey, filter.operators[0][0], value],
    ];
    assignView({ ...view, searchFilters: updatedFilters }, onUpdate);
    setIsSuggestionOpen(false);
  };

  const context = {
    suggestions,
    contentTypeId,
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
    setIsTyping,
  };

  return [context, actions];
};

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
