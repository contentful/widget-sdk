import React from 'react';
import { render, waitFor, screen, fireEvent } from '@testing-library/react';
import { track } from 'analytics/Analytics';
import { StartAppTrialModal } from './StartAppTrialModal';
import { EVENTS } from '../utils/analyticsTracking';

const onClose = jest.fn();
const onConfirm = jest.fn();

const build = () => {
  return render(<StartAppTrialModal isShown onClose={onClose} onConfirm={onConfirm} />);
};

jest.mock('analytics/Analytics', () => ({
  track: jest.fn(),
}));

jest.mock('states/Navigator', () => ({
  getCurrentStateName: jest.fn().mockReturnValue('current.state.name'),
}));

describe('StartAppTrialModal', () => {
  it('should render', () => {
    expect(build().baseElement).toMatchSnapshot();
  });

  it('fires off all needed events on confirm btn click', async () => {
    build();

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    await waitFor(() => fireEvent.click(screen.queryByTestId('confirm-button')!));

    expect(track).toHaveBeenCalledWith(`trial:${EVENTS.START_APP_TRIAL_MODAL}`, {
      fromState: 'current.state.name',
      elementId: 'confirm_button',
    });

    expect(onConfirm).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('fires off all needed events on cancel btn click', async () => {
    build();

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    await waitFor(() => fireEvent.click(screen.queryByTestId('cancel-button')!));

    expect(track).toHaveBeenCalledWith(`trial:${EVENTS.START_APP_TRIAL_MODAL}`, {
      fromState: 'current.state.name',
      elementId: 'cancel_button',
    });

    expect(onClose).toHaveBeenCalled();
  });
});
