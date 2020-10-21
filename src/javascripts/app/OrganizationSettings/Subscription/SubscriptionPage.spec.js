import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as Fake from 'test/helpers/fakeFactory';
import SubscriptionPage from './SubscriptionPage';
import { getVariation } from 'LaunchDarkly';

import { isOwner, isOwnerOrAdmin } from 'services/OrganizationRoles';
import { go } from 'states/Navigator';
import { billing } from './links';

import * as trackCTA from 'analytics/trackCTA';

import { beginSpaceCreation } from 'services/CreateSpace';
import { showDialog as showChangeSpaceModal } from 'services/ChangeSpaceService';
import { FREE, SELF_SERVICE } from 'account/pricing/PricingDataProvider';

jest.mock('services/CreateSpace', () => ({
  beginSpaceCreation: jest.fn(),
}));

jest.mock('services/ChangeSpaceService', () => ({
  showDialog: jest.fn(),
}));

jest.mock('services/OrganizationRoles', () => ({
  isOwner: jest.fn(),
  isOwnerOrAdmin: jest.fn(),
}));

jest.mock('./links', () => ({
  billing: jest.fn(),
  memberships: jest.fn().mockReturnValue({ path: 'not-important-path' }),
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
const mockFreeBasePlan = Fake.Plan({ customerType: FREE });
const mockTeamBasePlan = Fake.Plan({ customerType: SELF_SERVICE });

const mockSpacePlans = [
  Fake.Plan({
    space: Fake.Space(),
  }),
  Fake.Plan({
    space: Fake.Space(),
  }),
];

describe('SubscriptionPage', () => {
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

  it('should show the right number of space plan rows', () => {
    build({ spacePlans: mockSpacePlans });

    expect(screen.getAllByTestId('subscription-page.spaces-list.table-row')).toHaveLength(
      mockSpacePlans.length
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

  it('should show user details and CTA to upgrade for the Community customers', () => {
    const navigatorObject = { test: true };
    billing.mockReturnValue(navigatorObject);

    const usersMeta = {
      numFree: 5,
      numPaid: 2,
      hardLimit: 5,
    };

    build({ usersMeta, basePlan: mockFreeBasePlan });

    expect(screen.getByTestId('users-for-plan')).toHaveTextContent(
      `Your organization has ${usersMeta.numFree + usersMeta.numPaid} users. ${
        usersMeta.hardLimit
      } users are included free with your subscription.`
    );

    expect(screen.getByTestId('subscription-page.org-memberships-link')).toBeVisible();

    const ctaLink = screen.getByTestId('subscription-page.upgrade-to-team-link');
    expect(ctaLink).toBeVisible();

    userEvent.click(ctaLink);
    expect(trackTargetedCTAClick).toBeCalledWith(trackCTA.CTA_EVENTS.UPGRADE_TO_TEAM, {
      organizationId: mockOrganization.sys.id,
    });

    expect(billing).toHaveBeenCalledWith(mockOrganization.sys.id);
    expect(go).toHaveBeenCalledWith(navigatorObject);
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

    build({ usersMeta, isPlatformTrialCommEnabled: true, organization: mockTrialOrganization });

    expect(screen.getByTestId('users-for-plan')).toHaveTextContent(
      `Your organization has ${usersMeta.numFree} users. 10 users are included free with Enterprise tier. ` +
        `Customers on the Enterprise tier can purchase additional users for $15/month per user.`
    );

    expect(screen.getByTestId('subscription-page.org-memberships-link')).toBeVisible();
  });

  it('should show the monthly cost for on demand users', () => {
    build({ organization: Fake.Organization({ isBillable: true }), grandTotal: 3000 });

    expect(screen.getByText('Monthly total')).toBeVisible();
    expect(screen.getByTestId('on-demand-monthly-cost')).toHaveTextContent('$3,000');
  });

  it('should show the limitations copy if the org is nonpaying, user is org owner, and the new space purchase flow is enabled', () => {
    build({ organization: Fake.Organization({ isBillable: false }) });

    expect(screen.getByTestId('subscription-page.non-paying-org-limits')).toBeVisible();
  });

  it('should not show the limitations copy if the org is nonpaying, user is _not_ org owner, and the new space purchase flow is enabled', () => {
    isOwner.mockReturnValue(false);
    build({ organization: Fake.Organization({ isBillable: false }) });

    expect(screen.queryByTestId('subscription-page.billing-copy')).toBeNull();
    expect(screen.queryByTestId('subscription-page.non-paying-org-limits')).toBeNull();
  });

  it('should open the create space dialog if the limitations create space CTA is clicked', () => {
    isOwner.mockReturnValue(true);
    build({ organization: Fake.Organization({ isBillable: false }) });

    userEvent.click(screen.getByTestId('subscription-page.add-space-free-org-cta'));

    expect(beginSpaceCreation).toBeCalled();
  });

  it('should show the billing copy if the org is nonpaying, user is org owner, and the new space purchase flow is disabled', () => {
    isOwner.mockReturnValue(true);
    build({
      organization: Fake.Organization({ isBillable: false }),
      newSpacePurchaseEnabled: false,
    });

    expect(screen.getByTestId('subscription-page.billing-copy')).toBeVisible();
  });

  it('should not show the billing copy if the org is nonpaying, user is _not_ org owner, and the new space purchase flow is disabled', () => {
    isOwner.mockReturnValue(false);
    build({
      organization: Fake.Organization({ isBillable: false }),
      newSpacePurchaseEnabled: false,
    });

    expect(screen.queryByTestId('subscription-page.billing-copy')).toBeNull();
    expect(screen.queryByTestId('subscription-page.non-paying-org-limits')).toBeNull();
  });

  it('should redirect to the billing page when the CTA add billing button is clicked', () => {
    const navigatorObject = { test: true };
    const nonBillableOrganization = Fake.Organization({ isBillable: false });
    isOwner.mockReturnValue(true);
    billing.mockReturnValue(navigatorObject);

    build({
      organization: nonBillableOrganization,
      organizationId: nonBillableOrganization.sys.id,
      newSpacePurchaseEnabled: false,
    });

    userEvent.click(screen.getByTestId('subscription-page.add-billing-button'));
    expect(billing).toHaveBeenCalledWith(nonBillableOrganization.sys.id);
    expect(go).toHaveBeenCalledWith(navigatorObject);
  });

  it('should track a click and open the CreateSpaceModal when onCreateSpace is clicked', () => {
    build();

    userEvent.click(screen.getByTestId('subscription-page.create-space'));
    expect(trackCTAClick).toBeCalledWith(trackCTA.CTA_EVENTS.CREATE_SPACE, {
      organizationId: mockOrganization.sys.id,
    });
    expect(beginSpaceCreation).toBeCalledWith(mockOrganization.sys.id);
  });

  it('should track a click and call showChangeSpaceModal when onChangeSpace is clicked', () => {
    build({ spacePlans: mockSpacePlans });

    // Click on the first space plan's upgrade link
    userEvent.click(screen.getAllByTestId('subscription-page.spaces-list.upgrade-plan-link')[0]);
    expect(trackCTAClick).toBeCalledWith(trackCTA.CTA_EVENTS.UPGRADE_SPACE_PLAN, {
      organizationId: mockOrganization.sys.id,
      spaceId: mockSpacePlans[0].space.sys.id,
    });
    expect(showChangeSpaceModal).toBeCalledWith({
      organizationId: mockOrganization.sys.id,
      space: mockSpacePlans[0].space,
      onSubmit: expect.any(Function),
    });
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
        isPlatformTrialCommEnabled: true,
      });

      expect(screen.getByTestId('platform-trial-info')).toBeVisible();
    });

    it('should show trial info and spaces section for members', () => {
      isOwnerOrAdmin.mockReturnValueOnce(false);
      build({
        organization: mockTrialOrganization,
        isPlatformTrialCommEnabled: true,
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
      organizationId: mockOrganization.sys.id,
      basePlan: mockBasePlan,
      spacePlans: [],
      grandTotal: null,
      usersMeta: null,
      organization: null,
      showMicroSmallSupportCard: null,
      onSpacePlansChange: null,
      newSpacePurchaseEnabled: true,
    },
    custom
  );

  render(<SubscriptionPage {...props} />);
}
