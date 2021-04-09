import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as Fake from 'test/helpers/fakeFactory';
import { getVariation } from 'LaunchDarkly';

import { isOwner, isOwnerOrAdmin } from 'services/OrganizationRoles';
import { EnterpriseSubscriptionPage } from './EnterpriseSubscriptionPage';

import * as trackCTA from 'analytics/trackCTA';

import { beginSpaceCreation } from 'services/CreateSpace';
import { SELF_SERVICE } from 'account/pricing/PricingDataProvider';

jest.mock('services/CreateSpace', () => ({
  beginSpaceCreation: jest.fn(),
}));

jest.mock('services/OrganizationRoles', () => ({
  isOwner: jest.fn(),
  isOwnerOrAdmin: jest.fn(),
}));

jest.mock('../utils', () => ({
  links: {
    billing: jest.fn(),
    memberships: jest.fn().mockReturnValue({ path: 'not-important-path' }),
  },
}));

jest.mock('states/Navigator', () => ({
  go: jest.fn(),
  href: jest.fn(),
  getCurrentStateName: jest.fn(),
}));

const trackCTAClick = jest.spyOn(trackCTA, 'trackCTAClick');
const trackTargetedCTAClick = jest.spyOn(trackCTA, 'trackTargetedCTAClick');

const mockOrganization = Fake.Organization();
const mockTrialOrganization = Fake.Organization({
  trialPeriodEndsAt: new Date(),
});

const mockBasePlan = Fake.Plan({ name: 'My cool base plan' });
const mockTeamBasePlan = Fake.Plan({ customerType: SELF_SERVICE });

describe('EnterpriseSubscriptionPage', () => {
  beforeEach(() => {
    isOwner.mockReturnValue(true);
    getVariation.mockClear().mockResolvedValue(false);
    isOwnerOrAdmin.mockReturnValue(true);
  });

  it('should show skeletons when initialLoad is true', () => {
    build({ initialLoad: true });

    screen.getAllByTestId('cf-ui-skeleton-form').forEach((ele) => {
      expect(ele).toBeVisible();
    });
  });

  it('should display the base name', () => {
    build();

    expect(screen.getByTestId('subscription-page.base-plan-details')).toHaveTextContent(
      mockBasePlan.name
    );
  });

  it('should show user details', () => {
    const usersMeta = {
      numFree: 7,
      numPaid: 10,
      cost: 1000000,
      unitPrice: 100,
      hardLimit: 25,
    };

    build({ usersMeta });

    expect(screen.getByTestId('users-for-plan')).toHaveTextContent(
      `Your organization has ${usersMeta.numFree + usersMeta.numPaid} users. ${
        usersMeta.numFree
      } users are included free with your subscription. ` +
        `You will be charged an additional $${usersMeta.unitPrice}/month per user for ${usersMeta.numPaid} users. That is $${usersMeta.cost} per month.`
    );

    expect(screen.getByTestId('subscription-page.org-memberships-link')).toBeVisible();
  });

  it('should show user details and CTA to contact support for the Team users', () => {
    const usersMeta = {
      numFree: 10,
      numPaid: 17,
      hardLimit: 25,
    };

    build({ usersMeta, basePlan: mockTeamBasePlan });

    expect(screen.getByTestId('users-for-plan')).toHaveTextContent(
      `Your organization has ${usersMeta.numFree + usersMeta.numPaid} users. ${
        usersMeta.hardLimit
      } users are included with your subscription.`
    );

    expect(screen.getByTestId('subscription-page.org-memberships-link')).toBeVisible();

    const ctaLink = screen.getByTestId('subscription-page.contact-support-link');
    expect(ctaLink).toBeVisible();

    userEvent.click(ctaLink);
    expect(trackTargetedCTAClick).toBeCalledWith(trackCTA.CTA_EVENTS.REQUEST_TEAM_USER_LIMIT, {
      organizationId: mockOrganization.sys.id,
    });
  });

  it('should show user details correctly for the Enterprise trial customers', () => {
    const usersMeta = {
      numFree: 100,
      hardLimit: null,
    };

    build({ usersMeta, organization: mockTrialOrganization });

    expect(screen.getByTestId('users-for-plan')).toHaveTextContent(
      `Your organization has ${usersMeta.numFree} users. 10 users are included free with Enterprise tier. ` +
        `Customers on the Enterprise tier can purchase additional users for $15/month per user.`
    );

    expect(screen.getByTestId('subscription-page.org-memberships-link')).toBeVisible();
  });

  it('should track a click and open the CreateSpaceModal when onCreateSpace is clicked', () => {
    build();

    userEvent.click(screen.getByTestId('subscription-page.create-space'));
    expect(trackCTAClick).toBeCalledWith(trackCTA.CTA_EVENTS.CREATE_SPACE, {
      organizationId: mockOrganization.sys.id,
    });
    expect(beginSpaceCreation).toBeCalledWith(mockOrganization.sys.id);
  });

  it('should show CTA to talk to support', () => {
    build();

    expect(screen.getByText('Get in touch with us')).toBeVisible();
  });

  describe('organization on platform trial', () => {
    beforeEach(() => {
      isOwnerOrAdmin.mockReturnValue(true);
    });

    it('should show trial info for admins and owners', () => {
      build({
        organization: mockTrialOrganization,
      });

      expect(screen.getByTestId('platform-trial-info')).toBeVisible();
    });

    it('should show trial info and spaces section for members', () => {
      isOwnerOrAdmin.mockReturnValueOnce(false);
      build({
        organization: mockTrialOrganization,
        memberAccessibleSpaces: [],
      });

      expect(screen.getByTestId('platform-trial-info')).toBeVisible();
      expect(screen.getByTestId('subscription-page-trial-members.heading')).toBeVisible();
      expect(
        screen.getByTestId('subscription-page-trial-members.no-spaces-placeholder')
      ).toBeVisible();
    });
  });
});

function build(custom) {
  const props = Object.assign(
    {
      initialLoad: false,
      organization: mockOrganization,
      basePlan: mockBasePlan,
      spacePlans: [],
      grandTotal: null,
      usersMeta: null,
      onSpacePlansChange: null,
    },
    custom
  );

  render(<EnterpriseSubscriptionPage {...props} />);
}
