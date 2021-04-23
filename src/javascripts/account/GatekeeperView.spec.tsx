import React from 'react';
import {
  render,
  fireEvent,
  screen,
  waitFor,
  waitForElementToBeRemoved,
} from '@testing-library/react';

import { GatekeeperView } from './GatekeeperView';

jest.mock('./UrlSyncHelper', () => ({
  getGatekeeperUrl: jest.fn().mockReturnValue('account/gatekeeperpage'),
}));

describe('GatekeeperView', () => {
  const props = {
    title: 'My Account Page',
  };

  const build = () => {
    return render(<GatekeeperView {...props} />);
  };

  it('renders the iframe with the correct url', () => {
    const { getByTestId } = build();

    expect(getByTestId('account-iframe')).toHaveAttribute('src', 'account/gatekeeperpage');
  });

  it('remove loading state when ready', async () => {
    const { getByTestId } = build();
    const iframe = getByTestId('account-iframe');
    const loadingState = screen.getByTestId('cf-loading-state');
    await waitFor(() => expect(loadingState).toBeVisible());

    fireEvent.load(iframe);

    process.nextTick(async () => {
      await waitForElementToBeRemoved(() => loadingState);
    });
  });
});
