import { startsWith, find } from 'lodash';
import { makeCtor } from 'utils/TaggedValues';
import { assign, push, concat } from 'utils/Collections';

const CT_QUERY_KEY_PREFIX = 'fields';

/**
 * This module exports functions to construct field filters.
 *
 * If field filter describes how a filter interacts with the query API.
 * There is a filter for every field of every content type and there
 * are filters for entry metadata fields.
 *
 * A filter has the following properties
 * - name: string
 *   A user readable string. This value is displayed as the key in
 *   filter pills
 * - description: string
 *   A user readable string that gives information about this filter in
 *   the filter suggestion box
 * - queryKey: string
 *   If a list of filter values is translated to a query object we use
 *   this as the key in the query object.
 * - valueInput: ValueInput
 *   Describes the type of input used when displaying the filter input.
 *   See below for possible values
 * - contentType: { id: string, name: string }?
 *   If set, describes the content type of the field this filter
 *   filters. If null the filter applies to all content types.
 */


/**
 * Takes a list of [filter, operator, value] triples and a search
 * string and constructs a query object for the API.
 *
 * Handles the special `__status` key that translates to complicated
 * queries on `sys` fields.
 *
 * TODO: Find a better place for this. Write tests.
 */
export function makeCMAQueryObject ({contentTypeId, searchFilters, searchTerm}) {
  let queryObj = searchFilters.reduce((obj, [key, op, value]) => {
    if (key.queryKey === '__status') {
      if (value === 'published') {
        obj['sys.publishedAt[exists]'] = 'true';
        obj['sys.archivedAt[exists]'] = 'false';
      } else if (value === 'draft') {
        obj['sys.publishedAt[exists]'] = 'false';
        obj['sys.archivedAt[exists]'] = 'false';
      } else if (value === 'changed') {
        obj['sys.publishedAt[exists]'] = 'true';
        obj['sys.archivedAt[exists]'] = 'false';
        obj['changed'] = 'true';
      } else if (value === 'archived') {
        obj['sys.archivedAt[exists]'] = 'true';
      } else if (value === '' || value === null) {
        // Search for anything
      } else {
        throw new Error(`Unknown status value ${value}`);
      }
    } else {
      op = op ? `[${op}]` : '';
      obj[key.queryKey + op] = value;
    }
    return obj;
  }, {});

  if (contentTypeId) {
    queryObj.content_type = contentTypeId;
  }

  searchTerm = searchTerm.trim();
  if (searchTerm) {
    queryObj = assign(queryObj, { query: searchTerm });
  }

  return queryObj;
}

/**
 * Input types for filter values.
 *
 * We render each value input differently. See './View' for details.
 */
export const ValueInput = {
  // Select box. Call the constructor with a list of [value, label] pairs
  Select: makeCtor(),
  // A simple text input
  Text: makeCtor()
};


// The generic filters applicable to all content types
const sysFieldFilters = [
  ['updatedAt', 'Time the item was last changed'],
  ['updatedBy'],
  ['createdAt'],
  ['createdBy'],
  ['publishedAt'],
  ['publishedBy'],
  ['id']
].map(([name, desc]) => {
  return {
    name: name,
    description: desc,
    queryKey: `sys.${name}`,
    valueInput: ValueInput.Text(),
    contentType: null
  };
}).concat([{
  name: 'status',
  queryKey: '__status',
  valueInput: ValueInput.Select([
    ['', 'Any'],
    ['published', 'Published'],
    ['changed', 'Changed'],
    ['draft', 'Draft'],
    ['archived', 'Archived']
  ])
}]);


/**
 * Create the filter for the contentType field of an entry.
 *
 * Takes a list of available content types as an argument. This is used
 * to contstruct the available options to select from.
 */
export function contentTypeFilter (contentTypes) {
  return {
    name: 'contentType',
    queryKey: 'content_type',
    valueInput: ValueInput.Select([
      ['', 'Any'],
      ...contentTypes.map((ct) => [ct.sys.id, ct.name])
    ])
  };
}

/**
 *
 * @param {API.ContentType[]} contentTypes List of content types
 * @param {string} contentTypeId ContentType id
 * 
 * @returns {API.ContentType?}
 */
export function getContentTypeById (contentTypes, contentTypeId) {
  return find(contentTypes, ct => ct.sys.id === contentTypeId);
}

export function getFiltersFromQueryKey (contentTypes, searchFilters, contentTypeId) {
  const contentType = getContentTypeById(contentTypes, contentTypeId);

  const filters = searchFilters.map(([queryKey, op, value]) => {
    return [buildFilterFieldByQueryKey(contentType, queryKey), op, value];
  });

  return filters;
}

/**
 * Returns a field filter for given queryKey from
 * the fields of provided Content Type or sys field filters.
 *
 * @param {API.ContentType?} contentType
 * @param {string} queryKey
 *
 * @returns {FieldFilter}
 */
export function buildFilterFieldByQueryKey (contentType, queryKey) {
  if (isContentTypeField(queryKey)) {
    const field = getFieldByApiName(contentType, getApiName(queryKey));
    return buildFilterField(contentType, field);
  } else {
    return find(sysFieldFilters, filter => filter.queryKey === queryKey);
  }
}

/**
 * Checks if provided queryKey is applicable to the ContentType.
 * 
 * @param {API.ContentType} contentType 
 * @param {string} queryKey 
 * 
 * @returns {boolean}
 */
export function isFieldFilterApplicableToContentType(contentType, queryKey) {
  if (isContentTypeField(queryKey)) { 
    const field = getFieldByApiName(contentType, getApiName(queryKey));

    return field !== undefined;
  } else {
    return true;
  }
}

/**
 * Returns a list of filters that begin with the search string and
 * match the selected content type ID or
 * a list of all filters if there was no match by name.
 *
 * @param {string} searchString
 *   Only return filters whose name starts with this string
 * @param {string?} contentTypeID
 *   If given return only filters for fields on this content type.
 * @param {API.ContentType[]} availableContentTypes
 * @returns {Filter[]}
 */
export function getMatchingFilters (searchString, contentTypeId, availableContentTypes) {
  const filters = allFilters(availableContentTypes);

  let matchingFilters = filterByName(filters, searchString);
  matchingFilters = filterByContentType(matchingFilters, contentTypeId);

  return matchingFilters.length > 0 ? matchingFilters : filters;
}

function filterByName (filters, searchString = '') {
  searchString = searchString.toLowerCase();

  return filters.filter((filter) => {
    return startsWith(filter.name.toLowerCase(), searchString);
  });
}

function filterByContentType (filters, contentTypeId) {
  if (contentTypeId) {
    // Remove all filters that do not apply to the given Content Type
    return filters.filter((field) => {
      if (field.contentType) {
        return field.contentType.id === contentTypeId;
      } else {
        return true;
      }
    });
  } else {
    return filters;
  }
}

function isContentTypeField (queryKey) {
  const [prefix, apiName] = queryKey.split('.');

  return prefix === CT_QUERY_KEY_PREFIX;
}

function getApiName (queryKey) {
  const [, apiName] = queryKey.split('.');
  return apiName;
}

function getFieldByApiName (contentType, apiName) {
  return find(contentType.fields, field => field.apiName === apiName);
}

/**
 * Returns a list of all filters.
 *
 * This list consists of
 * - The contentType filter
 * - Filters for sys fields common to each content type
 * - A filter for each field of the given content types
 */
function allFilters (contentTypes) {
  const ctFieldFilters = contentTypes.reduce((filters, ct) => {
    return ct.fields.reduce((filters, ctField) => {
      return push(filters, buildFilterField(ct, ctField));
    }, filters);
  }, []);

  const fields = concat(
    ctFieldFilters,
    sysFieldFilters
  );

  return fields;
}

/**
 * Given a content type and a content type field return the filter for
 * that field.
 */
function buildFilterField (ct, ctField) {
  return {
    name: ctField.apiName,
    description: ctField.name,
    queryKey: `${CT_QUERY_KEY_PREFIX}.${ctField.apiName}`,
    valueInput: getControlByType(ctField.type),
    contentType: {
      id: ct.sys.id,
      name: ct.name
    }
  };
}

// TODO: implement control type resolution
function getControlByType (_type) {
  return ValueInput.Text();
}
