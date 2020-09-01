import React, { useState } from 'react';
import PropTypes from 'prop-types';

import { isEmpty } from 'lodash';
import {
  TextField,
  Form,
  SelectField,
  Button,
  Card,
  Subheading,
} from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { useForm } from 'core/hooks/useForm';

import { isValidVat, getIsVatCountry } from '../utils/VATVerification';
import COUNTRIES_LIST from 'libs/countries_list.json';

const DEFAULT_BILLING_DETAILS = {
  firstName: '',
  lastName: '',
  email: '',
  address: '',
  addressTwo: '',
  city: '',
  postalCode: '',
  country: '',
  vatNumber: '',
};

const styles = {
  form: css({
    marginTop: tokens.spacingM,
    '& div:last-child': {
      marginBottom: 0,
    },
  }),
  buttonsContainer: css({
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: tokens.spacingL,
  }),
  card: css({
    padding: tokens.spacingL,
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
  const [showVat, setShouldShowVat] = useState(false);

  // If there are no saved billing details, then the user is adding billing details.
  // otherwise they are  updating their billing details.
  const isAddingBillingDetails = isEmpty(savedBillingDetails);
  const billingDetails = Object.assign(DEFAULT_BILLING_DETAILS, savedBillingDetails);

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

      // Only want to check if the VAT number is valid if a VAT number has been added.
      if (vatNumber !== '' && getIsVatCountry(countryCode) && !isValidVat(vatNumber, countryCode)) {
        errors.vatNumber = 'Not a valid VAT Number';
      }

      return errors;
    },
  });

  const onChangeCountry = (e) => {
    const countryCode = e.target.value;
    const isVatCountry = getIsVatCountry(countryCode);

    setShouldShowVat(isVatCountry);
    if (!isVatCountry) {
      // Reset VAT number in case they started filling this field out as we
      // don't want to submit/validate this field if it's not a VAT country.
      onChange('vatNumber', '');
    }

    onChange('country', countryCode);
  };

  // Get the input's name and call onChange/onBlur for that input with the updated value.
  const handleChange = (e) => onChange(e.target.getAttribute('name'), e.target.value);
  const handleBlur = (e) => onBlur(e.target.getAttribute('name'), e.target.value);

  return (
    <Card testId="billing-details.card" className={styles.card}>
      <Subheading element="h3" testId="billing-details.heading">
        {isAddingBillingDetails ? 'Add Billing Details' : 'Update Billing Details'} 📫
      </Subheading>

      <Form className={styles.form} onSubmit={onSubmit}>
        <div className={styles.twoItemRow}>
          <TextField
            className={styles.fieldSpacing}
            name="firstName"
            id="first_name"
            testId="billing-details.firstName"
            labelText="First Name"
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

        {showVat && (
          <TextField
            name="vatNumber"
            id="vatNumber"
            testId="billing-details.vatNumber"
            labelText="VAT Number"
            autoFocus
            value={fields.vatNumber.value}
            validationMessage={fields.vatNumber.error}
            onChange={handleChange}
            onBlur={handleBlur}
          />
        )}

        <div className={styles.buttonsContainer}>
          <Button onClick={navigateToPreviousStep} testId="navigate-back" buttonType="naked">
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
