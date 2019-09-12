import _ from 'lodash';
import * as EntityResolver from 'data/CMA/EntityResolver.es6';
import { getModule } from 'NgRegistry.es6';

export function fetchEntities({ entryIds, assetIds }) {
  const spaceContext = getModule('spaceContext');
  return Promise.all([
    EntityResolver.fetchForType(spaceContext, 'Entry', entryIds),
    EntityResolver.fetchForType(spaceContext, 'Asset', assetIds)
  ]);
}
