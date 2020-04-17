import { PC_CONTENT_TAGS } from 'featureFlags';
import useCurrentSpaceFeature from './useCurrentSpaceFeature';

function useTagsFeatureEnabled() {
  const {
    spaceFeatureEnabled: tagsEnabled,
    isSpaceFeatureLoading: isTagsEnabledLoading,
  } = useCurrentSpaceFeature(PC_CONTENT_TAGS, false);
  return { tagsEnabled, isTagsEnabledLoading };
}

export { useTagsFeatureEnabled, useCurrentSpaceFeature };
