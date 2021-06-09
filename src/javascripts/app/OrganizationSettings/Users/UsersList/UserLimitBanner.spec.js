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
import * as OrganizationMembershipRepository from 'access_control/OrganizationMembershipRepository';
import * as trackCTA from 'analytics/trackCTA';
import { CONTACT_SALES_URL_WITH_IN_APP_BANNER_UTM } from 'analytics/utmLinks';
import { getBasePlan } from 'features/pricing-entities';

import UserLimitBanner, { THRESHOLD_NUMBER_TO_DISPLAY_BANNER } from './UserLimitBanner';

const mockOrg = fake.Organization({ pricingVersion: 'pricing_version_2' });
const mockBasePlan = fake.Plan({ customerType: PricingDataProvider.FREE });
const mockSpaces = Array.from(Array(3)).map((_, idx) => fake.Space(`Space ${idx}`));
const mockUsersEmpty = { items: [], total: 0 };

let mockOrgCall;

jest.mock('features/pricing-entities', () => ({
  getBasePlan: jest.fn(),
}));

const trackTargetedCTAClick = jest.spyOn(trackCTA, 'trackTargetedCTAClick');
jest.spyOn(EndpointFactory, 'createOrganizationEndpoint').mockImplementation(() => jest.fn());
jest.spyOn(TokenStore, 'getOrganization').mockImplementation(() => mockOrg);
jest
  .spyOn(OrganizationMembershipRepository, 'getMemberships')
  .mockImplementation(() => mockUsersEmpty);
jest.spyOn(OrganizationRoles, 'isOwner').mockImplementation(() => false);
jest.spyOn(CreateSpace, 'beginSpaceCreation').mockImplementation(() => jest.fn());
jest.spyOn(ChangeSpaceService, 'beginSpaceChange').mockImplementation(() => jest.fn());

async function build(customProps) {
  const props = {
    orgId: mockOrg.sys.id,
    spaces: mockSpaces,
    ...customProps,
  };

  render(<UserLimitBanner {...props} />);

  await waitFor(() => {
    expect(mockOrgCall).toBeCalled();
  });
}

describe('UserLimitBanner', () => {
  beforeEach(() => {
    mockOrgCall = jest.spyOn(TokenStore, 'getOrganization').mockImplementation(() => mockOrg);
    getBasePlan.mockResolvedValue(mockBasePlan);
  });

  afterEach(() => {
    mockOrgCall.mockRestore();
    getBasePlan.mockReset();
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
      expect(ChangeSpaceService.beginSpaceChange).toBeCalledWith({
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
      expect(CreateSpace.beginSpaceCreation).toBeCalledWith(mockOrg.sys.id);
    });
  });

  describe('when the plan is Self-service', () => {
    const usersCount = THRESHOLD_NUMBER_TO_DISPLAY_BANNER;
    const mockUsers = { total: usersCount };

    it('should render if the user reached the limit of users for the plan', async () => {
      getBasePlan.mockImplementation(() =>
        fake.Plan({ customerType: PricingDataProvider.SELF_SERVICE })
      );
      jest
        .spyOn(OrganizationMembershipRepository, 'getMemberships')
        .mockImplementation(() => mockUsers);

      await build({ usersCount });

      expect(screen.getByTestId('users-limit-banner').textContent).toBe(
        `Your organization has ${usersCount} users. 10 users are included free on the Team tier with a maximum of 25 users.To increase the limit, the organization owner must upgrade your organization to enterprise.`
      );
    });

    it('should render if the user reached the limit of users for the plan and user is Owner', async () => {
      getBasePlan.mockImplementation(() =>
        fake.Plan({ customerType: PricingDataProvider.SELF_SERVICE })
      );
      OrganizationRoles.isOwner.mockResolvedValueOnce(true);

      await build({ usersCount });

      expect(screen.getByTestId('users-limit-banner').textContent).toBe(
        `Your organization has ${usersCount} users. 10 users are included free on the Team tier with a maximum of 25 users.To increase the limit, talk to us about upgrading to enterprise.`
      );

      const linkToSales = screen.getByTestId('link-to-sales');
      expect(linkToSales.href).toMatch(CONTACT_SALES_URL_WITH_IN_APP_BANNER_UTM);

      userEvent.click(linkToSales);

      expect(trackTargetedCTAClick).toBeCalledWith(trackCTA.CTA_EVENTS.UPGRADE_TO_ENTERPRISE, {
        organizationId: mockOrg.sys.id,
      });
    });

    it('should not render if the user is below the limit of users for the plan', async () => {
      const mockUsers = { total: 8 };
      jest
        .spyOn(OrganizationMembershipRepository, 'getMemberships')
        .mockImplementation(() => mockUsers);
      getBasePlan.mockImplementation(() =>
        fake.Plan({ customerType: PricingDataProvider.SELF_SERVICE })
      );

      build({});

      await waitFor(() => {
        expect(mockOrgCall).toBeCalled();
      });

      expect(mockOrgCall().pricingVersion).toBe('pricing_version_2');
      expect(screen.queryByTestId('users-limit-banner')).toBeNull();
    });
  });
});
