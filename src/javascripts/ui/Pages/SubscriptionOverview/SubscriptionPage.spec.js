import React from 'react';
import { render, screen } from '@testing-library/react';
// import { render, screen, waitFor } from '@testing-library/react';
// import userEvent from '@testing-library/user-event';
import * as Fake from 'test/helpers/fakeFactory';
import SubscriptionPage from './SubscriptionPage';

// import { isOwner } from 'services/OrganizationRoles';
// import { isEnterprisePlan } from 'account/pricing/PricingDataProvider';
// import { calcUsersMeta } from 'utils/SubscriptionUtils';

jest.mock('services/OrganizationRoles', () => ({
  isOwner: jest.fn(),
}));
jest.mock('account/pricing/PricingDataProvider', () => ({
  isEnterprisePlan: jest.fn(),
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
    // insert test here
  });

  it('should show the monthly cost for on demand users', () => {
    // insert test here
  });

  it('should show CTA to add billing copy if the org is free and user is org owner', () => {
    // insert test here
  });

  it('should not show the add billing copy if the org is free but the user is not org owner', () => {
    // insert test here
  });

  it('should show CTA to talk to support', () => {
    // insert test here
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
