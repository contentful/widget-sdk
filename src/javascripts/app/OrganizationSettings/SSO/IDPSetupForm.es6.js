import React from 'react';
import PropTypes from 'prop-types';
import {
  Note,
  TextField,
  TextInput,
  FormLabel,
  HelpText,
  Icon,
  Tooltip
} from '@contentful/forma-36-react-components';

export default class IDPSetupForm extends React.Component {
  static propTypes = {
    org: {
      name: PropTypes.string.isRequired
    },
    idpDetails: {
      ssoName: PropTypes.string,
      ssoProvider: PropTypes.string,
      ssoIdpTargetUrl: PropTypes.string,
      idpCert: PropTypes.string
    }
  };
  state = {
    dropdownOpen: false,
    showOtherProvider: false,
    idpDetails: {
      ssoName: ''
    }
  };

  componentDidMount() {
    const {
      idpDetails,
      org: { name: orgName }
    } = this.props;
    const state = this.state;

    if (!idpDetails.ssoName) {
      state.idpDetails.ssoName = orgName;
    }

    this.setState(state);
  }

  updateValue(name) {
    return e => {
      const value = e.target.value;

      const updatedState = this.state;
      updatedState.idpDetails[name] = value;

      this.setState(updatedState);
    };
  }

  updateSsoProvider() {
    return e => {
      const value = e.target.value;

      const state = this.state;

      if (value === 'Other') {
        state.showOtherProvider = true;
      } else {
        state.showOtherProvider = false;
      }

      state.idpDetails.ssoProvider = value;

      this.setState(state);
    };
  }

  toggleSsoProviderDropdown(state) {
    const { dropdownOpen } = this.state;
    let newDropdownState;

    if (state) {
      newDropdownState = state;
    } else {
      newDropdownState = !dropdownOpen;
    }

    this.setState({
      dropdownOpen: newDropdownState
    });
  }

  render() {
    const { org } = this.props;
    const { idpDetails, showOtherProvider } = this.state;

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
          <select name="ssoProvider" id="ssoProvider" onChange={this.updateSsoProvider()}>
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
            value={idpDetails.ssoName}
            onChange={this.updateValue('ssoName')}
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
            value={`https://app.contentful.com`}
          />
          <TextField
            labelText="Login URL"
            name="login-url"
            id="login-url"
            textInputProps={{
              withCopyButton: true,
              disabled: true
            }}
            value={`https://be.contentful.com/sso/${org.sys.id}/login`}
          />
          <TextField
            labelText="ACS (Assertion Consumer Service) URL"
            name="acs-url"
            id="acs-url"
            textInputProps={{
              withCopyButton: true,
              disabled: true
            }}
            value={`https://be.contentful.com/sso/${org.sys.id}/consume`}
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
            onBlur={this.updateValue('ssoIdpTargetUrl')}
            value={idpDetails.ssoIdpTargetUrl}
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
            onChange={this.updateValue('idpCert')}
          />
          <HelpText>Certificate should be formatted with header or in string format.</HelpText>
        </section>
      </React.Fragment>
    );
  }
}
