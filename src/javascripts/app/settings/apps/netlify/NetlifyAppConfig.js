import { getModule } from 'NgRegistry.es6';
import createCachedAppConfig from '../CachedAppConfig.es6';

const perSpaceCache = {};

export function getSpaceNetlifyConfig() {
  const spaceContext = getModule('spaceContext');
  const spaceId = spaceContext.getId();
  if (!perSpaceCache[spaceId]) {
    perSpaceCache[spaceId] = createCachedAppConfig({
      spaceId,
      appId: 'netlify',
      makeDefaultConfig: () => ({ sites: [] })
    });
  }
  return perSpaceCache[spaceId];
}
