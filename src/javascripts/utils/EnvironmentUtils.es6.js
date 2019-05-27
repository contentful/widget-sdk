import { get } from 'lodash';

export function isInsideMasterEnv(spaceContext) {
  return isMaster(spaceContext.space.environment);
}

export function isMaster(environment) {
  // if environment is not available, we assume it's the master environment.
  // TODO: Add aliases check when aliases become available.
  return get(environment, 'sys.id', 'master') === 'master';
}
