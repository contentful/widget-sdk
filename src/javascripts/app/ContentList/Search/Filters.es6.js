import { startsWith } from 'lodash';
import { makeCtor } from 'utils/TaggedValues';
import { assign, push, concat } from 'utils/Collections';

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
export function contentTypeFilter (availableContentTypes) {
  const ctOptions = availableContentTypes.map((ct) => [ct.sys.id, ct.name]);
  return {
    name: 'contentType',
    queryKey: 'content_type',
    valueInput: ValueInput.Select([['', 'Any']].concat(ctOptions))
  };
}


/**
 * Returns a list of filters that begin with the search string and
 * match the selected content type ID.
 *
 * @param {string} searchString
 *   Only return filters whose name includes this string
 * @param {string?} contentTypeID
 *   If given return only filters for fields on this content type.
 * @param {API.ContentType[]} availableContentTypes
 * @returns {Filter[]}
 */
export function getMatchingFilters (searchString, contentTypeId, availableContentTypes) {
  const filters = allFilters(availableContentTypes);

  const matchingFilters = filters.filter((filter) => {
    return startsWith(filter.name.toLowerCase(), searchString.toLowerCase());
  });

  if (contentTypeId) {
    // Remove all filters that do not apply to the given Content Type
    return matchingFilters.filter((field) => {
      if (field.queryKey === 'content_type') {
        return false;
      } else if (field.contentType) {
        return field.contentType.id === contentTypeId;
      } else {
        return true;
      }
    });
  } else {
    return matchingFilters;
  }
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
    queryKey: ['fields', ctField.apiName].join('.'),
    valueInput: ValueInput.Text(),
    contentType: {
      id: ct.sys.id,
      name: ct.name
    }
  };
}
