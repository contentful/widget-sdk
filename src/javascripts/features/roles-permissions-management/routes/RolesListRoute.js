import React from 'react';
import { sortBy } from 'lodash';
import StateRedirect from 'app/common/StateRedirect';
import { RolesWorkbenchSkeleton } from '../skeletons/RolesWorkbenchSkeleton';
import createFetcherComponent from 'app/common/createFetcherComponent';
import createResourceService from 'services/ResourceService';
import * as accessChecker from 'access_control/AccessChecker';
import * as RoleListHandler from '../components/RoleListHandler';
import { RolesList } from '../roles_list/RolesList';
import DocumentTitle from 'components/shared/DocumentTitle';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import * as ResourceUtils from 'utils/ResourceUtils';
import { isOwnerOrAdmin } from 'services/OrganizationRoles';

const RolesFetcher = createFetcherComponent(async ({ spaceId, environmentId }) => {
  const listHandler = RoleListHandler.create(spaceId, environmentId);

  const hasCustomRolesFeature = await accessChecker.canModifyRoles();
  const data = await listHandler.reset();
  const rolesResource = await createResourceService(spaceId).get('role');

  const roleCounts = listHandler.getRoleCounts();

  const roles = sortBy(data.roles, 'name').map((role) => {
    role.count = roleCounts[role.sys.id] || 0;
    return role;
  });

  return {
    hasCustomRolesFeature,
    rolesResource,
    roles,
    roleCounts,
    listHandler,
  };
});

export function RolesListRoute() {
  const {
    currentOrganization,
    currentSpaceId: spaceId,
    currentEnvironmentId: environmentId,
  } = useSpaceEnvContext();
  const isLegacyOrganization = ResourceUtils.isLegacyOrganization(currentOrganization);
  const canUpgradeOrganization = isOwnerOrAdmin(currentOrganization);

  return (
    <>
      <DocumentTitle title="Roles" />
      <RolesFetcher spaceId={spaceId} environmentId={environmentId}>
        {({ isLoading, isError, data, fetch }) => {
          if (isLoading) {
            return <RolesWorkbenchSkeleton title="Roles" />;
          }
          if (isError) {
            return <StateRedirect path="spaces.detail.entries.list" />;
          }
          return (
            <RolesList
              canUpgradeOrganization={canUpgradeOrganization}
              isLegacyOrganization={isLegacyOrganization}
              refetch={fetch}
              {...data}
            />
          );
        }}
      </RolesFetcher>
    </>
  );
}
