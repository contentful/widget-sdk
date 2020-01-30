import React from 'react';
import PropTypes from 'prop-types';
import { sortBy } from 'lodash';
import StateRedirect from 'app/common/StateRedirect';
import RolesWorkbenchShell from './RolesWorkbenchShell';
import createFetcherComponent from 'app/common/createFetcherComponent';
import createResourceService from 'services/ResourceService';
import * as accessChecker from 'access_control/AccessChecker';
import * as RoleListHandler from 'access_control/RoleListHandler';
import RolesList from '../roles_list/RolesList';
import DocumentTitle from 'components/shared/DocumentTitle';

const RolesFetcher = createFetcherComponent(async ({ spaceId }) => {
  const listHandler = RoleListHandler.create();

  const hasCustomRolesFeature = await accessChecker.canModifyRoles();
  const data = await listHandler.reset();
  const rolesResource = await createResourceService(spaceId).get('role');

  const roleCounts = listHandler.getRoleCounts();

  const roles = sortBy(data.roles, 'name').map(role => {
    role.count = roleCounts[role.sys.id] || 0;
    return role;
  });

  return {
    hasCustomRolesFeature,
    rolesResource,
    roles,
    roleCounts,
    listHandler
  };
});

export default function RolesListRoute(props) {
  return (
    <>
      <DocumentTitle title="Roles" />
      <RolesFetcher spaceId={props.spaceId}>
        {({ isLoading, isError, data, fetch }) => {
          if (isLoading) {
            return <RolesWorkbenchShell title="Roles" />;
          }
          if (isError) {
            return <StateRedirect path="spaces.detail.entries.list" />;
          }
          return (
            <RolesList
              canUpgradeOrganization={props.canUpgradeOrganization}
              isLegacyOrganization={props.isLegacyOrganization}
              refetch={fetch}
              {...data}
            />
          );
        }}
      </RolesFetcher>
    </>
  );
}

RolesListRoute.propTypes = {
  spaceId: PropTypes.string.isRequired,
  isLegacyOrganization: PropTypes.bool.isRequired,
  canUpgradeOrganization: PropTypes.bool.isRequired
};
