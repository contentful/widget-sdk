import {makeApply, getState, Action, State} from 'data/CMA/EntityState';
import * as K from 'utils/kefir';

export {Action, State};

/**
 * @ngdoc service
 * @name data/document/ResourceStateManager
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
export function create (sys$, setSys, getData, spaceEndpoint) {
  const applyAction = makeApply(spaceEndpoint);

  const state$ = sys$.map(getState);
  let currentState;
  state$.onValue(state => {
    currentState = state;
  });

  const stateChangeBus = K.createBus();
  const stateChange$ = stateChangeBus.stream;
  sys$.onEnd(stateChangeBus.end);

  const inProgressBus = K.createPropertyBus(false);
  const inProgress$ = inProgressBus.property;

  return { apply, stateChange$, state$, inProgress$ };

  function apply (action) {
    const previousState = currentState;
    inProgressBus.set(true);
    return applyAction(action, getData())
    .then(data => {
      // Deleting does not return any data.
      if (data && data.sys) {
        setSys(data.sys);
        stateChangeBus.emit({
          from: previousState,
          to: getState(data.sys)
        });
      }
      return data;
    })
    .finally(() => {
      inProgressBus.set(false);
    });
  }
}
