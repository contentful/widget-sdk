import Parser from 'path-parser';

import {
  ORG_MEMBERSHIPS,
  ORG_SPACE_ROLES,
  ORG_SPACES,
  TEAM_MEMBERSHIPS,
  TEAM_SPACE_MEMBERSHIPS,
  TEAMS,
  USERS,
  __PROTOTYPE__PROJECTS
} from './datasets.es6';

/**
 * @description
 * Define routes in app and attributes of these routes
 *
 * Required datasets and features are inherited by children.
 *
 * Data will be refetched on user navigation, similar to how data is refetched when react lifecycles are used.
 * There is a limit how often this will happen, defined here (`MAX_AGE`): `redux/selectors/datasets.es6.js`
 *
 * Limiting for which roles a dataset is to be fetched is optional, If just the constant is given the dataset will always be fetched for that route.
 */
const ROUTES = {
  organization: {
    path: '/account/organizations/:orgId',
    children: {
      teams: {
        path: '/teams',
        requiredDataSets: [TEAMS, TEAM_MEMBERSHIPS],
        feature: 'teams',
        children: {
          team: {
            path: '/:teamId',
            requiredDataSets: [
              USERS,
              ORG_MEMBERSHIPS,
              TEAM_SPACE_MEMBERSHIPS,
              ORG_SPACES,
              { orgRoles: ['admin', 'owner'], datasets: [ORG_SPACE_ROLES] }
            ]
          }
        }
      },
      projects: {
        path: '/projects',
        requiredDataSets: [USERS, ORG_SPACES, __PROTOTYPE__PROJECTS, ORG_MEMBERSHIPS],
        children: {
          project: {
            path: '/:projectId'
          }
        }
      }
    }
  },
  space: {
    path: '/spaces/:spaceId'
  }
};

function addParser(route, parentPath) {
  const path = (parentPath || '') + route.path;
  const parser = new Parser(path);
  route.test = parser.test.bind(parser);
  route.partialTest = parser.partialTest.bind(parser);
  route.build = parser.build.bind(parser);
  if (route.children) {
    Object.values(route.children).forEach(child => addParser(child, path));
  }
}

Object.values(ROUTES).forEach(route => addParser(route));

// assumes if a route belongs to a feature, all children belong to that feature as well
export function getFeature(path, routes = ROUTES) {
  if (!path) {
    return null;
  }
  return Object.values(routes).reduce((pathFeature, { partialTest, children, feature }) => {
    // if one of the parents belongs to a feature, return that
    if (pathFeature) {
      return pathFeature;
    }
    // if this route matches and belongs to a feature, return that
    if (partialTest(path) && feature) {
      return feature;
    }
    // otherwise check if child route matches and has a feature
    return children ? getFeature(path, children) : null;
  }, null);
}

export default ROUTES;
