import { cloneDeep, startsWith, find, get, has, map } from 'lodash';
import { makeCtor } from 'utils/TaggedValues';
import { assign, push, concat } from 'utils/Collections';
import { getOperatorsByType, equality as equalityOperator } from './Operators';
import mimetype from 'mimetype';

const CT_QUERY_KEY_PREFIX = 'fields';

const SUPPORTED_CT_FIELD_TYPES = [
  'Symbol',
  'Text',
  'Integer',
  'Number',
  'Date',
  'Boolean',
  'Array',
  'Link'
];

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
 * - operators: [[string, string]]
 *   List of tuples with available operators (in CDA [format] or an empty
 *   string for equality) and their respective human readable labels.
 * - valueInput: ValueInput
 *   Describes the type of input used when displaying the filter input.
 *   See below for possible values
 * - contentType: { id: string, name: string }?
 *   If set, describes the content type of the field this filter
 *   filters. If null the filter applies to all content types.
 */

/**
 * Input types for filter values.
 *
 * We render each value input differently. See './View' for details.
 */
export const ValueInput = {
  // Select box. Call the constructor with a list of [value, label] pairs
  Select: makeCtor(),
  // A simple text input
  Text: makeCtor(),
  Reference: makeCtor(),
  Date: makeCtor(),
  AssetDetailsSize: makeCtor()
};

// The generic filters applicable to all content types
// TODO: Use "entry" and "asset" instead of "item".
const sysFieldFilters = [
  ['updatedAt', 'Date', 'Time an item was last changed'],
  ['createdAt', 'Date', 'Time an item was created'],
  ['publishedAt', 'Date', 'Time an item was last published'],
  ['firstPublishedAt', 'Date', 'Date an item was published for the very first time'],
  ['updatedBy', 'User', 'The user who last updated an item'],
  ['createdBy', 'User', 'The user who created an item'],
  ['publishedBy', 'User', 'The user who last published an item'],
  ['version', 'Number', 'An item’s version'],
  ['id', 'Text', 'An item’s unique identifier']
]
  .map(([name, type, description, label]) => {
    return {
      name,
      label: label || name,
      type,
      description,
      queryKey: getSysFieldQueryKey({ name, type }),
      operators: getOperatorsByType(type),
      valueInput: getControlByType({ type }),
      contentType: null
    };
  })
  .concat([
    {
      name: 'status',
      type: 'Text',
      description: 'Current status of the item',
      queryKey: '__status',
      operators: [equalityOperator],
      valueInput: ValueInput.Select([
        ['', 'Any'],
        ['published', 'Published'],
        ['changed', 'Changed'],
        ['draft', 'Draft'],
        ['archived', 'Archived']
      ]),
      contentType: null
    }
  ]);

// These are only applicable to assets
const assetsFieldFilters = [
  ['width', 'AssetDetails'],
  ['height', 'AssetDetails'],
  ['size', 'AssetDetailsSize', '', 'size (kb)'],
  ['type', 'AssetType'],
  ['title', 'AssetField'],
  ['description', 'AssetField'],
  ['fileName', 'AssetFileField']
].map(([name, type, description, label]) => ({
  name,
  label: label || name,
  description,
  type,
  queryKey: getAssetQueryKey({ name, type }),
  operators: getOperatorsByType(type),
  valueInput: getControlByType({ type }),
  contentType: null
}));

/**
 * Create the filter for the contentType field of an entry.
 *
 * Takes a list of available content types as an argument. This is used
 * to contstruct the available options to select from.
 */
export function contentTypeFilter (contentTypes) {
  let valueInputSelect = [...contentTypes.map(ct => [ct.sys.id, ct.name])];

  if (contentTypes.length > 1) {
    valueInputSelect = [['', 'Any'], ...valueInputSelect];
  }

  return {
    name: 'Content type',
    queryKey: 'content_type',
    operators: [equalityOperator],
    valueInput: ValueInput.Select(valueInputSelect)
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

export function getFiltersFromQueryKey ({
  contentTypes,
  searchFilters,
  contentTypeId,
  users,
  withAssets = false
}) {
  const contentType = getContentTypeById(contentTypes, contentTypeId);
  const filters = searchFilters
    .map(([queryKey, op, value]) => [
      buildFilterFieldByQueryKey(contentType, queryKey, withAssets),
      op,
      value
    ])
    .filter(([queryKey]) => queryKey !== undefined);

  return setUserFieldsFilters(users, filters);
}

export function sanitizeSearchFilters (
  filters = [],
  contentTypes,
  contentTypeId,
  withAssets = false
) {
  const contentType = getContentTypeById(contentTypes, contentTypeId);

  return filters.filter(([queryKey]) => {
    if (contentType && isContentTypeField(queryKey)) {
      return getFieldByApiName(contentType, getApiName(queryKey)) !== undefined;
    } else {
      return (
        find(
          getSysFilters(withAssets),
          filter => filter.queryKey === queryKey
        ) !== undefined
      );
    }
  });
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
export function buildFilterFieldByQueryKey (
  contentType,
  queryKey,
  withAssets = false
) {
  let filterField;

  if (contentType && isContentTypeField(queryKey)) {
    const field = getFieldByApiName(contentType, getApiName(queryKey));
    if (field) {
      filterField = buildFilterField(contentType, field);
    }
  } else {
    filterField = find(
      getSysFilters(withAssets),
      filter => filter.queryKey === queryKey
    );
  }

  return filterField;
}

/**
 * Checks if provided queryKey is applicable to the ContentType.
 *
 * @param {API.ContentType} contentType
 * @param {string} queryKey
 *
 * @returns {boolean}
 */
export function isFieldFilterApplicableToContentType (contentType, queryKey) {
  if (isContentTypeField(queryKey)) {
    if (!contentType) {
      return false;
    }

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
export function getMatchingFilters (
  searchString,
  contentTypeId,
  availableContentTypes,
  withAssets
) {
  let filters = allFilters(availableContentTypes, withAssets);
  filters = filterByName(filters, searchString);
  filters = filterByContentType(filters, contentTypeId);

  return withAssets ? filters : filterBySupportedTypes(filters);
}

function filterBySupportedTypes (filters) {
  return filters.filter(({ queryKey, type }) => {
    if (isContentTypeField(queryKey)) {
      return SUPPORTED_CT_FIELD_TYPES.indexOf(type) > -1;
    }
    return true;
  });
}

function filterByName (filters, searchString = '') {
  searchString = searchString.trim().toLowerCase();

  return filters.filter(filter => {
    return startsWith(filter.name.toLowerCase(), searchString);
  });
}

function filterByContentType (filters, contentTypeId) {
  if (contentTypeId) {
    // Remove all filters that do not apply to the given Content Type
    return filters.filter(field => {
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

function setUserFieldsFilters (users, filters) {
  const usersOptions = users.map(user => {
    const label = user.firstName
      ? `${user.firstName} ${user.lastName}`
      : user.email;
    const value = user.sys.id;

    return [value, label];
  });

  return filters.map(([filter, op, value]) => {
    const filterClone = cloneDeep(filter);

    if (filterClone && filterClone.type === 'User') {
      filterClone.valueInput = ValueInput.Select([['', 'Any'], ...usersOptions]);
    }

    return [filterClone, op, value];
  });
}

function isContentTypeField (queryKey) {
  const [prefix] = queryKey.split('.');

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
function allFilters (contentTypes, withAssets = false) {
  const ctFieldFilters = contentTypes.reduce((filters, ct) => {
    return ct.fields.reduce((filters, ctField) => {
      return push(filters, buildFilterField(ct, ctField));
    }, filters);
  }, []);

  const fields = concat(
    getSysFilters(withAssets),
    withAssets ? [] : ctFieldFilters
  );

  return fields;
}

function getSysFilters (withAssets = false) {
  return withAssets
    ? [...sysFieldFilters, ...assetsFieldFilters]
    : sysFieldFilters;
}

/**
 * Given a content type and a content type field return the filter for
 * that field.
 */
function buildFilterField (ct, ctField) {
  return {
    name: ctField.apiName,
    description: ctField.name,
    queryKey: getQueryKey(ctField),
    operators: getOperatorsByType(getFieldType(ctField)),
    valueInput: getControlByType(ctField),
    contentType: {
      id: ct.sys.id,
      name: ct.name
    },
    type: ctField.type
  };
}

function getQueryKey (ctField) {
  const suffix = isReferenceField(ctField) ? '.sys.id' : '';

  return `${CT_QUERY_KEY_PREFIX}.${ctField.apiName}${suffix}`;
}

function getSysFieldQueryKey ({ name, type }) {
  const suffix = isUserField({ type }) ? '.sys.id' : '';

  return `sys.${name}${suffix}`;
}

function getAssetQueryKey ({ name, type }) {
  let queryKey = CT_QUERY_KEY_PREFIX;

  if (type === 'AssetDetails' || type === 'AssetDetailsSize') {
    queryKey = getAssetDetailsQueryKey(name);
  } else if (type === 'AssetFileField') {
    queryKey = getAssetsFileFieldQueryKey(name);
  } else if (type === 'AssetField') {
    queryKey = `fields.${name}`;
  } else if (type === 'AssetType') {
    queryKey = 'mimetype_group';
  }

  return queryKey;
}

function getAssetDetailsQueryKey (name) {
  let prefix = 'fields.file.details';

  if (name === 'width' || name === 'height') {
    prefix += '.image';
  }

  return `${prefix}.${name}`;
}

function getAssetsFileFieldQueryKey (name) {
  return `fields.file.${name}`;
}

// TODO: implement control type resolution
function getControlByType (ctField) {
  const type = getFieldType(ctField);

  if (type === 'Boolean') {
    return ValueInput.Select([['true', 'Yes'], ['false', 'No']]);
  } else if (['SymbolPredefined', 'SymbolListPredefined'].indexOf(type) > -1) {
    return ValueInput.Select(getPredefinedValues(ctField).map(o => [o, o]));
  } else if (isReferenceField(ctField)) {
    return ValueInput.Reference(
      assign(ctField, {
        // TODO: This is required by the entity selector
        itemLinkType: get(ctField, ['items', 'linkType']),
        itemValidations: get(ctField, ['items', 'validations'])
      })
    );
  } else if (ctField.type === 'Date') {
    return ValueInput.Date();
  } else if (type === 'AssetType') {
    const mimeTypes = map(mimetype.getGroupNames(), (label, value) => [
      value,
      label
    ]);
    return ValueInput.Select(mimeTypes);
  } else if (type === 'AssetDetailsSize') {
    return ValueInput.AssetDetailsSize();
  } else {
    return ValueInput.Text();
  }
}

function isReferenceField ({ type, items = {} } = {}) {
  return type === 'Link' || items.type === 'Link';
}

function isUserField ({ type }) {
  return type === 'User';
}

function getPredefinedValues (ctField) {
  const { validations = [] } = ctField.items || ctField;
  const validationWithPredefinedValues =
    find(validations, v => has(v, 'in')) || {};

  return validationWithPredefinedValues.in;
}

function getFieldType (ctField) {
  let { type } = ctField;
  const isList = type === 'Array';
  const valuesType = get(ctField, ['items', 'type']) || type;

  if (valuesType === 'Symbol') {
    type = 'Symbol';

    if (isList) {
      type = `${type}SymbolList`;
    }

    if (getPredefinedValues(ctField)) {
      type = `${type}Predefined`;
    }
  }

  return type;
}
