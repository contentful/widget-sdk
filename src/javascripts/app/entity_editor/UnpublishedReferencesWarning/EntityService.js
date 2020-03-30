import _ from 'lodash';
import * as EntityResolver from 'data/CMA/EntityResolver';

export function fetchEntities({ entryIds, assetIds }) {
  return Promise.all([
    EntityResolver.fetchForType('Entry', entryIds),
    EntityResolver.fetchForType('Asset', assetIds),
  ]);
}
