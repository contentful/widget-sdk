import { get } from 'lodash';

export default (state = {}, { type, meta, payload }) => {
  switch (type) {
    case 'LOADING_CONSTANTS_FOR_ORGS': {
      if (!get(meta, 'pending')) {
        return payload;
      }
    }
  }
  return state;
};
