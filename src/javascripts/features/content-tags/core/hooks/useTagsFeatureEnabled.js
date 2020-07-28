import { FEATURES } from 'data/CMA/ProductCatalog';
import { useCurrentSpaceFeature } from 'features/content-tags/core/hooks/useCurrentSpaceFeature';

function useTagsFeatureEnabled() {
  const {
    spaceFeatureEnabled: tagsEnabled,
    isSpaceFeatureLoading: isTagsEnabledLoading,
  } = useCurrentSpaceFeature(FEATURES.PC_CONTENT_TAGS, false);
  return { tagsEnabled, isTagsEnabledLoading };
}

export { useTagsFeatureEnabled };
