import _ from 'lodash';
import * as EntityResolver from 'data/CMA/EntityResolver';
import { getModule } from 'NgRegistry';

export function fetchEntities({ entryIds, assetIds }) {
  const spaceContext = getModule('spaceContext');
  return Promise.all([
    EntityResolver.fetchForType(spaceContext, 'Entry', entryIds),
    EntityResolver.fetchForType(spaceContext, 'Asset', assetIds),
  ]);
}
