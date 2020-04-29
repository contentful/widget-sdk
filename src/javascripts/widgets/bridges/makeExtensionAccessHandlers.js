import { get } from 'lodash';
import { can, Action } from 'access_control/AccessChecker';

const ALLOWED_ACTIONS = [
  Action.CREATE,
  Action.READ,
  Action.UPDATE,
  Action.DELETE,
  Action.PUBLISH,
  Action.UNPUBLISH,
  Action.ARCHIVE,
  Action.UNARCHIVE,
];

const ALLOWED_TYPES = ['ContentType', 'EditorInterface', 'Entry', 'Asset'];

export default function makeExtensionAccessHandlers() {
  return function checkAccess(action, entity) {
    if (!ALLOWED_ACTIONS.includes(action)) {
      throw new Error('Action not supported');
    }

    // We allow checks on strings (entity type as in `sys.type`)
    // or full entity objects.
    let type = entity;
    if (typeof type !== 'string') {
      type = get(entity, ['sys', 'type']);
    }

    if (!ALLOWED_TYPES.includes(type)) {
      throw new Error('Entity type not supported');
    }

    return can(action, entity);
  };
}
