import React from 'react';
import { screen, render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import * as PricingService from 'services/PricingService';
import { isOwnerOrAdmin } from 'services/OrganizationRoles';
import * as trackCTA from 'analytics/trackCTA';
import { CONTACT_SALES_URL_WITH_IN_APP_BANNER_UTM } from 'analytics/utmLinks';
import { UpgradeBanner } from './UpgradeBanner';
import { SpaceEnvContextProvider } from 'core/services/SpaceEnvContext/SpaceEnvContext';
import * as spaceContextMocked from 'ng/spaceContext';

jest.mock('services/OrganizationRoles', () => ({
  isOwnerOrAdmin: jest.fn(),
}));

const trackTargetedCTAClick = jest.spyOn(trackCTA, 'trackTargetedCTAClick');

jest.mock('utils/ResourceUtils', () => ({
  getResourceLimits: jest.fn((r) => r.limits),
}));

function renderComponent() {
  render(
    <SpaceEnvContextProvider>
      <UpgradeBanner />
    </SpaceEnvContextProvider>
  );
}

describe('Upgrade banner', () => {
  beforeEach(() => {
    spaceContextMocked.environmentResources.get.mockResolvedValue({
      usage: 1,
      limits: { maximum: 1 },
    });

    jest.spyOn(PricingService, 'nextSpacePlanForResource').mockResolvedValue(null);
  });

  afterEach(() => {
    PricingService.nextSpacePlanForResource.mockRestore();
  });

  describe('with next available space plan', () => {
    beforeEach(() => {
      PricingService.nextSpacePlanForResource.mockResolvedValue({
        name: 'Some space plan',
      });
    });

    it('does not show up if they are not at the 90% threshold', async () => {
      spaceContextMocked.environmentResources.get.mockResolvedValue({
        usage: 43,
        limits: { maximum: 48 },
      });
      isOwnerOrAdmin.mockReturnValue(true);

      renderComponent();

      await waitFor(() => {});

      expect(screen.queryByTestId('content-type-limit-banner')).toBeNull();
    });

    it('does not show up even if they are at above the 90% threshold', async () => {
      isOwnerOrAdmin.mockReturnValue(true);
      spaceContextMocked.environmentResources.get.mockResolvedValue({
        usage: 46,
        limits: { maximum: 48 },
      });

      renderComponent();

      await waitFor(() => {});

      expect(screen.queryByTestId('content-type-limit-banner')).toBeNull();
    });
  });

  describe('with no next available space plan', () => {
    // The default in the topmost `beforeEach` is no next space plan
    it('does not show up if they are not an owner or admin', async () => {
      spaceContextMocked.environmentResources.get.mockResolvedValue({
        usage: 44,
        limits: { maximum: 48 },
      });
      isOwnerOrAdmin.mockReturnValue(false);

      renderComponent();

      await waitFor(() => {});

      expect(screen.queryByTestId('content-type-limit-banner')).toBeNull();
    });

    it('shows up if they are at the 90% threshold', async () => {
      isOwnerOrAdmin.mockReturnValue(true);
      spaceContextMocked.environmentResources.get.mockResolvedValue({
        usage: 44,
        limits: { maximum: 48 },
      });

      renderComponent();

      await waitFor(() => expect(screen.queryByTestId('content-type-limit-banner')).toBeVisible());
    });

    it('shows up with a link to sales if they are an owner or admin', async () => {
      spaceContextMocked.environmentResources.get.mockResolvedValue({
        usage: 44,
        limits: { maximum: 48 },
      });
      isOwnerOrAdmin.mockReturnValue(true);

      renderComponent();

      await waitFor(() => expect(screen.queryByTestId('content-type-limit-banner')).toBeVisible());
      expect(screen.queryByTestId('link-to-sales')).toBeVisible();
    });

    it('tracks click on the link to sales', async () => {
      spaceContextMocked.environmentResources.get.mockResolvedValue({
        usage: 44,
        limits: { maximum: 48 },
      });
      isOwnerOrAdmin.mockReturnValue(true);

      renderComponent();

      await waitFor(() => expect(screen.queryByTestId('content-type-limit-banner')).toBeVisible());

      const linkToSales = screen.getByTestId('link-to-sales');
      expect(linkToSales.href).toMatch(CONTACT_SALES_URL_WITH_IN_APP_BANNER_UTM);
      userEvent.click(linkToSales);

      expect(trackTargetedCTAClick).toBeCalledWith(trackCTA.CTA_EVENTS.UPGRADE_TO_ENTERPRISE, {
        organizationId: spaceContextMocked.organization.sys.id,
        spaceId: spaceContextMocked.space.data.sys.id,
      });
    });
  });
});
