import React from 'react';
import PropTypes from 'prop-types';
import StateRedirect from 'app/common/StateRedirect';
import { RolesWorkbenchSkeleton } from '../skeletons/RolesWorkbenchSkeleton';
import createFetcherComponent from 'app/common/createFetcherComponent';
import createResourceService from 'services/ResourceService';
import { ENVIRONMENT_ALIASING } from 'featureFlags';
import { Notification } from '@contentful/forma-36-react-components';
import { getSpaceFeature } from 'data/CMA/ProductCatalog';
import * as accessChecker from 'access_control/AccessChecker';
import * as ResourceUtils from 'utils/ResourceUtils';
import { RoleEditor } from '../role_editor/RoleEditor';
import DocumentTitle from 'components/shared/DocumentTitle';

const RoleEditorFetcher = createFetcherComponent(
  async ({ spaceId, getContentTypes, getEntities, isNew }) => {
    const [
      contentTypes,
      hasEnvironmentAliasesEnabled,
      hasCustomRolesFeature,
      resource,
      entities,
    ] = await Promise.all([
      getContentTypes(),
      getSpaceFeature(spaceId, ENVIRONMENT_ALIASING),
      accessChecker.canModifyRoles(),
      createResourceService(spaceId).get('role'),
      getEntities(),
    ]);

    if (!hasCustomRolesFeature) {
      return {
        contentTypes,
        entities,
        hasEnvironmentAliasesEnabled,
        hasCustomRolesFeature: false,
        canModifyRoles: false,
      };
    }

    if (isNew && !ResourceUtils.canCreate(resource)) {
      Notification.error('Your organization has reached the limit for custom roles.');
      return {
        contentTypes,
        entities,
        hasEnvironmentAliasesEnabled,
        hasCustomRolesFeature: true,
        canModifyRoles: false,
      };
    }

    return {
      contentTypes,
      entities,
      hasEnvironmentAliasesEnabled,
      hasCustomRolesFeature: true,
      canModifyRoles: true,
    };
  }
);

export function RoleEditorRoute(props) {
  return (
    <>
      <DocumentTitle title="Roles" />
      <RoleEditorFetcher
        spaceId={props.spaceId}
        getContentTypes={props.getContentTypes}
        getEntities={props.getEntities}
        isNew={props.isNew}>
        {({ isLoading, isError, data }) => {
          if (isLoading) {
            return <RolesWorkbenchSkeleton onBack={() => {}} />;
          }
          if (isError) {
            return <StateRedirect path="spaces.detail.entries.list" />;
          }

          return (
            <RoleEditor isLegacyOrganization={props.isLegacyOrganization} {...data} {...props} />
          );
        }}
      </RoleEditorFetcher>
    </>
  );
}

RoleEditorRoute.defaultProps = {
  getEntities: () => ({ Entry: {}, Asset: {} }),
};

RoleEditorRoute.propTypes = {
  spaceId: PropTypes.string.isRequired,
  isLegacyOrganization: PropTypes.bool.isRequired,
  getContentTypes: PropTypes.func.isRequired,
  getEntities: PropTypes.func.isRequired,
  isNew: PropTypes.bool.isRequired,
};
