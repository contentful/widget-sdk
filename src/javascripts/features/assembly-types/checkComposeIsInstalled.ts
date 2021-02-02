import { getAppsRepo } from 'features/apps-core';

const spaceFlagCache = {};

export async function checkComposeIsInstalled(spaceId: string) {
  if (!spaceId) {
    return false;
  }
  if (spaceId in spaceFlagCache) {
    return spaceFlagCache[spaceId];
  }
  try {
    const appsRepo = getAppsRepo();
    const installedApps = await appsRepo.getOnlyInstalledApps();
    const isComposeInstalled = installedApps.some((app) => app.id === 'compose');
    spaceFlagCache[spaceId] = isComposeInstalled;
    return isComposeInstalled;
  } catch (e) {
    return false;
  }
}
