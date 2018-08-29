export function isInsideMasterEnv(spaceContext) {
  return spaceContext.getEnvironmentId() === 'master';
}
