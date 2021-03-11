import React from 'react';
import { render, waitFor, screen, fireEvent } from '@testing-library/react';
import * as fake from 'test/helpers/fakeFactory';
import { isExpiredTrialSpace, isExpiredAppTrial } from 'features/trials';
import { ExpiredTrialSpaceHome } from './ExpiredTrialSpaceHome';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { getVariation } from 'LaunchDarkly';
import { isOwnerOrAdmin } from 'services/OrganizationRoles';
import { openDeleteSpaceDialog } from 'features/space-settings';
import { beginSpaceChange } from 'services/ChangeSpaceService';
import { getAddOnProductRatePlans } from 'features/pricing-entities';

const mockedSpace = fake.Space();
const readOnlySpace = {
  ...mockedSpace,
  readOnlyAt: 'some day',
};

const mockedOrg = fake.Organization();

const defaultSpaceContextValues = {
  currentSpaceData: mockedSpace,
  currentOrganizationId: 'testOrgId',
  currentOrganization: mockedOrg,
};

const build = () => {
  return render(<ExpiredTrialSpaceHome />);
};

jest.mock('services/TokenStore', () => ({
  getSpace: jest.fn(),
}));

jest.mock('features/trials', () => ({
  isExpiredTrialSpace: jest.fn(),
  isExpiredAppTrial: jest.fn(),
  AppTrialRepo: {
    getTrial: jest.fn().mockResolvedValue({ sys: {} }),
  },
}));

jest.mock('core/services/SpaceEnvContext/useSpaceEnvContext', () => ({
  useSpaceEnvContext: jest.fn(),
}));

jest.mock('analytics/Analytics', () => ({
  track: jest.fn(),
}));

jest.mock('services/OrganizationRoles', () => ({
  isOwnerOrAdmin: jest.fn(),
}));

jest.mock('states/Navigator', () => ({
  go: jest.fn(),
  getCurrentStateName: jest.fn(),
}));

jest.mock('services/ChangeSpaceService', () => ({
  beginSpaceChange: jest.fn(),
}));

jest.mock('features/space-settings', () => ({
  openDeleteSpaceDialog: jest.fn(),
}));

jest.mock('features/pricing-entities', () => ({
  getAddOnProductRatePlans: jest.fn().mockResolvedValue([{ price: 100 }]),
}));

describe('ExpiredTrialSpaceHome', () => {
  beforeEach(() => {
    (useSpaceEnvContext as jest.Mock).mockReturnValue(defaultSpaceContextValues);
    (isExpiredTrialSpace as jest.Mock).mockReturnValue(true);
    (getVariation as jest.Mock).mockResolvedValue(false);
    (isOwnerOrAdmin as jest.Mock).mockReturnValue(true);
  });

  describe('with the feature flag off', () => {
    it('renders correctly when the space is an expired trial space', async () => {
      build();

      await waitFor(() =>
        expect(screen.getByTestId('expired-trial-space-home')).toHaveTextContent('trial space')
      );
      expect(getAddOnProductRatePlans).toBeCalledTimes(0);
      expect(screen.getByTestId('expired-trial-space-home')).not.toHaveTextContent(
        'Contentful Apps'
      );
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('does not render when the space has not expired', async () => {
      (isExpiredTrialSpace as jest.Mock).mockReturnValue(false);

      build();

      await waitFor(() => screen.queryByTestId('expired-trial-space-home'));
      expect(screen.queryByTestId('expired-trial-space-home')).not.toBeInTheDocument();
    });

    it('does not render when the space is read-only', async () => {
      (useSpaceEnvContext as jest.Mock).mockReturnValue({
        ...defaultSpaceContextValues,
        currentSpaceData: readOnlySpace,
      });

      build();

      await waitFor(() => screen.queryByTestId('expired-trial-space-home'));
      expect(screen.queryByTestId('expired-trial-space-home')).not.toBeInTheDocument();
    });
  });

  describe('with the feature flag on', () => {
    beforeEach(() => {
      (getVariation as jest.Mock).mockResolvedValue(true);
    });

    it('does not render when the Trial App is active', async () => {
      (isExpiredAppTrial as jest.Mock).mockReturnValue(false);
      (isExpiredTrialSpace as jest.Mock).mockReturnValue(false);
      build();

      await waitFor(() => screen.queryByTestId('expired-trial-space-home'));
      expect(screen.queryByTestId('expired-trial-space-home')).not.toBeInTheDocument();
    });

    it('does not render when the space is read-only', async () => {
      (useSpaceEnvContext as jest.Mock).mockReturnValue({
        ...defaultSpaceContextValues,
        currentSpaceData: readOnlySpace,
      });

      build();

      await waitFor(() => screen.queryByTestId('expired-trial-space-home'));
      expect(screen.queryByTestId('expired-trial-space-home')).not.toBeInTheDocument();
    });

    it('renders correctly when the space is an expired Trial Space', async () => {
      build();

      await waitFor(() =>
        expect(screen.getByTestId('expired-trial-space-home')).toHaveTextContent('trial space')
      );
      expect(screen.getByTestId('expired-trial-space-home')).not.toHaveTextContent(
        'Contentful Apps'
      );
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('renders correctly when the space is an expired App Trial Space', async () => {
      (isExpiredAppTrial as jest.Mock).mockReturnValue(true);
      build();

      await waitFor(() =>
        expect(screen.getByTestId('expired-trial-space-home')).toHaveTextContent('Contentful Apps')
      );
      expect(screen.getByTestId('expired-trial-space-home')).toHaveTextContent('$100/month');
      expect(screen.getByTestId('expired-trial-space-home')).not.toHaveTextContent('trial space');
      expect(screen.queryByTestId('expired-trial-space-home.delete-space')).toBeInTheDocument();
      expect(screen.queryByTestId('expired-trial-space-home.buy-now')).toBeInTheDocument();
    });

    it('navigates to the upgrade flow when clicked', async () => {
      (isExpiredAppTrial as jest.Mock).mockReturnValue(true);
      build();

      await waitFor(() => fireEvent.click(screen.getByTestId('expired-trial-space-home.buy-now')));

      expect(beginSpaceChange).toHaveBeenCalled();
    });

    it('opens a delete space modal when clicked', async () => {
      (isExpiredAppTrial as jest.Mock).mockReturnValue(true);
      build();

      await waitFor(() =>
        fireEvent.click(screen.getByTestId('expired-trial-space-home.delete-space'))
      );

      expect(openDeleteSpaceDialog).toBeCalledWith({
        space: mockedSpace,
        onSuccess: expect.any(Function),
      });
    });

    it('does not render the CTA buttons when the user is not an org admin or owner', async () => {
      (isExpiredAppTrial as jest.Mock).mockReturnValue(true);
      (isOwnerOrAdmin as jest.Mock).mockReturnValue(false);
      build();

      await waitFor(() => expect(screen.getByTestId('expired-trial-space-home')));
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('does not fetch the add-on price when the user is not an org admin or owner', async () => {
      (isOwnerOrAdmin as jest.Mock).mockReturnValue(false);
      build();

      await waitFor(() => expect(getAddOnProductRatePlans).toBeCalledTimes(0));
    });

    it('does not render when the App Trial is expired but the Trial Space is purchased', async () => {
      (isExpiredAppTrial as jest.Mock).mockReturnValue(true);
      (isExpiredTrialSpace as jest.Mock).mockReturnValue(false);

      build();

      await waitFor(() => screen.queryByTestId('expired-trial-space-home'));
      expect(screen.queryByTestId('expired-trial-space-home')).not.toBeInTheDocument();
      expect(getAddOnProductRatePlans).toBeCalledTimes(0);
    });
  });
});
