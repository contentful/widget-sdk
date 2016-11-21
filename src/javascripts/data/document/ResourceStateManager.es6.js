import {makeApply, getState, Action, State} from 'data/CMA/EntityState';
import * as K from 'utils/kefir';

export {Action, State};

// TODO document
// TODO unit tests
export function create (sys$, setSys, getData, spaceEndpoint) {
  const applyAction = makeApply(spaceEndpoint);

  const state$ = sys$.map(getState);
  let currentState;
  state$.onValue(function (state) {
    currentState = state;
  });

  const stateChangeBus = K.createBus();
  const stateChange$ = stateChangeBus.stream;

  return { apply, stateChange$, state$ };

  function apply (action) {
    const previousState = currentState;
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
    });
  }
}
