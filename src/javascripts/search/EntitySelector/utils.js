import { uniqBy } from 'lodash';

function getValidContentTypes(linkedContentTypeIds, contentTypes) {
  const acceptsOnlySpecificContentType =
    Array.isArray(linkedContentTypeIds) && linkedContentTypeIds.length > 0;

  if (acceptsOnlySpecificContentType) {
    return contentTypes.filter((ct) => linkedContentTypeIds.includes(ct.sys.id));
  }

  return contentTypes;
}

const toSelectionMap = (entities) =>
  entities.reduce((acc, entity) => ({ ...acc, [entity.sys.id]: false }), {});

const extendSelectionMap = (selectionMap, extensionMap) => {
  if (!selectionMap || !extensionMap) {
    return selectionMap;
  }

  return { ...extensionMap, ...selectionMap };
};

const selectionMapToEntities = (mapOfSelection, entities) => {
  const selectedIds = Object.entries(mapOfSelection)
    .filter(([_key, value]) => value === true)
    .map(([key]) => key);
  const uniqueSelectedIds = Array.from(new Set(selectedIds).values());
  const res = uniqBy(
    entities.filter((entity) => uniqueSelectedIds.includes(entity.sys.id)),
    'sys.id'
  );
  return res;
};

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

export {
  extendSelectionMap,
  getValidContentTypes,
  toSelectionMap,
  selectionMapToEntities,
  isSearchUsed,
};
