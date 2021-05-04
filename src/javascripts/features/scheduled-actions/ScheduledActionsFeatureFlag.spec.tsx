import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { trackAlphaEligibilityToIntercom } from 'app/ScheduledActions/Analytics/ScheduledActionsAnalytics';

import { getSpaceFeature } from 'data/CMA/ProductCatalog';

import { ScheduledActionsFeatureFlag } from 'features/scheduled-actions';

jest.mock('data/CMA/ProductCatalog', () => ({
  ...(jest.requireActual('data/CMA/ProductCatalog') as object),
  getSpaceFeature: jest.fn().mockResolvedValue({ currentVariation: false }),
}));

jest.mock('app/ScheduledActions/Analytics/ScheduledActionsAnalytics');
describe('<ScheduledActionsFeatureFlag />', () => {
  const build = (): [ReturnType<typeof render>, { children: jest.Mock }] => {
    const props = {
      children: jest.fn().mockReturnValue(null),
    };
    return [render(<ScheduledActionsFeatureFlag {...props} />), props];
  };

  it('tracks to intercom if ff is on', async () => {
    (getSpaceFeature as jest.Mock).mockResolvedValue(true);

    const [, props] = build();

    await waitFor(() =>
      expect(props.children as jest.Mock).toHaveBeenCalledWith({ currentVariation: true })
    );
    expect(trackAlphaEligibilityToIntercom).toHaveBeenCalled();
  });

  it('does not track to intercom if ff is off', async () => {
    (getSpaceFeature as jest.Mock).mockResolvedValue(false);

    const [, props] = build();

    await waitFor(() =>
      expect(props.children as jest.Mock).toHaveBeenCalledWith({ currentVariation: false })
    );
    expect(trackAlphaEligibilityToIntercom).not.toHaveBeenCalled();
  });
});
