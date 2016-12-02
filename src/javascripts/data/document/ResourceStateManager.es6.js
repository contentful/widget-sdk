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
 * The document resource manager is responsible for changing the
 * resource state ('published', etc.) of an entity. The changes are
 * synced back to the entity document.
 */
export function create (sys$, setSys, getData, spaceEndpoint) {
  const applyAction = makeApply(spaceEndpoint);

  const state$ = sys$.map(getState);
  let currentState;
  state$.onValue(function (state) {
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
    .then(function (data) {
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
    .finally(function () {
      inProgressBus.set(false);
    });
  }
}
