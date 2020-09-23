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

import { isValidVat, getIsVatCountry } from '../utils/vat';
import COUNTRIES_LIST from 'libs/countries_list.json';
import US_STATES_LIST from 'libs/us_states_list.json';

const styles = {
  card: css({
    padding: tokens.spacingXl,
    borderRadius: '4px',
  }),
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
    marginTop: tokens.spacingL,
    justifyContent: 'flex-end',
    '& button:last-child': {
      marginLeft: tokens.spacingM,
    },
  }),
  twoItemRow: css({
    display: 'flex',
    justifyContent: 'space-between',
  }),
  fieldSpacing: css({
    marginRight: tokens.spacingM,
  }),
};

export function BillingDetailsForm({
  onSubmit,
  onCancel,
  submitText = 'Update billing details',
  cancelText = 'Cancel',
  billingDetails = {},
}) {
  const [showVat, setShouldShowVat] = useState(!!billingDetails.vatNumber);
  const [showUSState, setShouldShowUSState] = useState(!!billingDetails.state);

  const { onChange, onBlur, onSubmit: onFormSubmit, fields, form } = useForm({
    fields: {
      firstName: {
        value: billingDetails.firstName ?? '',
        required: true,
      },
      lastName: {
        value: billingDetails.lastName ?? '',
        required: true,
      },
      email: {
        value: billingDetails.email ?? '',
        required: true,
        validator: (value) => {
          //search for @ && .
          if (!value.includes('@') || !value.includes('.')) {
            return 'Not a valid email address';
          }
        },
      },
      address: {
        value: billingDetails.address ?? '',
        required: true,
      },
      addressTwo: {
        value: billingDetails.addressTwo ?? '',
        required: false,
      },
      city: {
        value: billingDetails.city ?? '',
        required: true,
      },
      postcode: {
        value: billingDetails.postcode ?? '',
        required: true,
      },
      state: {
        value: billingDetails.state ?? '',
        required: false,
      },
      country: {
        value: billingDetails.country ?? '',
        required: true,
      },
      vatNumber: {
        value: billingDetails.vatNumber ?? '',
        required: false,
      },
    },
    submitFn: onSubmit,
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
    <Card className={styles.card} testId="billing-details.card">
      <Typography>
        <Subheading className={styles.cardTitle} element="h3" testId="billing-details.heading">
          {isEmpty(billingDetails) ? 'Add' : 'Update'} your billing details{' '}
          <span role="img" aria-label="Mailbox closed">
            📫
          </span>
        </Subheading>
      </Typography>

      <Form className={styles.form} spacing="condensed" onSubmit={onFormSubmit}>
        <div className={styles.twoItemRow}>
          <TextField
            className={styles.fieldSpacing}
            name="firstName"
            id="first_name"
            testId="billing-details.firstName"
            labelText="First name"
            textInputProps={{
              placeholder: 'Archibald',
            }}
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
            labelText="Last name"
            textInputProps={{
              placeholder: 'Johannson',
            }}
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
          labelText="Address line 2 (optional)"
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
            autoFocus
            value={fields.city.value}
            validationMessage={fields.city.error}
            onChange={handleChange}
            onBlur={handleBlur}
          />
          <TextField
            name="postcode"
            id="postcode"
            testId="billing-details.postcode"
            labelText="Postcode"
            textInputProps={{
              placeholder: '58102',
            }}
            autoFocus
            value={fields.postcode.value}
            validationMessage={fields.postcode.error}
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
            labelText="VAT number"
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
          <Button
            onClick={onCancel}
            testId="billing-details.cancel"
            buttonType="muted"
            disabled={form.submitting}>
            {cancelText}
          </Button>
          <Button
            onClick={onFormSubmit}
            testId="billing-details.submit"
            disabled={form.submitting}
            loading={form.submitting}>
            {submitText}
          </Button>
        </div>
      </Form>
    </Card>
  );
}

BillingDetailsForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  submitText: PropTypes.string,
  cancelText: PropTypes.string,
  billingDetails: PropTypes.object,
};