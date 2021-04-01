import React from 'react';
import { render, waitFor, screen, fireEvent } from '@testing-library/react';
import * as fake from 'test/helpers/fakeFactory';
import { SpaceTrialWidget } from './SpaceTrialWidget';
import { getSpace } from 'services/TokenStore';
import { isSpaceOnTrial } from '../services/TrialService';
import { track } from 'analytics/Analytics';

// Needed for ContactUsButton
global.open = jest.fn();

const mockedSpace = fake.Space();

const build = (props?: unknown) => {
  return render(<SpaceTrialWidget spaceId={mockedSpace.sys.id} {...props} />);
};

jest.mock('analytics/Analytics', () => ({
  track: jest.fn(),
}));

jest.mock('services/TokenStore', () => ({
  getSpace: jest.fn(),
}));

jest.mock('../services/TrialService', () => ({
  isSpaceOnTrial: jest.fn(),
}));

describe('SpaceTrialWidget', () => {
  beforeEach(() => {
    (getSpace as jest.Mock).mockResolvedValue(mockedSpace);
    (isSpaceOnTrial as jest.Mock).mockReturnValue(true);
  });

  it('renders correctly when the space is on trial', async () => {
    build();

    await waitFor(() => expect(screen.queryByTestId('space-trial-widget')).toBeInTheDocument());
  });

  it('does not render when the space is not on trial', async () => {
    (isSpaceOnTrial as jest.Mock).mockReturnValue(false);

    build();

    await waitFor(() => expect(screen.queryByTestId('space-trial-widget')).not.toBeInTheDocument());
  });

  it('does not render when the space is App Trial Space', async () => {
    (isSpaceOnTrial as jest.Mock).mockReturnValue(false);

    build({ hasActiveAppTrial: true });

    await waitFor(() => expect(screen.queryByTestId('space-trial-widget')).not.toBeInTheDocument());
  });

  it('tracks the get_in_touch link click event', async () => {
    build();

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    await waitFor(() => fireEvent.click(screen.queryByTestId('cf-contact-us-button')!));

    expect(track).toHaveBeenCalledWith('trial:get_in_touch_clicked', {});
  });

  it('tracks the fair_use_policy link click event', async () => {
    build();

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    await waitFor(() => fireEvent.click(screen.queryByTestId('fair_use_policy_link')!));

    expect(track).toHaveBeenCalledWith('trial:fair_use_policy_clicked', {});
  });
});
