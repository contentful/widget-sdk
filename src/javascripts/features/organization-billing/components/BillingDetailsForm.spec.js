import React from 'react';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BillingDetailsForm } from './BillingDetailsForm';

describe('BillingDetailsForm', () => {
  let mockBillingDetails;

  beforeEach(() => {
    mockBillingDetails = getMockBillingDetails();
  });

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
          billingDetails: getMockBillingDetails({ email: '@' }),
        });

        userEvent.click(screen.getByTestId('billing-details.submit'));

        await waitFor(() => {
          expect(screen.getByText('Not a valid email address')).toBeVisible();
        });
      });

      it('should reject an email missing @', async () => {
        build({
          billingDetails: getMockBillingDetails({ email: '.' }),
        });

        userEvent.click(screen.getByTestId('billing-details.submit'));

        await waitFor(() => {
          expect(screen.getByText('Not a valid email address')).toBeVisible();
        });
      });

      it('should accept an email containing both @ && .', async () => {
        const onSubmit = jest.fn();
        build({
          billingDetails: getMockBillingDetails({ email: '@.' }),
          onSubmit,
        });

        userEvent.click(screen.getByTestId('billing-details.submit'));

        await waitFor(() => {
          expect(onSubmit).toBeCalled();
        });
      });
    });

    describe('fields validation', () => {
      it('should reject an improperly formatted vat for the selected country', async () => {
        build({
          billingDetails: getMockBillingDetails({ country: 'DE', vatNumber: '1234123' }),
        });

        const countrySelect = within(screen.getByTestId('billing-details.country')).getByTestId(
          'cf-ui-select'
        );

        userEvent.selectOptions(countrySelect, ['DE']);
        userEvent.click(screen.getByTestId('billing-details.submit'));

        await waitFor(() => {
          expect(screen.getByText('Not a valid VAT Number')).toBeVisible();
        });
      });

      it('should accept a properly formatted vat for the selected country', async () => {
        const onSubmit = jest.fn();
        build({
          billingDetails: getMockBillingDetails({ country: 'DE', vatNumber: 'DE275148225' }),
          onSubmit,
        });

        userEvent.click(screen.getByTestId('billing-details.submit'));

        await waitFor(() => {
          expect(screen.queryByText('Not a valid VAT Number')).toBeNull();
          expect(onSubmit).toBeCalled();
        });
      });

      it('should accept an EU country with no vat number filled out', async () => {
        const onSubmit = jest.fn();

        build({
          billingDetails: mockBillingDetails,
          onSubmit,
        });

        const countrySelect = within(screen.getByTestId('billing-details.country')).getByTestId(
          'cf-ui-select'
        );

        userEvent.selectOptions(countrySelect, ['DE']);
        userEvent.click(screen.getByTestId('billing-details.submit'));

        await waitFor(() => {
          expect(screen.queryByText('Not a valid VAT Number')).toBeNull();
          expect(onSubmit).toBeCalled();
        });
      });

      it('should display an error if the US is selected but no state has been selected', async () => {
        const onSubmit = jest.fn();

        build({
          billingDetails: getMockBillingDetails({ country: 'DE' }),
          onSubmit,
        });

        const countrySelect = within(screen.getByTestId('billing-details.country')).getByTestId(
          'cf-ui-select'
        );

        userEvent.selectOptions(countrySelect, ['US']);
        userEvent.click(screen.getByTestId('billing-details.submit'));

        expect(screen.getByText('Select a State')).toBeVisible();
        expect(onSubmit).not.toBeCalled();
      });

      it('should not display error and successfully submit if the US and a State are selected', async () => {
        const onSubmit = jest.fn();

        build({
          billingDetails: getMockBillingDetails({ country: 'DE' }),
          onSubmit,
        });

        const countrySelect = within(screen.getByTestId('billing-details.country')).getByTestId(
          'cf-ui-select'
        );

        userEvent.selectOptions(countrySelect, ['US']);

        const stateSelect = within(screen.getByTestId('billing-details.state')).getByTestId(
          'cf-ui-select'
        );
        userEvent.selectOptions(stateSelect, ['CA']);

        userEvent.click(screen.getByTestId('billing-details.submit'));

        expect(screen.queryByText('Select a State')).toBeNull();
        await waitFor(() => {
          expect(onSubmit).toBeCalled();
        });
      });
    });
  });

  describe('saved billing details', () => {
    it('should render an empty form when there are no saved billing details', () => {
      build();

      expect(screen.getByTestId('billing-details.card')).toBeVisible();
      expect(screen.getByTestId('billing-details.heading')).toHaveTextContent(
        'Add your billing details 📫'
      );

      expect(screen.getAllByTestId('cf-ui-text-input').value).toBeUndefined();
    });

    it('should render a prefilled form when there are saved billing details', () => {
      build({ billingDetails: getMockBillingDetails({ vatNumber: '' }) });

      expect(screen.getByTestId('billing-details.card')).toBeVisible();
      expect(screen.getByTestId('billing-details.heading')).toHaveTextContent(
        'Update your billing details 📫'
      );

      // Make sure all text fields are filled out
      const allTextFields = screen.getAllByTestId('cf-ui-text-input');
      allTextFields.forEach((textField) => {
        expect(textField.value).toEqual(mockBillingDetails[textField.getAttribute('name')]);
      });
    });

    it('should show vat field if its been filled out', () => {
      build({
        billingDetails: getMockBillingDetails({ country: 'DE', vatNumber: 'DE275148225' }),
      });

      expect(screen.queryByTestId('billing-details.vatNumber')).toBeVisible();
    });

    it('should show state field if its been filled out', () => {
      build({
        billingDetails: getMockBillingDetails({ country: 'US', state: 'CA' }),
      });

      expect(screen.queryByTestId('billing-details.state')).toBeVisible();
    });
  });

  describe('navigational buttons', () => {
    it('calls onCancel when the cancel button is clicked', async () => {
      const onCancel = jest.fn();
      build({
        onCancel,
      });

      userEvent.click(screen.getByTestId('billing-details.cancel'));

      await waitFor(() => {
        expect(onCancel).toBeCalled();
      });
    });

    it('calls onSubmit when submit button is clicked and form is correct', async () => {
      const onSubmit = jest.fn();
      build({
        billingDetails: mockBillingDetails,
        onSubmit,
      });

      userEvent.click(screen.getByTestId('billing-details.submit'));

      waitFor(() => {
        expect(onSubmit).toBeCalled();
      });
    });
  });
});

function getMockBillingDetails(customProps) {
  return {
    firstName: 'John',
    lastName: 'Doe',
    email: 'test@example.com',
    address: '123 street ave',
    addressTwo: 'apartment 321',
    city: 'Rio de Janeiro',
    postcode: '11111',
    country: 'BR',
    vatNumber: '',
    ...customProps,
  };
}

function build(customProps) {
  const props = {
    onSubmit: () => {},
    onCancel: () => {},
    ...customProps,
  };

  render(<BillingDetailsForm {...props} />);
}