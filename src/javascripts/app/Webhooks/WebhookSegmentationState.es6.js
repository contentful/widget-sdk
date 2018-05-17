import { cloneDeep } from 'lodash'

export const ENTITY_TYPES = ['ContentType', 'Entry', 'Asset']
export const ACTIONS = ['create', 'save', 'auto_save', 'archive', 'unarchive', 'publish', 'unpublish', 'delete']
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
  ACTIONS.forEach(a => map[entityType][a] = value)
  return result
}

// Change specific action under all types.
// (!) All change* functions are pure (they return a new object)
export function changeAllTypesByAction (map, action, value) {
  const result = cloneDeep(map)
  ENTITY_TYPES.forEach(t => map[t][action] = value)
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

// Is all actions *under given entity type* checked ?
export function isAllActionsChecked (map, type) {
  return ACTIONS.every(a => map[type][a])
}

// Is all types *matching given action* checked ?
export function isAllEntityTypesChecked (map, action) {
  return ENTITY_TYPES.every(t => map[t][action])
}

// It takes a map, and returns list of topics from given map. Output looks like this;
// [
//   "*.create",
//   "ContentType.*",
//   "Entry.Archive"
// ]
export function transformMapToTopics (map) {
  const result = []
  const wildcardedActions = {}
  let allEventsSelected = true

  // Find wildcarded actions first and push them into the result array.
  ACTIONS.forEach(action => {
    if (!isAllEntityTypesChecked(map, action)) {
      allEventsSelected = false
      return
    }

    wildcardedActions[action] = true
    result.push(`*.${action}`)
  })

  if (allEventsSelected) {
    return [
      "*.*"
    ]
  }

  ENTITY_TYPES.forEach(typeName => {
    if (isAllActionsChecked(map, typeName)) {
      result.push(`${typeName}.*`)
      return
    }

    // Having wildcarded stuff on top of the list,
    // now add rest of the checked topics
    ACTIONS.forEach(a => {
      if (wildcardedActions[a] || map[typeName][a] !== true) {
        return
      }

      result.push(`${typeName}.${a}`)
    })
  })

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
2016
