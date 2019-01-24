import { get, pickBy, find, defaultTo, flow } from 'lodash/fp';
import { getPath } from './location.es6';
import ROUTES from '../routes.es6';
import getSpacesByOrgId from './getSpacesByOrgId.es6';

export default state => {
  const path = getPath(state);
  if (!path) {
    return null;
  }
  const params = ROUTES.organization.partialTest(path);
  if (params === null) {
    const spaceId = get('spaceId', ROUTES.space.partialTest(path));
    if (!spaceId) {
      return null;
    }
    return flow(
      getSpacesByOrgId,
      defaultTo({}),
      pickBy(find({ sys: { id: spaceId } })),
      Object.keys,
      get(0),
      defaultTo(null)
    )(state);
  }
  return params.orgId;
};
