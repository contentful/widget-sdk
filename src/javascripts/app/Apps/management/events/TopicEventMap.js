import { cloneDeep } from 'lodash';

export const ENTITY_TYPES = ['ContentType', 'Entry', 'Asset'];

export const ACTIONS = ['create', 'save', 'archive', 'unarchive', 'publish', 'unpublish', 'delete'];

export const ACTION_LABELS = {
  create: 'Create',
  save: 'Save',
  auto_save: 'Autosave',
  archive: 'Archive',
  unarchive: 'Unarchive',
  publish: 'Publish',
  unpublish: 'Unpublish',
  delete: 'Delete',
};

export const DISABLED_ACTIONS = {
  ContentType: ['archive', 'unarchive', 'auto_save'],
  Asset: ['auto_save'],
  Entry: ['auto_save'],
  AppInstallation: ACTIONS,
};

export const TYPE_LABELS = {
  ContentType: 'Content type',
  Entry: 'Entry',
  Asset: 'Asset',
  AppInstallation: 'App Installation',
};

export function createMap(defaultValue) {
  const map = {};

  ENTITY_TYPES.forEach((type) => {
    map[type] = {};
    ACTIONS.forEach((action) => {
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
  ACTIONS.filter((a) => !isActionDisabled(entityType, a)).forEach((a) => {
    result[entityType][a] = value;
  });
  return result;
}

// Change specific action under all types.
// This function is pure and returns a new object
export function changeAllTypesByAction(map, action, value) {
  const result = cloneDeep(map);
  ENTITY_TYPES.filter((t) => !isActionDisabled(t, action)).forEach((t) => {
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
  return DISABLED_ACTIONS[type] && DISABLED_ACTIONS[type].includes(action);
}

// Is all actions *under given entity type* checked ?
export function areAllActionsChecked(map, entityType) {
  return ACTIONS.filter((a) => !isActionDisabled(entityType, a)).every((a) => map[entityType][a]);
}

// Is all types *matching given action* checked ?
export function areAllEntityTypesChecked(map, action) {
  return ENTITY_TYPES.filter((t) => !isActionDisabled(t, action)).every((t) => map[t][action]);
}

// It takes a map, and returns list of topics from given map. Output looks like this;
// [
//   "ContentType.save",
//   "Entry.archive"
// ]
export function transformMapToTopics(map) {
  const result = [];

  ENTITY_TYPES.forEach((t) => {
    ACTIONS.filter((a) => !isActionDisabled(t, a)).forEach((a) => {
      if (map[t][a]) {
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

  const map = createMap(false);

  topics.forEach((topic) => {
    const [entityType, action] = topic.split('.');

    if (entityType !== '*' && action !== '*') {
      map[entityType][action] = true;
    } else if (entityType === '*') {
      ENTITY_TYPES.forEach((t) => {
        map[t][action] = true;
      });
    } else if (action === '*') {
      ACTIONS.forEach((a) => {
        map[entityType][a] = true;
      });
    }
  });

  return map;
}
