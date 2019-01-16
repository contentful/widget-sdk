import React from 'react';
import _ from 'lodash';
import {
  Note,
  TextField,
  TextInput,
  FormLabel,
  HelpText,
  Icon,
  Tooltip,
  Notification
} from '@contentful/forma-36-react-components';
import { authUrl, appUrl } from 'Config.es6';
import { createOrganizationEndpoint } from 'data/EndpointFactory.es6';
import {
  Organization as OrganizationPropType,
  IdentityProvider as IdentityProviderPropType
} from 'app/OrganizationSettings/PropTypes.es6';

export default class IDPSetupForm extends React.Component {
  static propTypes = {
    organization: OrganizationPropType,
    identityProvider: IdentityProviderPropType
  };

  state = {
    showOtherProvider: false,
    identityProvider: {}
  };

  componentDidMount() {
    const {
      identityProvider,
      organization: { name: orgName }
    } = this.props;

    const state = this.state;

    state.identityProvider = identityProvider;

    if (!identityProvider.ssoName) {
      state.identityProvider.ssoName = orgName.toLowerCase();
    }

    this.setState(state);
  }

  debouncedUpdateValue = _.debounce(async function(name, value) {
    const {
      organization: {
        sys: { id: orgId }
      }
    } = this.props;
    const endpoint = createOrganizationEndpoint(orgId);

    const state = this.state;
    const currentValue = state.identityProvider[name];

    if (currentValue === value) {
      return;
    }

    state.identityProvider[name] = value;

    // If we are updating the ssoProvider, we should
    // also update showOtherProvider
    if (name === 'ssoProvider') {
      if (value === 'Other') {
        state.showOtherProvider = true;
      } else {
        state.showOtherProvider = false;
      }
    }

    try {
      await endpoint({
        method: 'PUT',
        path: ['identity_provider'],
        data: {
          [name]: value
        }
      });
    } catch (e) {
      Notification.error(`Could not update ${name}`);

      return;
    }

    this.setState(state);
  }, 500);

  updateValueImmediately(name) {
    return e => {
      const value = e.target.value;

      this.debouncedUpdateValue(name, value);
      this.debouncedUpdateValue.flush();
    };
  }

  updateValue(name) {
    return e => {
      const value = e.target.value;

      this.debouncedUpdateValue(name, value);
    };
  }

  render() {
    const {
      organization: {
        sys: { id: orgId }
      }
    } = this.props;
    const { identityProvider, showOtherProvider } = this.state;

    const ssoProviders = [
      'Auth0',
      'Google Suite',
      'Microsoft ADFS',
      'Microsoft Azure',
      'Okta',
      'OneLogin',
      'PingIdentity',
      'Other'
    ];

    return (
      <React.Fragment>
        <Note>All fields are required unless marked as optional.</Note>

        <section className="f36-margin-top--3xl">
          <h2>SSO provider and SSO name</h2>
          <FormLabel
            htmlFor="ssoProvider"
            required
            requiredText="optional"
            style={{ display: 'block' }}>
            SSO provider
          </FormLabel>
          <select
            name="ssoProvider"
            id="ssoProvider"
            onChange={this.updateValueImmediately('ssoProvider')}>
            <option value={''}>Select provider</option>
            {ssoProviders.map(name => {
              return (
                <option key={name} value={name}>
                  {name}
                </option>
              );
            })}
          </select>
          {showOtherProvider && (
            <TextField name="otherProvider" id="otherProvider" labelText="Other provider" />
          )}
          <HelpText>This will help us provide better support to you.</HelpText>

          <TextField
            labelText="SSO name"
            id="sso-name"
            name="sso-name"
            value={identityProvider.ssoName}
            onChange={this.updateValue('ssoName')}
            onBlur={this.updateValueImmediately('ssoName')}
          />
          <HelpText>
            It’s what users have to type to log in via SSO on Contentful. Lowercase letters,
            numbers, periods, spaces, hypdens, or underscores are allowed.
          </HelpText>
        </section>
        <section className="f36-margin-top--3xl">
          <h2>Copy Contentful’s details</h2>
          <TextField
            labelText="Audience"
            name="audience"
            id="audience"
            textInputProps={{
              withCopyButton: true,
              disabled: true
            }}
            value={appUrl}
          />
          <TextField
            labelText="Login URL"
            name="login-url"
            id="login-url"
            textInputProps={{
              withCopyButton: true,
              disabled: true
            }}
            value={authUrl(`/sso/${orgId}/login`)}
          />
          <TextField
            labelText="ACS (Assertion Consumer Service) URL"
            name="acs-url"
            id="acs-url"
            textInputProps={{
              withCopyButton: true,
              disabled: true
            }}
            value={authUrl(`/sso/${orgId}/consume`)}
          />
        </section>

        <section className="f36-margin-top--3xl">
          <h2>Map user attributes</h2>
          <HelpText>
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
          <Note>
            Read the documentation on mapping user attributes if you’re using Microsoft Azure or
            Microsoft Active Directory.
          </Note>
        </section>

        <section className="f36-margin-top--3xl">
          <h2>Enter your SSO provider’s details</h2>
          <FormLabel htmlFor="redirect-url">
            <strong>
              Single Sign-On Redirect URL
              <Tooltip content="SSO Redirect URL">
                <Icon icon="HelpCircle" />
              </Tooltip>
            </strong>
          </FormLabel>
          <TextInput
            id="redirect-url"
            name="redirect-url"
            onChange={this.updateValue('idpSsoTargetUrl')}
            onBlur={this.updateValueImmediately('idpSsoTargetUrl')}
            value={identityProvider.idpSsoTargetUrl}
          />
          <HelpText>Be careful not to paste the SLO, or Single Logout URL</HelpText>
          <TextField
            labelText="X.509 Certificate"
            id="x509-cert"
            name="x509-cert"
            textarea
            textInputProps={{
              rows: 8
            }}
            value={identityProvider.idpCert}
            onChange={this.updateValue('idpCert')}
            onBlur={this.updateValueImmediately('idpCert')}
          />
          <HelpText>Certificate should be formatted with header or in string format.</HelpText>
        </section>
      </React.Fragment>
    );
  }
}
