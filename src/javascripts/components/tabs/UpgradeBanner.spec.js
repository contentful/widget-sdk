import React from 'react';
import { render, screen, waitFor, waitForElementToBeRemoved } from '@testing-library/react';
import UpgradeBanner from './UpgradeBanner';
import * as fake from 'test/helpers/fakeFactory';

import { getResourceLimits, isLegacyOrganization } from 'utils/ResourceUtils';
import { showDialog as showUpgradeSpaceDialog } from 'services/ChangeSpaceService';
import { getSingleSpacePlan, isEnterprisePlan } from 'account/pricing/PricingDataProvider';
import createResourceService from 'services/ResourceService';
import { isOwnerOrAdmin } from 'services/OrganizationRoles';
import { trackCTAClick } from 'analytics/targetedCTA';
import userEvent from '@testing-library/user-event';
import * as spaceContextMocked from 'ng/spaceContext';

const SPACE = fake.Space();

jest.mock('analytics/Analytics', () => ({
  track: jest.fn(),
}));

jest.mock('account/pricing/PricingDataProvider', () => ({
  isEnterprisePlan: jest.fn(),
  getSingleSpacePlan: jest.fn(),
}));

jest.mock('services/ChangeSpaceService', () => ({
  showDialog: jest.fn(),
  showUpgradeSpaceDialog: jest.fn(),
  trackCTAClick: jest.fn(),
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

jest.mock('analytics/targetedCTA', () => ({
  trackCTAClick: jest.fn(),
}));

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
    getSingleSpacePlan.mockResolvedValue({ name: 'Large' });
    spaceContextMocked.getSpace.mockReturnValue(SPACE);
    spaceContextMocked.isMasterEnvironment = true;
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

  it('should render the link to contact sales about upgrading to enterprise when a large space', async () => {
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
      expect(trackCTAClick).toBeCalledWith('upgrade_to_enterprise', {
        organizationId: SPACE.organization.sys.id,
        spaceId: SPACE.sys.id,
      });
    });
  });

  it('should render the link to upgrade the currnent space when it is not a large space', async () => {
    getSingleSpacePlan.mockResolvedValue({ name: 'notLarge' });
    await build();

    expect(screen.queryByTestId('upgrade-banner.upgrade-to-enterprise-link')).toBeNull();
    expect(screen.getByTestId('upgrade-banner.action-text').textContent).toEqual(
      'To increase your limit, upgrade space.'
    );

    const upgradeSpaceLink = screen.getByTestId('upgrade-banner.upgrade-space-link');
    expect(upgradeSpaceLink).toBeVisible();

    userEvent.click(upgradeSpaceLink);

    await waitFor(() => {
      expect(trackCTAClick).toBeCalledWith('upgrade_space_plan', {
        organizationId: SPACE.organization.sys.id,
        spaceId: SPACE.sys.id,
      });
      expect(showUpgradeSpaceDialog).toBeCalledWith({
        organizationId: SPACE.organization.sys.id,
        space: SPACE,
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
      spaceContextMocked.isMasterEnvironment = false;
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
