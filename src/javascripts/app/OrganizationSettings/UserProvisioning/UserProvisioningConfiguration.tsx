import React, { useState } from 'react';
import {
  Button,
  Heading,
  ModalLauncher,
  Note,
  Paragraph,
  TextField,
  TextLink,
  Typography,
  Workbench,
} from '@contentful/forma-36-react-components';
import { ProductIcon } from '@contentful/forma-36-react-components/dist/alpha';

import { css } from 'emotion';
import { apiUrl, helpCenterUrl } from 'Config';
import tokens from '@contentful/forma-36-tokens';
import { GenerateCMATokenDialog, TokenResourceManager } from 'features/api-keys-management';
import * as Auth from 'Authentication';
import UserProvisioningToken from './UserProvisioningToken';
import { buildUrlWithUtmParams } from 'utils/utmBuilder';
import { ReactRouterLink } from 'core/react-routing';

const withInAppHelpUtmParams = buildUrlWithUtmParams({
  source: 'webapp',
  medium: 'user-provisioning-configuration',
  campaign: 'in-app-help',
});

const styles = {
  content: css({
    margin: '0 auto',
    marginTop: tokens.spacing2Xl,
  }),
  subheading: css({
    marginBottom: tokens.spacingXs,
    fontWeight: tokens.fontWeightMedium,
  }),
  input: css({
    marginTop: tokens.spacingL,
    marginBottom: tokens.spacingL,
  }),
  paragraph: css({
    marginTop: tokens.spacingM,
    marginBottom: tokens.spacingL,
  }),
  cta: css({
    marginRight: tokens.spacingM,
  }),
};

export default function UserProvisioningConfiguration({ orgId }: { orgId: string }) {
  const SCIM_BASE = apiUrl(`scim/v2/organizations/${orgId}`);
  const [personalAccessToken, setPersonalAccessToken] = useState(null);
  const tokenResourceManager = TokenResourceManager.createToken(Auth);

  const openGenerateDialog = () => {
    return ModalLauncher.open(({ isShown, onClose }) => (
      <GenerateCMATokenDialog
        key={Date.now()}
        createToken={tokenResourceManager.create}
        successHandler={(token) => {
          setPersonalAccessToken(token);
          onClose(true);
        }}
        isShown={isShown}
        onConfirm={() => {
          onClose(true);
        }}
        onCancel={() => {
          onClose(false);
        }}
      />
    ));
  };

  return (
    <Workbench>
      <Workbench.Header icon={<ProductIcon icon="Sso" size="large" />} title="User Provisioning" />
      <Workbench.Content type="text">
        <Typography className={styles.content}>
          <Heading>Set up user provisioning with SCIM 2.0</Heading>
          <Paragraph className={styles.paragraph}>
            Set up user provisioning for your organization in Contentful in a few steps.{' '}
            <TextLink
              href={withInAppHelpUtmParams(`${helpCenterUrl}/scim-faq`)}
              target="_blank"
              rel="noopener noreferrer">
              Check out the FAQs.
            </TextLink>
          </Paragraph>
          <TextField
            labelText="SCIM URL"
            name="scim-url"
            id="scim-url"
            className={styles.input}
            textInputProps={{
              withCopyButton: true,
              disabled: true,
              width: 'large',
            }}
            value={SCIM_BASE}
          />
          <div className={styles.subheading}>Personal access token</div>
          <Note noteType="primary">
            We strongly recommend logging into a service account, with the organization role set to
            owner, for setting up user provisioning in Contentful.
          </Note>
          <Paragraph className={styles.paragraph}>
            We advise using a personal access token to manage SCIM API access. These tokens are
            always bound to your individual account, with the same permissions you have on all of
            your spaces and organizations.{' '}
          </Paragraph>
          {personalAccessToken ? (
            <UserProvisioningToken personalAccessToken={personalAccessToken} />
          ) : (
            <>
              <Button testId="generate-btn" onClick={openGenerateDialog} className={styles.cta}>
                Generate personal access token
              </Button>
              <ReactRouterLink
                route={{ path: 'account.profile.cma_tokens' }}
                data-test-id="tokens-url"
                target="_blank"
                rel="noopener noreferrer">
                Manage your tokens
              </ReactRouterLink>
            </>
          )}
        </Typography>
      </Workbench.Content>
    </Workbench>
  );
}