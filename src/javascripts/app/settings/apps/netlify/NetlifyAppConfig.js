import { getModule } from 'NgRegistry';
import createCachedAppConfig from '../CachedAppConfig';

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
