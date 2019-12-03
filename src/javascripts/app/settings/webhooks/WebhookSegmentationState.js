import { cloneDeep } from 'lodash';

// We introduce this special object to mark double asterisk "*.*" wildcard.
// We check the reference with `===` in the component using this module.
export const WILDCARD = { isDoubleAsteriskWildcard: true };

export const ENTITY_TYPES = ['ContentType', 'Entry', 'Asset', 'EnvironmentAlias'];
export const ACTIONS = [
  'create',
  'save',
  'auto_save',
  'archive',
  'unarchive',
  'publish',
  'unpublish',
  'delete',
  'change_target'
];
const aliasActionIndex = ACTIONS.indexOf('change_target');

export const DISABLED = {
  ContentType: ['auto_save', 'archive', 'unarchive'],
  EnvironmentAlias: ACTIONS.slice(0, aliasActionIndex)
};

export const HIDDEN_ENTITY_TYPES = ['EnvironmentAlias'];
export const HIDDEN_ACTIONS = ['change_target', 'Change Target'];

export const TYPE_LABELS = {
  ContentType: 'Content type',
  Entry: 'Entry',
  Asset: 'Asset'
};

export const ACTION_LABELS = {
  create: 'Create',
  save: 'Save',
  auto_save: 'Autosave',
  archive: 'Archive',
  unarchive: 'Unarchive',
  publish: 'Publish',
  unpublish: 'Unpublish',
  delete: 'Delete',
  change_target: 'Change Target'
};

// for non content entity types, don't create a table row
export function shouldHideEntity(type) {
  return HIDDEN_ENTITY_TYPES.includes(type);
}

// for non content entity type actions, don't create a table column
export function shouldHideAction(action) {
  return HIDDEN_ACTIONS.includes(action);
}

// A map is the representation of topics as a nested object:
// {
//   "ContentType": {
//     "create": true
//   }
// }
//
export function createMap(defaultValue) {
  const map = {};

  ENTITY_TYPES.forEach(type => {
    map[type] = {};
    ACTIONS.forEach(action => {
      map[type][action] = defaultValue;
    });
  });

  return map;
}

// Change value of specific action under given entity type.
// This function is pure and returns a new object
export function changeAction(map, entityType, action, checked) {
  if (action === '*') {
    return changeAllActionsByEntityType(map, entityType, checked);
  }

  if (entityType === '*') {
    return changeAllTypesByAction(map, action, checked);
  }

  const result = cloneDeep(map);
  result[entityType][action] = checked;
  return result;
}

// Change value of all actions matching given entity type.
// This function is pure and returns a new object
export function changeAllActionsByEntityType(map, entityType, value) {
  const result = cloneDeep(map);
  ACTIONS.filter(a => !isActionDisabled(entityType, a)).forEach(a => {
    result[entityType][a] = value;
  });
  return result;
}

// Change specific action under all types.
// This function is pure and returns a new object
export function changeAllTypesByAction(map, action, value) {
  const result = cloneDeep(map);
  ENTITY_TYPES.filter(t => !isActionDisabled(t, action)).forEach(t => {
    result[t][action] = value;
  });
  return result;
}

// Return value of a specific action and entity type.
export function isActionChecked(map, type, action) {
  if (type === '*') {
    return areAllEntityTypesChecked(map, action);
  }

  if (action === '*') {
    return areAllActionsChecked(map, type);
  }

  return map[type][action];
}

export function isActionDisabled(type, action) {
  return DISABLED[type] && DISABLED[type].includes(action);
}

// Is all actions *under given entity type* checked ?
export function areAllActionsChecked(map, entityType) {
  return ACTIONS.filter(a => !isActionDisabled(entityType, a)).every(a => map[entityType][a]);
}

// Is all types *matching given action* checked ?
export function areAllEntityTypesChecked(map, action) {
  return ENTITY_TYPES.filter(t => !isActionDisabled(t, action) && !shouldHideEntity(t)).every(
    t => map[t][action]
  );
}

// It takes a map, and returns list of topics from given map. Output looks like this;
// [
//   "*.create",
//   "ContentType.*",
//   "Entry.Archive"
// ]
export function transformMapToTopics(map) {
  if (map === WILDCARD) {
    return ['*.*'];
  }

  const result = [];

  // Find wildcarded entity types and add them into the result array first
  ENTITY_TYPES.forEach(t => {
    // Is all actions in the same entity row checked ? Then early return, adding a wilcard record.
    if (areAllActionsChecked(map, t)) {
      result.push(`${t}.*`);
      return;
    }

    ACTIONS.filter(a => !isActionDisabled(t, a)).forEach(a => {
      // Is this action checked for all entity types? Then push a wild card for it.
      const allChecked = areAllEntityTypesChecked(map, a);

      if (allChecked && !result.includes(`*.${a}`)) {
        result.push(`*.${a}`);
      } else if (!allChecked && map[t][a]) {
        // Otherwise, just push it without wildcard.
        result.push(`${t}.${a}`);
      }
    });
  });

  return result;
}

// Take a list of topics, convert them into a simple map of entity types and actions:
export function transformTopicsToMap(topics) {
  if (!Array.isArray(topics) || topics.length < 1) {
    return createMap(false);
  }

  if (topics.includes('*.*')) {
    return WILDCARD;
  }

  const map = createMap(false);

  topics.forEach(topic => {
    const [entityType, action] = topic.split('.');

    if (entityType !== '*' && action !== '*') {
      map[entityType][action] = true;
    } else if (entityType === '*') {
      ENTITY_TYPES.forEach(t => {
        map[t][action] = true;
      });
    } else if (action === '*') {
      ACTIONS.forEach(a => {
        map[entityType][a] = true;
      });
    }
  });

  return map;
}
