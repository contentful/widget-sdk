import { pick, isEqual } from 'lodash';

const INTERNAL_TO_API = {
  Symbol: { type: 'Symbol' },
  Symbols: { type: 'Array', items: { type: 'Symbol' } },
  Text: { type: 'Text' },
  RichText: { type: 'RichText' },
  Integer: { type: 'Integer' },
  Number: { type: 'Number' },
  Boolean: { type: 'Boolean' },
  Date: { type: 'Date' },
  Location: { type: 'Location' },
  Object: { type: 'Object' },
  Entry: { type: 'Link', linkType: 'Entry' },
  Entries: { type: 'Array', items: { type: 'Link', linkType: 'Entry' } },
  Asset: { type: 'Link', linkType: 'Asset' },
  Assets: { type: 'Array', items: { type: 'Link', linkType: 'Asset' } },
  File: { type: 'File' }
};

export const FIELD_TYPES = Object.keys(INTERNAL_TO_API);

// RichText, Location and File field types are not supported for extensions.
// TODO: Fix the backend to accept these values.
const EXTENSION_NOT_SUPPORTED_FIELD_TYPES = ['RichText', 'Location', 'File'];

export const EXTENSION_FIELD_TYPES = FIELD_TYPES.filter(type => {
  return !EXTENSION_NOT_SUPPORTED_FIELD_TYPES.includes(type);
});

/**
 * Returns an internal string identifier for an API field object.
 *
 * We use this string as a simplified reference to field types.
 * Possible values are:
 *
 * - Symbol
 * - Symbols
 * - Text
 * - RichText
 * - Integer
 * - Number
 * - Boolean
 * - Date
 * - Location
 * - Object
 * - Entry
 * - Entries
 * - Asset
 * - Assets
 * - File
 */
export function toInternalFieldType(api) {
  return FIELD_TYPES.find(internal => {
    const stripped = pick(api, ['type', 'linkType', 'items']);
    if (stripped.items) {
      stripped.items = pick(stripped.items, ['type', 'linkType']);
    }

    return isEqual(stripped, INTERNAL_TO_API[internal]);
  });
}

// Given our internal identifier returns a minimal API field object.
export function toApiFieldType(internal) {
  return INTERNAL_TO_API[internal];
}
