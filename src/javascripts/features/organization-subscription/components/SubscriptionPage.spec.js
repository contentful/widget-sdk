import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as Fake from 'test/helpers/fakeFactory';
import { getVariation } from 'core/feature-flags';
import { isOwner, isOwnerOrAdmin } from 'services/OrganizationRoles';
import { SubscriptionPage } from './SubscriptionPage';
import { OrgSubscriptionContextProvider } from '../context/OrgSubscriptionContext';
import { MemoryRouter } from 'core/react-routing';
import * as trackCTA from 'analytics/trackCTA';

import { beginSpaceCreation } from 'services/CreateSpace';
import { FREE, isFreePlan, SELF_SERVICE } from 'account/pricing/PricingDataProvider';
import { useAppsTrial, isOrganizationOnTrial } from 'features/trials';
import { calculateSubscriptionCosts } from 'utils/SubscriptionUtils';

jest.mock('../utils/generateBasePlanName', () => ({
  generateBasePlanName: jest.fn(),
}));

jest.mock('services/CreateSpace', () => ({
  beginSpaceCreation: jest.fn(),
}));

jest.mock('services/OrganizationRoles', () => ({
  isOwner: jest.fn(),
  isOwnerOrAdmin: jest.fn(),
}));

jest.mock('account/pricing/PricingDataProvider', () => ({
  isEnterprisePlan: jest.fn(),
  isFreePlan: jest.fn(),
  isPartnerPlan: jest.fn(),
}));

jest.mock('states/Navigator', () => ({
  href: jest.fn(),
  getCurrentStateName: jest.fn(),
}));

jest.mock('features/trials/services/TrialService', () => ({
  isOrganizationOnTrial: jest.fn().mockReturnValue(false),
}));
jest.mock('features/trials/hooks/useAppsTrial', () => ({
  useAppsTrial: jest.fn().mockReturnValue({}),
}));

jest.mock('utils/SubscriptionUtils', () => ({
  ...jest.requireActual('utils/SubscriptionUtils'),
  calculateSubscriptionCosts: jest.fn(),
}));

const trackCTAClick = jest.spyOn(trackCTA, 'trackCTAClick');
const trackTargetedCTAClick = jest.spyOn(trackCTA, 'trackTargetedCTAClick');

const mockOrganization = Fake.Organization({
  _v1Migration: {
    status: 'failed',
  },
});
const mockTrialOrganization = Fake.Organization({
  trialPeriodEndsAt: new Date(),
});

const mockBasePlan = Fake.Plan({ name: 'My cool base plan' });
const mockFreeBasePlan = Fake.Plan({ customerType: FREE });
const mockTeamBasePlan = Fake.Plan({ customerType: SELF_SERVICE });

const mockSubscriptionCosts = {
  lineItems: [{ name: 'First Item', price: 3000 }],
  total: 3000,
};

describe('SubscriptionPage', () => {
  beforeEach(() => {
    isOwner.mockReturnValue(true);
    getVariation.mockClear().mockResolvedValue(false);
    isOwnerOrAdmin.mockReturnValue(true);
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

  it('should show user details and CTA to upgrade for the Community customers', () => {
    isFreePlan.mockReturnValueOnce(true);

    const usersMeta = {
      numFree: 5,
      numPaid: 2,
      hardLimit: 5,
    };

    build({ usersMeta, basePlan: mockFreeBasePlan });

    expect(screen.getByTestId('users-for-plan').textContent).toContain(
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
    isOrganizationOnTrial.mockReturnValueOnce(true);
    build({ usersMeta, organization: mockTrialOrganization });

    expect(screen.getByTestId('users-for-plan')).toHaveTextContent(
      `Your organization has ${usersMeta.numFree} users. 10 users are included free with Enterprise tier. ` +
        `Customers on the Enterprise tier can purchase additional users for $15/month per user.`
    );

    expect(screen.getByTestId('subscription-page.org-memberships-link')).toBeVisible();
  });

  it('should show the monthly cost for on demand users', () => {
    calculateSubscriptionCosts.mockReturnValue(mockSubscriptionCosts);
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

    expect(screen.queryByTestId('subscription-page.non-paying-org-limits')).toBeNull();
  });

  it('should not show the limitations copy if the org is on trial', () => {
    isOrganizationOnTrial.mockReturnValueOnce(true);
    build({ organization: mockTrialOrganization });

    expect(screen.queryByTestId('subscription-page.non-paying-org-limits')).toBeNull();
  });

  it('should open the create space dialog if the limitations create space CTA is clicked', () => {
    isOwner.mockReturnValue(true);
    build({ organization: Fake.Organization({ isBillable: false }) });

    userEvent.click(screen.getByTestId('subscription-page.add-space-free-org-cta'));

    expect(beginSpaceCreation).toBeCalled();
  });

  it('should not show the billing copy if the org is nonpaying, user is _not_ org owner, and the new space purchase flow is disabled', () => {
    isOwner.mockReturnValue(false);
    build({
      organization: Fake.Organization({ isBillable: false }),
    });

    expect(screen.queryByTestId('subscription-page.non-paying-org-limits')).toBeNull();
  });

  it('should track a click and open the CreateSpaceModal when onCreateSpace is clicked', () => {
    build();

    userEvent.click(screen.getByTestId('subscription-page.create-space'));
    expect(trackCTAClick).toBeCalledWith(trackCTA.CTA_EVENTS.CREATE_SPACE, {
      organizationId: mockOrganization.sys.id,
    });
    expect(beginSpaceCreation).toBeCalledWith(mockOrganization.sys.id);
  });

  describe('organization on platform trial', () => {
    beforeEach(() => {
      isOwnerOrAdmin.mockReturnValue(true);
      isOrganizationOnTrial.mockReturnValue(true);
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

  describe('contentful apps card', () => {
    it('shows Contentful Apps trial card for users who have not purchased apps', () => {
      isOwnerOrAdmin.mockReturnValueOnce(true);
      useAppsTrial.mockReturnValueOnce({ isAppsTrialActive: true });
      build({ organization: mockOrganization });

      expect(screen.getByTestId('apps-trial-header')).toBeVisible();
      expect(screen.queryByTestId('apps-header')).toBeNull();
    });

    it('shows Contentful Apps card for users who have purchased apps', () => {
      isOwnerOrAdmin.mockReturnValueOnce(true);
      build({
        organization: mockOrganization,
        addOnPlan: { sys: { id: 'addon_id' } },
      });

      expect(screen.getByTestId('apps-header')).toBeVisible();
      expect(screen.queryByTestId('apps-trial-header')).toBeNull();
    });
  });
});

function build(customProps) {
  const props = {
    organization: mockOrganization,
    basePlan: mockBasePlan,
    grandTotal: null,
    usersMeta: null,
    ...customProps,
  };
  const state = {
    spacePlans: [],
    basePlan: mockFreeBasePlan,
    addOnPlans: [],
    numMemberships: 2,
  };

  render(
    <MemoryRouter>
      <OrgSubscriptionContextProvider initialState={state}>
        <SubscriptionPage {...props} />
      </OrgSubscriptionContextProvider>
    </MemoryRouter>
  );
}
