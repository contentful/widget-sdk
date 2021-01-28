import { Action, getSpaceAuthContext } from 'access_control/AccessChecker';
import { AccessAPI, EntryFieldAPI, EntrySys } from 'contentful-ui-extensions-sdk';
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

type Entry = {
  fields: EntryFieldAPI,
  sys: EntrySys
}

export const ALLOWED_TYPES = ['ContentType', 'EditorInterface', 'Entry', 'Asset'];
const spaceAuthContext = getSpaceAuthContext() as any;

export function createAccessApi(getCurrentEntry?: () => Entry): AccessAPI {
  return {
    can: (action: string, entity: any) => {
      if (!ALLOWED_ACTIONS.includes(action)) {
        throw new Error('Action not supported');
      }

      let type = entity;
      const isUpdatingEntry = Action.UPDATE === action && type === 'Entry' && isObject(entity);

      if (!spaceAuthContext) {
        return Promise.resolve(false);
      }

      if (typeof type !== 'string') {
        type = get(entity, ['sys', 'type']);
      }

      if (!ALLOWED_TYPES.includes(type)) {
        throw new Error('Entity type not supported');
      }

      if (isUpdatingEntry && getCurrentEntry) {
        const currentEntry = getCurrentEntry();
        const patches = createPatch(currentEntry, entity);

        // spaceAuthContext.can only takes single elemtn in array [patch] while createPatch can result in multiple patches
        // we only allow a change if all patches can be applied
        return Promise.resolve(patches.every(patch => spaceAuthContext.can(action, currentEntry, [patch])));
      }

      return Promise.resolve(spaceAuthContext.can(action, entity));
    },
    canEditAppConfig: () => {
      return Promise.resolve(spaceAuthContext.can(Action.UPDATE, 'settings'));
    },
  };
}
