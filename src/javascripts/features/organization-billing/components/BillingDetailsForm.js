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
import { BillingDetailsPropType } from '../propTypes';

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
  const [showVat, setShouldShowVat] = useState(!!billingDetails.vat);
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
      workEmail: {
        value: billingDetails.workEmail ?? '',
        required: true,
        validator: (value) => {
          //search for @ && .
          if (!value.includes('@') || !value.includes('.')) {
            return 'Not a valid email address';
          }
        },
      },
      address1: {
        value: billingDetails.address1 ?? '',
        required: true,
      },
      address2: {
        value: billingDetails.address2 ?? '',
        required: false,
      },
      city: {
        value: billingDetails.city ?? '',
        required: true,
      },
      zipCode: {
        value: billingDetails.zipCode ?? '',
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
      vat: {
        value: billingDetails.vat ?? '',
        required: false,
      },
    },
    submitFn: onSubmit,
    fieldsValidator: (fields) => {
      const errors = {};

      const countryCode = fields.country.value;
      const vat = fields.vat.value;
      const state = fields.state.value;

      // Only want to check if the VAT number is valid if a VAT number has been added.
      if (vat !== '' && getIsVatCountry(countryCode) && !isValidVat(vat, countryCode)) {
        errors.vat = 'Not a valid VAT Number';
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
      onChange('vat', '');
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
  const handleChange = (e) => onChange(e.target.getAttribute('id'), e.target.value);
  const handleBlur = (e) => onBlur(e.target.getAttribute('id'), e.target.value);

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
            name="first-name"
            id="firstName"
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
            name="last-name"
            id="lastName"
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
          id="workEmail"
          testId="billing-details.workEmail"
          labelText="Email"
          textInputProps={{
            placeholder: 'archibald.johannson@email.com',
          }}
          autoFocus
          value={fields.workEmail.value}
          validationMessage={fields.workEmail.error}
          onChange={handleChange}
          onBlur={handleBlur}
        />

        <TextField
          name="address"
          id="address1"
          testId="billing-details.address1"
          labelText="Address"
          textInputProps={{
            placeholder: '19th Avenue North',
          }}
          autoFocus
          value={fields.address1.value}
          validationMessage={fields.address1.error}
          onChange={handleChange}
          onBlur={handleBlur}
        />

        <TextField
          name="address2"
          id="address2"
          testId="billing-details.address2"
          labelText="Address line 2 (optional)"
          autoFocus
          value={fields.address2.value}
          validationMessage={fields.address2.error}
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
            name="postal-code"
            id="zipCode"
            testId="billing-details.zipCode"
            labelText="Postcode"
            textInputProps={{
              placeholder: '58102',
            }}
            autoFocus
            value={fields.zipCode.value}
            validationMessage={fields.zipCode.error}
            onChange={handleChange}
            onBlur={handleBlur}
          />
        </div>

        <SelectField
          className={styles.selectLocale}
          name="country"
          id="country"
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
            id="state"
            testId="billing-details.state"
            labelText="State"
            value={fields.state.value}
            validationMessage={fields.state.error}
            onChange={handleChange}>
            <option value="" disabled />
            {US_STATES_LIST.map((state) => (
              <option key={state.name} value={state.code}>
                {state.name}
              </option>
            ))}
          </SelectField>
        )}

        {showVat && (
          <TextField
            name="vat"
            id="vat"
            testId="billing-details.vat"
            labelText="VAT number"
            textInputProps={{
              placeholder: 'XX123456789',
            }}
            autoFocus
            value={fields.vat.value}
            validationMessage={fields.vat.error}
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
  billingDetails: BillingDetailsPropType,
};
