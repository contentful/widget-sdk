import * as TokenStore from 'services/TokenStore';
import * as K from 'core/utils/kefir';
import { get, isString } from 'lodash';

import _ from 'lodash';

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

  if (entity && entity.sys) {
    entityType = get(entity, 'sys.type');
  }

  return entitiesForUsageCheck.includes(entityType);
}

function getAuthorIdFor(entry) {
  return get(entry, 'data.sys.createdBy.sys.id');
}
