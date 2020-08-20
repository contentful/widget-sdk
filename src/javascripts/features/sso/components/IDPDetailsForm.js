import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { IdentityProviderPropType } from 'app/OrganizationSettings/SSO/PropTypes';
import { findKey, kebabCase, debounce } from 'lodash';
import { css } from 'emotion';
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
  Note,
  Button,
} from '@contentful/forma-36-react-components';
import { useForm } from 'core/hooks';
import { SSO_PROVIDERS_MAP, validate, connectionTestingAllowed } from 'features/sso/utils';
import { updateFieldValue, enable } from '../services/SSOService';
import { TestConnection } from './TestConnection';
import { buildUrlWithUtmParams } from 'utils/utmBuilder';

const withInAppHelpUtmParams = buildUrlWithUtmParams({
  source: 'webapp',
  medium: 'idp-setup-form',
  campaign: 'in-app-help',
});

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
  buttonSpaced: css({
    marginTop: tokens.spacingL,
  }),
  noteSpaced: css({
    marginTop: tokens.spacingXl,
  }),
};

export function IDPDetailsForm({
  orgId,
  orgName,
  identityProvider,
  onUpdate,
  onTrackSupportClick,
}) {
  const [updatingField, setUpdatingField] = useState('');
  const [enablePending, setEnablePending] = useState(false);

  const submitForm = async (values, fieldName, identityProvider) => {
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
    await onUpdate();
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
      onSubmit(fieldName, identityProvider);
    }, 500),
    [identityProvider]
  );

  const handleInputChange = (e) => debouncedUpdate('idpSsoTargetUrl', e.target.value);

  const allowConnectionTest = connectionTestingAllowed(fields);

  const handleEnable = async () => {
    setEnablePending(true);
    try {
      await enable(orgId);
    } catch {
      setEnablePending(false);
      return;
    }
    await onUpdate();
    setEnablePending(false);
  };

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
              onSubmit('idpName', identityProvider);
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
        <TestConnection
          orgId={orgId}
          disabled={!allowConnectionTest}
          ssoConfig={identityProvider.data}
          onComplete={onUpdate}
        />
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
        <Note className={styles.noteSpaced}>
          To enable SSO in{' '}
          <TextLink
            href={withInAppHelpUtmParams(
              'https://www.contentful.com/faq/sso/#how-does-sso-restricted-mode-work'
            )}>
            Restricted mode
          </TextLink>
          , requiring users to sign in using SSO,{' '}
          <TextLink
            onClick={onTrackSupportClick}
            testId="support-link"
            href={withInAppHelpUtmParams('https://www.contentful.com/support/')}>
            reach out to support
          </TextLink>
          .
        </Note>
        <div className={styles.buttonSpaced}>
          <Button
            buttonType="positive"
            testId="enable-button"
            onClick={handleEnable}
            loading={enablePending}
            disabled={identityProvider.data.testConnectionResult !== 'success'}>
            Enable SSO
          </Button>
        </div>
      </section>
    </>
  );
}

IDPDetailsForm.propTypes = {
  orgId: PropTypes.string.isRequired,
  orgName: PropTypes.string.isRequired,
  identityProvider: IdentityProviderPropType,
  onUpdate: PropTypes.func,
  onTrackSupportClick: PropTypes.func,
};
