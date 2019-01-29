import { uniq, flow, flatMap } from 'lodash/fp';
import Parser from 'path-parser';

import { TEAMS, USERS, ORG_MEMBERSHIPS, TEAM_MEMBERSHIPS } from './datasets.es6';

// required datasets and features are inherited by children
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
            requiredDataSets: [USERS, ORG_MEMBERSHIPS]
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

export function getRequiredDataSets(path, routes = ROUTES) {
  if (!path) {
    return [];
  }
  return flow(
    // get all routes
    Object.values,
    // this gets the datasets of the matching route and all parents
    // effectively parents gives their dataset requirements to all their children
    flatMap(({ partialTest, children, requiredDataSets = [] }) => {
      const dataSets = partialTest(path) ? requiredDataSets : [];
      return children ? dataSets.concat(getRequiredDataSets(path, children)) : dataSets;
    }),
    uniq
  )(routes);
}

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
