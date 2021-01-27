import React from 'react';
import PropTypes from 'prop-types';
import StateRedirect from 'app/common/StateRedirect';
import { RolesWorkbenchSkeleton } from '../skeletons/RolesWorkbenchSkeleton';
import createFetcherComponent from 'app/common/createFetcherComponent';
import createResourceService from 'services/ResourceService';
import { Notification } from '@contentful/forma-36-react-components';
import * as accessChecker from 'access_control/AccessChecker';
import * as ResourceUtils from 'utils/ResourceUtils';
import { RoleEditor } from '../role_editor/RoleEditor';
import { EntitiesContext, EntitiesProvider } from '../role_editor/EntitiesProvider';
import DocumentTitle from 'components/shared/DocumentTitle';
import { getSpaceFeature, FEATURES } from 'data/CMA/ProductCatalog';
import { entitySelector, useEntitySelectorSdk } from 'features/entity-search';
import { MetadataTags, ReadTagsContext } from 'features/content-tags';
import { FLAGS, getVariation } from 'LaunchDarkly';

const RoleEditorFetcher = createFetcherComponent(
  async ({ spaceId, organizationId, environmentId, getContentTypes, getEntities, isNew }) => {
    const [
      contentTypes,
      hasEnvironmentAliasesEnabled,
      hasCustomRolesFeature,
      hasContentTagsFeature,
      hasClpFeature,
      resource,
      _,
    ] = await Promise.all([
      getContentTypes(),
      getSpaceFeature(spaceId, FEATURES.ENVIRONMENT_ALIASING),
      accessChecker.canModifyRoles(),
      getSpaceFeature(spaceId, FEATURES.PC_CONTENT_TAGS, false),
      getVariation(FLAGS.CONTENT_LEVEL_PERMISSIONS, { spaceId, environmentId, organizationId }),
      createResourceService(spaceId).get('role'),
      getEntities(),
    ]);

    if (!hasCustomRolesFeature) {
      return {
        contentTypes,
        hasEnvironmentAliasesEnabled,
        hasCustomRolesFeature: false,
        hasContentTagsFeature,
        hasClpFeature,
        canModifyRoles: false,
      };
    }

    if (isNew && !ResourceUtils.canCreate(resource)) {
      Notification.error('Your organization has reached the limit for custom roles.');
      return {
        contentTypes,
        hasEnvironmentAliasesEnabled,
        hasCustomRolesFeature: true,
        hasContentTagsFeature,
        hasClpFeature,
        canModifyRoles: false,
      };
    }

    return {
      contentTypes,
      hasEnvironmentAliasesEnabled,
      hasCustomRolesFeature: true,
      hasContentTagsFeature,
      hasClpFeature,
      canModifyRoles: true,
    };
  }
);

export function RoleEditorRoute(props) {
  const entitySelectorSdk = useEntitySelectorSdk();

  return (
    <EntitiesProvider getEntities={props.getEntities} getEntity={props.getEntity}>
      <EntitiesContext.Consumer>
        {({ entities, fetchEntities, fetchEntity }) => {
          return (
            <MetadataTags>
              <ReadTagsContext.Consumer>
                {(tagsContext) => {
                  return (
                    <>
                      <DocumentTitle title="Roles" />
                      <RoleEditorFetcher
                        spaceId={props.spaceId}
                        organizationId={props.organizationId}
                        environmentId={props.environmentId}
                        getContentTypes={props.getContentTypes}
                        getEntities={fetchEntities}
                        isNew={props.isNew}>
                        {({ isLoading, isError, data }) => {
                          if (isLoading || tagsContext.isLoading) {
                            return <RolesWorkbenchSkeleton onBack={() => {}} />;
                          }
                          if (isError || tagsContext.error) {
                            return <StateRedirect path="spaces.detail.entries.list" />;
                          }

                          return (
                            <RoleEditor
                              isLegacyOrganization={props.isLegacyOrganization}
                              {...data}
                              {...props}
                              tags={tagsContext.data}
                              entities={entities}
                              fetchEntity={fetchEntity}
                              openEntitySelectorForEntity={(entity) => {
                                return entitySelector.openFromRolesAndPermissions(
                                  entitySelectorSdk,
                                  entity
                                );
                              }}
                            />
                          );
                        }}
                      </RoleEditorFetcher>
                    </>
                  );
                }}
              </ReadTagsContext.Consumer>
            </MetadataTags>
          );
        }}
      </EntitiesContext.Consumer>
    </EntitiesProvider>
  );
}

RoleEditorRoute.defaultProps = {
  getEntities: () => ({ Entry: {}, Asset: {} }),
};

RoleEditorRoute.propTypes = {
  spaceId: PropTypes.string.isRequired,
  organizationId: PropTypes.string.isRequired,
  environmentId: PropTypes.string.isRequired,
  isLegacyOrganization: PropTypes.bool.isRequired,
  getContentTypes: PropTypes.func.isRequired,
  getEntities: PropTypes.func.isRequired,
  getEntity: PropTypes.func.isRequired,
  isNew: PropTypes.bool.isRequired,
};
