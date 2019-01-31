import { flow, get } from 'lodash/fp';
import getToken from './getToken.es6';

export default flow(
  getToken,
  get('organization')
);
