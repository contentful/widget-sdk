import RoleRepository from 'access_control/RoleRepository';
import * as ResourceUtils from 'utils/ResourceUtils';
import createUnsavedChangesDialogOpener from 'app/common/UnsavedChangesDialog';
import { isOwnerOrAdmin } from 'services/OrganizationRoles';
import { loadEntry, loadAsset } from 'app/entity_editor/DataLoader';
import * as PolicyBuilder from 'access_control/PolicyBuilder';
import * as logger from 'services/logger';
import { RoleEditorRoute, RolesListRoute } from 'features/roles-permissions-management';
import { mapRoutes, withRouteProvider } from 'core/routing';

const list = {
  name: 'list',
  url: '',
  component: RolesListRoute,
  mapInjectedToProps: [
    'spaceContext',
    (spaceContext) => {
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
  Details: { name: 'details', url: '/details', label: 'Role detail' },
  Content: { name: 'content', url: '/content', label: 'Content' },
  Media: { name: 'media', url: '/media', label: 'Media' },
  Permissions: { name: 'permissions', url: '/permissions', label: 'Permissions' },
};

const newRole = {
  redirectTo: '.details',
  name: 'new',
  url: '/new',
  params: {
    baseRoleId: null,
  },
  resolve: {
    roleRepo: ['spaceContext', (spaceContext) => RoleRepository.getInstance(spaceContext.space)],
    baseRole: [
      'roleRepo',
      '$stateParams',
      (roleRepo, $stateParams) =>
        $stateParams.baseRoleId ? roleRepo.get($stateParams.baseRoleId) : null,
    ],
  },
  children: mapRoutes(RoleEditRoutes),
  component: withRouteProvider(RoleEditorRoute),
  mapInjectedToProps: [
    '$scope',
    'spaceContext',
    'baseRole',
    ($scope, spaceContext, baseRole) => {
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
  redirectTo: '.details',
  name: 'detail',
  url: '/:roleId',
  resolve: {
    role: [
      'spaceContext',
      '$stateParams',
      (spaceContext, $stateParams) =>
        RoleRepository.getInstance(spaceContext.space).get($stateParams.roleId),
    ],
  },
  children: mapRoutes(RoleEditRoutes),
  component: withRouteProvider(RoleEditorRoute),
  mapInjectedToProps: [
    '$scope',
    'spaceContext',
    'role',
    ($scope, spaceContext, role) => {
      return {
        isNew: false,
        spaceId: spaceContext.getId(),
        environmentId: spaceContext.getEnvironmentId(),
        organizationId: spaceContext.organization.sys.id,
        role,
        roleRepo: RoleRepository.getInstance(spaceContext.space),
        isLegacyOrganization: ResourceUtils.isLegacyOrganization(spaceContext.organization),
        getEntities: async () => {
          const result = {
            Entry: {},
            Asset: {},
          };

          // Trap and ignore errors -
          // perhaps the entities do not exist or can't be accessed but the rule should still be displayed
          await Promise.all([
            ...PolicyBuilder.findEntryIds(role.policies).map(async (entityId) => {
              try {
                const entry = await loadEntry(spaceContext, entityId);
                result.Entry[entityId] = entry;
              } catch (_) {
                logger.logWarn(`Could not find entry ${entityId} for rule`, {
                  groupingHash: 'missingRolesAndPermissionsRuleEntity',
                });
              }
            }),
            ...PolicyBuilder.findAssetIds(role.policies).map(async (entityId) => {
              try {
                const asset = await loadAsset(spaceContext, entityId);
                result.Asset[entityId] = asset;
              } catch (_) {
                logger.logWarn(`Could not find asset ${entityId} for rule`, {
                  groupingHash: 'missingRolesAndPermissionsRuleEntity',
                });
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

export const rolesPermissionsSettingsState = {
  name: 'roles',
  url: '/roles',
  abstract: true,
  children: [newRole, detail, list],
};
