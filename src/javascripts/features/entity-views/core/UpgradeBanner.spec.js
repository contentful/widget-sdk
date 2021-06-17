import React from 'react';
import { render, screen, waitFor, waitForElementToBeRemoved } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getResourceLimits } from 'utils/ResourceUtils';
import { beginSpaceChange } from 'services/ChangeSpaceService';
import { isEnterprisePlan } from 'account/pricing/PricingDataProvider';
import { isOwnerOrAdmin } from 'services/OrganizationRoles';
import * as trackCTA from 'analytics/trackCTA';
import * as spaceContextMocked from 'ng/spaceContext';
import * as PricingService from 'services/PricingService';
import { CONTACT_SALES_URL_WITH_IN_APP_BANNER_UTM } from 'analytics/utmLinks';

import { UpgradeBanner } from './UpgradeBanner';
import { SpaceEnvContextProvider } from 'core/services/SpaceEnvContext/SpaceEnvContext';

jest.mock('analytics/Analytics', () => ({
  track: jest.fn(),
}));

jest.mock('account/pricing/PricingDataProvider', () => ({
  isEnterprisePlan: jest.fn(),
}));

jest.mock('features/pricing-entities', () => ({
  getBasePlan: jest.fn(),
}));

jest.mock('services/ChangeSpaceService', () => ({
  beginSpaceChange: jest.fn(),
  showUpgradeSpaceDialog: jest.fn(),
}));

jest.mock('utils/ResourceUtils', () => ({
  getResourceLimits: jest.fn(),
}));

jest.mock('states/Navigator', () => ({
  getCurrentStateName: jest.fn(),
}));

jest.mock('services/OrganizationRoles', () => ({
  isOwnerOrAdmin: jest.fn(),
}));

jest.mock('data/EndpointFactory', () => ({
  createOrganizationEndpoint: jest.fn(),
}));

const trackTargetedCTAClick = jest.spyOn(trackCTA, 'trackTargetedCTAClick');

async function build(shouldWait = true) {
  render(
    <SpaceEnvContextProvider>
      <UpgradeBanner />
    </SpaceEnvContextProvider>
  );

  if (shouldWait) {
    await waitForElementToBeRemoved(() => screen.queryByTestId('upgrade-banner.is-loading'));
  }
}

describe('UpgradeBanner', () => {
  const mockUsage = 44;
  const mockMaximum = 48;
  const mockLimits = { maximum: mockMaximum };

  beforeEach(() => {
    spaceContextMocked.environmentResources.get.mockReturnValue({
      usage: mockUsage,
      limits: mockLimits,
    });
    getResourceLimits.mockReturnValue(mockLimits);

    isOwnerOrAdmin.mockReturnValue(true);
    isEnterprisePlan.mockReturnValue(false);

    jest.spyOn(PricingService, 'nextSpacePlanForResource').mockResolvedValue(null);
  });

  afterEach(() => {
    PricingService.nextSpacePlanForResource.mockRestore();
  });

  it('should load an empty div when fetching initial data', async () => {
    build(false);

    expect(screen.queryByTestId('upgrade-banner.is-loading').textContent).toEqual('');

    await waitForElementToBeRemoved(() => screen.queryByTestId('upgrade-banner.is-loading'));

    expect(screen.getByTestId('upgrade-banner.container')).toBeVisible();
  });

  it('should render the banner when render criteria are met', async () => {
    await build();

    expect(screen.getByTestId('upgrade-banner.container')).toBeVisible();
    expect(screen.getByTestId('upgrade-banner.usage-text').textContent).toEqual(
      `You have used ${mockUsage} of ${mockMaximum} records (total assets and entries).`
    );
  });

  it('should render the link to contact sales about upgrading to enterprise when there are no more plans', async () => {
    await build();

    expect(screen.queryByTestId('upgrade-banner.upgrade-space-link')).toBeNull();
    expect(screen.getByTestId('upgrade-banner.action-text').textContent).toEqual(
      'To increase your limit, talk to us about upgrading to the enterprise tier.'
    );

    const enterpriseLink = screen.getByTestId('upgrade-banner.upgrade-to-enterprise-link');
    expect(enterpriseLink).toBeVisible();
    expect(enterpriseLink.href).toMatch(CONTACT_SALES_URL_WITH_IN_APP_BANNER_UTM);

    userEvent.click(enterpriseLink);

    await waitFor(() => {
      expect(trackTargetedCTAClick).toBeCalledWith(trackCTA.CTA_EVENTS.UPGRADE_TO_ENTERPRISE, {
        organizationId: spaceContextMocked.space.data.organization.sys.id,
        spaceId: spaceContextMocked.space.data.sys.id,
      });
    });
  });

  it('should render the link to upgrade the current space when there is a next space plan available', async () => {
    PricingService.nextSpacePlanForResource.mockResolvedValueOnce({
      name: 'Large',
    });

    await build();

    expect(screen.queryByTestId('upgrade-banner.upgrade-to-enterprise-link')).toBeNull();
    expect(screen.getByTestId('upgrade-banner.action-text').textContent).toEqual(
      'To increase your limit, upgrade space.'
    );

    const upgradeSpaceLink = screen.getByTestId('upgrade-banner.upgrade-space-link');
    expect(upgradeSpaceLink).toBeVisible();

    userEvent.click(upgradeSpaceLink);

    await waitFor(() => {
      expect(trackTargetedCTAClick).toBeCalledWith(trackCTA.CTA_EVENTS.UPGRADE_SPACE_PLAN, {
        organizationId: spaceContextMocked.space.data.organization.sys.id,
        spaceId: spaceContextMocked.space.data.sys.id,
      });
      expect(beginSpaceChange).toBeCalledWith({
        organizationId: spaceContextMocked.space.data.organization.sys.id,
        space: spaceContextMocked.space.data,
        onSubmit: expect.any(Function),
      });
    });
  });

  describe('should not trigger the banner', () => {
    it('when user is not an owner or admin', async () => {
      isOwnerOrAdmin.mockReturnValue(false);
      await build();

      expect(screen.queryByTestId('upgrade-banner.container')).toBeNull();
    });

    it('when it is an enterprise plan', async () => {
      isEnterprisePlan.mockReturnValue(true);
      await build();

      expect(screen.queryByTestId('upgrade-banner.container')).toBeNull();
    });

    it('when it is not a master environment', async () => {
      spaceContextMocked.getSpace.mockReturnValue({
        ...spaceContextMocked.space,
        environmentMeta: {
          isMasterEnvironment: false,
        },
      });

      await build();

      expect(screen.queryByTestId('upgrade-banner.container')).toBeNull();
    });

    it('when not past the 90% threshold', async () => {
      const nonThresholdLimits = { maximum: 48 };
      spaceContextMocked.environmentResources.get.mockResolvedValue({
        usage: 43,
        limits: nonThresholdLimits,
      });
      getResourceLimits.mockReturnValue(nonThresholdLimits);

      await build();

      expect(screen.queryByTestId('upgrade-banner.container')).toBeNull();
    });
  });
});
