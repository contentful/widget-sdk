import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Organization as OrganizationPropType } from 'app/OrganizationSettings/PropTypes';
import { Heading, Paragraph, TextLink, TextField } from '@contentful/forma-36-react-components';
import { authUrl } from 'Config';
import { track } from 'analytics/Analytics';
import { buildUrlWithUtmParams } from 'utils/utmBuilder';

const withInAppHelpUtmParams = buildUrlWithUtmParams({
  source: 'webapp',
  medium: 'sso-enabled',
  campaign: 'in-app-help',
});

export default class SSOEnabled extends React.Component {
  static propTypes = {
    restrictedModeEnabled: PropTypes.bool.isRequired,
    ssoName: PropTypes.string.isRequired,
    organization: OrganizationPropType.isRequired,
  };

  trackSupportClick = () => {
    track('sso:contact_support');
  };

  render() {
    const {
      restrictedModeEnabled,
      ssoName,
      organization: {
        sys: { id: orgId },
      },
    } = this.props;

    return (
      <div className="sso-enabled__main">
        <Heading className="f36-margin-top--3xl">Congrats! SSO is enabled 🎉</Heading>
        <Paragraph className="f36-margin-top--l">
          {restrictedModeEnabled && (
            <React.Fragment>
              If you experience any issues with SSO,{' '}
              <TextLink
                onClick={this.trackSupportClick}
                testId="restricted-support-link"
                href={withInAppHelpUtmParams('https://www.contentful.com/support/')}>
                talk to support
              </TextLink>
              .
            </React.Fragment>
          )}
          {!restrictedModeEnabled && (
            <Fragment>
              To turn on{' '}
              <TextLink
                href={withInAppHelpUtmParams(
                  'https://www.contentful.com/faq/sso/#how-does-sso-restricted-mode-work'
                )}>
                Restricted mode
              </TextLink>
              , requiring users to sign in using SSO,{' '}
              <TextLink
                onClick={this.trackSupportClick}
                testId="unrestricted-support-link"
                href={withInAppHelpUtmParams('https://www.contentful.com/support/')}>
                talk to support
              </TextLink>
              .
            </Fragment>
          )}
        </Paragraph>
        <div className="sso-enabled__links f36-margin-top--xl">
          <div className="sso-enabled__link">
            <TextField
              labelText="SSO name"
              id="ssoName"
              name="ssoName"
              testId="ssoName"
              value={ssoName}
              textInputProps={{
                withCopyButton: true,
                disabled: true,
              }}
            />
          </div>
          <div className="sso-enabled__link f36-margin-left--l">
            <TextField
              labelText="Bookmarkable Login URL"
              id="login-url"
              name="login-url"
              testId="login-url"
              value={authUrl(`/sso/${orgId}/login`)}
              textInputProps={{
                withCopyButton: true,
                disabled: true,
              }}
            />
          </div>
        </div>
      </div>
    );
  }
}
