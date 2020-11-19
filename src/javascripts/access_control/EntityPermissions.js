import { partial } from 'lodash';
// TODO This module has global state :(
import * as accessChecker from 'access_control/AccessChecker';

/**
 * @ngdoc service
 * @name access_control/EntityPermissions
 * @description
 * Exports a factory that creates a permissions object for a given
 * entity.
 *
 * TODO This module depends on the global state of the 'accessChecker'
 * service.
 */

// There are more actions but we only use these for now
const ACTIONS = ['update', 'delete', 'publish', 'unpublish', 'archive', 'unarchive'];

/**
 * @ngdoc method
 * @name access_control/EntityPermissions#create
 * @description
 * The returned entity permissions object has the following methods
 *
 * - `can(action: string): boolean`
 * - `canEditFieldLocale(fieldId: string, localeCode): boolean`
 *
 * @param {API.EntitySys} sys
 * @returns {EntityPermissions}
 */
export function create(entity) {
  entity = { data: entity };

  return {
    can: partial(canPerformAction, entity),
    canEditFieldLocale: partial(canEditFieldLocale, entity),
  };
}

function canPerformAction(entity, action) {
  if (ACTIONS.indexOf(action) < 0) {
    throw new Error(`Unknown entity action "${action}"`);
  }
  const sys = entity.data.sys;

  if (action === 'update') {
    if (sys.type === 'Entry') {
      return accessChecker.canUpdateEntry(entity);
    } else if (sys.type === 'Asset') {
      return accessChecker.canUpdateAsset(entity);
    } else {
      throw new TypeError(`Unknown entity type "${sys.type}"`);
    }
  } else {
    return accessChecker.canPerformActionOnEntity(action, entity);
  }
}

function canEditFieldLocale(entity, fieldId, localeCode) {
  if (!canPerformAction(entity, 'update')) {
    return false;
  }

  const field = { apiName: fieldId };
  const locale = { code: localeCode };
  if (field) {
    return accessChecker.canEditFieldLocale(entity.data, field, locale);
  } else {
    return false;
  }
}
