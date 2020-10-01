import React from 'react';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as FakeFactory from 'test/helpers/fakeFactory';
import * as LazyLoader from 'utils/LazyLoader';
import { NewSpacePage } from './NewSpacePage';
import { isOwner } from 'services/OrganizationRoles';
import { trackEvent, EVENTS } from '../utils/analyticsTracking';

import {
  createBillingDetails,
  setDefaultPaymentMethod,
  getDefaultPaymentMethod,
  getBillingDetails,
} from 'features/organization-billing/index';

// eslint-disable-next-line
import { mockEndpoint } from 'data/EndpointFactory';

const mockOrganization = FakeFactory.Organization({ isBillable: false });
const mockProductRatePlanMedium = { name: 'Medium', price: 100 };
const mockProductRatePlanLarge = { name: 'Large', price: 200 };
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
const mockSessionId = '987654321';
const mockSessionMetadata = { organizationId: mockOrganization.sys.id, sessionId: mockSessionId };

jest.mock('services/TokenStore', () => ({
  ...jest.requireActual('services/TokenStore'),
  refresh: jest.fn().mockResolvedValue(),
}));

jest.mock('../utils/analyticsTracking', () => ({
  trackEvent: jest.fn().mockReturnValue(true),
  EVENTS: jest.requireActual('../utils/analyticsTracking').EVENTS,
}));

jest.mock('services/OrganizationRoles', () => ({
  isOwner: jest.fn().mockReturnValue(true),
}));

jest.mock('utils/LazyLoader', () => {
  const results = {
    Zuora: {
      render: jest.fn(),
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

describe('NewSpacePage', () => {
  beforeEach(() => {
    isOwner.mockReturnValue(true);
    mockOrganization.isBillable = false;
  });

  it('should render SPACE_SELECTION page as a default', () => {
    build();

    expect(screen.getByTestId('space-selection-section')).toBeVisible();
  });

  it('should render SPACE_DETAILS when a plan has been selected', () => {
    build();

    userEvent.click(screen.getAllByTestId('select-space-cta')[0]);

    expect(screen.getByTestId('new-space-details-section')).toBeVisible();
  });

  it('should render BILLING_DETAILS when space details have been filled out with the selected space plan', async () => {
    build();

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
        mockProductRatePlanMedium.name
      );
      expect(screen.getByTestId('order-summary.selected-plan-price')).toHaveTextContent(
        mockProductRatePlanMedium.price
      );
    });
  });

  it('should allow any paid space plan to be selected if the user is org owner, even without billing details', () => {
    build();

    const spacePlanCards = screen.getAllByTestId('space-card');

    spacePlanCards.forEach((ele) => {
      expect(within(ele).getByTestId('select-space-cta')).not.toHaveAttribute('disabled');
    });
  });

  it('should allow any paid space plan to be selected if the user is not org owner and the org has billing details', () => {
    mockOrganization.isBillable = true;
    isOwner.mockReturnValueOnce(false);

    build();

    const spacePlanCards = screen.getAllByTestId('space-card');

    spacePlanCards.forEach((ele) => {
      expect(within(ele).getByTestId('select-space-cta')).not.toHaveAttribute('disabled');
    });
  });

  it('should fetch and display billing details and skip credit card and billing details page if org has billing details', async () => {
    mockOrganization.isBillable = true;
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

    build();

    // Space Selection Page
    expect(getBillingDetails).toBeCalledWith(mockOrganization.sys.id);
    expect(getDefaultPaymentMethod).toBeCalledWith(mockOrganization.sys.id);

    userEvent.click(screen.getAllByTestId('select-space-cta')[0]);

    // Space Details Page
    const input = screen.getByTestId('space-name').getElementsByTagName('input')[0];

    userEvent.type(input, 'test');

    userEvent.click(screen.getByTestId('next-step-new-details-page'));

    // Confirmation Page
    expect(screen.getByTestId('new-space-confirmation-section')).toBeVisible();
  });

  it('should disable all paid space plans if the user is not org owner and the org does not have billing details', () => {
    isOwner.mockReturnValue(false);

    build();

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
      build();

      // ------ Space select page------
      userEvent.click(screen.getAllByTestId('select-space-cta')[0]);

      expect(trackEvent).toHaveBeenCalledWith(EVENTS.SPACE_PLAN_SELECTED, mockSessionMetadata, {
        selectedPlan: mockProductRatePlanMedium,
      });
      expect(trackEvent).toHaveBeenCalledWith(EVENTS.NAVIGATE, mockSessionMetadata, {
        fromStep: 'SPACE_SELECTION',
        toStep: 'SPACE_DETAILS',
      });

      // ------ Space Details page------
      const input = screen.getByTestId('space-name').getElementsByTagName('input')[0];

      userEvent.type(input, 'test');

      userEvent.click(screen.getByTestId('next-step-new-details-page'));

      expect(trackEvent).toHaveBeenCalledWith(EVENTS.SPACE_DETAILS_ENTERED, mockSessionMetadata);
      expect(trackEvent).toHaveBeenCalledWith(EVENTS.NAVIGATE, mockSessionMetadata, {
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

      userEvent.selectOptions(countrySelect, ['DE']);

      userEvent.click(screen.getByTestId('billing-details.submit'));

      expect(trackEvent).toHaveBeenCalledWith(EVENTS.BILLING_DETAILS_ENTERED, mockSessionMetadata);
      expect(trackEvent).toHaveBeenCalledWith(EVENTS.NAVIGATE, mockSessionMetadata, {
        fromStep: 'BILLING_DETAILS',
        toStep: 'CARD_DETAILS',
      });

      // ------ Card Details page ------
      const successCb = await waitForZuoraToRender();

      successCb({ success: true, refId: mockRefId });

      expect(trackEvent).toHaveBeenCalledWith(EVENTS.PAYMENT_DETAILS_ENTERED, mockSessionMetadata);

      // ------ Confirmation page ------
      await waitFor(() => {
        expect(screen.getByTestId('new-space-confirmation-section')).toBeVisible();
      });

      expect(trackEvent).toHaveBeenCalledWith(EVENTS.NAVIGATE, mockSessionMetadata, {
        fromStep: 'CARD_DETAILS',
        toStep: 'CONFIRMATION',
      });

      expect(trackEvent).toHaveBeenCalledWith(EVENTS.PAYMENT_METHOD_CREATED, mockSessionMetadata);

      userEvent.click(screen.getByTestId('confirm-purchase-button'));

      expect(trackEvent).toHaveBeenCalledWith(EVENTS.CONFIRM_PURCHASE, mockSessionMetadata);
      expect(trackEvent).toHaveBeenCalledWith(EVENTS.NAVIGATE, mockSessionMetadata, {
        fromStep: 'CONFIRMATION',
        toStep: 'RECEIPT',
      });
    });
  });

  describe('handler functionality', () => {
    it('should update space name when onChangeSpaceName is used', () => {
      build();

      userEvent.click(screen.getAllByTestId('select-space-cta')[0]);

      const input = screen.getByTestId('space-name').getElementsByTagName('input')[0];

      userEvent.type(input, 'test');

      expect(input.value).toEqual('test');
    });

    it('should track user navigation', () => {
      build();

      userEvent.click(screen.getAllByTestId('select-space-cta')[0]);
      expect(trackEvent).toBeCalledWith(
        EVENTS.NAVIGATE,
        {
          organizationId: mockOrganization.sys.id,
          sessionId: mockSessionId,
        },
        { fromStep: 'SPACE_SELECTION', toStep: 'SPACE_DETAILS' }
      );
    });

    it('should save billing information then fetch the payment method onSuccess of the Zoura iframe', async () => {
      getDefaultPaymentMethod.mockResolvedValueOnce({
        number: '************1111',
        expirationDate: { month: 3, year: 2021 },
      });
      build();

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
    build();

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

    userEvent.click(screen.getByTestId('navigate-back'));

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
    it('should go back a step when clicked', () => {
      build();

      userEvent.click(screen.getAllByTestId('select-space-cta')[0]);
      expect(screen.getByTestId('new-space-details-section')).toBeVisible();

      userEvent.click(screen.getByTestId('navigate-back'));

      waitFor(() => {
        expect(screen.getByTestId('space-selection-section')).toBeVisible();
      });
    });

    it('should go back a step when browser back is clicked', () => {
      build();

      userEvent.click(screen.getAllByTestId('select-space-cta')[0]);
      expect(screen.getByTestId('new-space-details-section')).toBeVisible();

      window.history.back();

      waitFor(() => {
        expect(screen.getByTestId('space-selection-section')).toBeVisible();
      });
    });
  });

  describe('browser forward button', () => {
    it('should go forward a step when clicked after a back button has been clicked', () => {
      build();

      userEvent.click(screen.getAllByTestId('select-space-cta')[0]);
      expect(screen.getByTestId('new-space-details-section')).toBeVisible();

      userEvent.click(screen.getByTestId('navigate-back'));

      waitFor(() => {
        expect(screen.getByTestId('space-selection-section')).toBeVisible();
      });

      window.history.forward();

      expect(screen.getByTestId('new-space-details-section')).toBeVisible();
    });

    it('should go forward a step after the browser back button has been clicked', () => {
      build();

      userEvent.click(screen.getAllByTestId('select-space-cta')[0]);
      expect(screen.getByTestId('new-space-details-section')).toBeVisible();

      window.history.back();

      waitFor(() => {
        expect(screen.getByTestId('space-selection-section')).toBeVisible();
      });

      window.history.forward();

      expect(screen.getByTestId('new-space-details-section')).toBeVisible();
    });
  });
});

function build(customProps) {
  const props = {
    organization: mockOrganization,
    sessionMetadata: mockSessionMetadata,
    templatesList: [],
    canCreateCommunityPlan: true,
    productRatePlans: [mockProductRatePlanMedium, mockProductRatePlanLarge],
    pageContent: {
      pageName: 'Space Purchase',
      content: [],
    },
    ...customProps,
  };

  render(<NewSpacePage {...props} />);
}

async function waitForZuoraToRender() {
  const { Zuora } = LazyLoader._results;

  let runAfterRenderCb;
  let successCb;

  Zuora.render.mockImplementationOnce(
    (_params, _prefilledFields, cb) =>
      (successCb = () => {
        const response = { success: true, refId: mockRefId };

        cb(response);

        // For simplified testing, return the response here as well
        return response;
      })
  );

  Zuora.runAfterRender.mockImplementationOnce((cb) => (runAfterRenderCb = cb));

  await waitFor(() => expect(Zuora.render).toBeCalled());

  await waitFor(runAfterRenderCb);

  expect(screen.getByTestId('zuora-payment-iframe')).toBeVisible();

  return successCb;
}
