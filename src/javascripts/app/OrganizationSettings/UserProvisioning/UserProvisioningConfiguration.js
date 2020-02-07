import React, { useState } from 'react';
import {
  TextLink,
  TextInput,
  Heading,
  Paragraph,
  Note,
  Button
} from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import ModalLauncher from 'app/common/ModalLauncher';
import GenerateCMATokenDialog from 'app/settings/api/cma-tokens/GenerateCMATokenDialog';
import * as Auth from 'Authentication';
import * as TokenResourceManager from 'app/settings/api/cma-tokens/TokenResourceManager';

const styles = {
  content: css({
    width: '700px',
    margin: '0 280px'
  }),
  heading: css({
    fontFamily: 'Avenir Next',
    marginBottom: tokens.spacingL,
    marginTop: tokens.spacing2Xl
  }),
  subheading: css({
    color: '#2A3039',
    fontFamily: 'Avenir Next',
    fontSize: tokens.fontSizeM,
    marginBottom: tokens.spacingXs,
    marginTop: tokens.spacingL
  }),
  bold: css({ fontWeight: tokens.fontWeightMedium }),
  paragraph: css({
    color: '#536171',
    fontFamily: 'Avenir Next',
    fontSize: tokens.fontSizeM,
    marginBottom: tokens.spacingM
  }),
  note: css({
    fontFamily: 'Avenir Next',
    fontSize: tokens.fontSizeM,
    marginBottom: tokens.spacingM
  })
};

function UserProvisioningConfiguration() {
  const [personalAccessToken, setPersonalAccessToken] = useState(null);

  const openGenerateDialog = () => {
    const tokenResourceManager = TokenResourceManager.create(Auth);
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
    <div className={styles.content}>
      <Heading className={styles.heading} testId="scim-header">
        Set up user provisioning with SCIM 2.0
      </Heading>
      <Paragraph className={styles.paragraph}>
        Set up user provisioning for your organization in Contentful in a few steps.&nbsp;&nbsp;
        <TextLink href="https://www.contentful.com/faq/">Check out the FAQs.</TextLink>
      </Paragraph>
      <Note noteType="primary" className={styles.note}>
        We strongly recommend using a service account for setting up user provisioning to better
        manage the organization access in Contentful.&nbsp;&nbsp;
        <TextLink>Show more</TextLink>
      </Note>
      <Heading element="h1" className={styles.heading}>
        SCIM configuration details
      </Heading>
      <div className={styles.subheading}>SCIM URL</div>
      <TextInput
        name="scim-url"
        testId="scim-url"
        disabled
        withCopyButton
        value="https://app.contentful.com" //TODO set correct base url
      />
      <div className={`${styles.subheading} ${styles.bold}`}>Personal Access Token</div>
      <Paragraph className={styles.paragraph}>
        As an alternative to OAuth applications, you can also leverage Personal Access Tokens to use
        the Content Management API. These tokens are always bound to your individual account, with
        the same permissions you have on all of your spaces and organizations.
      </Paragraph>
      {personalAccessToken ? (
        <>
          <Note
            noteType="positive"
            title={`"${personalAccessToken.name}" is ready!`}
            className={styles.note}>
            {`Make sure to immediately copy your new Personal Access Token. You won't be
                        able to see it again.`}
          </Note>
          <TextInput
            name="scim-token"
            testId="scim-token"
            disabled
            withCopyButton
            value={personalAccessToken.token}
          />
        </>
      ) : (
        <Button onClick={openGenerateDialog}>Generate personal access token</Button>
      )}
    </div>
  );
}
export default UserProvisioningConfiguration;
