import React from 'react';
import userEvent from '@testing-library/user-event';
import { screen } from '@testing-library/react';
import * as Fake from 'test/helpers/fakeFactory';
import { EVENTS } from '../../utils/analyticsTracking';
import { setUser } from 'services/OrganizationRoles';
import { ConfirmationStep } from './ConfirmationStep';
import { renderWithProvider } from '../../__tests__/helpers';
import { MemoryRouter } from 'core/react-routing';

const mockOrganization = Fake.Organization();
const mockOrgOwner = Fake.User({
  organizationMemberships: [{ organization: mockOrganization, role: 'owner' }],
});
const mockOrgAdmin = Fake.User({
  organizationMemberships: [{ organization: mockOrganization, role: 'admin' }],
});

const mockSelectedPlan = Fake.Plan();
const mockBillingDetails = {
  firstName: 'John',
  lastName: 'Doe',
  workEmail: 'test@example.com',
  address1: '123 street ave',
  address2: 'apartment 321',
  city: 'Berlin',
  zipCode: '11111',
  country: 'Germany',
  state: '',
  vat: '',
};
const mockPaymentMethod = {
  number: '************1111',
  expirationDate: { month: 3, year: 2021 },
};

describe('ConfirmationStep', () => {
  beforeEach(() => {
    setUser(mockOrgOwner);
  });

  it('should not show the edit link when the organization is not billable', async () => {
    await build();

    expect(screen.queryByTestId('confirmation-page.edit-billing-link')).toBeNull();
  });

  it('should not show the edit link if the user is not org owner, even if the org is billable', async () => {
    setUser(mockOrgAdmin);

    await build(null, {
      organization: Object.assign({}, mockOrganization, {
        isBillable: true,
      }),
    });

    expect(screen.queryByTestId('confirmation-page.edit-billing-link')).toBeNull();
  });

  it('should show the edit link when the org is billable and track clicks on it', async () => {
    const track = jest.fn();
    await build(
      { track },
      {
        organization: Object.assign({}, mockOrganization, {
          isBillable: true,
        }),
      }
    );

    const editBillingLink = screen.getByTestId('confirmation-page.edit-billing-link');

    expect(editBillingLink).toBeVisible();

    userEvent.click(editBillingLink);

    expect(track).toHaveBeenCalledWith(EVENTS.INTERNAL_LINK_CLICKED, {
      state: 'account.organizations.billing',
      intent: 'edit_billing',
    });
  });

  it('should show the loading state if the payment and billing details are null and the org is billable', async () => {
    await build(null, {
      billingDetails: null,
      paymentDetails: null,
    });

    expect(screen.getByTestId('billing-details-loading')).toBeVisible();
    expect(screen.getByTestId('credit-card-details-loading')).toBeVisible();
  });

  it('should not show the loading state if the payment and billing details have loaded', async () => {
    await build();

    expect(screen.queryByTestId('billing-details-loading')).toBeNull();
    expect(screen.queryByTestId('credit-card-details-loading')).toBeNull();
  });

  it('should not show the billing details section if the user is not org owner', async () => {
    setUser(mockOrgAdmin);

    await build();

    expect(screen.queryByTestId('new-space-confirmation.billing-details')).toBeNull();
  });

  it('should render the payment section with buttons if the user is not org owner', async () => {
    setUser(mockOrgAdmin);

    await build();

    expect(screen.getByTestId('order-summary.buttons')).toBeVisible();
  });
});

async function build(customProps, customState) {
  const props = {
    track: () => {},
    onSubmit: () => {},
    onBack: () => {},
    ...customProps,
  };

  await renderWithProvider(
    () => (
      <MemoryRouter>
        <ConfirmationStep {...props} />
      </MemoryRouter>
    ),
    {
      organization: mockOrganization,
      selectedPlan: mockSelectedPlan,
      billingDetails: mockBillingDetails,
      paymentDetails: mockPaymentMethod,
      ...customState,
    },
    props
  );
}
