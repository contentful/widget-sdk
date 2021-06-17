import * as React from 'react';
import * as PolicyBuilder from 'access_control/PolicyBuilder';
import { captureWarning } from 'core/monitoring';
import RoleRepository from 'access_control/RoleRepository';
import noop from 'lodash/noop';
import StateRedirect from 'app/common/StateRedirect';
import { RolesWorkbenchSkeleton } from '../skeletons/RolesWorkbenchSkeleton';
import createFetcherComponent from 'app/common/createFetcherComponent';
import { Notification } from '@contentful/forma-36-react-components';
import * as accessChecker from 'access_control/AccessChecker';
import * as ResourceUtils from 'utils/ResourceUtils';
import { RoleEditor } from '../role_editor/RoleEditor';
import { EntitiesContext, EntitiesProvider } from '../role_editor/EntitiesProvider';
import DocumentTitle from 'components/shared/DocumentTitle';
import { SpaceFeatures, getSpaceFeature } from 'data/CMA/ProductCatalog';
import { entitySelector, useEntitySelectorSdk } from 'features/entity-search';
import { MetadataTags, ReadTagsContext } from 'features/content-tags';
import { useSpaceEnvContext, useSpaceEnvContentTypes } from 'core/services/SpaceEnvContext';
import { getBatchingApiClient } from 'app/widgets/WidgetApi/BatchingApiClient';
import { createAPIClient } from 'core/services/APIClient/utils';
import type { Role } from 'core/services/SpaceEnvContext/types';
import { useNavigationState, useParams } from 'core/react-routing';
import { useUnsavedChangesModal } from 'core/hooks';
import { useSpaceEnvCMAClient } from 'core/services/usePlainCMAClient';

export const RoleEditRoutes = {
  Details: {
    name: 'details',
    url: '/details',
    label: 'Role detail',
  },
  Content: {
    name: 'content',
    url: '/content',
    label: 'Content',
  },
  Media: {
    name: 'media',
    url: '/media',
    label: 'Media',
  },
  Permissions: {
    name: 'permissions',
    url: '/permissions',
    label: 'Permissions',
  },
};

const RoleEditorFetcher = createFetcherComponent(
  async ({ spaceId, getContentTypes, getEntities, isNew, resources }) => {
    const [
      contentTypes,
      hasEnvironmentAliasesEnabled,
      hasCustomRolesFeature,
      hasContentTagsFeature,
      resource,
    ] = await Promise.all([
      getContentTypes(),
      getSpaceFeature(spaceId, SpaceFeatures.ENVIRONMENT_ALIASING),
      accessChecker.canModifyRoles(),
      getSpaceFeature(spaceId, SpaceFeatures.PC_CONTENT_TAGS, false),
      resources.get('role'),
      getEntities(),
    ]);

    if (!hasCustomRolesFeature) {
      return {
        contentTypes,
        hasEnvironmentAliasesEnabled,
        hasCustomRolesFeature: false,
        hasContentTagsFeature,
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
        canModifyRoles: false,
      };
    }

    return {
      contentTypes,
      hasEnvironmentAliasesEnabled,
      hasCustomRolesFeature: true,
      hasContentTagsFeature,
      canModifyRoles: true,
    };
  }
);

export function RoleEditorRoute(props: { isNew: boolean }) {
  const { roleId } = useParams();
  const navigationState = useNavigationState<{ baseRoleId?: string }>();
  const baseRoleId = navigationState?.baseRoleId ?? null;

  const { registerSaveAction, setDirty } = useUnsavedChangesModal();

  const entitySelectorSdk = useEntitySelectorSdk();
  const { currentEnvironmentId, currentSpaceId, spaceResources } = useSpaceEnvContext();

  const { currentSpaceContentTypes } = useSpaceEnvContentTypes();
  const { spaceEnvCMAClient: cmaClient } = useSpaceEnvCMAClient();
  const roleRepo = React.useMemo(() => RoleRepository.getInstance(cmaClient), [cmaClient]);
  const [role, setRole] = React.useState<Role | null>(null);
  const [baseRole, setBaseRole] = React.useState(null);
  const apiClient = React.useMemo(
    () => createAPIClient(currentSpaceId, currentEnvironmentId),
    [currentSpaceId, currentEnvironmentId]
  );
  const batchingApiClient = React.useMemo(() => getBatchingApiClient(apiClient), [apiClient]);

  React.useEffect(() => {
    async function initRole() {
      const role = props.isNew ? RoleRepository.getEmpty() : await roleRepo.get(roleId);
      setRole(role);
    }

    initRole();
  }, [props.isNew, roleRepo, roleId]);

  React.useEffect(() => {
    async function getBaseRole() {
      const baseRole = baseRoleId ? await roleRepo.get(baseRoleId) : null;
      setBaseRole(baseRole);
    }

    getBaseRole();
  }, [baseRoleId, roleRepo]);

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
      captureWarning(new Error(`Could not find entity for given rule`), {
        extra: { type, id },
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
      ...PolicyBuilder.findEntryIds(role?.policies || []).map(async (entryId) => {
        const entity = await getEntity(entryId, 'entry');
        if (entity) {
          result.Entry[entryId] = entity;
        }
      }),
      ...PolicyBuilder.findAssetIds(role?.policies).map(async (assetId) => {
        const entity = await getEntity(assetId, 'asset');
        if (entity) {
          result.Asset[assetId] = entity;
        }
      }),
    ]);

    return result;
  }

  if (!role) {
    return <RolesWorkbenchSkeleton onBack={noop} />;
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
                        getContentTypes={() => currentSpaceContentTypes}
                        getEntities={fetchEntities}
                        isNew={props.isNew}
                        resources={spaceResources}>
                        {({ isLoading, isError, data }) => {
                          if (isLoading || tagsContext?.isLoading) {
                            return <RolesWorkbenchSkeleton onBack={noop} />;
                          }
                          if (isError || tagsContext?.error) {
                            return <StateRedirect path="spaces.detail.entries.list" />;
                          }

                          return (
                            <RoleEditor
                              {...data}
                              isNew={props.isNew}
                              role={role}
                              baseRole={baseRole}
                              roleRepo={roleRepo}
                              setDirty={setDirty}
                              registerSaveAction={registerSaveAction}
                              tags={tagsContext?.data}
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
