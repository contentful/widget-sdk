import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { css } from 'emotion';
import {
  Heading,
  Subheading,
  Note,
  TextField,
  HelpText,
  TextLink,
  Tooltip,
  Icon,
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { authUrl, appUrl, websiteUrl } from 'Config';
import { Organization as OrganizationPropType } from 'app/OrganizationSettings/PropTypes';
import { IdentityProviderPropType } from 'app/OrganizationSettings/SSO/PropTypes';
import { buildUrlWithUtmParams } from 'utils/utmBuilder';
import { IDPDetailsForm } from './IDPDetailsForm';

const styles = {
  header: css({
    marginTop: tokens.spacingXl,
    marginBottom: tokens.spacingL,
  }),
  field: css({
    marginBottom: tokens.spacingL,
  }),
  attrContainer: css({
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: tokens.spacingL,
  }),
  attrField: css({
    width: 'auto',
  }),
  helpText: css({
    marginTop: tokens.spacingXs,
    marginBottom: tokens.spacingL,
  }),
  download: css({ marginLeft: tokens.spacingS }),
};

const withInAppHelpUtmParams = buildUrlWithUtmParams({
  source: 'webapp',
  medium: 'idp-setup-form',
  campaign: 'in-app-help',
});

export class IDPSetupForm extends React.Component {
  static propTypes = {
    organization: OrganizationPropType,
    identityProvider: IdentityProviderPropType,
    onUpdate: PropTypes.func,
    onTrackSupportClick: PropTypes.func,
  };

  render() {
    const {
      identityProvider,
      organization: {
        name: orgName,
        sys: { id: orgId },
      },
      onUpdate,
      onTrackSupportClick,
    } = this.props;

    const metadataUrl = authUrl(`/sso/${orgId}/metadata.xml`);

    return (
      <>
        <section>
          <Heading element="h2" className={styles.header}>
            Contentful’s service provider details
            <TextLink className={styles.download} href={metadataUrl}>
              <Tooltip place="top" content="Download SAML metadata file">
                <Icon icon="Download" />
              </Tooltip>
            </TextLink>
          </Heading>
          <TextField
            labelText="Audience URI"
            name="audience"
            id="audience"
            testId="audience-uri"
            className={styles.field}
            helpText="Sometimes called the Entity ID"
            textInputProps={{
              withCopyButton: true,
              disabled: true,
              width: 'large',
            }}
            value={appUrl}
          />
          <TextField
            labelText="ACS (Assertion Consumer Service) URL"
            name="acsUrl"
            id="acsUrl"
            testId="acs-url"
            className={styles.field}
            helpText="Sometimes called the Single Sign-On URL"
            textInputProps={{
              withCopyButton: true,
              disabled: true,
            }}
            value={authUrl(`/sso/${orgId}/consume`)}
          />

          <Subheading>Contentful logo</Subheading>
          <HelpText className={styles.helpText}>
            Most SSO providers allow you to upload a thumbnail for your custom SAML app.{' '}
            <TextLink href="http://press.contentful.com/media_kits/219490">
              Download Contentful logos
            </TextLink>
            .
          </HelpText>

          <Subheading>Map user attributes</Subheading>
          <HelpText className={styles.helpText}>
            Map these attributes into your SSO provider.
          </HelpText>
          <div className={styles.attrContainer}>
            <TextField
              className={styles.attrField}
              name="attribute-givenname"
              id="attribute-givenname"
              labelText="First name"
              textInputProps={{
                withCopyButton: true,
                disabled: true,
              }}
              value="givenname"
            />
            <TextField
              className={styles.attrField}
              name="attribute-surname"
              id="attribute-surname"
              labelText="Last name"
              textInputProps={{
                withCopyButton: true,
                disabled: true,
              }}
              value="surname"
            />
            <TextField
              className={styles.attrField}
              name="attribute-email"
              id="attribute-email"
              labelText="Email"
              textInputProps={{
                withCopyButton: true,
                disabled: true,
              }}
              value="email"
            />
          </div>
          <Note>
            Read the documentation on{' '}
            <TextLink
              href={withInAppHelpUtmParams(
                websiteUrl('faq/sso/#what-identity-providers-idp-does-contentful-support')
              )}>
              mapping user attributes
            </TextLink>
            .
          </Note>
        </section>
        <IDPDetailsForm
          orgId={orgId}
          orgName={orgName}
          identityProvider={identityProvider}
          onUpdate={onUpdate}
          onTrackSupportClick={onTrackSupportClick}
        />
      </>
    );
  }
}
