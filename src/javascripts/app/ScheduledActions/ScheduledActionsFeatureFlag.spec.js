import React from 'react';
import { render } from '@testing-library/react';
import { trackAlphaEligibilityToIntercom } from './Analytics/ScheduledActionsAnalytics';

import BooleanSpaceFeature from 'utils/ProductCatalog/BooleanSpaceFeature';

import ScheduledActionsFeatureFlag from './ScheduledActionsFeatureFlag';

jest.mock('utils/ProductCatalog/BooleanSpaceFeature', () => jest.fn().mockReturnValue(null));
jest.mock('./Analytics/ScheduledActionsAnalytics');
describe('<ScheduledActionsFeatureFlag />', () => {
  const build = () => {
    const props = {
      children: jest.fn().mockReturnValue(null),
    };
    return [render(<ScheduledActionsFeatureFlag {...props} />), props];
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
