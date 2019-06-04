export function isInsideMasterEnv(spaceContext) {
  return isMaster(spaceContext.getEnvironmentId());
}

export function isMaster(environmentId) {
  // if environment is not available, we assume it's the master environment.
  // TODO: Add aliases check when aliases become available.
  return environmentId === 'master';
}
