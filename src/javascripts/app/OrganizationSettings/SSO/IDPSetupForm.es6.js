import React from 'react';
import _ from 'lodash';
import PropTypes from 'prop-types';
import {
  Heading,
  Subheading,
  Note,
  TextField,
  FormLabel,
  HelpText,
  Select,
  Option,
  TextLink,
  Spinner,
  Button,
  Textarea,
  ModalConfirm,
  Tooltip,
  Icon
} from '@contentful/forma-36-react-components';
import { authUrl, appUrl } from 'Config.es6';
import ModalLauncher from 'app/common/ModalLauncher.es6';
import { Organization as OrganizationPropType } from 'app/OrganizationSettings/PropTypes.es6';
import { IdentityProviderPropType, FieldsStatePropType } from './PropTypes.es6';
import { connectionTestingAllowed } from './utils.es6';
import { SSO_PROVIDERS, TEST_RESULTS } from './constants.es6';
import * as ssoActionCreators from 'redux/actions/sso/actionCreators.es6';
import * as ssoSelectors from 'redux/selectors/sso.es6';

import { connect } from 'react-redux';

export class IDPSetupForm extends React.Component {
  static propTypes = {
    organization: OrganizationPropType,
    identityProvider: IdentityProviderPropType,
    updateFieldValue: PropTypes.func.isRequired,
    validateField: PropTypes.func.isRequired,
    fields: FieldsStatePropType.isRequired,
    connectionTest: PropTypes.object,
    connectionTestStart: PropTypes.func.isRequired,
    connectionTestCancel: PropTypes.func.isRequired,
    connectionTestResult: PropTypes.func.isRequired,
    connectionTestEnd: PropTypes.func.isRequired,
    enable: PropTypes.func.isRequired
  };

  debouncedUpdateValue = _.debounce(async function(fieldName, value) {
    const { organization, updateFieldValue } = this.props;

    updateFieldValue({ fieldName, value, orgId: organization.sys.id });
  }, 500);

  updateField = (fieldName, immediately) => {
    return e => {
      const { validateField } = this.props;

      const value = e.target.value;

      validateField({ fieldName, value });
      this.debouncedUpdateValue(fieldName, value);

      if (immediately) {
        this.debouncedUpdateValue.flush();
      }
    };
  };

  testConnection = () => {
    const {
      organization: {
        sys: { id: orgId }
      },
      connectionTestStart
    } = this.props;

    const testConnectionUrl = authUrl(`/sso/${orgId}/test_connection`);

    // Open the new window and check if it's closed every 250ms
    const newWindow = window.open(testConnectionUrl, '', 'toolbar=0,status=0,width=650,height=800');
    const testConnectionTimer = window.setInterval(this.checkTestConnectionWindow(newWindow), 250);

    // Listen for an event from the window
    window.addEventListener('message', this.messageHandler);

    this.setState({
      testConnectionTimer,
      newWindow,
      messageHandled: false
    });

    connectionTestStart();
  };

  messageHandler = ({ data }) => {
    this.setState({
      messageHandled: true
    });

    this.handleTestResultFromPopup(data);
  };

  handleTestResultFromPopup = data => {
    const {
      organization: {
        sys: { id: orgId }
      },
      connectionTestResult,
      connectionTestEnd
    } = this.props;

    if (data.testConnectionAt) {
      // The status of the connection test is updated in GK
      // Update the result directly in the store
      connectionTestResult({ data });
    } else {
      // The user clicked on the button, but somehow it never updated in GK
      // Treat it as if the user closed the popup and attempt to reload
      // the data
      connectionTestEnd({ orgId });
    }
  };

  cancelConnectionTest = () => {
    const { connectionTestCancel } = this.props;

    this.state.newWindow.close();

    window.clearInterval(this.state.testConnectionTimer);
    window.removeEventListener('message', this.messageHandler);

    this.setState({
      testConnectionTimer: undefined,
      newWindow: undefined
    });

    connectionTestCancel();
  };

  checkTestConnectionWindow = win => {
    return () => {
      const {
        organization: {
          sys: { id: orgId }
        },
        connectionTestEnd
      } = this.props;

      // Do not run the `end` action creator if:
      //
      // 1. The window isn't closed yet
      // 2. The window isn't available in the component state (it was canceled)
      // 3. The message was handled via `#messageHandler`
      if (!win.closed || !this.state.newWindow || this.state.messageHandled) {
        return;
      }

      window.clearInterval(this.state.testConnectionTimer);

      connectionTestEnd({ orgId });
    };
  };

  confirmEnable = async () => {
    const {
      enable,
      organization: {
        sys: { id: orgId }
      }
    } = this.props;
    const confirmation = await ModalLauncher.open(({ isShown, onClose }) => (
      <ModalConfirm
        title="Enable SSO"
        intent="positive"
        confirmLabel="Enable"
        isShown={isShown}
        onConfirm={() => onClose(true)}
        onCancel={() => onClose(false)}>
        <p>
          Enabling SSO will allow your users to log in via SSO.
        </p>

        <p>
          Once SSO is enabled, you won’t be able to make changes to the SSO settings yourself, and you’ll need to contact support instead.
        </p>

        <p>Ready to enable SSO?</p>
      </ModalConfirm>
    ));

    if (!confirmation) {
      return;
    }

    enable({ orgId });
  };

  render() {
    const {
      fields,
      connectionTest,
      identityProvider,
      organization: {
        sys: { id: orgId }
      }
    } = this.props;

    const allowConnectionTest = connectionTestingAllowed(fields, connectionTest);
    const metadataUrl = authUrl(`/sso/${orgId}/metadata`);

    const testResultIsSuccess = connectionTest.result === TEST_RESULTS.success;
    const testResultIsFailure = connectionTest.result === TEST_RESULTS.failure;
    const testResultIsUnknown =
      connectionTest.timestamp &&
      connectionTest.result !== TEST_RESULTS.success &&
      connectionTest.result !== TEST_RESULTS.failure;

    return (
      <React.Fragment>
        <section className="f36-margin-top--xl">
          <Heading element="h2" extraClassNames="f36-margin-bottom--l">
            Contentful’s service provider details
            <TextLink extraClassNames="f36-margin-left--s" href={metadataUrl}>
              <Tooltip place="top" content="Download SAML metadata file">
                <Icon icon="Download" />
              </Tooltip>
            </TextLink>
          </Heading>
          <TextField
            labelText="Audience URI"
            name="audience"
            id="audience"
            extraClassNames="f36-margin-bottom--l"
            helpText="Sometimes called the Entity ID"
            textInputProps={{
              withCopyButton: true,
              disabled: true,
              width: 'large'
            }}
            value={appUrl}
          />
          <TextField
            labelText="ACS (Assertion Consumer Service) URL"
            name="acsUrl"
            id="acsUrl"
            extraClassNames="f36-margin-bottom--xl"
            helpText="Sometimes called the Single Sign-On URL"
            textInputProps={{
              withCopyButton: true,
              disabled: true
            }}
            value={`https:${authUrl(`/sso/${orgId}/consume`)}`}
          />

          <Subheading extraClassNames="f36-margin-bottom--xs">Contentful logo</Subheading>
          <HelpText extraClassNames="f36-margin-bottom--xl">
            Most SSO providers allow you to upload a thumbnail for your custom SAML app.{' '}
            <TextLink href="http://press.contentful.com/media_kits/219490">
              Download Contentful logos
            </TextLink>
            .
          </HelpText>

          <Subheading extraClassNames="f36-margin-bottom--xs">Map user attributes</Subheading>
          <HelpText extraClassNames="f36-margin-bottom--l">
            Map these attributes into your SSO provider.
          </HelpText>
          <div className="sso-setup__user-attributes">
            <TextField
              extraClassNames="f36-margin-right--m"
              name="attribute-givenname"
              id="attribute-givenname"
              labelText="First name"
              textInputProps={{
                withCopyButton: true,
                disabled: true
              }}
              value="givenname"
            />
            <TextField
              extraClassNames="f36-margin-right--m"
              name="attribute-surname"
              id="attribute-surname"
              labelText="Last name"
              textInputProps={{
                withCopyButton: true,
                disabled: true
              }}
              value="surname"
            />
            <TextField
              extraClassNames="sso-setup__user-attribute"
              name="attribute-email"
              id="attribute-email"
              labelText="Email"
              textInputProps={{
                withCopyButton: true,
                disabled: true
              }}
              value="email"
            />
          </div>
          <Note extraClassNames="f36-margin-top--l">
            For Microsoft products,{' '}
            <TextLink href="https://www.contentful.com/faq/sso/#what-identity-providers-idp-does-contentful-support">
              read the documentation
            </TextLink>{' '}
            about mapping the user attributes.
          </Note>
        </section>

        <section className="f36-margin-top--3xl">
          <Heading element="h2" extraClassNames="f36-margin-bottom--l">
            Your SSO provider details
          </Heading>
          <FormLabel htmlFor="ssoProvider">SSO provider</FormLabel>
          <div>
            <Select
              name="ssoProvider"
              id="ssoProvider"
              testId="ssoProvider"
              helpText="Sometimes called the SAML 2.0 endpoint"
              width="medium"
              extraClassNames="f36-margin-bottom--l f36-margin-right--m sso-setup__select"
              value={fields.idpName.value}
              onChange={this.updateField('idpName', true)}>
              <Option value="">Select provider</Option>
              {SSO_PROVIDERS.map(name => {
                return (
                  <Option key={name} value={name}>
                    {name}
                  </Option>
                );
              })}
            </Select>
            {fields.idpName.isPending && <Spinner />}
          </div>
          <div className="sso-setup__field-container">
            <div className="sso-setup__field-input sso-setup__field-input--full">
              <TextField
                labelText="Single Sign-On Redirect URL"
                extraClassNames="sso-setup__field f36-margin-right--m f36-margin-bottom--l"
                id="idpSsoTargetUrl"
                name="idpSsoTargetUrl"
                onChange={this.updateField('idpSsoTargetUrl')}
                onBlur={this.updateField('idpSsoTargetUrl', true)}
                value={fields.idpSsoTargetUrl.value}
                validationMessage={fields.idpSsoTargetUrl.error}
              />
            </div>
            {fields.idpSsoTargetUrl.isPending && (
              <div className="sso-setup__field-spinner">
                <Spinner />
              </div>
            )}
          </div>
          <div className="sso-setup__field-container">
            <div className="sso-setup__field-input sso-setup__field-input--full">
              <TextField
                labelText="X.509 Certificate"
                textarea
                id="idpCert"
                name="idpCert"
                extraClassNames="f36-margin-right--m"
                textInputProps={{
                  rows: 8
                }}
                value={fields.idpCert.value}
                onChange={this.updateField('idpCert')}
                onBlur={this.updateField('idpCert', true)}
                validationMessage={fields.idpCert.error}
              />
            </div>
            {fields.idpCert.isPending && (
              <div className="sso-setup__field-spinner">
                <Spinner />
              </div>
            )}
          </div>
        </section>

        <section className="f36-margin-top--3xl">
          <Heading element="h2" extraClassNames="f36-margin-bottom--xs">
            Test connection
          </Heading>
          <HelpText extraClassNames="f36-margin-bottom--l">
            You need a user account in your SSO provider and permission to use the Contentful app in
            your SSO provider to test the connection.
          </HelpText>
          <div>
            <Button
              testId="test-connection-button"
              disabled={!allowConnectionTest}
              onClick={this.testConnection}>
              {!connectionTest.isPending && !testResultIsSuccess && `Test connection`}
              {!connectionTest.isPending && testResultIsSuccess && `Retest connection`}
              {connectionTest.isPending && `Testing connection...`}
            </Button>
            {connectionTest.isPending && (
              <Button
                extraClassNames="f36-margin-left--m"
                buttonType="negative"
                onClick={this.cancelConnectionTest}
                testId="cancel-button">
                Cancel
              </Button>
            )}
            {!connectionTest.isPending && (
              <div className="f36-margin-top--l">
                {testResultIsUnknown && (
                  <Note testId="result-unknown-note" noteType="warning">
                    An unknown error occured while testing the connection. Try again.
                  </Note>
                )}
                {testResultIsFailure && (
                  <Note testId="result-failure-note" noteType="negative">
                    Connection wasn’t established. View the Error log below for more information.
                  </Note>
                )}
                {testResultIsSuccess && (
                  <Note testId="result-success-note" noteType="positive">
                    Connection test successful!
                  </Note>
                )}
              </div>
            )}
          </div>

          {!connectionTest.isPending && connectionTest.result === TEST_RESULTS.failure && (
            <div>
              <Textarea
                extraClassNames="f36-margin-top--xl"
                rows={5}
                disabled
                testId="errors"
                value={connectionTest.errors.join('\n')}
              />
            </div>
          )}
        </section>

        <section className="f36-margin-top--3xl">
          <Heading element="h2" extraClassNames="f36-margin-bottom--xs">
            Sign-in name
          </Heading>
          <HelpText extraClassNames="f36-margin-bottom--l">
            It’s what users have to type if they choose to login in via SSO on Contentful. We’ve
            prefilled it with the name of your organization, but you can change it. Make sure to
            keep it short and memorable.
          </HelpText>

          <div className="sso-setup__field-container">
            <div className="sso-setup__field-input">
              <TextField
                labelText="Sign-in name"
                id="ssoName"
                name="ssoName"
                testId="ssoName"
                helpText="Letters, numbers, periods, hyphens, and underscores are allowed."
                textInputProps={{
                  width: 'large'
                }}
                extraClassNames="f36-margin-right--m"
                value={fields.ssoName.value}
                onChange={this.updateField('ssoName')}
                onBlur={this.updateField('ssoName', true)}
                validationMessage={fields.ssoName.error}
              />
            </div>
            {fields.ssoName.isPending && (
              <div className="sso-setup__field-spinner">
                <Spinner />
              </div>
            )}
          </div>

          <Note extraClassNames="f36-margin-top--3xl">
            To enable SSO in{' '}
            <TextLink href="https://www.contentful.com/faq/sso/#how-does-sso-restricted-mode-work">
              Restricted mode
            </TextLink>
            , requiring users to sign in using SSO,{' '}
            <TextLink href="https://www.contentful.com/support/">reach out to support</TextLink>.
          </Note>

          <div className="f36-margin-top--l">
            <Button
              buttonType="positive"
              testId="enable-button"
              onClick={this.confirmEnable}
              disabled={
                connectionTest.result !== TEST_RESULTS.success ||
                identityProvider.isPending ||
                identityProvider.isEnabling
              }>
              {!identityProvider.isEnabling && `Enable SSO`}
              {identityProvider.isEnabling && `Enabling SSO...`}
            </Button>
          </div>
        </section>
      </React.Fragment>
    );
  }
}

export default connect(
  state => ({
    fields: ssoSelectors.getFields(state),
    identityProvider: ssoSelectors.getIdentityProvider(state),
    connectionTest: ssoSelectors.getConnectionTest(state)
  }),
  {
    validateField: ssoActionCreators.validateField,
    updateFieldValue: ssoActionCreators.updateFieldValue,
    connectionTestStart: ssoActionCreators.connectionTestStart,
    connectionTestCancel: ssoActionCreators.connectionTestCancel,
    connectionTestResult: ssoActionCreators.connectionTestResult,
    connectionTestEnd: ssoActionCreators.connectionTestEnd,
    enable: ssoActionCreators.enable
  }
)(IDPSetupForm);
