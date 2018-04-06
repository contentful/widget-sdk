import {makeSum} from 'libs/sum-types';

const RequestState = makeSum({
  Pending: [],
  Success: [],
  Error: ['error']
});

export default RequestState;
