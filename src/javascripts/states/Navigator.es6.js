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
import { get } from 'lodash';
import { getModule } from 'NgRegistry.es6';

const $state = getModule('$state');

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
  return $state.go(state.path.join('.'), state.params, state.options);
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
  return $state.href(state.path.join('.'), state.params, state.options);
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
  const spaceEnvId = get(entity, 'sys.environment.sys.id');
  const isMasterEnv = spaceEnvId === 'master';

  return spaceEnvId && !isMasterEnv;
}
