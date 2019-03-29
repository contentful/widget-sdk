import { makeApply, getState, Action, State } from 'data/CMA/EntityState.es6';
import * as K from 'utils/kefir.es6';

export { Action, State };

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
export function create(sys$, setSys, getData, spaceEndpoint, docStateChangeBus) {
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

  function apply(action) {
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

          const nextState = getState(data.sys);
          const statesMap = {
            [State.Archived()]: 'archived',
            [State.Published()]: 'published'
          };

          // Document#docEventsBus doesn't emit changes of the document
          // status so we have to listen to those here.
          if (statesMap[nextState]) {
            docStateChangeBus.set({ name: statesMap[nextState], p: ['sys'] });
          } else if (previousState === State.Archived()) {
            docStateChangeBus.set({ name: 'unarchived', p: ['sys'] });
          } else if (
            previousState === State.Published() ||
            // When an entry is published, changed and then unpublished, it goes to Draft state.
            (previousState === State.Changed() && nextState === State.Draft())
          ) {
            docStateChangeBus.set({ name: 'unpublished', p: ['sys'] });
          }
        }
        return data;
      })
      .finally(() => {
        inProgressBus.set(false);
      });
  }
}
