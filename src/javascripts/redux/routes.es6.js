import { uniq, flow, flatMap } from 'lodash/fp';
import Parser from 'path-parser';

import { TEAMS, ORG_MEMBERS } from './dataSets.es6';

const ROUTES = {
  organization: {
    path: '/account/organizations/:orgId',
    children: {
      teams: {
        path: '/teams',
        requiredDataSets: [ORG_MEMBERS, TEAMS],
        children: {
          team: { path: '/:teamId' }
        }
      }
    }
  }
};

function addParser(route, parent = null) {
  const path = (parent ? parent.path : '') + route.path;
  const parser = new Parser(path);
  route.test = parser.test.bind(parser);
  route.partialTest = parser.partialTest.bind(parser);
  route.build = parser.build.bind(parser);
  if (route.children) {
    Object.values(route.children).forEach(child => addParser(child, route));
  }
}

Object.values(ROUTES).forEach(addParser);

export function getRequiredDataSets(path, routes = ROUTES) {
  if (!path) {
    return [];
  }
  return flow(
    flatMap(({ partialTest, children, requiredDataSets = [] }) => {
        const dataSets = partialTest(path) ? requiredDataSets : [];
        return children ? dataSets.concat(getRequiredDataSets(path, children)) : dataSets;
      }
    ),
    uniq
  )(Object.values(routes));
}

export default ROUTES;
