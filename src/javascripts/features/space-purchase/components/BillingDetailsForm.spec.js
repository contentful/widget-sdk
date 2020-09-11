import React from 'react';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BillingDetailsForm } from './BillingDetailsForm';

const mockBillingDetails = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'test@example.com',
  address: '123 street ave',
  addressTwo: 'apartment 321',
  city: 'Berlin',
  postalCode: '11111',
  country: 'AR',
};

const mockBillingDetailsWith = (object) => {
  return Object.assign(mockBillingDetails, object);
};

describe('BillingDetailsForm', () => {
  describe('editing the form works as expected', () => {
    it('should update text values when inputs are typed in', async () => {
      build();

      const allTextFields = screen.getAllByTestId('cf-ui-text-input');

      // Fill out all text fields
      allTextFields.forEach((textField) => {
        userEvent.type(textField, mockBillingDetails[textField.getAttribute('name')]);
      });

      // Make sure all text fields are filled out
      allTextFields.forEach((textField) => {
        expect(textField.value).toEqual(mockBillingDetails[textField.getAttribute('name')]);
      });
    });

    it('should show a VAT field when a EU country is selected, then hide when unselected', async () => {
      build();

      expect(screen.queryByTestId('billing-details.vatNumber')).toBeNull();

      const countrySelect = within(screen.getByTestId('billing-details.country')).getByTestId(
        'cf-ui-select'
      );

      userEvent.selectOptions(countrySelect, ['DE']);

      expect(screen.getByTestId('billing-details.vatNumber')).toBeVisible();

      userEvent.selectOptions(countrySelect, ['US']);

      expect(screen.queryByTestId('billing-details.vatNumber')).toBeNull();
    });

    it('should show a State field when the US country is selected, then hide when unselected', async () => {
      build();

      expect(screen.queryByTestId('billing-details.state')).toBeNull();

      const countrySelect = within(screen.getByTestId('billing-details.country')).getByTestId(
        'cf-ui-select'
      );

      userEvent.selectOptions(countrySelect, ['US']);

      expect(screen.getByTestId('billing-details.state')).toBeVisible();

      userEvent.selectOptions(countrySelect, ['DE']);

      expect(screen.queryByTestId('billing-details.state')).toBeNull();
    });
  });

  describe('validation', () => {
    describe('email validation', () => {
      it('should reject an email missing .', async () => {
        build({
          savedBillingDetails: mockBillingDetailsWith({ email: '@' }),
        });

        userEvent.click(screen.getByTestId('next-step-billing-details-form'));

        waitFor(() => {
          expect(screen.getByText('Not a valid email address')).toBeVisible();
        });
      });

      it('should reject an email missing @', async () => {
        build({
          savedBillingDetails: mockBillingDetailsWith({ email: '.' }),
        });

        userEvent.click(screen.getByTestId('next-step-billing-details-form'));

        waitFor(() => {
          expect(screen.getByText('Not a valid email address')).toBeVisible();
        });
      });

      it('should accept an email containing both @ && .', async () => {
        const mockOnSubmitBillingDetails = jest.fn();
        build({
          savedBillingDetails: mockBillingDetailsWith({ email: '@.' }),
          onSubmitBillingDetails: mockOnSubmitBillingDetails,
        });

        userEvent.click(screen.getByTestId('next-step-billing-details-form'));

        waitFor(() => {
          expect(mockOnSubmitBillingDetails).toBeCalled();
        });
      });
    });

    describe('fields validation', () => {
      it('should reject an improperly formatted vat for the selected country', async () => {
        build({
          savedBillingDetails: mockBillingDetailsWith({ vatNumber: '1234123' }),
        });

        const countrySelect = within(screen.getByTestId('billing-details.country')).getByTestId(
          'cf-ui-select'
        );

        userEvent.selectOptions(countrySelect, ['DE']);

        userEvent.click(screen.getByTestId('next-step-billing-details-form'));

        waitFor(() => {
          expect(screen.getByText('Not a valid VAT Number')).toBeVisible();
        });
      });

      it('should accept a properly formatted vat for the selected country', async () => {
        const mockOnSubmitBillingDetails = jest.fn();
        build({
          savedBillingDetails: mockBillingDetailsWith({ country: 'DE', vatNumber: 'DE 123456789' }),
          onSubmitBillingDetails: mockOnSubmitBillingDetails,
        });

        userEvent.click(screen.getByTestId('next-step-billing-details-form'));

        waitFor(() => {
          expect(mockOnSubmitBillingDetails).toBeCalled();
        });
      });

      it('should accept an EU country with no vat number filled out', async () => {
        const mockOnSubmitBillingDetails = jest.fn();

        build({
          savedBillingDetails: mockBillingDetailsWith({ vatNumber: '' }),
          onSubmitBillingDetails: mockOnSubmitBillingDetails,
        });

        const countrySelect = within(screen.getByTestId('billing-details.country')).getByTestId(
          'cf-ui-select'
        );

        userEvent.selectOptions(countrySelect, ['DE']);
        userEvent.click(screen.getByTestId('next-step-billing-details-form'));

        waitFor(() => {
          expect(screen.queryByText('Not a valid VAT Number')).toBeNull();
          expect(mockOnSubmitBillingDetails).toBeCalled();
        });
      });

      it('should display an error if the US is selected but no state has been selected', async () => {
        const mockOnSubmitBillingDetails = jest.fn();

        build({
          savedBillingDetails: mockBillingDetailsWith({ country: 'DE' }),
          onSubmitBillingDetails: mockOnSubmitBillingDetails,
        });

        const countrySelect = within(screen.getByTestId('billing-details.country')).getByTestId(
          'cf-ui-select'
        );

        userEvent.selectOptions(countrySelect, ['US']);
        userEvent.click(screen.getByTestId('next-step-billing-details-form'));

        expect(screen.getByText('Select a State')).toBeVisible();
        expect(mockOnSubmitBillingDetails).not.toBeCalled();
      });

      it('should not display error and successfully submit if the US and a State are selected', async () => {
        const mockOnSubmitBillingDetails = jest.fn();

        build({
          savedBillingDetails: mockBillingDetailsWith({ country: 'DE' }),
          onSubmitBillingDetails: mockOnSubmitBillingDetails,
        });

        const countrySelect = within(screen.getByTestId('billing-details.country')).getByTestId(
          'cf-ui-select'
        );

        userEvent.selectOptions(countrySelect, ['US']);

        const stateSelect = within(screen.getByTestId('billing-details.state')).getByTestId(
          'cf-ui-select'
        );
        userEvent.selectOptions(stateSelect, ['CA']);

        userEvent.click(screen.getByTestId('next-step-billing-details-form'));

        expect(screen.queryByText('Select a State')).toBeNull();
        waitFor(() => {
          expect(mockOnSubmitBillingDetails).toBeCalled();
        });
      });
    });
  });

  describe('saved billing details', () => {
    it('should render an empty form when there are no saved billing details', () => {
      build();

      expect(screen.getByTestId('billing-details.card')).toBeVisible();
      expect(screen.getByTestId('billing-details.heading')).toHaveTextContent(
        'Add Billing Details'
      );
      expect(screen.getByTestId('next-step-billing-details-form')).toHaveTextContent(
        'Add Credit Card Details'
      );

      expect(screen.getAllByTestId('cf-ui-text-input').value).toBeUndefined();
    });

    it('should render a prefilled form when there are saved billing details', () => {
      build({ savedBillingDetails: mockBillingDetails });

      expect(screen.getByTestId('billing-details.card')).toBeVisible();
      expect(screen.getByTestId('billing-details.heading')).toHaveTextContent(
        'Update Billing Details'
      );
      expect(screen.getByTestId('next-step-billing-details-form')).toHaveTextContent(
        'Update Billing Details'
      );

      // Make sure all text fields are filled out
      const allTextFields = screen.getAllByTestId('cf-ui-text-input');
      allTextFields.forEach((textField) => {
        expect(textField.value).toEqual(mockBillingDetails[textField.getAttribute('name')]);
      });
    });

    it('should show vat field if its been filled out', () => {
      build({
        savedBillingDetails: mockBillingDetailsWith({ country: 'DE', vatNumber: 'DE123456789' }),
      });

      expect(screen.queryByTestId('billing-details.vatNumber')).toBeVisible();
    });

    it('should show state field if its been filled out', () => {
      build({
        savedBillingDetails: mockBillingDetailsWith({ country: 'US', state: 'CA' }),
      });

      expect(screen.queryByTestId('billing-details.state')).toBeVisible();
    });
  });

  describe('navigational buttons', () => {
    it('calls navigateToPreviousStep when back button is clicked', async () => {
      const mockNavigateToPreviousStep = jest.fn();
      build({
        navigateToPreviousStep: mockNavigateToPreviousStep,
      });

      userEvent.click(screen.getByTestId('navigate-back'));
      waitFor(() => {
        expect(mockNavigateToPreviousStep).toBeCalled();
      });
    });

    it('calls onSubmitBillingDetails when continue button is clicked and form is correct', async () => {
      const mockOnSubmitBillingDetails = jest.fn();
      build({
        savedBillingDetails: mockBillingDetails,
        onSubmitBillingDetails: mockOnSubmitBillingDetails,
      });

      userEvent.click(screen.getByTestId('next-step-billing-details-form'));
      waitFor(() => {
        expect(mockOnSubmitBillingDetails).toBeCalled();
      });
    });
  });
});

function build(customProps) {
  const props = {
    navigateToPreviousStep: () => {},
    onSubmitBillingDetails: () => {},
    savedBillingDetails: {},
    ...customProps,
  };

  render(<BillingDetailsForm {...props} />);
}
