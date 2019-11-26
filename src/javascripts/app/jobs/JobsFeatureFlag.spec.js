import React from 'react';
import { render, cleanup } from '@testing-library/react';
import { trackAlphaEligibilityToIntercom } from './Analytics/JobsAnalytics';

import BooleanSpaceFeature from 'utils/ProductCatalog/BooleanSpaceFeature';

import JobsFeatureFlag from './JobsFeatureFlag';

jest.mock('utils/ProductCatalog/BooleanSpaceFeature', () => jest.fn().mockReturnValue(null));
jest.mock('./Analytics/JobsAnalytics');
describe('<JobsFeatureFlag />', () => {
  afterEach(() => {
    jest.clearAllMocks();
    cleanup();
  });

  const build = () => {
    const props = {
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

  it('does not track to intercom if ff is off', () => {
    mockBooleanFeatureFlag(false);

    const [, props] = build();

    expect(props.children).toHaveBeenCalledWith({ currentVariation: false });
    expect(trackAlphaEligibilityToIntercom).not.toHaveBeenCalled();
  });
});
function mockBooleanFeatureFlag(currentVariation) {
  BooleanSpaceFeature.mockImplementation(({ children }) => children({ currentVariation }));
}
