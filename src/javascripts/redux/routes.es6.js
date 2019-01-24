import { uniq, flow, flatMap } from 'lodash/fp';
import Parser from 'path-parser';

import { TEAMS, USERS, ORG_MEMBERSHIPS, TEAM_MEMBERSHIPS } from './datasets.es6';

const ROUTES = {
  organization: {
    path: '/account/organizations/:orgId',
    children: {
      teams: {
        path: '/teams',
        requiredDataSets: [TEAMS, TEAM_MEMBERSHIPS],
        children: {
          team: {
            path: '/:teamId',
            requiredDataSets: [USERS, ORG_MEMBERSHIPS, TEAM_MEMBERSHIPS]
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
    flatMap(({ partialTest, children, requiredDataSets = [] }) => {
      const dataSets = partialTest(path) ? requiredDataSets : [];
      return children ? dataSets.concat(getRequiredDataSets(path, children)) : dataSets;
    }),
    uniq
  )(Object.values(routes));
}

export default ROUTES;
