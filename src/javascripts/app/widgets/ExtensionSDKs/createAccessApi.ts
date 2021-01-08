import { can, Action } from 'access_control/AccessChecker';
import { AccessAPI } from 'contentful-ui-extensions-sdk';
import { get } from 'lodash';

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

export function createAccessApi(): AccessAPI {
  return {
    can: (action: string, entity: any) => {
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

      return Promise.resolve(can(action, entity));
    },
    ...({
      canEditAppConfig: () => {
        return can(Action.UPDATE, 'settings');
      },
    } as any),
  };
}
