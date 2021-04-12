import React, { useState, ChangeEvent } from 'react';
import { css } from 'emotion';
import {
  Button,
  FieldGroup,
  Flex,
  Form,
  Modal,
  Note,
  Paragraph,
  RadioButtonField,
  TextField,
  Typography,
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';

import type { UserData } from '../types';
import { AccountDeletionReasons } from '../types';
import { deleteUserAccount } from '../services/AccountRepository';
import { captureError } from 'services/logger';
import ContactUsButton from 'ui/Components/ContactUsButton';

const styles = {
  // this css is necessary because Forma 36 does not remove the margin-bottom of a form’s last child
  form: css({ '& div:last-child': { margin: 0 } }),
  confirmButton: css({ marginRight: tokens.spacingXs }),
  error: css({
    '& > p': {
      color: tokens.colorRedDark,
      marginLeft: tokens.spacingXs,
    },
  }),
};

type Reason = keyof typeof AccountDeletionReasons;

interface DeleteUserModalProps {
  singleOwnerOrganizations: UserData['userCancellationWarning']['singleOwnerOrganizations'];
  onConfirm: () => void;
  onCancel: () => void;
  isShown?: boolean;
}

export function DeleteUserModal({
  singleOwnerOrganizations,
  onConfirm,
  onCancel,
  isShown = false,
}: DeleteUserModalProps) {
  const [activeReason, setActiveReason] = useState<Reason>('other');
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<Error>();
  const [deleteInProgress, setDeleteInProgress] = useState(false);

  const deleteUser = async (reason: Reason, description: string) => {
    setDeleteInProgress(true);

    try {
      await deleteUserAccount({ reason, description, password });
      setDeleteInProgress(false);
    } catch (error) {
      setError(error);
      captureError(error);
      setDeleteInProgress(false);
      return;
    }

    onConfirm();
  };

  const closeHandler = () => onCancel();

  const warningNoteCountCopy =
    singleOwnerOrganizations.length === 1
      ? `your organization ${singleOwnerOrganizations[0].name}`
      : `all ${singleOwnerOrganizations.length} of your organizations`;

  return (
    <Modal
      isShown={isShown}
      title="Delete my account"
      testId="delete-user-modal"
      size="large"
      onClose={closeHandler}
      shouldCloseOnEscapePress
      shouldCloseOnOverlayClick>
      <Typography>
        {singleOwnerOrganizations.length && (
          <Flex marginBottom="spacingM">
            <Note testId="single-owner-orgs-warning" noteType="warning">
              We will delete {warningNoteCountCopy}, including all spaces and all content, as soon
              as you delete your account.
            </Note>
          </Flex>
        )}

        <Paragraph>
          If there is anything we can help you with, please{' '}
          <ContactUsButton noIcon isLink>
            get in touch with us
          </ContactUsButton>
          .
        </Paragraph>
      </Typography>

      <Form className={styles.form}>
        <Flex flexDirection="column">
          <Paragraph>
            <strong>Why are you deleting your account?</strong>
          </Paragraph>
          <Flex flexDirection="column" marginTop="spacingXs">
            <FieldGroup>
              {Object.keys(AccountDeletionReasons).map((reasonKey, index) => (
                <RadioButtonField
                  key={index}
                  id={reasonKey}
                  testId={`reason-${reasonKey}`}
                  labelText={AccountDeletionReasons[reasonKey]}
                  name={reasonKey}
                  checked={activeReason === reasonKey}
                  value={reasonKey}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    setActiveReason(e.target.value as Reason);
                  }}
                />
              ))}
            </FieldGroup>
          </Flex>
        </Flex>

        <TextField
          id="cancellationDetails"
          name="cancellationDetails"
          testId="cancellation-details"
          labelText="Additional details"
          value={additionalDetails}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setAdditionalDetails(e.target.value)}
          textarea
        />

        <TextField
          id="password"
          name="password"
          testId="password"
          labelText="Enter password to confirm"
          value={password}
          required
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setPassword(e.target.value)}
          textInputProps={{
            type: 'password',
          }}
          validationMessage={
            error &&
            'Check your password and try again. Your account will be locked after 5 failed attempts.'
          }
        />

        <Flex>
          <Button
            testId="delete-user-confirm"
            className={styles.confirmButton}
            type="submit"
            buttonType="negative"
            loading={deleteInProgress}
            disabled={!password || deleteInProgress}
            onClick={() => deleteUser(activeReason, additionalDetails)}>
            Delete my account
          </Button>
          <Button
            testId="delete-user-cancel"
            buttonType="muted"
            disabled={deleteInProgress}
            onClick={closeHandler}>
            Cancel
          </Button>
        </Flex>
      </Form>
    </Modal>
  );
}
