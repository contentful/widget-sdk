import { getState, State, EntityState } from 'data/CMA/EntityState';
import { Entity, EntitySys, PropertyBus, StreamBus } from 'app/entity_editor/Document/types';
import { EntityAction } from '../CMA/EntityActions';
import { EntityRepo } from '../CMA/EntityRepo';
import * as K from 'core/utils/kefir';
import { Property, Stream } from 'kefir';

type StateChange = { from: EntityState; to: EntityState };

export interface ResourceStateManager {
  apply(action: EntityAction): Promise<Entity | null>;

  stateChange$: Stream<StateChange, any>;
  state$: Property<EntityState, any>;
  inProgress$: Property<boolean, any>;
  inProgressBus: PropertyBus<boolean>;
}

/**
 * @description
 * Exports a factory that creates the resource manager for an entity
 * editor document.
 *
 * The resource state manager is responsible for changing the resource
 * state ('published', etc.) of an entity using the REST API and
 * reflecting the result on the document.
 *
 * The resource state manager is used by the `StateController` in the
 * entity editors.
 *
 * A resource state manager has the following properties.
 *
 * - `apply(action)` runs the given action on the document. `action` is
 *   a value constructed by `Action` from `data/CMA/EntityState`.
 *
 * - `stateChange$` is an event bus that emits a {from, to} pair
 *   whenever the state has changed. Values for these are constructed
 *   with `State` from `data/CMA/EntityState`.
 *
 * - `state$` is a property that holds the current state value. Values
 *   are constructed with `State`.
 *
 * - `inProgress$` is a boolean property that is true whenever a state
 *   change is in progress.
 */
export function create(config: {
  sys$: Property<EntitySys, any>;
  setSys: { (sys: EntitySys): void };
  getData: { (): Entity }; // Returns most actual entity data
  entityRepo: EntityRepo;
  preApplyFn?: { (): Promise<void> }; // Function that will be invoked before the status change API request
  forceChangedState$?: Property<boolean, any>;
}): ResourceStateManager {
  const { sys$, setSys, getData, entityRepo, preApplyFn, forceChangedState$ } = config;

  const state$: Property<EntityState, any> =
    forceChangedState$ === undefined
      ? sys$.map(getState).skipDuplicates()
      : sys$
          .merge(forceChangedState$) // allows to switch to "changed" as soon as there are local pending changes
          .map((value: EntitySys | boolean) => {
            if (typeof value === 'boolean') {
              return value && currentState === State.Published() ? State.Changed() : currentState;
            }
            return getState(value);
          })
          .filter((v) => !!v) // filter out the first "undefined" appearing because there's no currentState yet
          .toProperty()
          .skipDuplicates();

  let currentState: EntityState;
  state$.onValue((state) => {
    currentState = state;
  });

  const stateChangeBus: StreamBus<StateChange> = K.createBus();
  const stateChange$ = stateChangeBus.stream;
  sys$.onEnd(stateChangeBus.end);

  const inProgressBus: PropertyBus<boolean> = K.createPropertyBus(false);
  const inProgress$ = inProgressBus.property.skipDuplicates();

  return { apply, stateChange$, state$, inProgress$, inProgressBus };

  /**
   * Apply an action to an entity, calling "preApplyFn" before and changing the entity status as a result.
   */
  async function apply(action: EntityAction): Promise<Entity | null> {
    const previousState = currentState;
    inProgressBus.set(true);

    let data: Entity | null;
    try {
      if (preApplyFn) {
        await preApplyFn();
      }
      data = await entityRepo.applyAction(action, currentState, getData());
    } catch (error) {
      inProgressBus.set(false);
      throw error;
    }

    // Deleting does not return any data.
    if (data?.sys) {
      update(data.sys, previousState);
    }
    inProgressBus.set(false);
    return data;
  }

  /**
   * Update the entity state and notify stateChangeBus.
   */
  function update(newSys: EntitySys, previousState: EntityState): void {
    const nextState = getState(newSys);
    setSys(newSys);
    if (previousState !== nextState) {
      stateChangeBus.emit({
        from: previousState,
        to: nextState,
      });
    }
  }
}
