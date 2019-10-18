import { isOwnerOrAdmin } from 'services/OrganizationRoles.es6';
import { isLegacyOrganization } from 'utils/ResourceUtils.es6';
import EnvironmentsRoute from './EnvironmentsRoute.es6';

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
      const getAllSpaceAliases = spaceContext.getAllSpaceAliases;
      const getAliasesIds = spaceContext.getAliasesIds;

      return {
        spaceId,
        currentEnvironmentId,
        organizationId,
        isMasterEnvironment,
        canUpgradeSpace: isOwnerOrAdmin(organization),
        isLegacyOrganization: isLegacyOrganization(organization),
        endpoint,
        getSpaceData: () => space.data,
        getAllSpaceAliases,
        getAliasesIds,
        goToSpaceDetail: () => $state.go('spaces.detail')
      };
    }
  ]
};
