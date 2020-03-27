import { flow, get } from 'lodash/fp';
import getToken from './getToken';

export default flow(getToken, get('organization'));
