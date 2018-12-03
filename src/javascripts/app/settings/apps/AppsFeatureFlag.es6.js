import * as LD from 'utils/LaunchDarkly';

const FLAG_NAME = 'feature-te-11-2018-apps';

export function withAngularScope($scope, cb) {
  return LD.onFeatureFlag($scope, FLAG_NAME, value => cb(value));
}

export function getCurrent() {
  return LD.getCurrentVariation(FLAG_NAME);
}
