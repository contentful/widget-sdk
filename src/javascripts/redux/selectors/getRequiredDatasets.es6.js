import { getPath } from './location.es6';
import getOrgRole from './getOrgRole.es6';
import { flatMap, flow, isString, uniq } from 'lodash/fp';
import ROUTES from '../routes.es6';

function getRequiredDatasets(state, routes = ROUTES) {
  const path = getPath(state);
  const orgRole = getOrgRole(state);
  // path is not yet available
  if (!path) {
    return null;
  }
  return flow(
    // get all routes
    Object.values,
    // this gets the datasets of the matching route and all parents
    // effectively parents gives their dataset requirements to all their children
    flatMap(route => {
      const { partialTest, children, requiredDataSets = [] } = route;
      const datasets = (partialTest(path) ? requiredDataSets : [])
        // accumulate all the datasets that have to be loaded for the current state
        .reduce((acc, ds) => {
          // constants are always loaded
          if (isString(ds)) {
            return acc.concat([ds]);
          }
          // orgRole is required and not yet available
          if (ds.orgRoles && !orgRole) {
            return acc.concat(null);
          }
          // objects are used to limit loading of datasets to specific org roles
          if (ds.orgRoles && ds.orgRoles.includes(orgRole)) {
            return acc.concat(ds.datasets);
          }
          return acc;
        }, []);
      return children ? datasets.concat(getRequiredDatasets(state, children)) : datasets;
    }),
    uniq
  )(routes);
}

export default getRequiredDatasets;
