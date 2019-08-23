import React from 'react';
import { render, cleanup } from '@testing-library/react';
import { trackAlphaEligibilityToIntercom } from './Analytics/JobsAnalytics.es6';

import BooleanFeatureFlag from 'utils/LaunchDarkly/BooleanFeatureFlag.es6';

import * as FeatureFlagKey from 'featureFlags.es6';
import JobsFeatureFlag from './JobsFeatureFlag.es6';

jest.mock('utils/LaunchDarkly/BooleanFeatureFlag.es6', () => jest.fn().mockReturnValue(null));
jest.mock('./Analytics/JobsAnalytics.es6');
describe('<JobsFeatureFlag />', () => {
  afterEach(() => {
    jest.clearAllMocks();
    cleanup();
  });

  const build = () => {
    const props = {
      featureFlagKey: FeatureFlagKey.JOBS,
      children: jest.fn().mockReturnValue(null)
    };
    return [render(<JobsFeatureFlag {...props} />), props];
  };

  it('tracks to intercom if ff is on', () => {
    mockBooleanFeatureFlag(true);

    const [, props] = build();

    expect(props.children).toHaveBeenCalledWith({ currentVariation: true });
    expect(trackAlphaEligibilityToIntercom).toHaveBeenCalled();
  });

  it('tracks to intercom if ff is off', () => {
    mockBooleanFeatureFlag(false);

    const [, props] = build();

    expect(props.children).toHaveBeenCalledWith({ currentVariation: false });
    expect(trackAlphaEligibilityToIntercom).not.toHaveBeenCalled();
  });
});
function mockBooleanFeatureFlag(currentVariation) {
  BooleanFeatureFlag.mockImplementation(({ children }) => children({ currentVariation }));
}
