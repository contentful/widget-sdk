import { get } from 'lodash';
import { merge } from 'lodash/fp';

export default (state = {}, { type, meta, payload }) => {
  if (type === 'DATASET_LOADING' && !get(meta, 'pending')) {
    return merge(state, payload.datasets);
  }
  return state;
}
