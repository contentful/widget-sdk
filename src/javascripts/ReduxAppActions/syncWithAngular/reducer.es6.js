import { some, merge } from 'lodash';

const scopeChanged = (state, payload) =>
  some(['organization', 'environments', 'space', 'user'], key => state[key] !== payload);

export default (state = {}, { type, payload }) => {
  // Ensure we don't change state if there was no change
  if (type === 'ANGULAR_SCOPE_UPDATE' && scopeChanged(state, payload)) {
    return merge(state, payload);
  }
  return state;
};
