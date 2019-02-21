import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Organization as OrganizationPropType } from 'app/OrganizationSettings/PropTypes.es6';
import { Heading, Paragraph, TextLink, TextField } from '@contentful/forma-36-react-components';
import { authUrl } from 'Config.es6';

export default class SSOEnabled extends React.Component {
  static propTypes = {
    restrictedModeEnabled: PropTypes.bool.isRequired,
    ssoName: PropTypes.string.isRequired,
    organization: OrganizationPropType.isRequired
  };

  render() {
    const {
      restrictedModeEnabled,
      ssoName,
      organization: {
        sys: { id: orgId }
      }
    } = this.props;

    return (
      <div className="sso-enabled__main">
        <Heading extraClassNames="f36-margin-top--3xl">Congrats! SSO is enabled 🎉</Heading>
        <Paragraph extraClassNames="f36-margin-top--l">
          {restrictedModeEnabled && (
            <React.Fragment>
              If you experience any issues with SSO,{' '}
              <TextLink testId="restricted-support-link" href="https://www.contentful.com/support/">
                talk to support
              </TextLink>
              .
            </React.Fragment>
          )}
          {!restrictedModeEnabled && (
            <Fragment>
              To turn on{' '}
              <TextLink href="https://www.contentful.com/faq/sso/#how-does-sso-restricted-mode-work">
                Restricted mode
              </TextLink>
              , requiring users to sign in using SSO,{' '}
              <TextLink
                testId="unrestricted-support-link"
                href="https://www.contentful.com/support/">
                talk to support
              </TextLink>
              .
            </Fragment>
          )}
          <div className="sso-enabled__links f36-margin-top--xl">
            <div className="sso-enabled__link">
              <TextField
                labelText="Sign-in name"
                id="sign-in-name"
                name="sign-in-name"
                testId="sign-in-name"
                value={ssoName}
                textInputProps={{
                  withCopyButton: true,
                  disabled: true
                }}
              />
            </div>
            <div className="sso-enabled__link f36-margin-left--l">
              <TextField
                labelText="Bookmarkable Login URL"
                id="login-url"
                name="login-url"
                testId="login-url"
                value={`https:${authUrl(`/sso/${orgId}/login`)}`}
                textInputProps={{
                  withCopyButton: true,
                  disabled: true
                }}
              />
            </div>
          </div>
        </Paragraph>
      </div>
    );
  }
}
