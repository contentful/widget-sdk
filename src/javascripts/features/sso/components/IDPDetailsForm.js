import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { findKey, kebabCase, debounce } from 'lodash';
import tokens from '@contentful/forma-36-tokens';
import {
  Heading,
  TextField,
  FormLabel,
  Select,
  Option,
  HelpText,
  TextLink,
  Spinner,
} from '@contentful/forma-36-react-components';
import { SSO_PROVIDERS_MAP, validate } from 'features/sso/utils';
import { IdentityProviderPropType } from 'app/OrganizationSettings/SSO/PropTypes';
import { useForm } from 'core/hooks';
import { updateFieldValue } from '../services/SSOService';
import { css } from 'emotion';

const styles = {
  header: css({
    marginTop: tokens.spacing3Xl,
    marginBottom: tokens.spacingL,
  }),
  helpText: css({
    marginBottom: tokens.spacingL,
  }),
  select: css({
    display: 'inline-block',
    marginBottom: tokens.spacingL,
    marginRight: tokens.spacingM,
  }),
  fieldContainer: css({
    display: 'flex',
  }),
  input: css({
    width: '95%',
    marginBottom: tokens.spacingL,
  }),
  fieldSpinner: css({
    width: '5%',
    marginTop: tokens.spacingXl,
  }),
};

export function IDPDetailsForm({ orgId, orgName, identityProvider }) {
  const [updatingField, setUpdatingField] = useState('');

  const submitForm = async (values, fieldName) => {
    setUpdatingField(fieldName);
    try {
      await updateFieldValue(
        fieldName,
        values[fieldName],
        identityProvider.data.sys.version,
        orgId
      );
    } catch (e) {
      const errors = {
        [fieldName]: e.message,
      };
      return errors;
    }
    setUpdatingField('');
    return;
  };

  const { onChange, onSubmit, fields, form } = useForm({
    fields: {
      idpName: {
        value: identityProvider.data.idpName,
      },
      idpSsoTargetUrl: {
        value: identityProvider.data.idpSsoTargetUrl,
        validator: validate.bind(null, 'idpSsoTargetUrl'),
      },
      idpCert: {
        value: identityProvider.data.idpCert,
        validator: validate.bind(null, 'idpCert'),
      },
      ssoName: {
        value: identityProvider.data.ssoName,
        validator: validate.bind(null, 'ssoName'),
      },
    },
    submitFn: submitForm,
  });

  const idpNameSelectValue = findKey(SSO_PROVIDERS_MAP, (names) =>
    names.includes(fields.idpName.value)
  );

  const debouncedUpdate = useCallback(
    debounce((fieldName, value) => {
      onChange(fieldName, value);
      onSubmit(fieldName);
    }, 500),
    []
  );

  const handleInputChange = (e) => debouncedUpdate('idpSsoTargetUrl', e.target.value);

  return (
    <>
      <section>
        <Heading element="h2" className={styles.header}>
          Your SSO provider details
        </Heading>
        <FormLabel htmlFor="ssoProvider">SSO provider</FormLabel>
        <div>
          <Select
            name="ssoProvider"
            id="ssoProvider"
            testId="sso-provider"
            width="medium"
            className={styles.select}
            value={idpNameSelectValue}
            onChange={(e) => {
              onChange('idpName', e.target.value);
              onSubmit('idpName');
            }}>
            <Option value="">Select provider</Option>
            {Object.keys(SSO_PROVIDERS_MAP).map((name) => {
              return (
                <Option key={name} value={name}>
                  {name}
                </Option>
              );
            })}
          </Select>
          {form.isPending && updatingField === 'idpName' && <Spinner />}
        </div>
        <div className={styles.fieldContainer}>
          <div className={styles.input}>
            <TextField
              labelText="Single Sign-On Redirect URL"
              id="idpSsoTargetUrl"
              helpText="Sometimes called the SSO Login URL"
              name="idpSsoTargetUrl"
              testId="idp-sso-target-url"
              onChange={handleInputChange}
              value={fields.idpSsoTargetUrl.value}
              validationMessage={fields.idpSsoTargetUrl.error}
            />
          </div>
          {form.isPending && updatingField === 'idpSsoTargetUrl' && (
            <div className={styles.fieldSpinner}>
              <Spinner />
            </div>
          )}
        </div>
        <div className={styles.fieldContainer}>
          <div className={styles.input}>
            <TextField
              labelText="X.509 Certificate"
              textarea
              id="idpCert"
              name="idpCert"
              testId="idp-cert"
              textInputProps={{
                rows: 8,
              }}
              value={fields.idpCert.value}
              onChange={(e) => debouncedUpdate('idpCert', e.target.value)}
              validationMessage={fields.idpCert.error}
            />
          </div>
          {form.isPending && updatingField === 'idpCert' && (
            <div className={styles.fieldSpinner}>
              <Spinner />
            </div>
          )}
        </div>
      </section>
      <section>
        <Heading element="h2" className={styles.header}>
          SSO name
        </Heading>
        <HelpText className={styles.helpText}>
          Users will have to type the SSO name if they log in via{' '}
          <TextLink href="https://be.contentful.com/login/sso">
            Contentful&apos;s SSO login
          </TextLink>
          .
        </HelpText>

        <div className={styles.fieldContainer}>
          <div className={styles.input}>
            <TextField
              labelText="SSO name"
              id="ssoName"
              name="ssoName"
              testId="sso-name"
              helpText="Letters, numbers, periods, hyphens, and underscores are allowed."
              textInputProps={{
                width: 'large',
                placeholder: `E.g. ${kebabCase(orgName)}-sso`,
              }}
              value={fields.ssoName.value}
              onChange={(e) => debouncedUpdate('ssoName', e.target.value)}
              validationMessage={fields.ssoName.error}
            />
          </div>
          {form.isPending && updatingField === 'ssoName' && (
            <div className={styles.fieldSpinner}>
              <Spinner />
            </div>
          )}
        </div>
      </section>
    </>
  );
}

IDPDetailsForm.propTypes = {
  orgId: PropTypes.string.isRequired,
  orgName: PropTypes.string.isRequired,
  identityProvider: IdentityProviderPropType,
};
