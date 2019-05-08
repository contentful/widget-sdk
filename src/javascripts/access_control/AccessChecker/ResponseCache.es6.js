import { isObject, get, isString } from 'lodash';

let cache = {};
let context = null;

export function reset(_context) {
  cache = {};
  context = _context;
}

export function getResponse(action, entity, newEnforcement) {
  if (!context) {
    return false;
  }

  const { reasonsDenied, deniedEntities } = newEnforcement;
  const key = getCanResponseKey(action, entity);

  if (key) {
    let response = cache[key];
    if (![true, false].includes(response)) {
      response = context.can(action, entity);

      if (
        action === 'create' &&
        newEnforcement.length !== 0 &&
        reasonsDenied().length !== 0 &&
        isEntityDenied(entity, deniedEntities)
      ) {
        response = false;
      }

      cache[key] = response;
    }

    return response;
  }

  if (
    action === 'create' &&
    newEnforcement.length !== 0 &&
    reasonsDenied().length !== 0 &&
    isEntityDenied(entity, deniedEntities)
  ) {
    return false;
  }

  return context.can(action, entity);
}

function getCanResponseKey(action, entity) {
  let category = null;
  let id = null;

  if (isObject(entity)) {
    id = get(entity, 'sys.id', null);
    const type = get(entity, 'sys.type', null);
    category = ['Entry', 'Asset'].includes(type) ? 'specific' + type : null;
  } else if (isString(entity)) {
    id = 'none';
    category = 'general' + entity;
  }

  const segments = [action, category, id];
  if (segments.every(isString)) {
    return segments.join(',');
  }
}

function isEntityDenied(entity, deniedEntities) {
  let entityType = entity;

  if (entity.sys) entityType = get(entity, 'sys.type');

  return deniedEntities.includes(entityType);
}
