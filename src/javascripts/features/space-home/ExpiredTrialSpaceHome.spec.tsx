import React from 'react';
import { render, waitFor, screen, fireEvent } from '@testing-library/react';
import * as fake from 'test/helpers/fakeFactory';
import { ExpiredTrialSpaceHome } from './ExpiredTrialSpaceHome';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { isOwnerOrAdmin } from 'services/OrganizationRoles';
import { openDeleteSpaceDialog } from 'features/space-settings';
import { beginSpaceChange } from 'services/ChangeSpaceService';
import { getAddOnProductRatePlans } from 'features/pricing-entities';
import { useAppsTrial, useTrialSpace as _useTrialSpace } from 'features/trials';

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

jest.mock('features/trials', () => ({
  useAppsTrial: jest.fn().mockResolvedValue({}),
  useTrialSpace: jest.fn(),
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

const useTrialSpace = _useTrialSpace as jest.Mock;

describe('ExpiredTrialSpaceHome', () => {
  beforeEach(() => {
    (useSpaceEnvContext as jest.Mock).mockReturnValue(defaultSpaceContextValues);
    (isOwnerOrAdmin as jest.Mock).mockReturnValue(true);
  });

  describe('Enterprise Trial Space', () => {
    it('renders correctly when the space has expired', async () => {
      useTrialSpace.mockReturnValue({
        hasTrialSpaceExpired: true,
      });

      build();

      await waitFor(() =>
        expect(screen.getByTestId('expired-trial-space-home')).not.toHaveTextContent(
          'Contentful Apps trial space'
        )
      );
      expect(screen.getByTestId('expired-trial-space-home')).not.toHaveTextContent(
        'Contentful Apps'
      );
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('does not render when the the space is active', async () => {
      useTrialSpace.mockReturnValue({
        hasTrialSpaceExpired: false,
      });

      build();

      await waitFor(() => screen.queryByTestId('expired-trial-space-home'));
      expect(screen.queryByTestId('expired-trial-space-home')).not.toBeInTheDocument();
    });

    it('does not render when the space is read-only', async () => {
      (useSpaceEnvContext as jest.Mock).mockReturnValue({
        ...defaultSpaceContextValues,
        currentSpaceData: readOnlySpace,
      });
      useTrialSpace.mockReturnValue({ hasTrialSpaceExpired: true });

      build();

      await waitFor(() => screen.queryByTestId('expired-trial-space-home'));
      expect(screen.queryByTestId('expired-trial-space-home')).not.toBeInTheDocument();
    });
  });

  describe('Apps Trial Space', () => {
    beforeEach(() => {
      useTrialSpace.mockReturnValue({
        hasTrialSpaceExpired: true,
        matchesAppsTrialSpaceKey: true,
      });
    });

    it('renders correctly when the space has expired', async () => {
      build();

      await waitFor(() =>
        expect(screen.getByTestId('expired-trial-space-home')).toHaveTextContent(
          'Contentful Apps trial space'
        )
      );
      expect(screen.getByTestId('expired-trial-space-home')).toHaveTextContent('$100/month');
      expect(screen.queryByTestId('expired-trial-space-home.delete-space')).toBeInTheDocument();
      expect(screen.queryByTestId('expired-trial-space-home.buy-now')).toHaveTextContent('Buy now');
    });

    it('navigates to the upgrade flow when clicked', async () => {
      build();

      await waitFor(() => fireEvent.click(screen.getByTestId('expired-trial-space-home.buy-now')));

      expect(beginSpaceChange).toHaveBeenCalled();
    });

    it('opens a delete space modal when clicked', async () => {
      build();

      await waitFor(() =>
        fireEvent.click(screen.getByTestId('expired-trial-space-home.delete-space'))
      );

      expect(openDeleteSpaceDialog).toBeCalledWith({
        space: mockedSpace,
        onSuccess: expect.any(Function),
      });
    });

    it('has the upgrade now CTA if the add-on has been purchased', async () => {
      (useAppsTrial as jest.Mock).mockReturnValue({
        hasAppsTrialPurchased: true,
      });
      build();

      await waitFor(() =>
        expect(screen.queryByTestId('expired-trial-space-home.buy-now')).toHaveTextContent(
          'Upgrade now'
        )
      );
    });

    it('does not render the CTA buttons when the user is not an org admin or owner', async () => {
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

    it('does not render when the space is active', async () => {
      useTrialSpace.mockReturnValue({
        hasTrialSpaceExpired: false,
        matchesAppsTrialSpaceKey: true,
      });

      build();

      await waitFor(() => screen.queryByTestId('expired-trial-space-home'));
      expect(screen.queryByTestId('expired-trial-space-home')).not.toBeInTheDocument();
    });

    it('does not render when the App Trial is expired but the Trial Space is purchased', async () => {
      useTrialSpace.mockReturnValue({
        hasTrialSpaceExpired: true,
        matchesAppsTrialSpaceKey: true,
        hasTrialSpaceConverted: true,
      });

      build();

      await waitFor(() => screen.queryByTestId('expired-trial-space-home'));
      expect(screen.queryByTestId('expired-trial-space-home')).not.toBeInTheDocument();
      expect(getAddOnProductRatePlans).toBeCalledTimes(0);
    });
  });
});
