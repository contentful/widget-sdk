import React, { useEffect, useState } from 'react';
import {
  Heading,
  Paragraph,
  TextLink,
  TextInput,
  Button,
  Note,
  FormLabel,
  SkeletonContainer,
  SkeletonBodyText,
  Notification,
} from '@contentful/forma-36-react-components';
import { ModalLauncher } from '@contentful/forma-36-react-components';
import { AddSigningSecretDialog } from './AddSigningSecretDialog';
import { generateSecret } from './utils';
import { getAppDefinitionLoader } from 'features/apps-core';
import { ManagementApiClient } from '../ManagementApiClient';
import { styles } from './styles';

const openModal = (updateSecret: (generatedSecret: string) => Promise<void>) => {
  return ModalLauncher.open(({ isShown, onClose }) => {
    return (
      <AddSigningSecretDialog
        saveUpdatedSecret={updateSecret}
        isShown={isShown}
        onClose={onClose}
      />
    );
  });
};

export const SigningSecret = ({ definition }) => {
  const definitionId = definition.sys.id;
  const orgId = definition.sys.organization.sys.id;
  const [currentSecret, setSecret] = useState<string | undefined>();
  const [isLoadingSecret, setIsLoadingSecret] = useState<boolean>(true);
  const [isSecretUpdated, setSecretUpdateStatus] = useState<boolean>(false);

  const addNewSecret = async (secret: string) => {
    try {
      await ManagementApiClient.addAppSigningSecret(orgId, definitionId, secret);
      setSecret(secret);
      setSecretUpdateStatus(true);
    } catch (err) {
      Notification.error(`
        Something went wrong with saving your secret. Please try again and make sure you have the correct secret format
      `);
    }
  };
  const showLoadingError = () => {
    Notification.error(`
      Something went wrong with loading your secret. Please refresh the page.
    `);
  };

  useEffect(() => {
    (async () => {
      try {
        const secret = await getAppDefinitionLoader(orgId).getAppSigningSecret(definitionId);
        setSecret(secret?.padStart(16, '*'));
      } catch (err) {
        // ignore "secret not found" as it is expected
        if (err.status !== 404) {
          showLoadingError();
          throw err;
        }
      } finally {
        setIsLoadingSecret(false);
      }
    })();
  }, [orgId, definitionId, setSecret, setIsLoadingSecret]);

  return (
    <>
      <Heading className={styles.header} element="h3">
        Request verification
      </Heading>
      <Paragraph>
        Verify that requests from an app or event are coming from Contentful.{' '}
        <TextLink href="https://www.contentful.com/developers/docs/extensibility/app-framework/request-verification/">
          Learn more about request verification
        </TextLink>
      </Paragraph>
      {isLoadingSecret && (
        <SkeletonContainer className={styles.loading} testId={'loading'}>
          <SkeletonBodyText />
        </SkeletonContainer>
      )}

      {!isLoadingSecret && (
        <>
          {!currentSecret && (
            <Button
              className={styles.activateButton}
              onClick={() => addNewSecret(generateSecret())}
              buttonType={'muted'}
              testId={'activate-btn'}>
              Enable request verification
            </Button>
          )}

          {currentSecret && (
            <>
              <FormLabel
                htmlFor="secretInput"
                className={styles.secretInputLabel}
                requiredText={''}>
                Signing secret
              </FormLabel>
              {isSecretUpdated && (
                <Note
                  className={styles.copySecretReminder}
                  noteType="positive"
                  testId={'copy-reminder'}>
                  Make sure to immediately copy your new signing secret. You will not be able to see
                  it again.
                </Note>
              )}
              <div className={styles.inputWrapper}>
                <TextInput
                  id={'secretInput'}
                  className={styles.currentSecretInput}
                  value={currentSecret}
                  withCopyButton={isSecretUpdated}
                  testId={'secret-input'}
                  disabled={true}
                />
                <Button
                  className={styles.button}
                  buttonType={'muted'}
                  testId={'update-secret-btn'}
                  onClick={() => {
                    openModal(addNewSecret);
                  }}>
                  Update
                </Button>
              </div>
            </>
          )}
        </>
      )}
    </>
  );
};
