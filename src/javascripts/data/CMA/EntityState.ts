import { caseof } from 'sum-types/caseof-eq';
import { constant } from 'lodash';
import { Action, EntityAction, makePerform } from './EntityActions';
import { Entity, EntitySys } from 'app/entity_editor/Document/types';
import { SpaceEndpoint } from 'data/CMA/types';

export type EntityState =
  | '__DELETED__'
  | '__ARCHIVED__'
  | '__DRAFT__'
  | '__CHANGED__'
  | '__PUBLISHED__';
export { Action };

export const State = {
  Deleted: constant<EntityState>('__DELETED__'),
  Archived: constant<EntityState>('__ARCHIVED__'),
  Draft: constant<EntityState>('__DRAFT__'),
  Changed: constant<EntityState>('__CHANGED__'),
  Published: constant<EntityState>('__PUBLISHED__'),
};

export function stateName(state: EntityState): string {
  return caseof(state, [
    [State.Deleted(), constant('deleted')],
    [State.Archived(), constant('archived')],
    [State.Draft(), constant('draft')],
    [State.Changed(), constant('changed')],
    [State.Published(), constant('published')],
  ]);
}

/**
 * Return the state of an entity with the given 'sys' property.
 */
export function getState(sys: EntitySys): EntityState {
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
  }
  return State.Draft();
}

/**
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
export function makeApply(spaceEndpoint: SpaceEndpoint) {
  const changeTo = makeChangeTo(spaceEndpoint);

  return function applyAction(action: EntityAction, uiState: EntityState, data: Entity) {
    const targetState = caseof(action, [
      [Action.Publish(), State.Published],
      [Action.Unpublish(), State.Draft],
      [Action.Archive(), State.Archived],
      [Action.Unarchive(), State.Draft],
      [Action.Delete(), State.Deleted],
    ]);
    return changeTo(targetState, uiState, data);
  };
}

/**
 * A curried function that takes a space endpoint, a target entity
 * state and the entity data. It performs an API request to change the
 * entity to the target state and returns the updated entity data.
 */
function makeChangeTo(spaceEndpoint: SpaceEndpoint) {
  const performAction = makePerform(spaceEndpoint);

  return function changeTo(state: EntityState, uiState: EntityState, data: Entity) {
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
          if ([currentState, uiState].includes(State.Changed())) {
            return performAction(Action.Publish(), data);
          } else {
            return performActionWithDraftEnsured(Action.Publish(), data);
          }
        },
      ],
    ]);
  };

  function toDraft(data: Entity) {
    return caseof(getState(data.sys), [
      [State.Published(), () => performAction(Action.Unpublish(), data)],
      [State.Changed(), () => performAction(Action.Unpublish(), data)],
      [State.Archived(), () => performAction(Action.Unarchive(), data)],
      [State.Draft(), () => Promise.resolve(data)],
    ]);
  }

  function performActionWithDraftEnsured(action: EntityAction, data: Entity) {
    return toDraft(data).then((data) => performAction(action, data));
  }
}
