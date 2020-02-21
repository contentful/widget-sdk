import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Workbench,
  TextField,
  TextLink,
  Heading,
  Paragraph,
  Note,
  Button,
  Typography
} from '@contentful/forma-36-react-components';
import Icon from 'ui/Components/Icon';
import { css } from 'emotion';
import { apiUrl } from 'Config';
import tokens from '@contentful/forma-36-tokens';
import ModalLauncher from 'app/common/ModalLauncher';
import GenerateCMATokenDialog from 'app/common/ApiTokens/GenerateCMATokenDialog';
import * as Auth from 'Authentication';
import * as TokenResourceManager from 'app/settings/api/cma-tokens/TokenResourceManager';
import UserProvisioningToken from './UserProvisioningToken';
import StateLink from 'app/common/StateLink';

const styles = {
  content: css({
    margin: '0 auto',
    marginTop: tokens.spacing2Xl
  }),
  intro: css({
    marginBottom: tokens.spacing3Xl
  }),
  bold: css({
    marginBottom: tokens.spacingXs,
    fontWeight: tokens.fontWeightMedium
  }),
  input: css({
    marginTop: tokens.spacingXs,
    marginBottom: tokens.spacingL
  }),
  listStyle: css({
    listStyleType: 'disc'
  })
};

export default function UserProvisioningConfiguration({ orgId }) {
  const SCIM_BASE = apiUrl(`scim/v2/organizations/${orgId}`);
  const [personalAccessToken, setPersonalAccessToken] = useState(null);
  const tokenResourceManager = TokenResourceManager.create(Auth);

  const openGenerateDialog = () => {
    return ModalLauncher.open(({ isShown, onClose }) => (
      <GenerateCMATokenDialog
        key={Date.now()}
        createToken={tokenResourceManager.create}
        successHandler={token => {
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
      <Workbench.Header icon={<Icon name="page-sso" scale="0.75" />} title="User Provisioning" />
      <Workbench.Content type="text">
        <Typography className={styles.content}>
          <div className={styles.intro}>
            <Heading>Set up user provisioning with SCIM 2.0</Heading>
            <Paragraph>
              Set up user provisioning for your organization in Contentful in a few steps.{' '}
              <TextLink href="https://www.contentful.com/faq/" target="_blank">
                Check out the FAQs.
              </TextLink>
            </Paragraph>
            <Note noteType="primary">
              We strongly recommend using a service account for setting up user provisioning in
              Contentful.{' '}
              <TextLink
                testId="faq-url"
                href="https://www.contentful.com/faq/" //TODO set correct scim anchor url
                target="_blank">
                Learn why.
              </TextLink>
            </Note>
          </div>
          <Heading element="h1">SCIM configuration details</Heading>
          <TextField
            labelText="SCIM URL"
            name="scim-url"
            id="scim-url"
            className={styles.input}
            textInputProps={{
              withCopyButton: true,
              disabled: true,
              width: 'large'
            }}
            value={`https:${SCIM_BASE}`}
          />
          <div className={styles.bold}>Personal Access Token</div>
          <Paragraph>
            As an alternative to OAuth applications, you can also leverage Personal Access Tokens to
            use the Content Management API. These tokens are always bound to your individual
            account, with the same permissions you have on all of your spaces and organizations.{' '}
            <StateLink path="account.profile.cma_tokens" data-test-id="tokens-url" target="_blank">
              See created tokens.
            </StateLink>
          </Paragraph>
          {personalAccessToken ? (
            <UserProvisioningToken personalAccessToken={personalAccessToken} />
          ) : (
            <Button testId="generate-btn" onClick={openGenerateDialog}>
              Generate personal access token
            </Button>
          )}
        </Typography>
      </Workbench.Content>
    </Workbench>
  );
}

UserProvisioningConfiguration.propTypes = {
  orgId: PropTypes.string.isRequired
};
