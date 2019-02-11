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
  Spinner
} from '@contentful/forma-36-react-components';
import { authUrl, appUrl } from 'Config.es6';
import { Organization as OrganizationPropType } from 'app/OrganizationSettings/PropTypes.es6';
import { IdentityProviderPropType, FieldsStatePropType } from './PropTypes.es6';
import { SSO_PROVIDERS } from './constants.es6';
import * as ssoActionCreators from 'redux/actions/sso/actionCreators.es6';
import * as ssoSelectors from 'redux/selectors/sso.es6';

import { connect } from 'react-redux';

export class IDPSetupForm extends React.Component {
  static propTypes = {
    organization: OrganizationPropType,
    identityProvider: IdentityProviderPropType,
    updateFieldValue: PropTypes.func.isRequired,
    validateField: PropTypes.func.isRequired,
    fields: FieldsStatePropType.isRequired
  };

  debouncedUpdateValue = _.debounce(async function(fieldName, value) {
    const { organization, updateFieldValue } = this.props;

    updateFieldValue({ fieldName, value, orgId: organization.sys.id });
  }, 500);

  updateField(fieldName, immediately) {
    return e => {
      const { validateField } = this.props;

      const value = e.target.value;

      validateField({ fieldName, value });
      this.debouncedUpdateValue(fieldName, value);

      if (immediately) {
        this.debouncedUpdateValue.flush();
      }
    };
  }

  render() {
    const {
      fields,
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
    identityProvider: ssoSelectors.getIdentityProvider(state)
  }),
  {
    validateField: ssoActionCreators.validateField,
    updateFieldValue: ssoActionCreators.updateFieldValue
  }
)(IDPSetupForm);
