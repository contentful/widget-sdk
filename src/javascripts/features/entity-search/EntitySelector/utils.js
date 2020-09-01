function getValidContentTypes(linkedContentTypeIds, contentTypes) {
  const acceptsOnlySpecificContentType =
    Array.isArray(linkedContentTypeIds) && linkedContentTypeIds.length > 0;

  if (acceptsOnlySpecificContentType) {
    return contentTypes.filter((ct) => linkedContentTypeIds.includes(ct.sys.id));
  }

  return contentTypes;
}

const isSearchUsed = (searchState) => {
  if (!searchState) {
    return false;
  }

  const { searchFilters, contentTypeId, searchText } = searchState;

  if (searchFilters?.length) {
    return true;
  }

  return !!(contentTypeId || searchText);
};

export { getValidContentTypes, isSearchUsed };
