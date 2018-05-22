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
import $state from '$state';

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
export function go (state) {
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
export function href (state) {
  if (!state) {
    state = {
      path: []
    };
  }
  return $state.href(state.path.join('.'), state.params);
}


/**
 * @ngdoc method
 * @name state/Navigator#makeEntityRef
 * @description
 * Creates a state reference for an entity or link object.
 *
 * @param {API.Entity|API.Link} entity}
 * @param {Boolean} useSpaceEnv} If space environments are enabled
 * @param {Boolean} isMasterEnv} If current env is the master/default env
 * @returns {Navigator.Ref}
 */
export function makeEntityRef (entity, spaceEnvId) {
  return {
    path: makeEntityPath(entity, spaceEnvId),
    params: makeEntityParams(entity)
  };
}

function makeEntityPath (entity, spaceEnvId) {
  const type = getType(entity);
  const typePlural = ENTITY_PLURALS[type];
  const isMasterEnv = spaceEnvId === 'master';

  if (spaceEnvId && !isMasterEnv) {
    return ['spaces', 'detail', 'environment', typePlural, 'detail'];
  } else {
    return ['spaces', 'detail', typePlural, 'detail'];
  }
}

function makeEntityParams (entity) {
  const params = {addToContext: true};
  const type = getType(entity);
  const entityIdKey = type.toLowerCase() + 'Id';
  params[entityIdKey] = entity.sys.id;

  return params;
}

function getType (entity) {
  if (entity.sys.type === 'Link') {
    return entity.sys.linkType;
  } else {
    return entity.sys.type;
  }
}
