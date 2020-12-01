import { screen, within, waitFor } from '@testing-library/react';
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

// eslint-disable-next-line
import { mockEndpoint } from 'data/EndpointFactory';

const mockOrganization = FakeFactory.Organization({ isBillable: false });
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

const mockPlanCharges = [
  FakeFactory.RatePlanCharge('Environments', 3),
  FakeFactory.RatePlanCharge('Roles', 3),
  FakeFactory.RatePlanCharge('Locales', 3),
  FakeFactory.RatePlanCharge('Content types', 3),
  FakeFactory.RatePlanCharge('Records', 3),
];

const mockSpaceRatePlans = [
  {
    name: 'Community',
    productPlanType: 'free_space',
    productType: 'on_demand',
    price: 0,
    productRatePlanCharges: mockPlanCharges,
  },
  {
    name: 'Medium',
    productPlanType: 'space',
    productType: 'on_demand',
    price: 489,
    productRatePlanCharges: mockPlanCharges,
  },
  {
    name: 'Large',
    productPlanType: 'space',
    productType: 'on_demand',
    price: 879,
    productRatePlanCharges: mockPlanCharges,
  },
];

jest.mock('services/TokenStore', () => ({
  ...jest.requireActual('services/TokenStore'),
  refresh: jest.fn().mockResolvedValue(),
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

describe('SpacePurchaseContainer', () => {
  beforeEach(() => {
    isOwner.mockReturnValue(true);
    mockOrganization.isBillable = false;
  });

  it('should render SPACE_PLAN_SELECTION page as a default', async () => {
    await build();

    expect(screen.getByTestId('space-selection-section')).toBeVisible();
  });

  it('should render SPACE_DETAILS when a plan has been selected', async () => {
    await build();

    userEvent.click(screen.getAllByTestId('select-space-cta')[0]);

    expect(screen.getByTestId('new-space-details-section')).toBeVisible();
  });

  it('should render BILLING_DETAILS when space details have been filled out with the selected space plan', async () => {
    await build(null, { selectedPlan: mockSpaceRatePlans[1] });

    userEvent.click(screen.getAllByTestId('select-space-cta')[0]);

    await waitFor(() => {
      expect(screen.getByTestId('new-space-details-section')).toBeVisible();
    });

    userEvent.type(
      within(screen.getByTestId('space-name')).getByTestId('cf-ui-text-input'),
      'random space name'
    );

    userEvent.click(screen.getByTestId('next-step-new-details-page'));

    await waitFor(() => {
      expect(screen.getByTestId('new-space-billing-details-section')).toBeVisible();
      expect(screen.getByTestId('order-summary.selected-plan-name')).toHaveTextContent(
        mockSpaceRatePlans[1].name
      );
      expect(screen.getByTestId('order-summary.selected-plan-price')).toHaveTextContent(
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
    const input = screen.getByTestId('space-name').getElementsByTagName('input')[0];

    userEvent.type(input, 'test');

    userEvent.click(screen.getByTestId('next-step-new-details-page'));

    // Confirmation Page
    await waitFor(() => {
      expect(screen.getByTestId('new-space-confirmation-section')).toBeVisible();
    });
  });

  it('should disable all paid space plans if the user is not org owner and the org does not have billing details', async () => {
    isOwner.mockReturnValue(false);

    await build();

    const spacePlanCards = screen.getAllByTestId('space-card');

    spacePlanCards.forEach((ele) => {
      expect(within(ele).getByTestId('select-space-cta')).toHaveAttribute('disabled');
    });
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
      const input = screen.getByTestId('space-name').getElementsByTagName('input')[0];

      userEvent.type(input, 'test');

      userEvent.click(screen.getByTestId('next-step-new-details-page'));

      expect(track).toHaveBeenCalledWith(EVENTS.SPACE_DETAILS_ENTERED);
      expect(track).toHaveBeenCalledWith(EVENTS.NAVIGATE, {
        fromStep: 'SPACE_DETAILS',
        toStep: 'BILLING_DETAILS',
      });

      // ------ Billing Details page ------
      // Fill out all text fields
      screen.getAllByTestId('cf-ui-text-input').forEach((textField) => {
        userEvent.type(textField, mockBillingDetails[textField.getAttribute('id')]);
      });

      const countrySelect = within(screen.getByTestId('billing-details.country')).getByTestId(
        'cf-ui-select'
      );

      userEvent.selectOptions(countrySelect, ['Germany']);

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

      const input = screen.getByTestId('space-name').getElementsByTagName('input')[0];

      // ------ Space Details page------
      userEvent.type(input, 'test');

      userEvent.click(screen.getByTestId('next-step-new-details-page'));

      // ------ Billing Details page ------
      // Fill out all text fields
      screen.getAllByTestId('cf-ui-text-input').forEach((textField) => {
        userEvent.type(textField, mockBillingDetails[textField.getAttribute('id')]);
      });

      const countrySelect = within(screen.getByTestId('billing-details.country')).getByTestId(
        'cf-ui-select'
      );

      userEvent.selectOptions(countrySelect, ['Germany']);

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

    const input = screen.getByTestId('space-name').getElementsByTagName('input')[0];

    // ------ Space Details page------
    userEvent.type(input, 'test');

    userEvent.click(screen.getByTestId('next-step-new-details-page'));

    // ------ Billing Details page ------
    // Fill out all text fields
    screen.getAllByTestId('cf-ui-text-input').forEach((textField) => {
      userEvent.type(textField, mockBillingDetails[textField.getAttribute('id')]);
    });

    const countrySelect = within(screen.getByTestId('billing-details.country')).getByTestId(
      'cf-ui-select'
    );

    userEvent.selectOptions(countrySelect, ['Armenia']);

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

  await renderWithProvider(
    SpacePurchaseContainer,
    {
      organization: mockOrganization,
      sessionId: mockSessionMetadata.sessionId,
      templatesList: [],
      freeSpaceResource: mockFreeSpaceResource,
      spaceRatePlans: mockSpaceRatePlans,
      pageContent: {
        pageName: 'Space Purchase',
        content: [],
      },
      ...customState,
    },
    props
  );

  await waitFor(() => screen.getAllByTestId('select-space-cta'));
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
