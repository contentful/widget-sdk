import * as LD from 'utils/LaunchDarkly';

const FLAG_NAME = 'feature-te-11-2018-apps';

export function withAngularScope($scope, cb) {
  return LD.onFeatureFlag($scope, FLAG_NAME, value => cb(value));
}

export function isEnabled() {
  return LD.getCurrentVariation(FLAG_NAME);
}

export async function assertIsEnabled() {
  const enabled = await isEnabled();
  if (!enabled) {
    throw new Error('Apps not enabled');
  }
}
