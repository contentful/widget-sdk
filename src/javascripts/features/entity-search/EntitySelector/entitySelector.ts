import { getSpaceContext } from 'classes/spaceContext';
import type { EntitySelectorExtensionSDK } from '@contentful/entity-search';
import { EntitySelector } from '@contentful/entity-search';
import { FEATURES, getSpaceFeature } from 'data/CMA/ProductCatalog';

const checkFeatureFlags = async () => {
  // temporary use of `spaceContext`
  // todo: should be deleted once we remove PC_CONTENT_TAGS feature flag
  const spaceContext = getSpaceContext();
  const spaceId = spaceContext.getId();

  try {
    const [isTagsEnabled] = await Promise.all([
      getSpaceFeature(spaceId, FEATURES.PC_CONTENT_TAGS, false),
    ]);
    return { isTagsEnabled };
  } catch (e) {
    return { isTagsEnabled: false };
  }
};

export const openFromRolesAndPermissions = async (
  sdk: EntitySelectorExtensionSDK,
  entityType: 'Entry' | 'Asset'
) => {
  const { isTagsEnabled } = await checkFeatureFlags();
  return EntitySelector.open(sdk, {
    multiple: false,
    entityType,
    features: {
      metadata: isTagsEnabled,
    },
  });
};

export const openFromField = async (sdk: EntitySelectorExtensionSDK, field) => {
  const { isTagsEnabled } = await checkFeatureFlags();
  return EntitySelector.openFromLinkField(sdk, {
    entityType: 'Entry',
    field,
    features: {
      metadata: isTagsEnabled,
    },
  });
};

export const openFromWidget = async (
  sdk: EntitySelectorExtensionSDK,
  options: {
    locale?: string;
    contentTypes?: string[];
    mimetypeGroups?: string[];
    entityType: 'Entry' | 'Asset';
    multiple?: boolean;
    min?: number;
    max?: number;
    withCreate?: boolean;
  }
) => {
  const { isTagsEnabled } = await checkFeatureFlags();

  return EntitySelector.open(sdk, {
    locale: options.locale,
    entityType: options.entityType,
    min: options.min,
    max: options.max,
    linkedContentTypeIds: options.contentTypes ?? [],
    linkedMimetypeGroups: options.mimetypeGroups ?? [],
    multiple: options.multiple ?? false,
    withCreate: options.withCreate ?? false,
    features: {
      metadata: isTagsEnabled,
    },
  });
};
