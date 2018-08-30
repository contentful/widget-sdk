import { caseof } from 'sum-types/caseof-eq';
import { constant } from 'lodash';
import $q from '$q';
import { Action, makePerform } from 'data/CMA/EntityActions.es6';

/**
 * @ngdoc service
 * @name data/CMA/EntityState
 * @description
 * This service exports functions to manage the state of an entity.
 */

export const State = {
  /**
   * @ngdoc method
   * @name data/CMA/EntityState#State.Deleted
   * @returns {data/CMA/EntityState.State}
   */
  Deleted: constant('__DELETED__'),
  /**
   * @ngdoc method
   * @name data/CMA/EntityState#State.Archived
   * @returns {data/CMA/EntityState.State}
   */
  Archived: constant('__ARCHIVED__'),
  /**
   * @ngdoc method
   * @name data/CMA/EntityState#State.Draft
   * @returns {data/CMA/EntityState.State}
   */
  Draft: constant('__DRAFT__'),
  /**
   * @ngdoc method
   * @name data/CMA/EntityState#State.Changed
   * @returns {data/CMA/EntityState.State}
   */
  Changed: constant('__CHANGED__'),
  /**
   * @ngdoc method
   * @name data/CMA/EntityState#State.Published
   * @returns {data/CMA/EntityState.State}
   */
  Published: constant('__PUBLISHED__')
};

/**
 * @ngdoc method
 * @name data/CMA/EntityState#stateName
 * @param {data/CMA/EntityState.State} state
 * @returns {string}
 */
export function stateName(state) {
  return caseof(state, [
    [State.Deleted(), constant('deleted')],
    [State.Archived(), constant('archived')],
    [State.Draft(), constant('draft')],
    [State.Changed(), constant('changed')],
    [State.Published(), constant('published')]
  ]);
}

export { Action };

/**
 * @ngdoc method
 * @name data/CMA/EntityState#getState
 * @description
 * Returns the state of an entity with the given 'sys' property.
 * @param {API.Sys} sys
 * @returns {data/CMA/EntityState#State}
 */
export function getState(sys) {
  if (!sys || (sys.type !== 'Entry' && sys.type !== 'Asset')) {
    throw new TypeError('Invalid entity metadata object');
  }
  if (sys.deletedVersion) {
    return State.Deleted();
  } else if (sys.archivedVersion) {
    return State.Archived();
  } else if (sys.publishedVersion) {
    if (sys.version > sys.publishedVersion + 1) {
      return State.Changed();
    } else {
      return State.Published();
    }
  } else {
    return State.Draft();
  }
}

/**
 * @ngdoc method
 * @name data/CMA/EntityState#makeApply
 * @description
 * Apply an action to an entity to change its state.
 *
 * ~~~js
 * makeApply(spaceEndpoint)(Action.Publish(), entityPayload)
 * ~~~
 *
 * This is similar to 'data/CMA/EntityActions#makePerform()' but this
 * function might do multiple transitions. E.g. Publishing an archived
 * entry is possible by transitioning to a draft state first and then
 * publishing.
 *
 * 'spaceEndpoint' is a function to make the request to a space as defined in
 * the 'data/Endpoint' module.
 */
export function makeApply(spaceEndpoint) {
  const changeTo = makeChangeTo(spaceEndpoint);

  return function applyAction(action, data) {
    const targetState = caseof(action, [
      [Action.Publish(), State.Published],
      [Action.Unpublish(), State.Draft],
      [Action.Archive(), State.Archived],
      [Action.Unarchive(), State.Draft],
      [Action.Delete(), State.Deleted]
    ]);
    return changeTo(targetState, data);
  };
}

/**
 * A curried function that takes a space endpiont, a target entity
 * state and the entity data. It performs an API request to change the
 * entity to the target state and returns the updated entity data.
 */
function makeChangeTo(spaceEndpoint) {
  const performAction = makePerform(spaceEndpoint);

  return function changeTo(state, data) {
    if (state === State.Changed()) {
      throw new Error('"Changed" is not a valid entity target state');
    }

    const currentState = getState(data.sys);

    if (currentState === State.Deleted()) {
      throw new Error('Cannot change state of deleted entity');
    }

    return caseof(state, [
      [State.Draft(), () => toDraft(data)],
      [State.Deleted(), () => performActionWithDraftEnsured(Action.Delete(), data)],
      [State.Archived(), () => performActionWithDraftEnsured(Action.Archive(), data)],
      [
        State.Published(),
        () => {
          if (currentState === State.Changed()) {
            return performAction(Action.Publish(), data);
          } else {
            return performActionWithDraftEnsured(Action.Publish(), data);
          }
        }
      ]
    ]);
  };

  function toDraft(data) {
    return caseof(getState(data.sys), [
      [State.Published(), () => performAction(Action.Unpublish(), data)],
      [State.Changed(), () => performAction(Action.Unpublish(), data)],
      [State.Archived(), () => performAction(Action.Unarchive(), data)],
      [State.Draft(), () => $q.resolve(data)]
    ]);
  }

  function performActionWithDraftEnsured(action, data) {
    return toDraft(data).then(data => performAction(action, data));
  }
}
