import React from 'react';
import { render, screen, waitFor, waitForElementToBeRemoved } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as fake from 'test/helpers/fakeFactory';

import { getResourceLimits, isLegacyOrganization } from 'utils/ResourceUtils';
import { showDialog as showUpgradeSpaceDialog } from 'services/ChangeSpaceService';
import { isEnterprisePlan } from 'account/pricing/PricingDataProvider';
import createResourceService from 'services/ResourceService';
import { isOwnerOrAdmin } from 'services/OrganizationRoles';
import * as trackCTA from 'analytics/trackCTA';
import * as spaceContextMocked from 'ng/spaceContext';
import * as PricingService from 'services/PricingService';

import UpgradeBanner from './UpgradeBanner';

const mockSpace = fake.Space();
const mockOrganization = fake.Organization();

jest.mock('analytics/Analytics', () => ({
  track: jest.fn(),
}));

jest.mock('account/pricing/PricingDataProvider', () => ({
  isEnterprisePlan: jest.fn(),
  getBasePlan: jest.fn(),
}));

jest.mock('services/ChangeSpaceService', () => ({
  showDialog: jest.fn(),
  showUpgradeSpaceDialog: jest.fn(),
}));

jest.mock('utils/ResourceUtils', () => ({
  isLegacyOrganization: jest.fn(),
  getResourceLimits: jest.fn(),
}));

jest.mock('states/Navigator', () => ({
  getCurrentStateName: jest.fn(),
}));

jest.mock('services/OrganizationRoles', () => ({
  isOwnerOrAdmin: jest.fn(),
}));

jest.mock('services/ResourceService', () => {
  const resourceService = {
    get: jest.fn(),
  };

  return () => resourceService;
});

jest.mock('data/EndpointFactory', () => ({
  createOrganizationEndpoint: jest.fn(),
}));

const trackTargetedCTAClick = jest.spyOn(trackCTA, 'trackTargetedCTAClick');

async function build(shouldWait = true) {
  render(<UpgradeBanner />);

  if (shouldWait) {
    await waitForElementToBeRemoved(() => screen.queryByTestId('upgrade-banner.is-loading'));
  }
}

describe('UpgradeBanner', () => {
  const mockUsage = 44;
  const mockMaximum = 48;
  const mockLimits = { maximum: mockMaximum };

  beforeEach(() => {
    createResourceService().get.mockResolvedValue({ usage: mockUsage, limits: mockLimits });
    getResourceLimits.mockReturnValue(mockLimits);

    isOwnerOrAdmin.mockReturnValue(true);
    isLegacyOrganization.mockReturnValue(false);
    isEnterprisePlan.mockReturnValue(false);
    spaceContextMocked.isMasterEnvironment.mockReturnValue(true);

    spaceContextMocked.getSpace.mockReturnValue({ data: mockSpace });
    spaceContextMocked.getData.mockImplementation((key) => {
      if (key === 'organization') {
        return mockOrganization;
      } else {
        throw new Error('Invalid getData key');
      }
    });

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
    expect(enterpriseLink.href).toEqual('https://www.contentful.comcontact/sales/');

    userEvent.click(enterpriseLink);

    await waitFor(() => {
      expect(trackTargetedCTAClick).toBeCalledWith(trackCTA.CTA_EVENTS.UPGRADE_TO_ENTERPRISE, {
        organizationId: mockOrganization.sys.id,
        spaceId: mockSpace.sys.id,
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
        organizationId: mockOrganization.sys.id,
        spaceId: mockSpace.sys.id,
      });
      expect(showUpgradeSpaceDialog).toBeCalledWith({
        organizationId: mockOrganization.sys.id,
        space: mockSpace,
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

    it('when it is a legacy organization', async () => {
      isLegacyOrganization.mockReturnValue(true);
      await build();

      expect(screen.queryByTestId('upgrade-banner.container')).toBeNull();
    });

    it('when it is an enterprise plan', async () => {
      isEnterprisePlan.mockReturnValue(true);
      await build();

      expect(screen.queryByTestId('upgrade-banner.container')).toBeNull();
    });

    it('when it is not a master environment', async () => {
      spaceContextMocked.isMasterEnvironment.mockReturnValue(false);

      await build();

      expect(screen.queryByTestId('upgrade-banner.container')).toBeNull();
    });

    it('when not past the 90% threshold', async () => {
      const nonThresholdLimits = { maximum: 48 };
      createResourceService().get.mockResolvedValue({ usage: 43, limits: nonThresholdLimits });
      getResourceLimits.mockReturnValue(nonThresholdLimits);

      await build();

      expect(screen.queryByTestId('upgrade-banner.container')).toBeNull();
    });
  });
});
