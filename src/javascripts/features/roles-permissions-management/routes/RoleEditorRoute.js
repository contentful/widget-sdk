import * as React from 'react';
import * as PolicyBuilder from 'access_control/PolicyBuilder';
import * as logger from 'services/logger';
import RoleRepository from 'access_control/RoleRepository';
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
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { getModule } from 'core/NgRegistry';
import { go } from 'states/Navigator';
import createUnsavedChangesDialogOpener from 'app/common/UnsavedChangesDialog';
import { getBatchingApiClient } from 'app/widgets/WidgetApi/BatchingApiClient';
import { createAPIClient } from 'core/services/APIClient/utils';

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
  const {
    currentSpace,
    currentSpaceContentTypes,
    currentOrganization,
    currentOrganizationId,
    currentEnvironmentId,
    currentSpaceId,
  } = useSpaceEnvContext();
  const roleRepo = React.useMemo(() => RoleRepository.getInstance(currentSpace), [currentSpace]);
  const [role, setRole] = React.useState(null);
  const [baseRole, setBaseRole] = React.useState(null);
  const isLegacyOrganization = ResourceUtils.isLegacyOrganization(currentOrganization);
  const requestLeaveConfirmation = React.useRef();
  const isDirty = React.useRef(false);
  const apiClient = React.useMemo(() => createAPIClient(currentSpaceId, currentEnvironmentId), [
    currentSpaceId,
    currentEnvironmentId,
  ]);
  const batchingApiClient = React.useMemo(() => getBatchingApiClient(apiClient), [apiClient]);

  React.useEffect(() => {
    async function initRole() {
      const role = props.isNew ? RoleRepository.getEmpty() : await roleRepo.get(props.roleId);
      setRole(role);
    }

    initRole();
  }, [props.isNew, roleRepo, props.roleId]);

  React.useEffect(() => {
    async function getBaseRole() {
      const baseRole = props.baseRoleId ? await roleRepo.get(props.baseRoleId) : null;
      setBaseRole(baseRole);
    }

    getBaseRole();
  }, [props.baseRoleId, roleRepo]);

  React.useEffect(() => {
    const $rootScope = getModule('$rootScope');

    const unsubscribe = $rootScope.$on('$stateChangeStart', (event, toState, toStateParams) => {
      if (!isDirty.current || !requestLeaveConfirmation.current) return;

      event.preventDefault();
      requestLeaveConfirmation.current().then((confirmed) => {
        if (!confirmed) return;

        isDirty.current = false;
        return go({ path: toState.name, params: toStateParams });
      });
    });

    return unsubscribe;
  }, []);

  // Trap and ignore "NotFound" errors -
  // if an entity does not exist, the corresponding rule will be displayed as incomplete
  async function getEntity(id, type) {
    try {
      let entity;
      switch (type) {
        case 'asset':
          entity = await batchingApiClient.getAsset(id);
          break;
        case 'entry':
          entity = await batchingApiClient.getEntry(id);
          break;
      }
      // Use app/entity_editor/DataLoader data structure:
      return { entity: { data: entity } };
    } catch (err) {
      if (err.code !== 'NotFound') {
        throw err;
      }
      logger.captureWarning(new Error(`Could not find entity for given rule`), {
        type,
        id,
      });
    }
  }

  async function getEntities() {
    const result = {
      Entry: {},
      Asset: {},
    };

    if (props.isNew) return result;

    await Promise.all([
      ...PolicyBuilder.findEntryIds(role.policies).map(async (entryId) => {
        const entity = await getEntity(entryId, 'entry');
        if (entity) {
          result.Entry[entryId] = entity;
        }
      }),
      ...PolicyBuilder.findAssetIds(role.policies).map(async (assetId) => {
        const entity = await getEntity(assetId, 'asset');
        if (entity) {
          result.Asset[assetId] = entity;
        }
      }),
    ]);

    return result;
  }

  function registerSaveAction(save) {
    requestLeaveConfirmation.current = createUnsavedChangesDialogOpener(save);
  }

  function setDirty(value) {
    isDirty.current = value;
  }

  if (!role) {
    return <RolesWorkbenchSkeleton onBack={() => {}} />;
  }

  return (
    <EntitiesProvider getEntities={getEntities} getEntity={getEntity}>
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
                        spaceId={currentSpaceId}
                        organizationId={currentOrganizationId}
                        environmentId={currentEnvironmentId}
                        getContentTypes={() => currentSpaceContentTypes}
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
                              {...data}
                              {...props}
                              isLegacyOrganization={isLegacyOrganization}
                              role={role}
                              baseRole={baseRole}
                              roleRepo={roleRepo}
                              setDirty={setDirty}
                              registerSaveAction={registerSaveAction}
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

RoleEditorRoute.propTypes = {
  isNew: PropTypes.bool.isRequired,
  baseRoleId: PropTypes.string,
  roleId: PropTypes.string,
};
