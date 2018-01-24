import {isObject, get, isString} from 'lodash';

let cache = {};
let context = null;

export function reset (_context) {
  cache = {};
  context = _context;
}

export function getResponse (action, entity) {
  if (!context) {
    return false;
  }

  const key = getCanResponseKey(action, entity);
  if (key) {
    let response = cache[key];
    if (![true, false].includes(response)) {
      response = context.can(action, entity);
      cache[key] = response;
    }
    return response;
  }

  return context.can(action, entity);
}

function getCanResponseKey (action, entity) {
  let category = null;
  let id = null;

  if (isObject(entity)) {
    id = get(entity, 'sys.id', null);
    const type = get(entity, 'sys.type', null);
    category = ['Entry', 'Asset'].includes(type) ? ('specific' + type) : null;
  } else if (isString(entity)) {
    id = 'none';
    category = 'general' + entity;
  }

  const segments = [action, category, id];
  if (segments.every(isString)) {
    return segments.join(',');
  }
}
