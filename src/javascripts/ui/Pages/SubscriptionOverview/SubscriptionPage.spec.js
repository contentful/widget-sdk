import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as Fake from 'test/helpers/fakeFactory';
import SubscriptionPage from './SubscriptionPage';
import { getVariation } from 'LaunchDarkly';

import { isOwner } from 'services/OrganizationRoles';
import { go } from 'states/Navigator';
import { billing } from './links';

jest.mock('services/OrganizationRoles', () => ({
  isOwner: jest.fn(),
}));
jest.mock('./links', () => ({
  billing: jest.fn(),
  memberships: jest.fn().mockReturnValue({ path: 'not-important-path' }),
}));
jest.mock('states/Navigator', () => ({
  go: jest.fn(),
  href: jest.fn(),
}));

const mockOrganization = Fake.Organization();
const mockBasePlan = Fake.Plan({ name: 'My cool base plan' });
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
    getVariation.mockClear().mockResolvedValue(false);
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
    };

    build({ usersMeta });

    expect(screen.getByTestId('users-for-plan')).toHaveTextContent(
      `Your organization has ${
        usersMeta.numFree + usersMeta.numPaid
      } users. You are exceeding the limit of ${usersMeta.numFree} free users by ${
        usersMeta.numPaid
      } users.That is $${usersMeta.cost} per month.`
    );
  });

  it('should show copy about inaccessible spaces if the user has inaccessible spaces', () => {
    const inaccessibleSpace = Fake.Plan({
      space: Fake.Space({ isAccessible: false }),
    });

    build({
      spacePlans: [...mockSpacePlans, inaccessibleSpace],
    });

    expect(screen.getByTestId('subscription-page.inaccessible-space-copy')).toBeVisible();
  });

  it('should link to users page when link to users page button is clicked', () => {
    const inaccessibleSpace = Fake.Plan({
      space: Fake.Space({ isAccessible: false }),
    });

    build({
      spacePlans: [...mockSpacePlans, inaccessibleSpace],
    });

    userEvent.click(screen.getByTestId('subscription-page.link-to-users-list'));
    expect(go).toBeCalledWith({
      path: 'account.organizations.users.list',
      params: {
        orgId: mockOrganization.sys.id,
      },
    });
  });

  it('should show the monthly cost for on demand users', () => {
    build({ organization: Fake.Organization({ isBillable: true }), grandTotal: 3000 });

    expect(screen.getByText('Monthly total')).toBeVisible();
    expect(screen.getByTestId('on-demand-monthly-cost')).toHaveTextContent('$3,000');
  });

  it('should show CTA to add billing copy if the org is free and user is org owner', () => {
    isOwner.mockReturnValue(true);
    build({ organization: Fake.Organization({ isBillable: false }) });

    expect(screen.getByTestId('subscription-page.billing-copy')).toBeVisible();
  });

  it('should not show the add billing copy if the org is free but the user is not org owner', () => {
    isOwner.mockReturnValue(false);
    build({ organization: Fake.Organization({ isBillable: false }) });

    expect(screen.queryByTestId('subscription-page.billing-copy')).toBeNull();
  });

  it('should redirect to the billing page when the CTA add billing button is clicked', () => {
    const navigatorObject = { test: true };
    const nonBillableOrganization = Fake.Organization({ isBillable: false });
    isOwner.mockReturnValue(true);
    billing.mockReturnValue(navigatorObject);

    build({
      organization: nonBillableOrganization,
      organizationId: nonBillableOrganization.sys.id,
    });

    userEvent.click(screen.getByTestId('subscription-page.add-billing-button'));
    expect(billing).toHaveBeenCalledWith(nonBillableOrganization.sys.id);
    expect(go).toHaveBeenCalledWith(navigatorObject);
  });

  it('should show CTA to talk to support', () => {
    build();

    expect(screen.getByText('Get in touch with us')).toBeVisible();
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
    },
    custom
  );

  render(<SubscriptionPage {...props} />);
}
