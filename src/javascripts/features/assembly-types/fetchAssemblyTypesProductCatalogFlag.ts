import { getSpaceFeature, FEATURES } from 'data/CMA/ProductCatalog';

const spaceFlagCache = {};

export async function fetchAssemblyTypesProductCatalogFlag(spaceId: string) {
  if (!spaceId) {
    return false;
  }
  if (spaceId in spaceFlagCache) {
    return spaceFlagCache[spaceId];
  }
  const flag = await getSpaceFeature(spaceId, FEATURES.ASSEMBLY_TYPES, false);
  spaceFlagCache[spaceId] = flag;
  return flag;
}
