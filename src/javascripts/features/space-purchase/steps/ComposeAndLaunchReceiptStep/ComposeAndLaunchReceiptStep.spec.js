import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { go } from 'states/Navigator';
import { getSpace } from 'services/TokenStore';

import { Space } from 'test/helpers/fakeFactory';
import { renderWithProvider } from '../../__tests__/helpers';
import { PLATFORM_CONTENT } from '../../utils/platformContent';
import { ComposeAndLaunchReceiptStep } from './ComposeAndLaunchReceiptStep';

const mockLastUsedSpace = Space();

jest.mock('states/Navigator', () => ({
  go: jest.fn(),
}));

jest.mock('services/TokenStore', () => ({
  getSpace: jest.fn(),
}));

jest.mock('core/services/BrowserStorage', () => {
  const store = {
    get: () => 'last_space_used_id',
  };

  return {
    getBrowserStorage: () => store,
  };
});

describe('ComposeAndLaunchReceiptStep', () => {
  beforeEach(() => {
    getSpace.mockResolvedValue(mockLastUsedSpace);
  });

  it('should show message when Compose+Launch has been successfully ordered', async () => {
    await build();
    await waitFor(expect(getSpace).toBeCalled);

    expect(screen.getByTestId('receipt.subtext').textContent).toContain(
      `You successfully purchased the ${PLATFORM_CONTENT.composePlatform.title} package`
    );
  });

  it('should take the user to the last used space when "take me to" button is clicked', async () => {
    await build();
    await waitFor(expect(getSpace).toBeCalled);

    const redirectToSpace = screen.getByTestId('receipt-page.redirect-to-new-space');
    userEvent.click(redirectToSpace);

    expect(go).toBeCalledWith({
      path: ['spaces', 'detail'],
      params: { spaceId: 'last_space_used_id' },
    });
  });
});

async function build(customProps, customState) {
  const props = {
    ...customProps,
  };

  await renderWithProvider(ComposeAndLaunchReceiptStep, customState, props);
}
