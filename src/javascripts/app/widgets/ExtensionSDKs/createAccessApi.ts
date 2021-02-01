import { Action, getSpaceAuthContext } from 'access_control/AccessChecker';
import { AccessAPI } from 'contentful-ui-extensions-sdk';
import { get, isObject } from 'lodash';
import { createPatch } from 'rfc6902';

export const ALLOWED_ACTIONS = [
  Action.CREATE,
  Action.READ,
  Action.UPDATE,
  Action.DELETE,
  Action.PUBLISH,
  Action.UNPUBLISH,
  Action.ARCHIVE,
  Action.UNARCHIVE,
];

export const ALLOWED_TYPES = ['ContentType', 'EditorInterface', 'Entry', 'Asset'];

export function createAccessApi(
  getEntity: (type: string, id: string) => Promise<Record<string, any>>
): AccessAPI {
  return {
    can: async (action: string, entity: any) => {
      if (!ALLOWED_ACTIONS.includes(action)) {
        throw new Error('Action not supported');
      }

      let type = entity;

      if (typeof type !== 'string') {
        type = get(entity, ['sys', 'type']);
      }

      if (!ALLOWED_TYPES.includes(type)) {
        throw new Error('Entity type not supported');
      }

      const spaceAuthContext = getSpaceAuthContext() as any;
      if (!spaceAuthContext) {
        return false;
      }

      const patchingTypes = ['Entry', 'Asset'];
      const isPatching =
        action === Action.UPDATE && patchingTypes.includes(type) && isObject(entity);
      const hasValidId = typeof get(entity, ['sys', 'id']) === 'string';

      if (isPatching && hasValidId) {
        let currentEntity: any;
        try {
          currentEntity = await getEntity(type, entity.sys.id);
        } catch (_) {
          return false;
        }

        const patches = createPatch(currentEntity, entity);
        const validPatches = patches.filter((patch) => !patch.path.startsWith('/sys/')); // ignore changes to `sys` object

        // spaceAuthContext.can only takes single element in array [patch] while createPatch can result in multiple patches
        // we only allow a change if all patches can be applied
        return validPatches.every((patch) => spaceAuthContext.can(action, currentEntity, [patch]));
      }

      return spaceAuthContext.can(action, entity);
    },
    canEditAppConfig: async () => {
      const spaceAuthContext = getSpaceAuthContext() as any;

      if (!spaceAuthContext) {
        return false;
      }

      return spaceAuthContext.can(Action.UPDATE, 'settings');
    },
  };
}

// Locations: *
