/**
 * @ngdoc service
 * @name states/Navigator
 * @description
 * A service to create state references from domain objects and go to these references.
 *
 * The state references created by this service contain both the state name and
 * the state params.
 *
 * ~~~js
 * Navigator.entity.makeRef({sys: {type: 'Entry', id: 'entry-id'}}
 * // Yields
 * {
 *   path: ['spaces', 'detail', 'entries', 'detail'],
 *   params: {entryId: 'entry-id'},
 *   options: {}
 * }
 * ~~~
 *
 * Instead of passing them around as separate arguments (as
 * Angular UI router does) we treat them as one value.
 */
import { get, isArray } from 'lodash';
import { getModule } from 'NgRegistry.es6';

const ENTITY_PLURALS = {
  Entry: 'entries',
  Asset: 'assets'
};

/**
 * @ngdoc method
 * @name state/Navigator#go:
 * @description
 * Like `$state.go()` but accepts a full state reference
 * @param {Navigator.Ref}
 * @returns {Promise<void>}
 */
export function go(state) {
  const $state = getModule('$state');
  return $state.go(
    isArray(state.path) ? state.path.join('.') : state.path,
    state.params,
    state.options
  );
}

/**
 * @ngdoc method
 * @name state/Navigator#href:
 * @description
 * Like `$state.href()` but accepts a full state reference
 * @param {Navigator.Ref}
 * @returns {string}
 */
export function href(state) {
  if (!state) {
    state = {
      path: []
    };
  }
  const $state = getModule('$state');
  return $state.href(isArray(state.path) ? state.path.join('.') : state.path, state.params);
}

/**
 * @ngdoc method
 * @name state/Navigator#makeEntityRef
 * @description
 * Creates a state reference for an entity or link object.
 *
 * @param {API.Entity|API.Link} entity}
 * @returns {Navigator.Ref}
 */
export function makeEntityRef(entity) {
  return {
    path: makeEntityPath(entity),
    params: makeEntityParams(entity),
    options: { inherit: false }
  };
}

/**
 * @ngdoc method
 * @name state/Navigator#getCurrentStateName:
 * @description
 * Returns current state name
 * @returns {String}
 */
export function getCurrentStateName() {
  const $state = getModule('$state');
  return get($state, ['current', 'name']);
}

function makeEntityPath(entity) {
  const type = getType(entity);
  const typePlural = ENTITY_PLURALS[type];

  if (isNonMasterEnv(entity)) {
    return ['spaces', 'detail', 'environment', typePlural, 'detail'];
  } else {
    return ['spaces', 'detail', typePlural, 'detail'];
  }
}

function makeEntityParams(entity) {
  const params = { addToContext: true, bulkEditor: '' };
  const type = getType(entity);
  const entityIdKey = type.toLowerCase() + 'Id';

  params[entityIdKey] = entity.sys.id;
  params.spaceId = get(entity, 'sys.space.sys.id');

  if (isNonMasterEnv(entity)) {
    params.environmentId = get(entity, 'sys.environment.sys.id');
  }

  return params;
}

function getType(entity) {
  if (entity.sys.type === 'Link') {
    return entity.sys.linkType;
  } else {
    return entity.sys.type;
  }
}

function isNonMasterEnv(entity) {
  // We need to determine the env we are navigating to based on the entity
  // entity will have a link to an environment (but wont have alias information)
  // this will work as long as APIs re-write env ids with alias ids in responses
  const spaceEnvId = get(entity, 'sys.environment.sys.id');
  const isMasterEnv = spaceEnvId === 'master';

  return spaceEnvId && !isMasterEnv;
}
