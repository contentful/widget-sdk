import { makeApply, getState, Action, State } from 'data/CMA/EntityState';
import * as K from 'core/utils/kefir';

export { Action, State };

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
 *
 * @param {Kefir.Property<EntitySys>} sys$
 * @param {{(sys: EntitySys): void}} setSys Updates the entity sys property
 * @param {{(): Entity}} getData Returns most actual entity data
 * @param {{(body, headers): Entity}} spaceEndpoint Endpoint request maker
 * @param {{(): Promise<void>} | null} preApplyFn Optional async function that will be invoked before the status change API request
 */
export function create(sys$, setSys, getData, spaceEndpoint, preApplyFn = null) {
  const applyAction = makeApply(spaceEndpoint);

  const state$ = sys$.map(getState).skipDuplicates();
  let currentState;
  state$.onValue((state) => {
    currentState = state;
  });

  const stateChangeBus = K.createBus();
  const stateChange$ = stateChangeBus.stream;
  sys$.onEnd(stateChangeBus.end);

  const inProgressBus = K.createPropertyBus(false);
  const inProgress$ = inProgressBus.property.skipDuplicates();

  return { apply, stateChange$, state$, inProgress$ };

  async function apply(action) {
    const previousState = currentState;
    inProgressBus.set(true);

    let data;
    try {
      if (preApplyFn) {
        await preApplyFn();
      }
      data = await applyAction(action, getData());
    } catch (error) {
      inProgressBus.set(false);
      throw error;
    }

    // Deleting does not return any data.
    if (data && data.sys) {
      update(data.sys, previousState);
    }
    inProgressBus.set(false);
    return data;
  }

  function update(newSys, previousState) {
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
