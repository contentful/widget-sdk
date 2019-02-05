import { get, pickBy, find, defaultTo, flow } from 'lodash/fp';
import { getPath } from './location.es6';
import ROUTES from '../routes.es6';
import getSpacesByOrgId from './getSpacesByOrgId.es6';

// get's the id of the current org, set via url param or indirectly via space id in url and token
export default state => {
  const path = getPath(state);
  // location was not added to redux state yet
  if (!path) {
    return null;
  }
  // partialTest => also valid for child paths
  // https://github.com/troch/path-parser#pathpartialtestpath-string-opts-object-object--null
  const params = ROUTES.organization.partialTest(path);
  // if orgId is in path just return that
  if (params !== null) {
    return params.orgId;
  }
  // otherwise get active space
  const spaceId = get('spaceId', ROUTES.space.partialTest(path));
  if (!spaceId) {
    return null;
  }
  return flow(
    getSpacesByOrgId, // get all spaces for each org
    defaultTo({}),
    pickBy(find({ sys: { id: spaceId } })), // filter by current space id
    // get the related org id key for the space (can only be one, as a space can only belong to one org)
    Object.keys,
    get(0),
    defaultTo(null)
  )(state);
};
