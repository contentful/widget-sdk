import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import {
  Typography,
  Heading,
  Paragraph,
  TextLink,
  TextField,
} from '@contentful/forma-36-react-components';
import { Flex } from '@contentful/forma-36-react-components';
import { authUrl } from 'Config';
import { buildUrlWithUtmParams } from 'utils/utmBuilder';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

const withInAppHelpUtmParams = buildUrlWithUtmParams({
  source: 'webapp',
  medium: 'sso-enabled',
  campaign: 'in-app-help',
});

const styles = {
  ssoEnabledMain: css({
    textAlign: 'center',
    marginTop: tokens.spacing3Xl,
  }),
  ssoEnabledLink: css({
    width: '50%',
  }),
};

export function SSOEnabled({ restrictedModeEnabled, ssoName, orgId, onTrackSupportClick }) {
  return (
    <div className={styles.ssoEnabledMain}>
      <Typography>
        <Heading>Congrats! SSO is enabled 🎉</Heading>
        <Paragraph>
          {restrictedModeEnabled && (
            <React.Fragment>
              If you experience any issues with SSO,{' '}
              <TextLink
                onClick={onTrackSupportClick}
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
                onClick={onTrackSupportClick}
                testId="unrestricted-support-link"
                href={withInAppHelpUtmParams('https://www.contentful.com/support/')}>
                talk to support
              </TextLink>
              .
            </Fragment>
          )}
        </Paragraph>
      </Typography>
      <Flex marginTop="spacingXl" justifyContent="space-between">
        <Flex className={styles.ssoEnabledLink} marginRight="spacingM">
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
        </Flex>
        <Flex className={styles.ssoEnabledLink}>
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
        </Flex>
      </Flex>
    </div>
  );
}

SSOEnabled.propTypes = {
  restrictedModeEnabled: PropTypes.bool.isRequired,
  ssoName: PropTypes.string.isRequired,
  orgId: PropTypes.string.isRequired,
  onTrackSupportClick: PropTypes.func.isRequired,
};
