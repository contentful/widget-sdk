import RoleRepository from 'access_control/RoleRepository';
import * as ResourceUtils from 'utils/ResourceUtils';
import createUnsavedChangesDialogOpener from 'app/common/UnsavedChangesDialog';
import { isOwnerOrAdmin } from 'services/OrganizationRoles';
import * as PolicyBuilder from 'access_control/PolicyBuilder';
import * as logger from 'services/logger';
import { RoleEditorRoute, RolesListRoute } from 'features/roles-permissions-management';
import { getBatchingApiClient } from '../app/widgets/WidgetApi/BatchingApiClient';
import { getSpaceContext } from 'classes/spaceContext';

const list = {
  name: 'list',
  url: '',
  component: RolesListRoute,
  mapInjectedToProps: [
    () => {
      const spaceContext = getSpaceContext();
      return {
        spaceId: spaceContext.getId(),
        environmentId: spaceContext.getEnvironmentId(),
        isLegacyOrganization: ResourceUtils.isLegacyOrganization(spaceContext.organization),
        canUpgradeOrganization: isOwnerOrAdmin(spaceContext.organization),
      };
    },
  ],
};

export const RoleEditRoutes = {
  Details: {
    name: 'details',
    url: 'details',
    label: 'Role detail',
  },
  Content: {
    name: 'content',
    url: 'content',
    label: 'Content',
  },
  Media: {
    name: 'media',
    url: 'media',
    label: 'Media',
  },
  Permissions: {
    name: 'permissions',
    url: 'permissions',
    label: 'Permissions',
  },
};

const newRole = {
  name: 'new',
  url: '/new?{tab:string}',
  params: {
    baseRoleId: null,
    tab: {
      value: RoleEditRoutes.Details.url,
    },
  },
  resolve: {
    roleRepo: [
      // DI used as a workaround for child routes to wait for the spacecontext
      // to be initialized (defined in "src/javascripts/states/Spaces.js")
      'initializeSpaceContext',
      () => RoleRepository.getInstance(getSpaceContext().space),
    ],
    baseRole: [
      'roleRepo',
      '$stateParams',
      (roleRepo, $stateParams) =>
        $stateParams.baseRoleId ? roleRepo.get($stateParams.baseRoleId) : null,
    ],
  },
  component: RoleEditorRoute,
  mapInjectedToProps: [
    '$scope',
    'baseRole',
    ($scope, baseRole) => {
      const spaceContext = getSpaceContext();
      return {
        isNew: true,
        role: RoleRepository.getEmpty(),
        roleRepo: RoleRepository.getInstance(spaceContext.space),
        spaceId: spaceContext.getId(),
        environmentId: spaceContext.getEnvironmentId(),
        organizationId: spaceContext.organization.sys.id,
        baseRole,
        isLegacyOrganization: ResourceUtils.isLegacyOrganization(spaceContext.organization),
        getContentTypes: async () => {
          await spaceContext.publishedCTs.refresh();
          return spaceContext.publishedCTs.getAllBare();
        },
        registerSaveAction: (save) => {
          $scope.context.requestLeaveConfirmation = createUnsavedChangesDialogOpener(save);
          $scope.$applyAsync();
        },
        setDirty: (value) => {
          $scope.context.dirty = value;
          $scope.$applyAsync();
        },
      };
    },
  ],
};

const detail = {
  name: 'detail',
  url: '/:roleId?{tab:string}',
  params: {
    tab: {
      value: RoleEditRoutes.Details.url,
    },
  },
  resolve: {
    role: [
      '$stateParams',
      'initializeSpaceContext',
      ($stateParams) =>
        RoleRepository.getInstance(getSpaceContext().space).get($stateParams.roleId),
    ],
  },
  component: RoleEditorRoute,
  mapInjectedToProps: [
    '$scope',
    'role',
    ($scope, role) => {
      const spaceContext = getSpaceContext();
      const cma = getBatchingApiClient(spaceContext.cma);
      return {
        isNew: false,
        spaceId: spaceContext.getId(),
        environmentId: spaceContext.getEnvironmentId(),
        organizationId: spaceContext.organization.sys.id,
        role,
        roleRepo: RoleRepository.getInstance(spaceContext.space),
        isLegacyOrganization: ResourceUtils.isLegacyOrganization(spaceContext.organization),
        getEntity: async (id, type) => await fetchEntity(cma, id, type),
        getEntities: async () => {
          const result = {
            Entry: {},
            Asset: {},
          };
          await Promise.all([
            ...PolicyBuilder.findEntryIds(role.policies).map(async (entryId) => {
              const entity = await fetchEntity(cma, entryId, 'entry');
              if (entity) {
                result.Entry[entryId] = entity;
              }
            }),
            ...PolicyBuilder.findAssetIds(role.policies).map(async (assetId) => {
              const entity = await fetchEntity(cma, assetId, 'asset');
              if (entity) {
                result.Asset[assetId] = entity;
              }
            }),
          ]);

          return result;
        },
        getContentTypes: async () => {
          await spaceContext.publishedCTs.refresh();
          return spaceContext.publishedCTs.getAllBare();
        },
        registerSaveAction: (save) => {
          $scope.context.requestLeaveConfirmation = createUnsavedChangesDialogOpener(save);
          $scope.$applyAsync();
        },
        setDirty: (value) => {
          $scope.context.dirty = value;
          $scope.$applyAsync();
        },
      };
    },
  ],
};

// Trap and ignore "NotFound" errors -
// if an entity does not exist, the corresponding rule will be displayed as incomplete
async function fetchEntity(client, id, type) {
  try {
    let entity;
    switch (type) {
      case 'asset':
        entity = await client.getAsset(id);
        break;
      case 'entry':
        entity = await client.getEntry(id);
        break;
    }
    // Use app/entity_editor/DataLoader data structure:
    return { entity: { data: entity } };
  } catch (err) {
    if (err.code !== 'NotFound') {
      throw err;
    }
    logger.logWarn(`Could not find ${type} ${id} for rule`, {
      groupingHash: 'missingRolesAndPermissionsRuleEntity',
    });
  }
}

export const rolesPermissionsSettingsState = {
  name: 'roles',
  url: '/roles',
  abstract: true,
  children: [newRole, detail, list],
};
