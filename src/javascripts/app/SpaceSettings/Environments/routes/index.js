import { isOwnerOrAdmin } from 'services/OrganizationRoles';
import { isLegacyOrganization } from 'utils/ResourceUtils';
import EnvironmentsRoute from './EnvironmentsRoute';
import { ENVIRONMENT_CREATION_COMPLETE_EVENT } from 'services/PubSubService';

export default {
  name: 'environments',
  url: '/environments',
  component: EnvironmentsRoute,
  mapInjectedToProps: [
    'spaceContext',
    '$state',
    (spaceContext, $state) => {
      const { organization, endpoint, space } = spaceContext;
      const spaceId = spaceContext.getId();
      const currentEnvironmentId = spaceContext.getEnvironmentId();
      const organizationId = organization.sys.id;
      const isMasterEnvironment = spaceContext.isMasterEnvironment;
      const getAliasesIds = spaceContext.getAliasesIds;

      spaceContext.pubsubClient.on(ENVIRONMENT_CREATION_COMPLETE_EVENT, data => {
        console.log('Complete', data);
      });

      return {
        spaceId,
        currentEnvironmentId,
        organizationId,
        isMasterEnvironment,
        canUpgradeSpace: isOwnerOrAdmin(organization),
        isLegacyOrganization: isLegacyOrganization(organization),
        endpoint,
        getSpaceData: () => space.data,
        getAliasesIds,
        goToSpaceDetail: () => $state.go('spaces.detail')
      };
    }
  ]
};
