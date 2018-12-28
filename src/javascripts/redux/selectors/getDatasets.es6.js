import { get } from 'lodash';

import getOrgId from './getOrgId.es6';

export default (state, { orgId } = {}) => get(state, ['datasets', orgId || getOrgId(state)], {});
