import { set } from 'lodash/fp';

// in contrast to the version from redux,
// this helper gives reducers the global state as a third argument,
// so they use selectors
export default reducerMap => (state = {}, action, globalState) =>
  Object.keys(reducerMap).reduce(
    (newState, reducerKey) =>
      set(
        reducerKey,
        reducerMap[reducerKey](state[reducerKey], action, globalState || state),
        newState
      ),
    {}
  );
