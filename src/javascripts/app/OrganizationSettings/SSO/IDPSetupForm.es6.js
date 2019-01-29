import React from 'react';
import _ from 'lodash';
import {
  Heading,
  Subheading,
  Note,
  TextField,
  FormLabel,
  HelpText,
  Select,
  Option,
  Notification,
  TextLink
} from '@contentful/forma-36-react-components';
import { authUrl, appUrl } from 'Config.es6';
import { createOrganizationEndpoint } from 'data/EndpointFactory.es6';
import {
  Organization as OrganizationPropType,
  IdentityProvider as IdentityProviderPropType
} from 'app/OrganizationSettings/PropTypes.es6';
import { SSO_PROVIDERS } from './constants.es6';
import * as validators from './validators.es6';

export default class IDPSetupForm extends React.Component {
  static propTypes = {
    organization: OrganizationPropType.isRequired,
    identityProvider: IdentityProviderPropType
  };

  state = {
    showOtherProvider: false,
    identityProvider: {},
    invalidFields: {}
  };

  debouncedUpdateValue = _.debounce(async function(name, value) {
    const { identityProvider, organization } = this.props;

    const endpoint = createOrganizationEndpoint(organization.sys.id);
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

    const { sys: { version: currentVersion } } = identityProvider;
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

      const isValid = this.validate(name, value);

      if (!isValid) {
        return;
      }

      this.debouncedUpdateValue(name, value);
      this.debouncedUpdateValue.flush();
    };
  }

  updateValue(name) {
    return e => {
      const value = e.target.value;

      const isValid = this.validate(name, value);

      if (!isValid) {
        return;
      }

      this.debouncedUpdateValue(name, value);
    };
  }

  updateValidity(fieldName, isValid) {
    this.setState(({ invalidFields }) => {
      if (isValid && invalidFields[fieldName]) {
        delete invalidFields[fieldName];
      } else if (!isValid) {
        invalidFields[fieldName] = true;
      }

      return { invalidFields };
    });
  }

  validate(fieldName, value) {
    if (!validators[fieldName]) {
      return true;
    }

    const isValid = validators[fieldName](value);
    this.updateValidity(fieldName, isValid);

    return isValid;
  }

  render() {
    const {
      identityProvider,
      organization: {
        sys: { id: orgId }
      }
    } = this.props;

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
          <Select
            name="ssoProvider"
            id="ssoProvider"
            testId="ssoProvider"
            width="medium"
            extraClassNames="f36-margin-bottom--l"
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
              testId='otherSsoProvider'
              labelText="Other provider"
              extraClassNames="f36-margin-bottom--l"
              value={identityProvider.ssoProvider}
              onChange={this.updateValue('otherIdpName')}
              onBlur={this.updateValueImmediately('otherIdpName')}
              validationMessage={
                this.state.invalidFields.otherIdpName && 'Enter a valid SSO provider'
              }
            />
          )}

          <FormLabel htmlFor="redirect-url">Single Sign-On Redirect URL</FormLabel>
          <TextField
            id="idpSsoTargetUrl"
            name="idpSsoTargetUrl"
            extraClassNames="f36-margin-bottom--l"
            onChange={this.updateValue('idpSsoTargetUrl')}
            onBlur={this.updateValueImmediately('idpSsoTargetUrl')}
            value={identityProvider.idpSsoTargetUrl}
            validationMessage={
              this.state.invalidFields.idpSsoTargetUrl && 'Enter a valid SSO redirect URL'
            }
          />
          <TextField
            labelText="X.509 Certificate"
            id="idpCert"
            name="idpCert"
            textarea
            textInputProps={{
              rows: 8
            }}
            value={identityProvider.idpCert}
            onChange={this.updateValue('idpCert')}
            onBlur={this.updateValueImmediately('idpCert')}
            helpText="Certificate should be formatted with header or in string format."
            validationMessage={
              this.state.invalidFields.idpCert && 'Enter a valid X.509 certificate'
            }
          />
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
            value={identityProvider.ssoName}
            onChange={this.updateValue('ssoName')}
            onBlur={this.updateValueImmediately('ssoName')}
            helpText="Lowercase letters, numbers, periods, spaces, hyphens, or underscores are allowed."
            validationMessage={this.state.invalidFields.ssoName && 'Enter a valid SSO name'}
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
