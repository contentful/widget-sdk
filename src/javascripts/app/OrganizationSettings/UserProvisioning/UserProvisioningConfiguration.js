import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  TextLink,
  TextInput,
  Heading,
  Paragraph,
  Note,
  Button,
  Typography
} from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import ModalLauncher from 'app/common/ModalLauncher';
import GenerateCMATokenDialog from 'app/common/ApiTokens/GenerateCMATokenDialog';
import * as Auth from 'Authentication';
import * as TokenResourceManager from 'app/settings/api/cma-tokens/TokenResourceManager';

const styles = {
  content: css({
    width: '700px',
    margin: '0 280px',
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
  })
};

const SCIM_BASE = 'https://api.contentful.com/scim/v2/organizations/';

function UserProvisioningConfiguration({ orgId }) {
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
    <Typography className={styles.content}>
      <div className={styles.intro}>
        <Heading>Set up user provisioning with SCIM 2.0</Heading>
        <Paragraph>
          Set up user provisioning for your organization in Contentful in a few steps.&nbsp;&nbsp;
          <TextLink href="https://www.contentful.com/faq/" target="_blank">
            Check out the FAQs.
          </TextLink>
        </Paragraph>
        <Note noteType="primary">
          We strongly recommend using a service account for setting up user provisioning in
          Contentful.&nbsp;&nbsp;
          <TextLink
            testId="faq-url"
            href="https://www.contentful.com/faq/" //TODO set correct scim anchor url
            target="_blank">
            Learn why.
          </TextLink>
        </Note>
      </div>
      <Heading element="h1">SCIM configuration details</Heading>
      <div className={styles.bold}>SCIM URL</div>
      <div className={styles.input}>
        <TextInput
          name="scim-url"
          testId="scim-url"
          disabled
          withCopyButton
          value={`${SCIM_BASE}${orgId}`}
        />
      </div>
      <div className={styles.bold}>Personal Access Token</div>
      <Paragraph>
        As an alternative to OAuth applications, you can also leverage Personal Access Tokens to use
        the Content Management API. These tokens are always bound to your individual account, with
        the same permissions you have on all of your spaces and organizations.
      </Paragraph>
      {personalAccessToken ? (
        <>
          <div className={styles.input}>
            <Note noteType="positive" title={`"${personalAccessToken.name}" is ready!`}>
              {`Make sure to immediately copy your new Personal Access Token. You won't be
                        able to see it again.`}
            </Note>
          </div>
          <TextInput
            name="scim-token"
            testId="scim-token"
            disabled
            withCopyButton
            value={`Bearer ${personalAccessToken.token}`}
          />
        </>
      ) : (
        <Button testId="generate-btn" onClick={openGenerateDialog}>
          Generate personal access token
        </Button>
      )}
    </Typography>
  );
}

UserProvisioningConfiguration.propTypes = {
  orgId: PropTypes.string.isRequired
};

export default UserProvisioningConfiguration;
