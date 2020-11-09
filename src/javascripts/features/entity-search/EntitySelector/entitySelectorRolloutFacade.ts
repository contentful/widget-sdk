import { FLAGS, getVariation } from 'LaunchDarkly';
import { getModule } from 'core/NgRegistry';
import * as LegacyEntitySelector from './entitySelector';
import type { EntitySelectorExtensionSDK } from '@contentful/entity-search';
import { FEATURES, getSpaceFeature } from 'data/CMA/ProductCatalog';

const checkFeatureFlags = async () => {
  // temporary use of `spaceContext`
  // todo: should be deleted once we remove NEW_ENTITY_SELECTOR feature flag
  const spaceContext = getModule('spaceContext');
  const spaceId = spaceContext.getId();
  const environmentId = spaceContext.getEnvironmentId();
  const organizationId = spaceContext.getData('organization').sys.id;

  try {
    const [isNewEntitySelector, isTagsEnabled] = await Promise.all([
      getVariation(FLAGS.NEW_ENTITY_SELECTOR, {
        organizationId,
        spaceId,
        environmentId,
      }),
      getSpaceFeature(spaceId, FEATURES.PC_CONTENT_TAGS, false),
    ]);
    return { isNewEntitySelector, isTagsEnabled };
  } catch (e) {
    return { isNewEntitySelector: false, isTagsEnabled: false };
  }
};

export const openFromRolesAndPermissions = async (
  sdk: EntitySelectorExtensionSDK,
  entityType: 'Entry' | 'Asset'
) => {
  const { isNewEntitySelector, isTagsEnabled } = await checkFeatureFlags();
  if (isNewEntitySelector) {
    const { EntitySelector } = await import('@contentful/entity-search');
    return EntitySelector.open(sdk, {
      multiple: false,
      entityType,
      features: {
        metadata: isTagsEnabled,
      },
    });
  }
  return LegacyEntitySelector.openFromRolesAndPermissions(entityType);
};

export const openFromField = async (sdk: EntitySelectorExtensionSDK, field, currentSize) => {
  const { isNewEntitySelector, isTagsEnabled } = await checkFeatureFlags();
  if (isNewEntitySelector) {
    const { EntitySelector } = await import('@contentful/entity-search');
    return EntitySelector.openFromLinkField(sdk, {
      entityType: 'Entry',
      field,
      features: {
        metadata: isTagsEnabled,
      },
    });
  }
  return LegacyEntitySelector.openFromField(field, currentSize);
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
  const { isNewEntitySelector, isTagsEnabled } = await checkFeatureFlags();
  if (isNewEntitySelector) {
    const { EntitySelector } = await import('@contentful/entity-search');

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
  }
  return LegacyEntitySelector.openFromWidget(options);
};
