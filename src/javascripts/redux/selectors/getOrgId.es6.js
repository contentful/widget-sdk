import { getPath } from './location.es6';
import ROUTES from '../routes.es6';

export default state => {
  const path = getPath(state);
  if (!path) {
    return null;
  }
  const params = ROUTES.organization.partialTest(path);
  if (params === null) {
    return null;
  }
  return params.orgId;
};
