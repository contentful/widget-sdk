import React from 'react';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as FakeFactory from 'test/helpers/fakeFactory';
import * as LazyLoader from 'utils/LazyLoader';
import { NewSpacePage } from './NewSpacePage';

import {
  createBillingDetails,
  setDefaultPaymentMethod,
  getDefaultPaymentMethod,
} from 'features/organization-billing/index';

// eslint-disable-next-line
import { mockEndpoint } from 'data/EndpointFactory';

const mockOrganization = FakeFactory.Organization();
const mockProductRatePlanMedium = { name: 'Medium', price: 100 };
const mockProductRatePlanLarge = { name: 'Large', price: 200 };
const mockBillingDetails = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'test@example.com',
  address: '123 street ave',
  addressTwo: 'apartment 321',
  city: 'Berlin',
  postcode: '11111',
  country: 'DE',
  state: '',
  vatNumber: '',
};
const mockRefId = 'ref_1234';

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
  createBillingDetails: jest.fn(),
  setDefaultPaymentMethod: jest.fn(),
  getDefaultPaymentMethod: jest.fn(),
  getHostedPaymentParams: jest.fn().mockResolvedValue(),
  ZuoraCreditCardIframe: jest.requireActual('features/organization-billing/index')
    .ZuoraCreditCardIframe,
}));

describe('NewSpacePage', () => {
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

  describe('handler functionality', () => {
    it('should update space name when onChangeSpaceName is used', () => {
      build();

      userEvent.click(screen.getAllByTestId('select-space-cta')[0]);

      const input = screen.getByTestId('space-name').getElementsByTagName('input')[0];

      userEvent.type(input, 'test');

      expect(input.value).toEqual('test');
    });

    it('should save billing information then fetch the payment method onSuccess of the Zoura iframe', async () => {
      const reconciledBillingDetails = {
        refid: mockRefId,
        firstName: mockBillingDetails.firstName,
        lastName: mockBillingDetails.lastName,
        vat: mockBillingDetails.vatNumber,
        workEmail: mockBillingDetails.email,
        address1: mockBillingDetails.address,
        address2: mockBillingDetails.addressTwo,
        city: mockBillingDetails.city,
        state: mockBillingDetails.state,
        country: mockBillingDetails.country,
        zipCode: mockBillingDetails.postcode,
      };
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
        userEvent.type(textField, mockBillingDetails[textField.getAttribute('name')]);
      });

      const countrySelect = within(screen.getByTestId('billing-details.country')).getByTestId(
        'cf-ui-select'
      );

      userEvent.selectOptions(countrySelect, ['DE']);

      userEvent.click(screen.getByTestId('next-step-billing-details-form'));

      // ------ Card Details page ------
      const successCb = await waitForZuoraToRender();

      successCb({ success: true, refId: mockRefId });

      await waitFor(() => {
        expect(createBillingDetails).toBeCalledWith(
          mockOrganization.sys.id,
          reconciledBillingDetails
        );
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
      userEvent.type(textField, mockBillingDetails[textField.getAttribute('name')]);
    });

    const countrySelect = within(screen.getByTestId('billing-details.country')).getByTestId(
      'cf-ui-select'
    );

    userEvent.selectOptions(countrySelect, ['AR']);

    userEvent.click(screen.getByTestId('next-step-billing-details-form'));

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
      expect(textField.value).toEqual(mockBillingDetails[textField.getAttribute('name')]);
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
    organizationId: mockOrganization.sys.id,
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
