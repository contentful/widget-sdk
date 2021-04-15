import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as Fake from 'test/helpers/fakeFactory';
import { getVariation } from 'LaunchDarkly';

import { isOwner, isOwnerOrAdmin } from 'services/OrganizationRoles';
import { fetchWebappContentByEntryID } from 'core/services/ContentfulCDA';
import { NonEnterpriseSubscriptionPage } from './NonEnterpriseSubscriptionPage';

import * as trackCTA from 'analytics/trackCTA';

import { beginSpaceCreation } from 'services/CreateSpace';
import { FREE } from 'account/pricing/PricingDataProvider';
import { mockWebappContent } from './__mocks__/webappContent';

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

jest.mock('core/services/ContentfulCDA', () => ({
  fetchWebappContentByEntryID: jest.fn(),
}));

const trackCTAClick = jest.spyOn(trackCTA, 'trackCTAClick');

const mockOrganization = Fake.Organization();
const mockFreeBasePlan = Fake.Plan({ name: 'Community Platform', customerType: FREE });
const mockFreeSpacePlan = { planType: 'free_space', space: { sys: { id: 'test' } } };

describe('NonEnterpriseSubscriptionPage', () => {
  beforeEach(() => {
    isOwner.mockReturnValue(true);
    getVariation.mockClear().mockResolvedValue(false);
    isOwnerOrAdmin.mockReturnValue(true);
  });

  it('should show skeletons when initialLoad is true', async () => {
    build({ initialLoad: true });

    screen.getAllByTestId('cf-ui-skeleton-form').forEach((ele) => {
      expect(ele).toBeVisible();
    });
  });

  it('show the BasePlanCard when content is fetched', async () => {
    fetchWebappContentByEntryID.mockResolvedValue(mockWebappContent);
    build();

    await waitFor(() => expect(screen.queryByTestId('base-plan-card')).toBeDefined());
  });

  it('should show the monthly cost for on demand users', () => {
    build({ organization: Fake.Organization({ isBillable: true }), grandTotal: 3000 });

    expect(screen.getByText('Monthly total')).toBeVisible();
    expect(screen.getByTestId('on-demand-monthly-cost')).toHaveTextContent('$3,000');
  });

  it('should not show the limitations copy if the org is nonpaying, user is _not_ org owner, and the new space purchase flow is enabled', () => {
    isOwner.mockReturnValue(false);
    build({ organization: Fake.Organization({ isBillable: false }) });

    expect(screen.queryByTestId('subscription-page.billing-copy')).toBeNull();
    expect(screen.queryByTestId('subscription-page.non-paying-org-limits')).toBeNull();
  });

  it('should not show the billing copy if the org is nonpaying, user is _not_ org owner, and the new space purchase flow is disabled', () => {
    isOwner.mockReturnValue(false);
    build({
      organization: Fake.Organization({ isBillable: false }),
    });

    expect(screen.queryByTestId('subscription-page.billing-copy')).toBeNull();
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

  describe('contentful apps card', () => {
    it('shows Contentful Apps trial card for users who have not purchased apps', () => {
      isOwnerOrAdmin.mockReturnValueOnce(true);
      build({ organization: mockOrganization, isAppTrialActive: true });

      expect(screen.getByTestId('apps-trial-header')).toBeVisible();
      expect(screen.queryByTestId('apps-header')).toBeNull();
    });

    it('shows Contentful Apps card for users who have purchased apps', () => {
      isOwnerOrAdmin.mockReturnValueOnce(true);
      build({
        organization: mockOrganization,
        addOnPlan: { sys: { id: 'addon_id' } },
        composeAndLaunchEnabled: true,
      });

      expect(screen.getByTestId('apps-header')).toBeVisible();
      expect(screen.queryByTestId('apps-trial-header')).toBeNull();
    });
  });
});

function build(custom) {
  const props = Object.assign(
    {
      initialLoad: false,
      organization: mockOrganization,
      basePlan: mockFreeBasePlan,
      spacePlans: [mockFreeSpacePlan],
      grandTotal: null,
      usersMeta: null,
      onSpacePlansChange: null,
    },
    custom
  );

  render(<NonEnterpriseSubscriptionPage {...props} />);
}
