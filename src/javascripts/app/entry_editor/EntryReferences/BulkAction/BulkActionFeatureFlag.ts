import { FLAGS, getVariation } from 'LaunchDarkly';
import { SpaceEnvContextValue } from 'core/services/SpaceEnvContext/types';

export async function getBulkActionSupportFeatureFlag(context: SpaceEnvContextValue) {
  return getVariation(FLAGS.REFERENCE_TREE_BULK_ACTIONS_SUPPORT, {
    spaceId: context.currentSpaceId,
    organizationId: context.currentOrganizationId,
    environmentId: context.currentEnvironmentId,
  });
}
