import React, { useState } from 'react';
import PropTypes from 'prop-types';

import { isEmpty } from 'lodash';
import {
  TextField,
  Form,
  SelectField,
  Button,
  Card,
  Typography,
  Subheading,
} from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { useForm } from 'core/hooks/useForm';

import { isValidVat, getIsVatCountry } from '../utils/VATVerification';
import COUNTRIES_LIST from 'libs/countries_list.json';
import US_STATES_LIST from 'libs/us_states_list.json';

const DEFAULT_BILLING_DETAILS = {
  firstName: '',
  lastName: '',
  email: '',
  address: '',
  addressTwo: '',
  city: '',
  postalCode: '',
  state: '',
  country: '',
  vatNumber: '',
};

const styles = {
  form: css({
    '& div:last-child': {
      marginBottom: 0,
    },
  }),
  cardTitle: css({
    marginBottom: tokens.spacingL,
  }),
  buttonsContainer: css({
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: tokens.spacingL,
  }),
  twoItemRow: css({
    display: 'flex',
    justifyContent: 'space-between',
  }),
  fieldSpacing: css({
    marginRight: tokens.spacingM,
  }),
};

export const BillingDetailsForm = ({
  onSubmitBillingDetails,
  savedBillingDetails = {},
  navigateToPreviousStep,
}) => {
  // If there are no saved billing details, then the user is adding billing details.
  // otherwise they are  updating their billing details.
  const isAddingBillingDetails = isEmpty(savedBillingDetails);
  const billingDetails = Object.assign(DEFAULT_BILLING_DETAILS, savedBillingDetails);

  // If these fields have already been filled out they should be shown on first render.
  const [showVat, setShouldShowVat] = useState(billingDetails.vatNumber !== '');
  const [showUSState, setShouldShowUSState] = useState(billingDetails.state !== '');

  const { onChange, onBlur, onSubmit, fields } = useForm({
    fields: {
      firstName: {
        value: billingDetails.firstName,
        required: true,
      },
      lastName: {
        value: billingDetails.lastName,
        required: true,
      },
      email: {
        value: billingDetails.email,
        required: true,
        validator: (value) => {
          //search for @ && .
          if (!value.includes('@') || !value.includes('.')) {
            return 'Not a valid email address';
          }
        },
      },
      address: {
        value: billingDetails.address,
        required: true,
      },
      addressTwo: {
        value: billingDetails.addressTwo,
        required: false,
      },
      city: {
        value: billingDetails.city,
        required: true,
      },
      postalCode: {
        value: billingDetails.postalCode,
        required: true,
      },
      state: {
        value: billingDetails.state,
        required: false,
      },
      country: {
        value: billingDetails.country,
        required: true,
      },
      vatNumber: {
        value: billingDetails.vatNumber,
        required: false,
      },
    },
    submitFn: onSubmitBillingDetails,
    fieldsValidator: (fields) => {
      const errors = {};

      const countryCode = fields.country.value;
      const vatNumber = fields.vatNumber.value;
      const state = fields.state.value;

      // Only want to check if the VAT number is valid if a VAT number has been added.
      if (vatNumber !== '' && getIsVatCountry(countryCode) && !isValidVat(vatNumber, countryCode)) {
        errors.vatNumber = 'Not a valid VAT Number';
      }

      if (countryCode === 'US' && state === '') {
        errors.state = 'Select a State';
      }

      return errors;
    },
  });

  const onChangeCountry = (e) => {
    const countryCode = e.target.value;
    const isVatCountry = getIsVatCountry(countryCode);
    const isUnitedStates = countryCode === 'US';

    setShouldShowVat(isVatCountry);
    if (!isVatCountry) {
      // Reset VAT number in case they started filling this field out as we
      // don't want to submit/validate this field if it's not a VAT country.
      onChange('vatNumber', '');
    }

    setShouldShowUSState(isUnitedStates);
    if (!isUnitedStates) {
      // Reset state in case they started filling this field out as we
      // don't want to submit/validate this field if it's not the US.
      onChange('state', '');
    }

    onChange('country', countryCode);
  };

  // Get the input's name and call onChange/onBlur for that input with the updated value.
  const handleChange = (e) => onChange(e.target.getAttribute('name'), e.target.value);
  const handleBlur = (e) => onBlur(e.target.getAttribute('name'), e.target.value);

  return (
    <Card testId="billing-details.card">
      <Typography>
        <Subheading className={styles.cardTitle} element="h3" testId="billing-details.heading">
          {isAddingBillingDetails ? 'Add Billing Details' : 'Update Billing Details'} 📫
        </Subheading>
      </Typography>

      <Form className={styles.form} spacing="condensed" onSubmit={onSubmit}>
        <div className={styles.twoItemRow}>
          <TextField
            className={styles.fieldSpacing}
            name="firstName"
            id="first_name"
            testId="billing-details.firstName"
            labelText="First Name"
            textInputProps={{
              placeholder: 'Archibald',
            }}
            required
            autoFocus
            value={fields.firstName.value}
            validationMessage={fields.firstName.error}
            onChange={handleChange}
            onBlur={handleBlur}
          />

          <TextField
            name="lastName"
            id="last_name"
            testId="billing-details.lastName"
            labelText="Last Name"
            textInputProps={{
              placeholder: 'Johannson',
            }}
            required
            autoFocus
            value={fields.lastName.value}
            validationMessage={fields.lastName.error}
            onChange={handleChange}
            onBlur={handleBlur}
          />
        </div>

        <TextField
          name="email"
          id="email"
          testId="billing-details.email"
          labelText="Email"
          textInputProps={{
            placeholder: 'archibald.johannson@email.com',
          }}
          required
          autoFocus
          value={fields.email.value}
          validationMessage={fields.email.error}
          onChange={handleChange}
          onBlur={handleBlur}
        />

        <TextField
          name="address"
          id="address"
          testId="billing-details.address"
          labelText="Address"
          textInputProps={{
            placeholder: '19th Avenue North',
          }}
          required
          autoFocus
          value={fields.address.value}
          validationMessage={fields.address.error}
          onChange={handleChange}
          onBlur={handleBlur}
        />

        <TextField
          name="addressTwo"
          id="addressTwo"
          testId="billing-details.addressTwo"
          labelText="Address Line 2"
          autoFocus
          value={fields.addressTwo.value}
          validationMessage={fields.addressTwo.error}
          onChange={handleChange}
          onBlur={handleBlur}
        />

        <div className={styles.twoItemRow}>
          <TextField
            className={styles.fieldSpacing}
            name="city"
            id="city"
            testId="billing-details.city"
            labelText="City"
            textInputProps={{
              placeholder: 'Fargo',
            }}
            required
            autoFocus
            value={fields.city.value}
            validationMessage={fields.city.error}
            onChange={handleChange}
            onBlur={handleBlur}
          />
          <TextField
            name="postalCode"
            id="postalCode"
            testId="billing-details.postalCode"
            labelText="Postal Code"
            textInputProps={{
              placeholder: '58102',
            }}
            required
            autoFocus
            value={fields.postalCode.value}
            validationMessage={fields.postalCode.error}
            onChange={handleChange}
            onBlur={handleBlur}
          />
        </div>

        <SelectField
          className={styles.selectLocale}
          name="country"
          id="newspace-language"
          testId="billing-details.country"
          labelText="Country"
          required
          value={fields.country.value}
          onChange={onChangeCountry}>
          <option value="" disabled>
            Choose an option
          </option>
          {COUNTRIES_LIST.map((country) => (
            <option key={country.name} value={country.code}>
              {country.name}
            </option>
          ))}
        </SelectField>

        {showUSState && (
          <SelectField
            className={styles.selectLocale}
            name="state"
            id="newspace-language"
            testId="billing-details.state"
            labelText="State"
            required
            value={fields.state.value}
            validationMessage={fields.state.error}
            onChange={handleChange}>
            <option value="" disabled></option>
            {US_STATES_LIST.map((state) => (
              <option key={state.name} value={state.code}>
                {state.name}
              </option>
            ))}
          </SelectField>
        )}

        {showVat && (
          <TextField
            name="vatNumber"
            id="vatNumber"
            testId="billing-details.vatNumber"
            labelText="VAT Number"
            textInputProps={{
              placeholder: 'XX123456789',
            }}
            autoFocus
            value={fields.vatNumber.value}
            validationMessage={fields.vatNumber.error}
            onChange={handleChange}
            onBlur={handleBlur}
          />
        )}

        <div className={styles.buttonsContainer}>
          <Button onClick={navigateToPreviousStep} testId="navigate-back" buttonType="muted">
            Back
          </Button>
          <Button onClick={onSubmit} testId="next-step-billing-details-form">
            {isAddingBillingDetails ? 'Add Credit Card Details' : 'Update Billing Details'}
          </Button>
        </div>
      </Form>
    </Card>
  );
};

BillingDetailsForm.propTypes = {
  onSubmitBillingDetails: PropTypes.func.isRequired,
  navigateToPreviousStep: PropTypes.func.isRequired,
  savedBillingDetails: PropTypes.object,
};
