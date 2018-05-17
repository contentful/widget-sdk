import { cloneDeep } from 'lodash'

export const ENTITY_TYPES = ['ContentType', 'Entry', 'Asset']
export const ACTIONS = ['create', 'save', 'auto_save', 'archive', 'unarchive', 'publish', 'unpublish', 'delete']
export const DISABLED = { ContentType: ['auto_save', 'archive', 'unarchive'] }
export const LABELS = {
  ContentType: 'Content type',
  Entry: 'Entry',
  Asset: 'Asset',
  create: 'Create',
  save: 'Save',
  auto_save: 'Autosave',
  archive: 'Archive',
  unarchive: 'Unarchive',
  publish: 'Publish',
  unpublish: 'Unpublish',
  delete: 'Delete'
}

// A map is the representation of topics as a nested object:
// {
//   "ContentType": {
//     "create": true
//   }
// }
//
export function createMap (defaultValue) {
  const map = {}

  ENTITY_TYPES.forEach(type => {
    map[type] = {}
    ACTIONS.forEach(action => map[type][action] = defaultValue)
  })

  return map
}

// Change value of specific action under given entity type.
// (!) All change* functions are pure (they return a new object)
export function changeAction (map, entityType, action, checked) {
  if (action === '*') {
    return changeAllActionsByEntityType(map, entityType, checked)
  }

  if (entityType === '*') {
    return changeAllTypesByAction(map, action, checked)
  }

  const result = cloneDeep(map)
  result[entityType][action] = checked
  return result
}

// Change value of all actions matching given entity type.
// (!) All change* functions are pure (they return a new object)
export function changeAllActionsByEntityType (map, entityType, value) {
  const result = cloneDeep(map)
  ACTIONS.filter(a => !isActionDisabled(entityType, a)).forEach(a => result[entityType][a] = value)
  return result
}

// Change specific action under all types.
// (!) All change* functions are pure (they return a new object)
export function changeAllTypesByAction (map, action, value) {
  const result = cloneDeep(map)
  ENTITY_TYPES.filter(t => !isActionDisabled(t, action)).forEach(t => result[t][action] = value)
  return result
}

// Return value of a specific action and entity type.
export function isActionChecked (map, type, action) {
  if (type === '*') {
    return isAllEntityTypesChecked(map, action)
  }

  if (action === '*') {
    return isAllActionsChecked(map, type)
  }

  return map[type][action]
}

export function isActionDisabled (type, action) {
  return DISABLED[type] && DISABLED[type].indexOf(action) > -1
}

// Is all actions *under given entity type* checked ?
export function isAllActionsChecked (map, entityType) {
  return ACTIONS.filter(a => !isActionDisabled(entityType, a)).every(a => map[entityType][a])
}

// Is all types *matching given action* checked ?
export function isAllEntityTypesChecked (map, action) {
  return ENTITY_TYPES.filter(t => !isActionDisabled(t, action)).every(t => map[t][action])
}

// It takes a map, and returns list of topics from given map. Output looks like this;
// [
//   "*.create",
//   "ContentType.*",
//   "Entry.Archive"
// ]
export function transformMapToTopics (map) {
  const result = []

  // Find wildcarded entity types and add them into the result array first
  ENTITY_TYPES.forEach(t => {
    // Is all actions in the same entity row checked ? Then early return, adding a wilcard record.
    if (isAllActionsChecked(map, t)) {
      result.push(`${t}.*`)
      return
    }

    ACTIONS.filter(a => !isActionDisabled(t, a)).forEach(a => {
      // Is this action checked for all entity types? Then push a wild card for it.
      const isAllChecked = isAllEntityTypesChecked(map, a)

      if (isAllChecked && result.indexOf(`*.${a}`) === -1) {
        result.push(`*.${a}`)
      } else if (!isAllChecked && map[t][a]) {
        // Otherwise, just push it without wildcard.
        result.push(`${t}.${a}`)
      }
    })
  })

  // If all entity types are wildcarded, then return ['*.*']
  if (result.length === ENTITY_TYPES.length && result.every(t => /^\w+\.\*$/.test(t))) {
    return ['*.*']
  }

  return result
}


// Take a list of topics, convert them into a simple map of entity types and actions:
export function transformTopicsToMap (topics) {
  if (topics.indexOf('*.*') > -1) return createMap(true)

  const map = createMap(false)

  topics.forEach(function (topic) {
    const [ entityType, action ]  = topic.split('.')

    if (entityType !== '*' && action !== '*') {
      map[entityType][action] = true
    } else if (entityType === '*') {
      ENTITY_TYPES.forEach(t => map[t][action] = true)
    } else {
      ACTIONS.forEach(a => map[entityType][a] = true)
    }
  })

  return map
}
