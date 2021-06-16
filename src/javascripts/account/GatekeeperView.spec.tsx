import React from 'react';
import {
  render,
  fireEvent,
  screen,
  waitFor,
  waitForElementToBeRemoved,
} from '@testing-library/react';
import { MemoryRouter } from 'core/react-routing';

import { GatekeeperView } from './GatekeeperView';

jest.mock('./UrlSyncHelper', () => ({
  getGatekeeperUrl: jest.fn().mockReturnValue('account/gatekeeperpage'),
}));

describe('GatekeeperView', () => {
  const props = {
    title: 'My Account Page',
  };

  const build = () => {
    return render(
      <MemoryRouter>
        <GatekeeperView {...props} />
      </MemoryRouter>
    );
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

    const waitForRemoval = waitForElementToBeRemoved(screen.queryByTestId('cf-loading-state'));
    fireEvent.load(iframe);
    await waitForRemoval;
  });
});
