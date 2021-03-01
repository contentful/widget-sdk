import { find, get, has, map } from 'lodash';
import { assign } from 'utils/Collections';
import { equality as equalityOperator, getOperatorsByType } from './Operators';
import mimetype from '@contentful/mimetype';

import { FilterValueInputs as ValueInput } from './FilterValueInputs';
import { METADATA_TAGS_ID } from 'data/MetadataFields';

const CT_QUERY_KEY_PREFIX = 'fields';

const statusQueryKey = '__status';
const Status = {
  Any: '',
  Published: 'published',
  Changed: 'changed',
  Draft: 'draft',
  Archived: 'archived',
};

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

// The generic filters applicable to all content types
// TODO: Use "entry" and "asset" instead of "item".
const sysFieldFilters = [
  ['updatedAt', 'Date', 'Date an item was last updated'],
  ['createdAt', 'Date', 'Date an item was created'],
  ['publishedAt', 'Date', 'Date an item was last published'],
  ['firstPublishedAt', 'Date', 'Date an item was first published'],
  ['updatedBy', 'User', 'The user who last updated an item'],
  ['createdBy', 'User', 'The user who created an item'],
  ['publishedBy', 'User', 'The user who last published an item'],
  ['version', 'Number', 'An item’s version'],
  ['id', 'Text', 'An item’s unique identifier'],
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
      contentType: null,
    };
  })
  .concat([
    {
      name: 'status',
      type: 'Text',
      description: 'Current status of the item',
      queryKey: statusQueryKey,
      operators: [equalityOperator],
      valueInput: ValueInput.Select([
        [Status.Any, 'Any (except “Archived”)'],
        [Status.Published, 'Published'],
        [Status.Changed, 'Changed'],
        [Status.Draft, 'Draft'],
        [Status.Archived, 'Archived'],
      ]),
      contentType: null,
    },
  ]);

const metadataFilters = [
  {
    name: METADATA_TAGS_ID,
    type: 'Tags',
    displayName: 'tags',
    description: 'Tags on the item',
    queryKey: 'metadata.tags.sys.id',
    operators: getOperatorsByType('Tags'),
    valueInput: getControlByType({ type: 'Tags' }),
    contentType: null,
  },
];

// These are only applicable to assets
const assetsFieldFilters = [
  ['width', 'AssetDetails'],
  ['height', 'AssetDetails'],
  ['size', 'AssetDetailsSize', '', 'size (kb)'],
  ['type', 'AssetType'],
  ['title', 'AssetField'],
  ['description', 'AssetField'],
  ['fileName', 'AssetFileField'],
].map(([name, type, description, label]) => ({
  name,
  label: label || name,
  description,
  type,
  queryKey: getAssetQueryKey({ name, type }),
  operators: getOperatorsByType(type),
  valueInput: getControlByType({ type }),
  contentType: null,
}));

/**
 * Returns a field filter for given queryKey from
 * the fields of provided Content Type or sys field filters.
 *
 * @param {API.ContentType?} contentType
 * @param {string} queryKey
 *
 * @returns {FieldFilter}
 */
export function buildFilterFieldByQueryKey(
  contentType,
  queryKey,
  withAssets = false,
  withMetadata = false
) {
  let filterField;

  if (contentType && isContentTypeField(queryKey)) {
    const field = getFieldByApiName(contentType, getApiName(queryKey));
    if (field) {
      filterField = buildFilterField(contentType, field);
    }
  } else {
    filterField = find(
      getFilters(withAssets, withMetadata),
      (filter) => filter.queryKey === queryKey
    );
  }

  return filterField;
}

function isContentTypeField(queryKey) {
  const [prefix] = queryKey.split('.');

  return prefix === CT_QUERY_KEY_PREFIX;
}

function getApiName(queryKey) {
  const [, apiName] = queryKey.split('.');
  return apiName;
}

function getFieldByApiName(contentType, apiName) {
  return find(contentType.fields, (field) => field.apiName === apiName);
}

function getFilters(withAssets = false, withMetadata = false) {
  let filters = [...sysFieldFilters];
  if (withMetadata) {
    filters = filters.concat(metadataFilters);
  }
  if (withAssets) {
    filters = filters.concat(assetsFieldFilters);
  }
  return filters;
}

/**
 * Given a content type and a content type field return the filter for
 * that field.
 */
function buildFilterField(ct, ctField) {
  return {
    name: ctField.apiName,
    description: ctField.name,
    queryKey: getQueryKey(ctField),
    operators: getOperatorsByType(getFieldType(ctField)),
    valueInput: getControlByType(ctField),
    contentType: {
      id: ct.sys.id,
      name: ct.name,
    },
    type: ctField.type,
  };
}

function getQueryKey(ctField) {
  const suffix = isReferenceField(ctField) ? '.sys.id' : '';

  return `${CT_QUERY_KEY_PREFIX}.${ctField.apiName}${suffix}`;
}

function getSysFieldQueryKey({ name, type }) {
  const suffix = isUserField({ type }) ? '.sys.id' : '';

  return `sys.${name}${suffix}`;
}

function getAssetQueryKey({ name, type }) {
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

function getAssetDetailsQueryKey(name) {
  let prefix = 'fields.file.details';

  if (name === 'width' || name === 'height') {
    prefix += '.image';
  }

  return `${prefix}.${name}`;
}

function getAssetsFileFieldQueryKey(name) {
  return `fields.file.${name}`;
}

// TODO: implement control type resolution
function getControlByType(ctField) {
  const type = getFieldType(ctField);

  if (type === 'Boolean') {
    return ValueInput.Select([
      ['true', 'Yes'],
      ['false', 'No'],
    ]);
  } else if (['SymbolPredefined', 'SymbolListPredefined'].indexOf(type) > -1) {
    const emptyOption = ['', 'Select...'];
    const valueOptions = getPredefinedValues(ctField).map((o) => [o, o]);
    return ValueInput.Select([emptyOption].concat(valueOptions));
  } else if (isReferenceField(ctField)) {
    return ValueInput.Reference(
      assign(ctField, {
        // TODO: This is required by the entity selector
        itemLinkType: get(ctField, ['items', 'linkType']),
        itemValidations: get(ctField, ['items', 'validations']),
      })
    );
  } else if (ctField.type === 'Date') {
    return ValueInput.Date();
  } else if (ctField.type === 'Tags') {
    return ValueInput.MetadataTag();
  } else if (type === 'AssetType') {
    const mimeTypes = map(mimetype.getGroupNames(), (label, value) => [value, label]);
    return ValueInput.Select(mimeTypes);
  } else if (type === 'AssetDetailsSize') {
    return ValueInput.AssetDetailsSize();
  } else {
    return ValueInput.Text();
  }
}

function isReferenceField({ type, items = {} } = {}) {
  return type === 'Link' || items.type === 'Link';
}

function isUserField({ type }) {
  return type === 'User';
}

function getPredefinedValues(ctField) {
  const { validations = [] } = ctField.items || ctField;
  const validationWithPredefinedValues = find(validations, (v) => has(v, 'in')) || {};

  return validationWithPredefinedValues.in;
}

function getFieldType(ctField) {
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
