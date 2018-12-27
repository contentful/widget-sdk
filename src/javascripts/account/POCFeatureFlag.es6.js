import * as LD from 'utils/LaunchDarkly/index.es6';

const FLAG_NAME = 'feature-bv-07-2018-enterprise-poc-spaces';

export default function isPOCEnabled() {
  return LD.getCurrentVariation(FLAG_NAME);
}
