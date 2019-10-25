import React from 'react';
import PropTypes from 'prop-types';
import StateRedirect from 'app/common/StateRedirect.es6';
import RolesWorkbenchShell from './RolesWorkbenchShell';
import createFetcherComponent from 'app/common/createFetcherComponent.es6';
import createResourceService from 'services/ResourceService.es6';
import { ENVIRONMENT_ALIASING } from 'featureFlags.es6';
import { Notification } from '@contentful/forma-36-react-components';
import { getSpaceFeature } from 'data/CMA/ProductCatalog.es6';
import * as accessChecker from 'access_control/AccessChecker';
import * as ResourceUtils from 'utils/ResourceUtils.es6';
import RoleEditor from '../role_editor/RoleEditor';
import DocumentTitle from 'components/shared/DocumentTitle.es6';

const RoleEditorFetcher = createFetcherComponent(async ({ spaceId, getContentTypes, isNew }) => {
  const [
    contentTypes,
    hasEnvironmentAliasesEnabled,
    hasCustomRolesFeature,
    resource
  ] = await Promise.all([
    getContentTypes(),
    getSpaceFeature(spaceId, ENVIRONMENT_ALIASING),
    accessChecker.canModifyRoles(),
    createResourceService(spaceId).get('role')
  ]);

  const state = {
    canModifyRoles: undefined,
    hasCustomRolesFeature: undefined,
    hasEnvironmentAliasesEnabled: undefined
  };

  if (!hasCustomRolesFeature) {
    state.hasCustomRolesFeature = false;
    state.canModifyRoles = false;
  } else if (isNew && !ResourceUtils.canCreate(resource)) {
    Notification.error('Your organization has reached the limit for custom roles.');
    state.hasCustomRolesFeature = true;
    state.canModifyRoles = false;
  } else {
    state.hasCustomRolesFeature = true;
    state.canModifyRoles = true;
  }

  return {
    contentTypes,
    hasEnvironmentAliasesEnabled,
    ...state
  };
});

export default function RoleEditorRoute(props) {
  return (
    <>
      <DocumentTitle title="Roles" />
      <RoleEditorFetcher
        spaceId={props.spaceId}
        getContentTypes={props.getContentTypes}
        isNew={props.isNew}>
        {({ isLoading, isError, data }) => {
          if (isLoading) {
            return <RolesWorkbenchShell onBack={() => {}} />;
          }
          if (isError) {
            return <StateRedirect to="spaces.detail.entries.list" />;
          }

          return (
            <RoleEditor isLegacyOrganization={props.isLegacyOrganization} {...data} {...props} />
          );
        }}
      </RoleEditorFetcher>
    </>
  );
}

RoleEditorRoute.propTypes = {
  spaceId: PropTypes.string.isRequired,
  isLegacyOrganization: PropTypes.bool.isRequired,
  getContentTypes: PropTypes.func.isRequired,
  isNew: PropTypes.bool.isRequired
};
