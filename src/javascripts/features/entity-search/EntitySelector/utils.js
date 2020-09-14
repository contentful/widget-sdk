function getValidContentTypes(linkedContentTypeIds, contentTypes) {
  const acceptsOnlySpecificContentType =
    Array.isArray(linkedContentTypeIds) && linkedContentTypeIds.length > 0;

  if (acceptsOnlySpecificContentType) {
    return contentTypes.filter((ct) => linkedContentTypeIds.includes(ct.sys.id));
  }

  return contentTypes;
}

function getOrder(publishedCTs, singleContentTypeId) {
  const ct = singleContentTypeId && publishedCTs.get(singleContentTypeId);
  if (ct) {
    const displayField = ct.data.fields.find(({ id }) => id === ct.data.displayField);
    if (displayField && displayField.type === 'Symbol' && displayField.id) {
      return {
        order: {
          fieldId: displayField.id,
          direction: 'ascending',
        },
      };
    }
  }
  return {};
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

export { getValidContentTypes, isSearchUsed, getOrder };
