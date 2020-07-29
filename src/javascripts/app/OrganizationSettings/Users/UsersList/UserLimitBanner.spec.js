import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import * as ChangeSpaceService from 'services/ChangeSpaceService';
import * as CreateSpace from 'services/CreateSpace';
import * as EndpointFactory from 'data/EndpointFactory';
import * as fake from 'test/helpers/fakeFactory';
import * as OrganizationRoles from 'services/OrganizationRoles';
import * as PricingDataProvider from 'account/pricing/PricingDataProvider';
import * as TokenStore from 'services/TokenStore';
import * as trackCTA from 'analytics/trackCTA';

import UserLimitBanner, { THRESHOLD_NUMBER_TO_DISPLAY_BANNER } from './UserLimitBanner';

const mockOrg = fake.Organization({ pricingVersion: 'pricing_version_2' });
const mockBasePlan = fake.Plan({ customerType: PricingDataProvider.FREE });
const mockSpaces = Array.from(Array(3)).map((_, idx) => fake.Space(`Space ${idx}`));

let mockOrgCall;
let mockBasePlanCall;
const trackTargetedCTAClick = jest.spyOn(trackCTA, 'trackTargetedCTAClick');
jest.spyOn(EndpointFactory, 'createOrganizationEndpoint').mockImplementation(() => jest.fn());
jest.spyOn(TokenStore, 'getOrganization').mockImplementation(() => mockOrg);
jest.spyOn(OrganizationRoles, 'isOwner').mockImplementation(() => false);
jest.spyOn(CreateSpace, 'showDialog').mockImplementation(() => jest.fn());
jest.spyOn(ChangeSpaceService, 'showDialog').mockImplementation(() => jest.fn());

async function build(customProps, shouldWait = true) {
  const props = {
    orgId: mockOrg.sys.id,
    spaces: mockSpaces,
    usersCount: 1,
    ...customProps,
  };

  render(<UserLimitBanner {...props} />);

  if (shouldWait) {
    await waitFor(() => {
      expect(mockOrgCall).toBeCalled();
    });

    expect(screen.getByTestId('users-limit-banner')).toBeVisible();
  }
}

describe('UserLimitBanner', () => {
  beforeEach(() => {
    mockOrgCall = jest.spyOn(TokenStore, 'getOrganization').mockImplementation(() => mockOrg);
    mockBasePlanCall = jest
      .spyOn(PricingDataProvider, 'getBasePlan')
      .mockImplementation(() => mockBasePlan);
  });

  afterEach(() => {
    mockOrgCall.mockRestore();
    mockBasePlanCall.mockRestore();
  });

  it('should not render if organizaion is LegacyOrganization (it is not pricing_version_2)', async () => {
    mockOrgCall.mockImplementation(() =>
      fake.Organization({ pricingVersion: 'pricing_version_1' })
    );
    build({}, false);

    await waitFor(() => {
      expect(mockOrgCall).toBeCalled();
    });

    expect(mockOrgCall().pricingVersion).toBe('pricing_version_1');
    expect(screen.queryByTestId('users-limit-banner')).toBeNull();
  });

  describe('when the plan is Free', () => {
    it('should render correct text if user is not an owner', async () => {
      await build();

      expect(screen.getByTestId('users-limit-banner').textContent).toBe(
        'The free community plan has a limit of 5 users.To increase the limit, the organization owner must upgrade your tier by purchasing or upgrading a space.'
      );
    });

    it('should render correct text if user is Owner and has space to upgrade', async () => {
      OrganizationRoles.isOwner.mockReturnValueOnce(true);

      await build();

      expect(screen.getByTestId('users-limit-banner').textContent).toBe(
        'The free community plan has a limit of 5 users.To increase the limit, upgrade your free space.'
      );

      userEvent.click(screen.getByTestId('upgrade-space-plan'));
      expect(trackTargetedCTAClick).toBeCalledWith(trackCTA.CTA_EVENTS.UPGRADE_SPACE_PLAN, {
        organizationId: mockOrg.sys.id,
        spaceId: mockSpaces[0].sys.id,
      });
      expect(ChangeSpaceService.showDialog).toBeCalledWith({
        action: 'change',
        organizationId: mockOrg.sys.id,
        space: mockSpaces[0],
      });
    });

    it('should render correct text if user is Owner and has no spaces to upgrade', async () => {
      OrganizationRoles.isOwner.mockResolvedValueOnce(true);

      await build({ spaces: null });

      expect(screen.getByTestId('users-limit-banner').textContent).toBe(
        'The free community plan has a limit of 5 users.To increase the limit, purchase a space.'
      );

      userEvent.click(screen.getByTestId('upgrade-space-plan'));
      expect(trackTargetedCTAClick).toBeCalledWith(trackCTA.CTA_EVENTS.CREATE_SPACE, {
        organizationId: mockOrg.sys.id,
      });
      expect(CreateSpace.showDialog).toBeCalledWith(mockOrg.sys.id);
    });
  });

  describe('when the plan is Self-service', () => {
    const usersCount = THRESHOLD_NUMBER_TO_DISPLAY_BANNER;

    it('should render if the user reached the limit of users for the plan', async () => {
      mockBasePlanCall.mockImplementation(() =>
        fake.Plan({ customerType: PricingDataProvider.SELF_SERVICE })
      );

      await build({ usersCount });

      expect(screen.getByTestId('users-limit-banner').textContent).toBe(
        `Your organization has ${usersCount} users. 10 users are included free on the Team tear with a maximum of 25 users.To increase the limit, the organization owner must upgrade your organization to enterprise.`
      );
    });

    it('should render if the user reached the limit of users for the plan and user is Owner', async () => {
      mockBasePlanCall.mockImplementation(() =>
        fake.Plan({ customerType: PricingDataProvider.SELF_SERVICE })
      );
      OrganizationRoles.isOwner.mockResolvedValueOnce(true);

      await build({ usersCount });

      expect(screen.getByTestId('users-limit-banner').textContent).toBe(
        `Your organization has ${usersCount} users. 10 users are included free on the Team tear with a maximum of 25 users.To increase the limit, talk to us about upgrading to enterprise.`
      );

      userEvent.click(screen.getByTestId('link-to-sales'));
      expect(trackTargetedCTAClick).toBeCalledWith(trackCTA.CTA_EVENTS.UPGRADE_TO_ENTERPRISE, {
        organizationId: mockOrg.sys.id,
      });
    });

    it('should not render if the user is below the limit of users for the plan', async () => {
      mockBasePlanCall.mockImplementation(() =>
        fake.Plan({ customerType: PricingDataProvider.SELF_SERVICE })
      );

      build({}, false);

      await waitFor(() => {
        expect(mockOrgCall).toBeCalled();
      });

      expect(mockOrgCall().pricingVersion).toBe('pricing_version_2');
      expect(screen.queryByTestId('users-limit-banner')).toBeNull();
    });
  });
});
