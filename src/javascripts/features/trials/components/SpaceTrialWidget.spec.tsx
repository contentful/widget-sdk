import React from 'react';
import { render, waitFor, screen, fireEvent } from '@testing-library/react';
import { SpaceTrialWidget } from './SpaceTrialWidget';
import { useTrialSpace as _useTrialSpace } from '../hooks/useTrialSpace';
import { track } from 'analytics/Analytics';

// Needed for ContactUsButton
global.open = jest.fn();

const build = () => render(<SpaceTrialWidget />);

jest.mock('analytics/Analytics', () => ({
  track: jest.fn(),
}));

jest.mock('core/services/SpaceEnvContext/useSpaceEnvContext', () => ({
  useSpaceEnvContext: jest.fn().mockReturnValue({
    currentSpaceId: '123',
    currentOrganizationId: '123',
  }),
}));

jest.mock('../hooks/useTrialSpace', () => ({
  useTrialSpace: jest.fn(),
}));

jest.mock('states/Navigator', () => ({
  getCurrentStateName: jest.fn().mockReturnValue('current.state.name'),
}));

const useTrialSpace = _useTrialSpace as jest.Mock;

describe('SpaceTrialWidget', () => {
  beforeEach(() => {
    useTrialSpace.mockReturnValue({
      isActiveTrialSpace: true,
    });
  });

  it('renders correctly when the space is on trial', async () => {
    build();

    await waitFor(() => expect(screen.queryByTestId('space-trial-widget')).toBeInTheDocument());
  });

  it('does not render when the space is not on trial', async () => {
    useTrialSpace.mockReturnValue({
      isActiveTrialSpace: false,
    });

    build();

    await waitFor(() => expect(screen.queryByTestId('space-trial-widget')).not.toBeInTheDocument());
  });

  it('does not render when the space is App Trial Space', async () => {
    useTrialSpace.mockReturnValue({
      isActiveTrialSpace: true,
      matchesAppsTrialSpaceKey: true,
    });

    build();

    await waitFor(() => expect(screen.queryByTestId('space-trial-widget')).not.toBeInTheDocument());
  });

  it('tracks the get_in_touch link click event', async () => {
    build();

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    await waitFor(() => fireEvent.click(screen.queryByTestId('cf-contact-us-button')!));

    expect(track).toHaveBeenCalledWith('trial:get_in_touch_clicked', {
      fromState: 'current.state.name',
    });
  });

  it('tracks the fair_use_policy link click event', async () => {
    build();

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    await waitFor(() => fireEvent.click(screen.queryByTestId('fair_use_policy_link')!));

    expect(track).toHaveBeenCalledWith('trial:fair_use_policy_clicked', {
      fromState: 'current.state.name',
    });
  });
});
