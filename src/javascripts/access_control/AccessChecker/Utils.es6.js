import $q from '$q';
import $rootScope from '$rootScope';
import * as TokenStore from 'services/TokenStore';
import * as K from 'utils/kefir';
import {get, isString} from 'lodash';

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
export function wasForbidden (context) {
  return function (res) {
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

/**
 * TODO move from access checker or get rid of it entirely
 */
export function broadcastEnforcement (enforcement) {
  if (enforcement) {
    $rootScope.$broadcast('persistentNotification', {
      message: enforcement.message,
      actionMessage: enforcement.actionMessage,
      action: enforcement.action
    });
  }
}

/**
 * Remove all persistent notifications
*/
export function resetEnforcements () {
  $rootScope.$broadcast('resetPersistentNotification');
}

export function toType (entity) {
  if (isString(entity)) {
    return entity;
  } else {
    return get(entity, 'sys.type', null);
  }
}

export function isAuthor (entity) {
  const author = getAuthorIdFor(entity);
  const currentUser = K.getValue(TokenStore.user$);

  return author === get(currentUser, 'sys.id');
}

export function getContentTypeIdFor (entry) {
  return get(entry, 'data.sys.contentType.sys.id');
}

function getAuthorIdFor (entry) {
  return get(entry, 'data.sys.createdBy.sys.id');
}
