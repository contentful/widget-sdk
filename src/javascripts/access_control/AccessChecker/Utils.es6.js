import * as TokenStore from 'services/TokenStore.es6';
import * as K from 'utils/kefir.es6';
import { get, isString } from 'lodash';
import { getModule } from 'NgRegistry.es6';

import _ from 'lodash';

/**
 * TODO move from access checker or get rid of it entirely
 *
 * @description
 * Returns function that will check a status code of response.
 * If it's 403/4, it'll set "forbidden" key on a provided context object.
 *
 * @param {object} context
 * @returns {function}
 */
export function wasForbidden(context) {
  const $q = getModule('$q');

  return res => {
    if ([403, 404].includes(parseInt(get(res, 'statusCode'), 10))) {
      context.forbidden = true;
      // Using $q instead of native promises because it should update context
      // and trgger Angular digest circle.
      return $q.resolve(context);
    } else {
      return $q.reject(res);
    }
  };
}

export function toType(entity) {
  if (isString(entity)) {
    return entity;
  } else {
    return get(entity, 'sys.type', null);
  }
}

export function isAuthor(entity) {
  const author = getAuthorIdFor(entity);
  const currentUser = K.getValue(TokenStore.user$);

  return author === get(currentUser, 'sys.id');
}

export function getContentTypeIdFor(entry) {
  return get(entry, 'data.sys.contentType.sys.id');
}

// check for enforcements generated for entities not within their limits
export function shouldPerformNewUsageCheck(action, entity, newEnforcement, reasons) {
  const { reasonsDenied, deniedEntities } = newEnforcement;
  const isValidEntity = verifyEntityForNewUsageCheck(entity, deniedEntities);

  let result =
    action === 'create' &&
    Object.keys(newEnforcement).length > 0 &&
    isValidEntity &&
    reasonsDenied().length > 0;

  if (reasons) {
    result = result && (reasons.length === 0 || _.isEqual(reasons, reasonsDenied(action, entity)));
  }

  return result;
}

function verifyEntityForNewUsageCheck(entity, deniedEntities) {
  const entitiesForUsageCheck = deniedEntities || ['Entry', 'Asset', 'ContentType'];
  let entityType = entity;

  if (entity && entity.sys) entityType = get(entity, 'sys.type');

  return entitiesForUsageCheck.includes(entityType);
}

function getAuthorIdFor(entry) {
  return get(entry, 'data.sys.createdBy.sys.id');
}
