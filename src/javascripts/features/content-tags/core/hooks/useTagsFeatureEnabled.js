import { PC_CONTENT_TAGS } from 'featureFlags';
import { useCurrentSpaceFeature } from 'features/content-tags/core/hooks/useCurrentSpaceFeature';

function useTagsFeatureEnabled() {
  const {
    spaceFeatureEnabled: tagsEnabled,
    isSpaceFeatureLoading: isTagsEnabledLoading,
  } = useCurrentSpaceFeature(PC_CONTENT_TAGS, false);
  return { tagsEnabled, isTagsEnabledLoading };
}

export { useTagsFeatureEnabled };
