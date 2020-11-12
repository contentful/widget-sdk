import React, { useEffect, useState } from 'react';
import {
  Heading,
  Paragraph,
  TextLink,
  TextInput,
  Button,
  Note,
  FormLabel
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { ModalLauncher } from '@contentful/forma-36-react-components/dist/alpha';
import { css } from 'emotion';
import { AddSigningSecretDialog, generateSecret } from './AddSigningSecretDialog';
import { getAppDefinitionLoader } from 'features/apps-core';
import { ManagementApiClient } from '../ManagementApiClient';

const styles = {
  header: css({
    fontSize: tokens.fontSizeL,
    marginTop: tokens.spacing2Xl,
    marginBottom: tokens.spacingXs,
  }),
  activateButton: css({
    marginTop: tokens.spacingM
  }),
  copySecretReminder: css({
    marginTop: tokens.spacingM,
    marginBottom: tokens.spacingM,
  }),
  secretInputLabel: css({
    fontSize: tokens.fontSizeM,
    marginTop: tokens.spacingL,
  }),
  inputWrapper: css({
    display: 'flex',
    marginTop: tokens.spacingM
  }),
  currentSecretInput: css({
    flexGrow: 1,
    width: 'auto',
    "& input": {
      fontFamily: tokens.fontStackMonospace,
    },
  }),
  button: css({
    paddingLeft: tokens.spacingXl,
    paddingRight: tokens.spacingXl,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  })
};


const openModal = (updateSecret: (generatedSecret: string) => Promise<void>) => {
 return ModalLauncher.open(({isShown, onClose}) => {
  return <AddSigningSecretDialog
    saveUpdatedSecret={ updateSecret }
    isShown={isShown}
    onClose={onClose}
  />
 })
}

export const SigningSecret = ({definition}) => {
  const definitionId = definition.sys.id;
  const orgId = definition.sys.organization.sys.id;
  const [currentSecret, setSecret] = useState<string | undefined>();
  const [isSecretUpdated, setSecretUpdateStatus] = useState<boolean>(false);

  const addNewSecret = (secret: string) => {
    setSecret(secret);
    setSecretUpdateStatus(true)
    return ManagementApiClient.addAppSigningSecret(orgId, definitionId, secret);
  }

  useEffect(() => {
    (async ()=>{
      const secret = await getAppDefinitionLoader(orgId).getAppSigningSecret(definitionId)
      setSecret(secret?.padStart(64, '*'));
    })()
  }, [orgId, definitionId, setSecret])

  return <>
    <Heading className={styles.header} element='h3'>Secure requests</Heading>
    <Paragraph>
      Verify that requests from an app or event are coming from Contentful.{' '}
      <TextLink href="">Learn more about secure requests</TextLink>
    </Paragraph>

    {
      !currentSecret &&
      <Button className={styles.activateButton} onClick={() => addNewSecret(generateSecret())} buttonType={"muted"}>
        Activate secure requests
      </Button>
    }

    {currentSecret && <>
      <FormLabel
        htmlFor="secretInput"
        className={styles.secretInputLabel}
        requiredText={""}
        testId="cf-ui-form-label"
      >
        Shared secret
      </FormLabel>
      {isSecretUpdated &&
        <Note className={styles.copySecretReminder} noteType="positive">
          Make sure to immediately copy your new shared secret. You will not be able to see it again.
        </Note>
      }
      <div className={styles.inputWrapper}>
        <TextInput
          id={"secretInput"}
          className={styles.currentSecretInput}
          value={currentSecret}
          withCopyButton={isSecretUpdated}
          readOnly
        />
        <Button
          className={styles.button}
          buttonType={'muted'}
          onClick={() => {openModal(addNewSecret)}}
        >
          Update
        </Button>
      </div>
    </>}
  </>
}
