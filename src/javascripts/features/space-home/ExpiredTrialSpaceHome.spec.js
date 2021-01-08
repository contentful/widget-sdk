import React from 'react';
import { render, waitFor, screen } from '@testing-library/react';
import * as fake from 'test/helpers/fakeFactory';
import { getSpace } from 'services/TokenStore';
import { isExpiredTrialSpace } from 'features/trials';
import { ExpiredTrialSpaceHome } from './ExpiredTrialSpaceHome';

const mockedSpace = fake.Space();
const readOnlySpace = {
  ...mockedSpace,
  readOnlyAt: 'some day',
};

const build = () => {
  return render(<ExpiredTrialSpaceHome spaceId={mockedSpace.sys.id} />);
};

jest.mock('services/TokenStore', () => ({
  getSpace: jest.fn(),
}));

jest.mock('features/trials', () => ({
  isExpiredTrialSpace: jest.fn(),
}));

describe('ExpiredTrialSpaceHome', () => {
  beforeEach(() => {
    getSpace.mockResolvedValue(mockedSpace);
    isExpiredTrialSpace.mockReturnValue(true);
  });

  it('renders correctly when the space is an expired trial space', async () => {
    build();

    await waitFor(() =>
      expect(screen.queryByTestId('expired-trial-space-home')).toBeInTheDocument()
    );
  });

  it('does not render when the space has not expired', async () => {
    isExpiredTrialSpace.mockReturnValueOnce(false);

    build();

    await waitFor(() =>
      expect(screen.queryByTestId('expired-trial-space-home')).not.toBeInTheDocument()
    );
  });

  it('does not render when the space is read-only', async () => {
    getSpace.mockResolvedValue(readOnlySpace);

    build();

    await waitFor(() =>
      expect(screen.queryByTestId('expired-trial-space-home')).not.toBeInTheDocument()
    );
  });
});
