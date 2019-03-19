import _ from 'lodash';

export function getProjects(state, orgId) {
  return _.get(state, ['projects', orgId], null);
}
