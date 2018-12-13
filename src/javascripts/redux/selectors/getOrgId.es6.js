import { getPath } from './location.es6';
import ROUTES from '../routes.es6';

export default (state) => {
  const params = ROUTES.organization.partialTest(getPath(state));
  return params === null ? null : params.orgId;
}
