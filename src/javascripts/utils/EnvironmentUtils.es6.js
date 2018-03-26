export function isInsideEnv (spaceContext) {
  return spaceContext.getEnvironmentId() !== undefined;
}

export function isInsideMasterEnv (spaceContext) {
  return spaceContext.getEnvironmentId() === 'master';
}
