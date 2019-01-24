import { get, flow } from 'lodash/fp';
import getToken from './getToken.es6';

export default flow(
  getToken,
  get('spaces')
);
