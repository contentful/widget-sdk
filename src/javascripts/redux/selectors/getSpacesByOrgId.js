import { get, flow } from 'lodash/fp';
import getToken from './getToken';

export default flow(getToken, get('spaces'));
