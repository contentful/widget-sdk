import { find, isEqual } from 'lodash';

const INTERNAL_TO_API = {
  Symbol: { type: 'Symbol' },
  Text: { type: 'Text' },
  Integer: { type: 'Integer' },
  Number: { type: 'Number' },
  Date: { type: 'Date' },
  Boolean: { type: 'Boolean' },
  Object: { type: 'Object' },
  Asset: { type: 'Link', linkType: 'Asset' },
  Entry: { type: 'Link', linkType: 'Entry' },
  Symbols: { type: 'Array', items: { type: 'Symbol' } },
  Entries: { type: 'Array', items: { type: 'Link', linkType: 'Entry' } },
  Assets: { type: 'Array', items: { type: 'Link', linkType: 'Asset' } }
};

export const FIELD_TYPES = Object.keys(INTERNAL_TO_API);

export function toInternalFieldType(api) {
  return find(FIELD_TYPES, internal => isEqual(api, INTERNAL_TO_API[internal]));
}

export function toApiFieldType(internal) {
  return INTERNAL_TO_API[internal];
}
