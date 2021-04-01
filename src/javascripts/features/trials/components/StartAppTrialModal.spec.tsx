import React from 'react';
import { render, waitFor, screen, fireEvent } from '@testing-library/react';
import { track } from 'analytics/Analytics';
import { StartAppTrialModal } from './StartAppTrialModal';

const onClose = jest.fn();
const onConfirm = jest.fn();

const build = () => {
  return render(<StartAppTrialModal isShown onClose={onClose} onConfirm={onConfirm} />);
};

jest.mock('analytics/Analytics', () => ({
  track: jest.fn(),
}));

describe('StartAppTrialModal', () => {
  it('should render', () => {
    expect(build().baseElement).toMatchSnapshot();
  });

  it('fires off all needed events on click', async () => {
    build();

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    await waitFor(() => fireEvent.click(screen.queryByTestId('confirm-button')!));

    expect(track).toHaveBeenCalledWith('trial:app_trial_start_clicked', {});

    expect(onConfirm).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});
