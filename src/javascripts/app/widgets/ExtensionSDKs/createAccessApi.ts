import { Action, getSpaceAuthContext } from 'access_control/AccessChecker';
import { AccessAPI } from 'contentful-ui-extensions-sdk';
import { get, isObject } from 'lodash';
import { compare } from 'fast-json-patch';

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

const PATCHABLE_TYPES = ['Entry', 'Asset'];

export const ALLOWED_TYPES = ['ContentType', 'EditorInterface', 'Entry', 'Asset'];

export function createAccessApi({ getEntry, getAsset }): AccessAPI {
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

      const isPatching =
        action === Action.UPDATE && PATCHABLE_TYPES.includes(type) && isObject(entity);
      const hasValidId = typeof get(entity, ['sys', 'id']) === 'string';

      const getEntity = (type: string, id: string): Promise<Record<string, any>> => {
        if (type === 'Entry') {
          return getEntry(id);
        } else if (type === 'Asset') {
          return getAsset(id);
        } else {
          throw new Error(`Entity type: "${type}" is invalid`);
        }
      };

      if (isPatching && hasValidId) {
        let currentEntity: any;
        try {
          currentEntity = await getEntity(type, entity.sys.id);
        } catch (_) {
          return false;
        }

        const patches = compare(currentEntity, entity);
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
