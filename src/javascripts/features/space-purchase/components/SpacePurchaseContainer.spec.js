import React from 'react';
import { MemoryRouter } from 'core/react-routing';
import { screen, within, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as FakeFactory from 'test/helpers/fakeFactory';
import * as LazyLoader from 'utils/LazyLoader';
import { SpacePurchaseContainer } from './SpacePurchaseContainer';
import { isOwner } from 'services/OrganizationRoles';
import { EVENTS } from '../utils/analyticsTracking';
import { renderWithProvider } from '../__tests__/helpers';

import {
  createBillingDetails,
  setDefaultPaymentMethod,
  getDefaultPaymentMethod,
  getBillingDetails,
} from 'features/organization-billing/index';
import { getSpacesByOrganization } from 'services/TokenStore';

// eslint-disable-next-line
import { mockEndpoint } from 'data/EndpointFactory';

const mockOrganization = FakeFactory.Organization({ isBillable: false });
const mockSpaceFromOrganization = FakeFactory.Space();
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
const mockRefId = 'ref_1234';
const mockSessionMetadata = { organizationId: mockOrganization.sys.id, sessionId: '987654321' };
const mockFreeSpaceResource = {
  usage: 0,
  limits: {
    included: 1,
    maximum: 1,
  },
};
const mockSubscriptionPlans = [{ name: 'Medium' }];

const mockPlanCharges = [
  FakeFactory.RatePlanCharge('Environments', 3),
  FakeFactory.RatePlanCharge('Roles', 3),
  FakeFactory.RatePlanCharge('Locales', 3),
  FakeFactory.RatePlanCharge('Content types', 3),
  FakeFactory.RatePlanCharge('Records', 3),
];

const mockComposeAndLaunch = {
  price: 100,
};

// TODO: make these mocks available to everyone
const mockSpaceRatePlans = [
  {
    name: 'Community',
    productPlanType: 'free_space',
    productType: 'on_demand',
    price: 0,
    sys: { id: 'free' },
    productRatePlanCharges: mockPlanCharges,
  },
  {
    name: 'Medium',
    productPlanType: 'space',
    productType: 'on_demand',
    price: 489,
    sys: { id: 'random_medium_string' },
    productRatePlanCharges: mockPlanCharges,
  },
  {
    name: 'Large',
    productPlanType: 'space',
    productType: 'on_demand',
    sys: { id: 'random_large_string' },
    price: 879,
    productRatePlanCharges: mockPlanCharges,
  },
];

jest.mock('services/TokenStore', () => ({
  ...jest.requireActual('services/TokenStore'),
  refresh: jest.fn().mockResolvedValue(),
  getSpacesByOrganization: jest.fn(),
}));

jest.mock('services/OrganizationRoles', () => ({
  isOwner: jest.fn().mockReturnValue(true),
}));

jest.mock('utils/LazyLoader', () => {
  const results = {
    Zuora: {
      renderWithErrorHandler: jest.fn(),
      runAfterRender: jest.fn((cb) => cb()),
    },
  };

  return {
    _results: results,
    get: jest.fn().mockImplementation((key) => results[key]),
  };
});

jest.mock('features/organization-billing/index', () => ({
  ...jest.requireActual('features/organization-billing'),
  createBillingDetails: jest.fn(),
  setDefaultPaymentMethod: jest.fn(),
  getDefaultPaymentMethod: jest.fn(),
  getBillingDetails: jest.fn(),
  getHostedPaymentParams: jest.fn().mockResolvedValue(),
}));

jest.mock('account/pricing/PricingDataProvider', () => ({
  isFreeProductPlan: jest.fn(),
  isTrialSpacePlan: jest.fn(),
}));

jest.mock('services/ResourceService', () => {
  return () => ({
    get: (type) => {
      if (type === 'free_space') {
        return mockFreeSpaceResource;
      } else {
        throw `${type} not defined in ResourceService mock`;
      }
    },
  });
});

jest.mock('features/trials', () => ({
  useAppsTrial: jest.fn().mockReturnValue({}),
}));

describe('SpacePurchaseContainer', () => {
  beforeEach(() => {
    isOwner.mockReturnValue(true);
    mockOrganization.isBillable = false;
  });

  it('should render SPACE_PLAN_SELECTION page as a default', async () => {
    await build();

    expect(screen.getByTestId('space-selection-section')).toBeVisible();
  });

  describe('rendering PLATFORM_SELECTION component', () => {
    it('should render with spaces above platforms when `from` is not passed as a prop', async () => {
      await build({ purchasingApps: true });

      expect(screen.getByTestId('platform-selection-section')).toBeVisible();
      expect(screen.getByTestId('platform-space-order').style.flexDirection).toEqual(
        'column-reverse'
      );
    });

    it('should render with spaces above platforms when a non-preselected from is passed', async () => {
      await build({ from: 'random_string', purchasingApps: true });

      expect(screen.getByTestId('platform-selection-section')).toBeVisible();
      expect(screen.getByTestId('platform-space-order').style.flexDirection).toEqual(
        'column-reverse'
      );
    });

    it('should render with platforms above spaces when preselect param is passed', async () => {
      await build({ from: 'marketing_cta', preselectApps: true, purchasingApps: true });

      expect(screen.getByTestId('platform-selection-section')).toBeVisible();
      expect(screen.getByTestId('platform-space-order').style.flexDirection).toEqual('column');
    });
  });

  it('should render SPACE_DETAILS when a plan has been selected', async () => {
    await build();

    userEvent.click(screen.getAllByTestId('select-space-cta')[0]);

    expect(screen.getByTestId('new-space-details-section')).toBeVisible();
  });

  it('should render BILLING_DETAILS when space details have been filled out with the selected space plan', async () => {
    await build(null, { selectedPlan: mockSpaceRatePlans[1] });

    userEvent.click(screen.getAllByTestId('select-space-cta')[0]);

    expect(screen.getByTestId('new-space-details-section')).toBeVisible();

    fillOutSpaceDetailsForm();
    userEvent.click(screen.getByTestId('next-step-new-details-page'));

    await waitFor(() => {
      expect(screen.getByTestId('new-space-billing-details-section')).toBeVisible();
      expect(screen.getByTestId('order-summary.selected-plan')).toHaveTextContent(
        mockSpaceRatePlans[1].name
      );
      expect(screen.getByTestId('order-summary.monthly-total')).toHaveTextContent(
        mockSpaceRatePlans[1].price
      );
    });
  });

  it('should allow any paid space plan to be selected if the user is org owner, even without billing details', async () => {
    await build();

    const spacePlanCards = screen.getAllByTestId('space-card');

    spacePlanCards.forEach((ele) => {
      expect(within(ele).getByTestId('select-space-cta')).not.toHaveAttribute('disabled');
    });
  });

  it('should allow any paid space plan to be selected if the user is not org owner and the org has billing details', async () => {
    mockOrganization.isBillable = true;
    isOwner.mockReturnValueOnce(false);

    await build();

    const spacePlanCards = screen.getAllByTestId('space-card');

    spacePlanCards.forEach((ele) => {
      expect(within(ele).getByTestId('select-space-cta')).not.toHaveAttribute('disabled');
    });
  });

  it('should fetch and display billing details and skip credit card and billing details page if org has billing details', async () => {
    getBillingDetails.mockResolvedValueOnce({
      firstName: 'John',
      lastName: 'Doe',
      workEmail: 'test@example.com',
      vat: '',
      address: {
        address1: '123 street ave',
        address2: 'apartment 321',
        city: 'Berlin',
        zipCode: '11111',
        country: 'Germany',
        state: '',
      },
    });
    getDefaultPaymentMethod.mockResolvedValueOnce({
      number: '411111111111',
      expirationDate: { month: 1, year: '2020' },
    });

    await build(null, {
      organization: { ...mockOrganization, isBillable: true },
      selectedPlan: mockSpaceRatePlans[1],
    });

    // Space Selection Page
    expect(getBillingDetails).toBeCalledWith(mockOrganization.sys.id);
    expect(getDefaultPaymentMethod).toBeCalledWith(mockOrganization.sys.id);

    userEvent.click(screen.getAllByTestId('select-space-cta')[0]);

    // Space Details Page
    fillOutSpaceDetailsForm();

    userEvent.click(screen.getByTestId('next-step-new-details-page'));

    // Confirmation Page
    expect(screen.getByTestId('new-space-confirmation-section')).toBeVisible();
  });

  describe('analytics tracking', () => {
    it('should track each event throughout the whole flow - no template', async () => {
      getDefaultPaymentMethod.mockResolvedValueOnce({
        number: '************1111',
        expirationDate: { month: 3, year: 2021 },
      });

      const track = jest.fn();

      await build({ track }, { selectedPlan: mockSpaceRatePlans[1] });

      // ------ Space select page------
      userEvent.click(screen.getAllByTestId('select-space-cta')[0]);

      expect(track).toHaveBeenCalledWith(EVENTS.SPACE_PLAN_SELECTED, {
        selectedPlan: mockSpaceRatePlans[1],
      });
      expect(track).toHaveBeenCalledWith(EVENTS.NAVIGATE, {
        fromStep: 'SPACE_PLAN_SELECTION',
        toStep: 'SPACE_DETAILS',
      });

      // ------ Space Details page------
      fillOutSpaceDetailsForm();

      userEvent.click(screen.getByTestId('next-step-new-details-page'));

      expect(track).toHaveBeenCalledWith(EVENTS.SPACE_DETAILS_ENTERED);
      expect(track).toHaveBeenCalledWith(EVENTS.NAVIGATE, {
        fromStep: 'SPACE_DETAILS',
        toStep: 'BILLING_DETAILS',
      });

      // ------ Billing Details page ------
      fillOutBillingDetailsForm();

      userEvent.click(screen.getByTestId('billing-details.submit'));

      expect(track).toHaveBeenCalledWith(EVENTS.BILLING_DETAILS_ENTERED);
      expect(track).toHaveBeenCalledWith(EVENTS.NAVIGATE, {
        fromStep: 'BILLING_DETAILS',
        toStep: 'CREDIT_CARD_DETAILS',
      });

      // ------ Card Details page ------
      const successCb = await waitForZuoraToRender();

      successCb({ success: true, refId: mockRefId });

      expect(track).toHaveBeenCalledWith(EVENTS.PAYMENT_DETAILS_ENTERED);

      // ------ Confirmation page ------
      await waitFor(() => {
        expect(screen.getByTestId('new-space-confirmation-section')).toBeVisible();
      });

      expect(track).toHaveBeenCalledWith(EVENTS.NAVIGATE, {
        fromStep: 'CREDIT_CARD_DETAILS',
        toStep: 'CONFIRMATION',
      });

      expect(track).toHaveBeenCalledWith(EVENTS.PAYMENT_METHOD_CREATED);

      userEvent.click(screen.getByTestId('confirm-purchase-button'));

      expect(track).toHaveBeenCalledWith(EVENTS.CONFIRM_PURCHASE);
      expect(track).toHaveBeenCalledWith(EVENTS.NAVIGATE, {
        fromStep: 'CONFIRMATION',
        toStep: 'RECEIPT',
      });
    });
  });

  describe('handler functionality', () => {
    it('should update space name when onChangeSpaceName is used', async () => {
      await build();

      userEvent.click(screen.getAllByTestId('select-space-cta')[0]);

      const input = screen.getByTestId('space-name').getElementsByTagName('input')[0];

      // checks the default value of the input
      expect(input.value).toEqual('New space');

      fireEvent.change(input, { target: { value: '' } });
      userEvent.type(input, 'test');

      expect(input.value).toEqual('test');
    });

    it('should track user navigation', async () => {
      const track = jest.fn();

      await build({ track });

      userEvent.click(screen.getAllByTestId('select-space-cta')[0]);
      expect(track).toBeCalledWith(EVENTS.NAVIGATE, {
        fromStep: 'SPACE_PLAN_SELECTION',
        toStep: 'SPACE_DETAILS',
      });
    });

    it('should save billing information then fetch the payment method onSuccess of the Zuora iframe', async () => {
      getDefaultPaymentMethod.mockResolvedValueOnce({
        number: '************1111',
        expirationDate: { month: 3, year: 2021 },
      });
      await build(null, { selectedPlan: mockSpaceRatePlans[1] });

      // ------ Space select page------
      userEvent.click(screen.getAllByTestId('select-space-cta')[0]);

      // ------ Space Details page------
      fillOutSpaceDetailsForm();

      userEvent.click(screen.getByTestId('next-step-new-details-page'));

      // ------ Billing Details page ------
      fillOutBillingDetailsForm();

      userEvent.click(screen.getByTestId('billing-details.submit'));

      // ------ Card Details page ------
      const successCb = await waitForZuoraToRender();

      successCb({ success: true, refId: mockRefId });

      await waitFor(() => {
        expect(createBillingDetails).toBeCalledWith(mockOrganization.sys.id, {
          ...mockBillingDetails,
          refid: mockRefId,
        });
        expect(setDefaultPaymentMethod).toBeCalledWith(mockOrganization.sys.id, mockRefId);
        expect(getDefaultPaymentMethod).toBeCalledWith(mockOrganization.sys.id);
      });

      // ------ Confirmation page ------
      expect(screen.getByTestId('new-space-confirmation-section')).toBeVisible();
    });
  });

  it('should display saved billing details when navigating back from Credit Card Page', async () => {
    await build(null, { selectedPlan: mockSpaceRatePlans[1] });

    // ------ Space select page------
    userEvent.click(screen.getAllByTestId('select-space-cta')[0]);

    // ------ Space Details page------
    fillOutSpaceDetailsForm();
    userEvent.click(screen.getByTestId('next-step-new-details-page'));

    // ------ Billing Details page ------
    fillOutBillingDetailsForm();
    userEvent.click(screen.getByTestId('billing-details.submit'));

    // ------ Credit Card page------
    await waitFor(() => {
      expect(screen.getByTestId('new-space-card-details-section')).toBeVisible();
    });

    userEvent.click(screen.getByTestId('zuora-iframe.cancel-button'));

    // ------ Billing Details page------
    await waitFor(() => {
      expect(screen.getByTestId('billing-details.card')).toBeVisible();
    });

    // Check all text fields
    screen.getAllByTestId('cf-ui-text-input').forEach((textField) => {
      expect(textField.value).toEqual(mockBillingDetails[textField.getAttribute('id')]);
    });
  });

  it('should not allow a user without any paid spaces to select community space after selecting compose+launch', async () => {
    await build(
      { purchasingApps: true },
      {
        subscriptionPlans: [{ name: 'Community' }],
      }
    );

    // select compose+launch
    userEvent.click(screen.getAllByTestId('platform-card')[1]);

    expect(screen.getAllByTestId('space-plan-card')[0]).toHaveAttribute('aria-disabled');
  });

  describe('navigation', () => {
    beforeEach(() => {
      getDefaultPaymentMethod.mockResolvedValue({
        number: '************1111',
        expirationDate: { month: 3, year: 2021 },
      });
    });

    it('sucessful completion of organization without billing details - contentful platform', async () => {
      await build({ purchasingApps: true });

      // 1. Platform selection
      // select a platform
      userEvent.click(screen.getAllByTestId('platform-card')[0]);

      // select a space
      userEvent.click(screen.getAllByTestId('space-plan-card')[1]);

      // monthly total should be the sum of the platform price and the space price
      expect(screen.getByTestId('monthly-total').textContent).toEqual(
        `$${mockSpaceRatePlans[1].price}`
      );

      // continue
      userEvent.click(screen.getByTestId('platform-select-continue-button'));

      // Test back navigation
      expect(screen.getByTestId('space-selection.heading')).toBeDefined();
      userEvent.click(screen.getByTestId('navigate-back'));
      expect(screen.getByTestId('platform-selection-section')).toBeDefined();
      // select a space as it becomes unselected (to be fixed)
      userEvent.click(screen.getAllByTestId('space-plan-card')[1]);
      userEvent.click(screen.getByTestId('platform-select-continue-button'));

      // 2. Space Details
      fillOutSpaceDetailsForm();
      userEvent.click(screen.getByTestId('next-step-new-details-page'));

      // Test back navigation
      expect(screen.getByTestId('new-space-billing-details-section')).toBeVisible();
      userEvent.click(screen.getByTestId('billing-details.cancel'));
      expect(screen.getByTestId('space-selection.heading')).toBeDefined();
      userEvent.click(screen.getByTestId('next-step-new-details-page'));

      // 3. Billing Details
      fillOutBillingDetailsForm();
      userEvent.click(screen.getByTestId('billing-details.submit'));

      // Test back navigation
      expect(screen.getByTestId('new-space-card-details-section')).toBeVisible();
      userEvent.click(screen.getByTestId('zuora-iframe.cancel-button'));
      expect(screen.getByTestId('new-space-billing-details-section')).toBeVisible();
      userEvent.click(screen.getByTestId('billing-details.submit'));

      // 4. Credit Card Details
      const successCb = await waitForZuoraToRender();
      successCb({ success: true, refId: mockRefId });

      // Test back navigation
      await waitFor(() => {
        expect(screen.getByTestId('new-space-confirmation-section')).toBeVisible();
      });
      userEvent.click(screen.getByTestId('navigate-back'));
      expect(screen.getByTestId('new-space-card-details-section')).toBeVisible();
      successCb({ success: true, refId: mockRefId });

      // 5. Confirmation
      await waitFor(() => {
        expect(screen.getByTestId('new-space-confirmation-section')).toBeVisible();
      });
      userEvent.click(screen.getByTestId('confirm-purchase-button'));

      // 6. Receipt Page
      expect(screen.getByTestId('new-space-receipt-section')).toBeVisible();
    });

    it('successful completion of organization with billing details - contentful platform', async () => {
      await build(
        { purchasingApps: true },
        {
          organization: { ...mockOrganization, isBillable: true },
        }
      );

      // 1. Platform selection
      // select a platform
      userEvent.click(screen.getAllByTestId('platform-card')[0]);

      // select a space
      userEvent.click(screen.getAllByTestId('space-plan-card')[1]);

      // monthly total should be the sum of the platform price and the space price
      expect(screen.getByTestId('monthly-total').textContent).toEqual(
        `$${mockSpaceRatePlans[1].price}`
      );

      // continue
      userEvent.click(screen.getByTestId('platform-select-continue-button'));

      // Test back navigation
      expect(screen.getByTestId('space-selection.heading')).toBeDefined();
      userEvent.click(screen.getByTestId('navigate-back'));
      expect(screen.getByTestId('platform-selection-section')).toBeDefined();
      // select a space as it becomes unselected (to be fixed)
      userEvent.click(screen.getAllByTestId('space-plan-card')[1]);
      userEvent.click(screen.getByTestId('platform-select-continue-button'));

      // 2. Space Details
      fillOutSpaceDetailsForm();
      userEvent.click(screen.getByTestId('next-step-new-details-page'));

      // Test back navigation
      expect(screen.getByTestId('new-space-confirmation-section')).toBeVisible();
      userEvent.click(screen.getByTestId('navigate-back'));
      expect(screen.getByTestId('space-selection.heading')).toBeDefined();
      userEvent.click(screen.getByTestId('next-step-new-details-page'));

      // 4. Confirmation
      expect(screen.getByTestId('new-space-confirmation-section')).toBeVisible();
      userEvent.click(screen.getByTestId('confirm-purchase-button'));

      // 6. Receipt Page
      expect(screen.getByTestId('new-space-receipt-section')).toBeVisible();
    });

    it('sucessful completion of organization without billing details - compose+launch platform', async () => {
      await build({ purchasingApps: true, preselectApps: true });

      // 1. Platform selection
      // select a platform
      userEvent.click(screen.getAllByTestId('platform-card')[1]);

      // select a space
      userEvent.click(screen.getAllByTestId('space-plan-card')[1]);

      // monthly total should be the sum of the platform price and the space price
      expect(screen.getByTestId('monthly-total').textContent).toEqual(
        `$${mockComposeAndLaunch.price + mockSpaceRatePlans[1].price}`
      );

      // continue
      userEvent.click(screen.getByTestId('platform-select-continue-button'));

      // Test back navigation
      expect(screen.getByTestId('new-space-billing-details-section')).toBeVisible();
      userEvent.click(screen.getByTestId('billing-details.cancel'));
      expect(screen.getByTestId('platform-selection-section')).toBeDefined();
      // select a space as it becomes unselected (to be fixed)
      userEvent.click(screen.getAllByTestId('space-plan-card')[1]);
      userEvent.click(screen.getByTestId('platform-select-continue-button'));

      // 2. Billing Details
      fillOutBillingDetailsForm();
      userEvent.click(screen.getByTestId('billing-details.submit'));

      // Test back navigation
      expect(screen.getByTestId('new-space-card-details-section')).toBeVisible();
      userEvent.click(screen.getByTestId('zuora-iframe.cancel-button'));
      expect(screen.getByTestId('new-space-billing-details-section')).toBeVisible();
      userEvent.click(screen.getByTestId('billing-details.submit'));

      // 3. Credit Card Details
      const successCb = await waitForZuoraToRender();
      successCb({ success: true, refId: mockRefId });

      // Test back navigation
      await waitFor(() => {
        expect(screen.getByTestId('new-space-confirmation-section')).toBeVisible();
      });
      userEvent.click(screen.getByTestId('navigate-back'));
      expect(screen.getByTestId('new-space-card-details-section')).toBeVisible();
      successCb({ success: true, refId: mockRefId });

      // 4. Confirmation
      await waitFor(() => {
        expect(screen.getByTestId('new-space-confirmation-section')).toBeVisible();
      });
      userEvent.click(screen.getByTestId('confirm-purchase-button'));

      // 5. Receipt Page
      expect(screen.getByTestId('new-space-receipt-section')).toBeVisible();
    });

    it('successful completion of organization with billing details - compose+launch platform', async () => {
      await build(
        { purchasingApps: true },
        {
          organization: { ...mockOrganization, isBillable: true },
        }
      );

      // 1. Platform selection
      // select a platform
      userEvent.click(screen.getAllByTestId('platform-card')[1]);

      // select a space
      userEvent.click(screen.getAllByTestId('space-plan-card')[1]);

      // monthly total should be the sum of the platform price and the space price
      expect(screen.getByTestId('monthly-total').textContent).toEqual(
        `$${mockComposeAndLaunch.price + mockSpaceRatePlans[1].price}`
      );

      // continue
      userEvent.click(screen.getByTestId('platform-select-continue-button'));

      // Test back navigation
      expect(screen.getByTestId('new-space-confirmation-section')).toBeVisible();
      userEvent.click(screen.getByTestId('navigate-back'));
      expect(screen.getByTestId('platform-selection-section')).toBeDefined();
      // select a space as it becomes unselected (to be fixed)
      userEvent.click(screen.getAllByTestId('space-plan-card')[1]);
      userEvent.click(screen.getByTestId('platform-select-continue-button'));

      // 2. Confirmation
      expect(screen.getByTestId('new-space-confirmation-section')).toBeVisible();
      userEvent.click(screen.getByTestId('confirm-purchase-button'));

      // 3. Receipt Page
      expect(screen.getByTestId('new-space-receipt-section')).toBeVisible();
    });

    it('sucessful completion of organization with billing details - buying only compose+launch platform and no space', async () => {
      getSpacesByOrganization.mockReturnValue({
        [mockOrganization.sys.id]: [mockSpaceFromOrganization],
      });
      await build(
        { purchasingApps: true },
        {
          organization: { ...mockOrganization, isBillable: true },
        }
      );

      // 1. Platform selection
      await waitFor(() => {
        expect(screen.getByTestId('platform-selection-section')).toBeDefined();
      });
      // select a platform
      userEvent.click(screen.getAllByTestId('platform-card')[1]);

      // select 'Choose space later'
      userEvent.click(screen.getByTestId('choose-space-later-button'));

      // continue
      userEvent.click(screen.getByTestId('platform-select-continue-button'));

      // Test back navigation
      expect(screen.getByTestId('new-space-confirmation-section')).toBeVisible();
      userEvent.click(screen.getByTestId('navigate-back'));
      expect(screen.getByTestId('platform-selection-section')).toBeDefined();
      // select a space as it becomes unselected (to be fixed)
      userEvent.click(screen.getByTestId('choose-space-later-button'));
      userEvent.click(screen.getByTestId('platform-select-continue-button'));

      // 2. Confirmation
      expect(screen.getByTestId('new-space-confirmation-section')).toBeVisible();
      userEvent.click(screen.getByTestId('confirm-purchase-button'));

      // 3. Receipt Page
      expect(screen.getByTestId('performance-receipt-section')).toBeVisible();
    });
  });

  describe('back button', () => {
    it('should go back a step when clicked', async () => {
      await build();

      userEvent.click(screen.getAllByTestId('select-space-cta')[0]);
      expect(screen.getByTestId('new-space-details-section')).toBeVisible();

      userEvent.click(screen.getByTestId('navigate-back'));

      waitFor(() => {
        expect(screen.getByTestId('space-selection-section')).toBeVisible();
      });
    });
  });
});

async function build(customProps, customState) {
  const props = {
    track: () => {},
    ...customProps,
  };

  renderWithProvider(
    () => (
      <MemoryRouter>
        <SpacePurchaseContainer {...props} />
      </MemoryRouter>
    ),
    {
      organization: mockOrganization,
      sessionId: mockSessionMetadata.sessionId,
      templatesList: [],
      freeSpaceResource: mockFreeSpaceResource,
      spaceRatePlans: mockSpaceRatePlans,
      subscriptionPlans: mockSubscriptionPlans,
      pageContent: {
        pageName: 'Space Purchase',
        content: [],
      },
      composeAndLaunchProductRatePlan: mockComposeAndLaunch,
      ...customState,
    },
    props
  );

  // Platform step does not need to wait for cta to load
  if (props.hasPurchasedApps) {
    await waitFor(() => screen.getAllByTestId('select-space-cta'));
  }
}

async function waitForZuoraToRender() {
  const { Zuora } = LazyLoader._results;

  let runAfterRenderCb;
  let successCb;

  Zuora.renderWithErrorHandler.mockImplementationOnce(
    (_params, _prefilledFields, cb) =>
      (successCb = () => {
        const response = { success: true, refId: mockRefId };

        cb(response);

        // For simplified testing, return the response here as well
        return response;
      })
  );

  Zuora.runAfterRender.mockImplementationOnce((cb) => (runAfterRenderCb = cb));

  await waitFor(() => expect(Zuora.renderWithErrorHandler).toBeCalled());

  await waitFor(runAfterRenderCb);

  expect(screen.getByTestId('zuora-iframe.iframe-element')).toBeVisible();

  return successCb;
}

function fillOutSpaceDetailsForm() {
  const input = screen.getByTestId('space-name').getElementsByTagName('input')[0];
  userEvent.type(input, 'test');
}

function fillOutBillingDetailsForm() {
  screen.getAllByTestId('cf-ui-text-input').forEach((textField) => {
    userEvent.type(textField, mockBillingDetails[textField.getAttribute('id')]);
  });

  const countrySelect = within(screen.getByTestId('billing-details.country')).getByTestId(
    'cf-ui-select'
  );

  userEvent.selectOptions(countrySelect, ['Germany']);
}
