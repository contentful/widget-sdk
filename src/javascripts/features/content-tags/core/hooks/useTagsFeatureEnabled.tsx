import { SpaceFeatures } from 'data/CMA/ProductCatalog';
import { useCurrentSpaceFeature } from 'features/content-tags/core/hooks/useCurrentSpaceFeature';

function useTagsFeatureEnabled() {
  const {
    spaceFeatureEnabled: tagsEnabled,
    isSpaceFeatureLoading: isTagsEnabledLoading,
  } = useCurrentSpaceFeature(SpaceFeatures.PC_CONTENT_TAGS, false);
  return { tagsEnabled, isTagsEnabledLoading };
}

export { useTagsFeatureEnabled };
