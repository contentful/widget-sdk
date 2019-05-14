import { isObject, get, isString } from 'lodash';
import { shouldPerformNewUsageCheck } from './Utils.es6';

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

  const key = getCanResponseKey(action, entity);

  if (key) {
    let response = cache[key];
    if (![true, false].includes(response)) {
      response = getCanResponse(action, entity, context, newEnforcement);
      cache[key] = response;
    }

    return response;
  }

  return getCanResponse(action, entity, context, newEnforcement);
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

// Override Worf's `can` response to false
// when
// 1. user is allowed to carry out `action` on `entity` and
// 2. the new usage checker method is expected to be performed
function getCanResponse(action, entity, context, newEnforcement) {
  const isAllowed = context.can(action, entity);

  if (isAllowed && shouldPerformNewUsageCheck(action, entity, newEnforcement)) {
    return false;
  }

  return isAllowed;
}
