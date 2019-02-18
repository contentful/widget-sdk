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
  Textarea
} from '@contentful/forma-36-react-components';
import { authUrl, appUrl } from 'Config.es6';
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
    connectionTestEnd: PropTypes.func.isRequired
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

  render() {
    const {
      fields,
      connectionTest,
      organization: {
        sys: { id: orgId }
      }
    } = this.props;

    const allowConnectionTest = connectionTestingAllowed(fields, connectionTest);

    return (
      <React.Fragment>
        <section className="f36-margin-top--3xl">
          <Heading element="h2" extraClassNames="f36-margin-bottom--l">
            Copy Contentful’s details
          </Heading>
          <TextField
            labelText="Audience"
            name="audience"
            id="audience"
            extraClassNames="f36-margin-bottom--l"
            textInputProps={{
              withCopyButton: true,
              disabled: true
            }}
            value={appUrl}
          />
          <TextField
            labelText="ACS (Assertion Consumer Service) URL"
            name="acsUrl"
            id="acsUrl"
            extraClassNames="f36-margin-bottom--xl"
            textInputProps={{
              withCopyButton: true,
              disabled: true
            }}
            value={`https:${authUrl(`/sso/${orgId}/consume`)}`}
          />

          <Subheading extraClassNames="f36-margin-bottom--xs">Map user attributes</Subheading>
          <HelpText extraClassNames="f36-margin-bottom--l">
            Copy and paste these attributes into your SSO provider. They’re not case sensitive.
          </HelpText>
          <div className="sso-setup__user-attributes">
            <TextField
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
            For Microsoft Azure and Microsoft ADFS,{' '}
            <TextLink href="https://www.contentful.com/faq/sso/#what-identity-providers-idp-does-contentful-support">
              read the documentation
            </TextLink>{' '}
            for mapping the user attributes.
          </Note>
        </section>

        <section className="f36-margin-top--3xl">
          <Heading element="h2" extraClassNames="f36-margin-bottom--l">
            Enter your SSO provider details
          </Heading>
          <FormLabel htmlFor="ssoProvider" style={{ display: 'block' }}>
            SSO provider
          </FormLabel>
          <div>
            <Select
              name="ssoProvider"
              id="ssoProvider"
              testId="ssoProvider"
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
          <TextField
            labelText="Single Sign-On Redirect URL"
            id="idpSsoTargetUrl"
            name="idpSsoTargetUrl"
            extraClassNames="f36-margin-bottom--l"
            onChange={this.updateField('idpSsoTargetUrl')}
            onBlur={this.updateField('idpSsoTargetUrl', true)}
            value={fields.idpSsoTargetUrl.value}
            validationMessage={fields.idpSsoTargetUrl.error}
          />
          <TextField
            labelText="X.509 Certificate"
            id="idpCert"
            name="idpCert"
            textarea
            textInputProps={{
              rows: 8
            }}
            value={fields.idpCert.value}
            onChange={this.updateField('idpCert')}
            onBlur={this.updateField('idpCert', true)}
            validationMessage={fields.idpCert.error}
          />
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
              {!connectionTest.isPending && `Test connection`}
              {connectionTest.isPending && `Testing connection...`}
            </Button>
            {connectionTest.isPending && (
              <Button
                extraClassNames="f36-margin-left--m"
                buttonType="muted"
                onClick={this.cancelConnectionTest}
                testId="cancel-button">
                Cancel
              </Button>
            )}
            {!connectionTest.isPending && (
              <div className="f36-margin-top--l">
                {connectionTest.result === TEST_RESULTS.unknown && (
                  <Note testId="result-unknown-note" noteType="warning">
                    An unknown error occured while testing the connection. Try again.
                  </Note>
                )}
                {connectionTest.result === TEST_RESULTS.failure && (
                  <Note testId="result-failure-note" noteType="negative">
                    Connection wasn’t established. View the Error log below for more information.
                  </Note>
                )}
                {connectionTest.result === TEST_RESULTS.success && (
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

          <TextField
            labelText="Sign-in name"
            id="ssoName"
            name="ssoName"
            testId="ssoName"
            value={fields.ssoName.value}
            onChange={this.updateField('ssoName')}
            onBlur={this.updateField('ssoName', true)}
            helpText="Lowercase letters, numbers, periods, spaces, hyphens, or underscores are allowed."
            validationMessage={fields.ssoName.error}
          />

          <Note extraClassNames="f36-margin-top--3xl">
            To enable SSO in{' '}
            <TextLink href="https://www.contentful.com/faq/sso/#how-does-sso-restricted-mode-work">
              Restricted mode
            </TextLink>
            , requiring users to sign in using SSO,{' '}
            <TextLink href="https://www.contentful.com/support/">reach out to support</TextLink>.
          </Note>
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
    connectionTestEnd: ssoActionCreators.connectionTestEnd
  }
)(IDPSetupForm);
