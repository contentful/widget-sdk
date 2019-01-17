import React from 'react';
import _ from 'lodash';
import {
  Heading,
  Note,
  TextField,
  TextInput,
  FormLabel,
  HelpText,
  Select,
  Option,
  Notification
} from '@contentful/forma-36-react-components';
import { authUrl, appUrl } from 'Config.es6';
import { createOrganizationEndpoint } from 'data/EndpointFactory.es6';
import {
  Organization as OrganizationPropType,
  IdentityProvider as IdentityProviderPropType
} from 'app/OrganizationSettings/PropTypes.es6';
import { SSO_PROVIDERS } from './constants.es6';

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

    if (!identityProvider.ssoName) {
      identityProvider.ssoName = orgName.toLowerCase();
    }

    this.setState({
      identityProvider
    });
  }

  debouncedUpdateValue = _.debounce(async function(name, value) {
    const {
      organization: {
        sys: { id: orgId }
      }
    } = this.props;

    const endpoint = createOrganizationEndpoint(orgId);
    const currentValue = this.state.identityProvider[name];

    if (currentValue === value) {
      return;
    }

    let field = name;
    let newValue = value;
    let showOtherProvider;

    // If the user selects "other" as an SSO provider from the list,
    // we should show the input field for the user to type their own
    if (name === 'idpName') {
      if (value === 'other') {
        showOtherProvider = true;
        newValue = '';
      } else {
        showOtherProvider = false;
      }
    }

    if (name === 'otherIdpName') {
      field = 'idpName';
    }

    const {
      sys: { version: currentVersion }
    } = this.state.identityProvider;
    let updatedIdentityProvider;

    try {
      updatedIdentityProvider = await endpoint({
        method: 'PUT',
        path: ['identity_provider'],
        version: currentVersion,
        data: {
          [field]: newValue
        }
      });
    } catch (e) {
      Notification.error(`Could not update ${name}`);

      return;
    }

    this.setState({
      showOtherProvider,
      identityProvider: updatedIdentityProvider
    });
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

    return (
      <React.Fragment>
        <Note>All fields are required unless marked as optional.</Note>

        <section className="f36-margin-top--3xl">
          <Heading element="h2">SSO provider and SSO name</Heading>
          <FormLabel
            htmlFor="ssoProvider"
            required
            requiredText="optional"
            style={{ display: 'block' }}>
            SSO provider
          </FormLabel>
          <Select
            name="ssoProvider"
            id="ssoProvider"
            onChange={this.updateValueImmediately('idpName')}>
            <Option value={''}>Select provider</Option>
            {SSO_PROVIDERS.map(name => {
              return (
                <Option key={name} value={name}>
                  {name}
                </Option>
              );
            })}
            <Option value="other">Other</Option>
          </Select>
          {this.state.showOtherProvider && (
            <TextField
              name="otherSsoProvider"
              id="otherSsoProvider"
              labelText="Other provider"
              value={this.state.identityProvider.ssoProvider}
              onChange={this.updateValue('otherIdpName')}
              onBlur={this.updateValueImmediately('otherIdpName')}
            />
          )}
          <HelpText>This will help us provide better support to you.</HelpText>

          <TextField
            labelText="SSO name"
            id="ssoName"
            name="ssoName"
            value={this.state.identityProvider.ssoName}
            onChange={this.updateValue('ssoName')}
            onBlur={this.updateValueImmediately('ssoName')}
          />
          <HelpText>
            It’s what users have to type to log in via SSO on Contentful. Lowercase letters,
            numbers, periods, spaces, hyphens, or underscores are allowed.
          </HelpText>
        </section>
        <section className="f36-margin-top--3xl">
          <Heading element="h2">Copy Contentful’s details</Heading>
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
            name="loginUrl"
            id="loginUrl"
            textInputProps={{
              withCopyButton: true,
              disabled: true
            }}
            value={authUrl(`/sso/${orgId}/login`)}
          />
          <TextField
            labelText="ACS (Assertion Consumer Service) URL"
            name="acsUrl"
            id="acsUrl"
            textInputProps={{
              withCopyButton: true,
              disabled: true
            }}
            value={authUrl(`/sso/${orgId}/consume`)}
          />
        </section>

        <section className="f36-margin-top--3xl">
          <Heading element="h2">Map user attributes</Heading>
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
          <Heading element="h2">Enter your SSO provider’s details</Heading>
          <FormLabel htmlFor="redirect-url">Single Sign-On Redirect URL</FormLabel>
          <TextInput
            id="redirect-url"
            name="redirect-url"
            onChange={this.updateValue('idpSsoTargetUrl')}
            onBlur={this.updateValueImmediately('idpSsoTargetUrl')}
            value={this.state.identityProvider.idpSsoTargetUrl}
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
            value={this.state.identityProvider.idpCert}
            onChange={this.updateValue('idpCert')}
            onBlur={this.updateValueImmediately('idpCert')}
          />
          <HelpText>Certificate should be formatted with header or in string format.</HelpText>
        </section>
      </React.Fragment>
    );
  }
}
